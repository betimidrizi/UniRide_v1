using AutoMapper;
using Microsoft.EntityFrameworkCore;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;
using UniRide.Domain.Entities;
using UniRide.Domain.Enums;
using UniRide.Domain.Exceptions;

namespace UniRide.Application.Services;

public class ReviewService(
    IRepository<Review> reviews,
    IRepository<Reservation> reservations,
    IRepository<Ride> rides,
    IRepository<User> users,
    IMapper mapper,
    INotificationService notifications) : IReviewService
{
    public async Task<ReviewReadDto> CreateAsync(int reviewerId, ReviewCreateDto dto, CancellationToken ct = default)
    {
        // Defensive validation — FluentValidation also enforces this at the controller boundary.
        if (dto.Rating < 1 || dto.Rating > 5)
            throw new ValidationException("Rating must be between 1 and 5.");

        if (dto.TargetUserId == reviewerId)
            throw new ConflictException("Cannot review yourself.");

        var ride = await rides.QueryNoTracking()
            .FirstOrDefaultAsync(r => r.RideId == dto.RideId, ct)
            ?? throw new NotFoundException("Ride", dto.RideId);

        if (ride.Status != RideStatus.Completed)
            throw new ConflictException("Can only review completed rides.");

        // Reviewer must be EITHER the driver OR a confirmed passenger.
        // Target must be the counterparty.
        var reviewerIsDriver = ride.DriverId == reviewerId;
        var targetIsDriver = ride.DriverId == dto.TargetUserId;

        if (reviewerIsDriver)
        {
            // Driver reviewing a passenger: target must be a confirmed passenger.
            var targetIsConfirmedPassenger = await reservations.QueryNoTracking()
                .AnyAsync(r =>
                    r.RideId == ride.RideId &&
                    r.PassengerId == dto.TargetUserId &&
                    r.ReservationStatus == ReservationStatus.Confirmed,
                    ct);

            if (!targetIsConfirmedPassenger)
                throw new ForbiddenException("Target user is not a confirmed passenger on this ride.");
        }
        else if (targetIsDriver)
        {
            // Passenger reviewing the driver: reviewer must be a confirmed passenger.
            var reviewerIsConfirmedPassenger = await reservations.QueryNoTracking()
                .AnyAsync(r =>
                    r.RideId == ride.RideId &&
                    r.PassengerId == reviewerId &&
                    r.ReservationStatus == ReservationStatus.Confirmed,
                    ct);

            if (!reviewerIsConfirmedPassenger)
                throw new ForbiddenException("Only the driver and confirmed passengers may leave a review for this ride.");
        }
        else
        {
            // Neither party is the driver — reviews are only driver↔passenger.
            throw new ForbiddenException("Only the driver and confirmed passengers may leave a review for this ride.");
        }

        var alreadyReviewed = await reviews.QueryNoTracking()
            .AnyAsync(r =>
                r.ReviewerId == reviewerId &&
                r.RideId == dto.RideId &&
                r.TargetUserId == dto.TargetUserId,
                ct);

        if (alreadyReviewed)
            throw new ConflictException("Review already submitted.");

        var target = await users.Query()
            .FirstOrDefaultAsync(u => u.UserId == dto.TargetUserId, ct)
            ?? throw new NotFoundException("User", dto.TargetUserId);

        var review = new Review
        {
            ReviewerId = reviewerId,
            TargetUserId = dto.TargetUserId,
            RideId = dto.RideId,
            Rating = dto.Rating,
            Comment = string.IsNullOrWhiteSpace(dto.Comment) ? null : dto.Comment.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await reviews.AddAsync(review, ct);

        // Recompute target's rolling average across ALL their reviews
        // (including the one being inserted in this same SaveChanges call).
        var existingRatings = await reviews.QueryNoTracking()
            .Where(r => r.TargetUserId == dto.TargetUserId)
            .Select(r => r.Rating)
            .ToListAsync(ct);

        var total = existingRatings.Sum() + review.Rating;
        var count = existingRatings.Count + 1;
        var newAverage = Math.Round((double)total / count, 1);

        target.Rating = newAverage;
        users.Update(target);

        await reviews.SaveChangesAsync(ct);

        var reviewer = await users.QueryNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == reviewerId, ct);
        var reviewerName = reviewer?.FullName ?? $"User {reviewerId}";

        await notifications.NotifyAsync(
            dto.TargetUserId,
            $"{reviewerName} left you a {review.Rating}★ review",
            ct);

        return mapper.Map<ReviewReadDto>(review);
    }

    public async Task<List<ReviewReadDto>> GetForUserAsync(int targetUserId, CancellationToken ct = default)
    {
        var list = await reviews.QueryNoTracking()
            .Where(r => r.TargetUserId == targetUserId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

        return mapper.Map<List<ReviewReadDto>>(list);
    }

    public async Task<List<ReviewReadDto>> GetMineAsync(int userId, CancellationToken ct = default)
    {
        var list = await reviews.QueryNoTracking()
            .Where(r => r.ReviewerId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

        return mapper.Map<List<ReviewReadDto>>(list);
    }

    public Task<bool> ExistsForRideAsync(int reviewerId, int rideId, int targetUserId, CancellationToken ct = default) =>
        reviews.QueryNoTracking()
            .AnyAsync(r =>
                r.ReviewerId == reviewerId &&
                r.RideId == rideId &&
                r.TargetUserId == targetUserId,
                ct);
}
