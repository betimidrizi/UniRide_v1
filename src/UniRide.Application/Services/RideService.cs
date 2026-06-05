using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using UniRide.Application.Common;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;
using UniRide.Application.Settings;
using UniRide.Domain.Entities;
using UniRide.Domain.Enums;
using UniRide.Domain.Exceptions;

namespace UniRide.Application.Services;

public class RideService(
    IRepository<Ride> rides,
    IRepository<Reservation> reservations,
    IRepository<User> users,
    IMapper mapper,
    INotificationService notifications) : IRideService
{
    public async Task<RideReadDto> CreateAsync(RideCreateDto dto, int driverId, CancellationToken cancellationToken = default)
    {
        var count = dto.IsRecurring ? dto.RecurrenceCount : 1;
        var recurrenceGroupId = count > 1 ? Guid.NewGuid().ToString("N") : null;
        Ride? firstRide = null;

        for (var i = 0; i < count; i++)
        {
            var offset = TimeSpan.FromDays(i * dto.RecurrenceIntervalDays);
            var ride = mapper.Map<Ride>(dto);
            ride.DriverId = driverId;
            ride.Status = RideStatus.Open;
            ride.StartLocation = dto.StartLocation.Trim();
            ride.Destination = dto.Destination.Trim();
            ride.University = dto.University.Trim();
            ride.DepartureTime = dto.DepartureTime.Add(offset);
            ride.ExpectedArrivalTime = dto.ExpectedArrivalTime.Add(offset);
            ride.IsRecurring = count > 1;
            ride.RecurrenceGroupId = recurrenceGroupId;
            ride.RecurrenceIndex = count > 1 ? i + 1 : null;

            await rides.AddAsync(ride, cancellationToken);
            firstRide ??= ride;
        }

        await rides.SaveChangesAsync(cancellationToken);

        var created = await rides.QueryNoTracking()
            .Include(r => r.Driver)
            .FirstAsync(r => r.RideId == firstRide!.RideId, cancellationToken);

        return mapper.Map<RideReadDto>(created);
    }

    public async Task<PagedResult<RideReadDto>> SearchAsync(RideSearchDto d, CancellationToken cancellationToken = default)
    {
        var q = rides.QueryNoTracking()
            .Include(r => r.Driver)
            .AsQueryable();

        if (!d.IncludeArchived)
        {
            var now = DateTime.UtcNow;
            q = q.Where(r =>
                (r.Status == RideStatus.Open || r.Status == RideStatus.Full) &&
                r.DepartureTime > now);
        }

        if (!string.IsNullOrWhiteSpace(d.University))
            q = q.Where(r => r.University.Contains(d.University));

        if (!string.IsNullOrWhiteSpace(d.Location))
            q = q.Where(r =>
                r.StartLocation.Contains(d.Location) ||
                r.Destination.Contains(d.Location));

        if (d.DepartureFrom.HasValue)
            q = q.Where(r => r.DepartureTime >= d.DepartureFrom);

        if (d.DepartureTo.HasValue)
            q = q.Where(r => r.DepartureTime <= d.DepartureTo);

        if (d.MinSeats.HasValue)
            q = q.Where(r => r.AvailableSeats >= d.MinSeats);

        q = d.SortBy?.ToLower() switch
        {
            "price" => q.OrderBy(r => r.Price),
            "departure" => q.OrderBy(r => r.DepartureTime),
            "distance" => q.OrderBy(r => r.DistanceKm),
            _ => q.OrderBy(r => r.DepartureTime)
        };

        var total = await q.CountAsync(cancellationToken);

        var page = await q
            .Skip((d.Page - 1) * d.PageSize)
            .Take(d.PageSize)
            .ToListAsync(cancellationToken);

        return PagedResult<RideReadDto>.Create(
            mapper.Map<List<RideReadDto>>(page), total, d.Page, d.PageSize);
    }

    public async Task<List<RideReadDto>> GetMineAsync(int userId, CancellationToken cancellationToken = default)
    {
        var list = await rides.QueryNoTracking()
            .Include(r => r.Driver)
            .Where(r =>
                r.DriverId == userId &&
                r.Status != RideStatus.Completed &&
                r.Status != RideStatus.Cancelled)
            .OrderByDescending(r => r.DepartureTime)
            .ToListAsync(cancellationToken);

        return mapper.Map<List<RideReadDto>>(list);
    }

    public async Task<List<ReservationReadDto>> GetPassengersAsync(int rideId, int userId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var ride = await rides.QueryNoTracking()
            .FirstOrDefaultAsync(r => r.RideId == rideId, cancellationToken)
            ?? throw new NotFoundException("Ride", rideId);

        if (ride.DriverId != userId && !isAdmin)
            throw new ForbiddenException();

        var list = await reservations.QueryNoTracking()
            .Include(r => r.Passenger)
            .Include(r => r.Ride)!.ThenInclude(x => x!.Driver)
            .Where(r =>
                r.RideId == rideId &&
                r.ReservationStatus != ReservationStatus.Cancelled)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return mapper.Map<List<ReservationReadDto>>(list);
    }

    public async Task<RideReadDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var ride = await rides.QueryNoTracking()
            .Include(r => r.Driver)
            .FirstOrDefaultAsync(r => r.RideId == id, cancellationToken);

        return ride is null ? null : mapper.Map<RideReadDto>(ride);
    }

    public async Task<RideReadDto?> UpdateAsync(int id, RideUpdateDto dto, int userId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var ride = await rides.Query()
            .Include(r => r.Driver)
            .FirstOrDefaultAsync(r => r.RideId == id, cancellationToken);

        if (ride is null)
            return null;

        if (ride.DriverId != userId && !isAdmin)
            throw new ForbiddenException();

        ride.StartLocation = dto.StartLocation.Trim();
        ride.Destination = dto.Destination.Trim();
        ride.DepartureTime = dto.DepartureTime;
        ride.ExpectedArrivalTime = dto.ExpectedArrivalTime;
        ride.AvailableSeats = dto.AvailableSeats;
        ride.Price = dto.Price;
        ride.University = dto.University.Trim();
        ride.DistanceKm = dto.DistanceKm;
        ride.Status = dto.AvailableSeats == 0 ? RideStatus.Full : RideStatus.Open;

        rides.Update(ride);
        await rides.SaveChangesAsync(cancellationToken);

        return mapper.Map<RideReadDto>(ride);
    }

    public async Task<bool> DeleteAsync(int id, int userId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var ride = await rides.GetByIdAsync(id, cancellationToken);

        if (ride is null)
            return false;

        if (ride.DriverId != userId && !isAdmin)
            throw new ForbiddenException();

        var hasActiveReservations = await reservations.Query()
            .AnyAsync(r =>
                r.RideId == id &&
                r.ReservationStatus != ReservationStatus.Cancelled,
                cancellationToken);

        if (hasActiveReservations)
            throw new ConflictException("Cannot delete a ride with active reservations.");

        rides.Delete(ride);
        await rides.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<RideReadDto> StartAsync(int rideId, int driverId, CancellationToken cancellationToken = default)
    {
        var ride = await rides.Query()
            .Include(r => r.Driver)
            .FirstOrDefaultAsync(r => r.RideId == rideId, cancellationToken)
            ?? throw new NotFoundException("Ride", rideId);

        if (ride.DriverId != driverId)
            throw new ForbiddenException("Only the driver can start this ride.");

        if (ride.Status is not (RideStatus.Open or RideStatus.Full))
            throw new ConflictException($"Cannot start a ride in state '{ride.Status}'.");

        ride.Status = RideStatus.InProgress;
        ride.StartedAt = DateTime.UtcNow;
        rides.Update(ride);
        await rides.SaveChangesAsync(cancellationToken);

        // Notify all confirmed passengers
        var passengerIds = await reservations.QueryNoTracking()
            .Where(r => r.RideId == rideId && r.ReservationStatus == ReservationStatus.Confirmed)
            .Select(r => r.PassengerId)
            .ToListAsync(cancellationToken);

        foreach (var pid in passengerIds)
            await notifications.NotifyAsync(pid, $"Your ride from {ride.StartLocation} → {ride.Destination} has started.", cancellationToken);

        return mapper.Map<RideReadDto>(ride);
    }

    public async Task<RideReadDto> CompleteAsync(int rideId, int driverId, CancellationToken cancellationToken = default)
    {
        var ride = await rides.Query()
            .Include(r => r.Driver)
            .FirstOrDefaultAsync(r => r.RideId == rideId, cancellationToken)
            ?? throw new NotFoundException("Ride", rideId);

        if (ride.DriverId != driverId)
            throw new ForbiddenException("Only the driver can complete this ride.");

        if (ride.Status is not (RideStatus.InProgress or RideStatus.Open or RideStatus.Full))
            throw new ConflictException($"Cannot complete a ride in state '{ride.Status}'.");

        ride.Status = RideStatus.Completed;
        ride.CompletedAt = DateTime.UtcNow;
        rides.Update(ride);
        await rides.SaveChangesAsync(cancellationToken);

        // Notify driver and confirmed passengers to leave reviews
        var passengerIds = await reservations.QueryNoTracking()
            .Where(r => r.RideId == rideId && r.ReservationStatus == ReservationStatus.Confirmed)
            .Select(r => r.PassengerId)
            .ToListAsync(cancellationToken);

        foreach (var pid in passengerIds)
            await notifications.NotifyAsync(pid, $"Ride to {ride.Destination} completed. Leave a review for {ride.Driver?.FullName ?? "your driver"}!", cancellationToken);

        await notifications.NotifyAsync(driverId, $"Ride to {ride.Destination} completed. Review your passengers.", cancellationToken);

        return mapper.Map<RideReadDto>(ride);
    }
}
