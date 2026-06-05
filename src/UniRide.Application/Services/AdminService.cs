using AutoMapper;
using Microsoft.EntityFrameworkCore;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;
using UniRide.Domain.Entities;
using UniRide.Domain.Enums;
using UniRide.Domain.Exceptions;

namespace UniRide.Application.Services;

/// <summary>
/// Encapsulates every admin write path so the AdminController stays a thin
/// HTTP shell and never imports AppDbContext.
/// </summary>
public class AdminService(
    IRepository<User> users,
    IRepository<Ride> rides,
    IRepository<Reservation> reservations,
    IRepository<ChatMessage> messages,
    IRepository<Review> reviews,
    IRepository<Notification> notifications,
    IMapper mapper) : IAdminService
{
    public async Task<List<AdminUserDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        var list = await users.QueryNoTracking()
            .OrderBy(u => u.FullName)
            .ToListAsync(cancellationToken);

        return mapper.Map<List<AdminUserDto>>(list);
    }

    public async Task<AdminUserDto> SetSuspensionAsync(int userId, bool isSuspended, CancellationToken cancellationToken = default)
    {
        var user = await users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        user.IsSuspended = isSuspended;
        users.Update(user);
        await users.SaveChangesAsync(cancellationToken);

        return mapper.Map<AdminUserDto>(user);
    }

    public async Task<AdminUserDto> SetVerificationAsync(int userId, bool isVerified, CancellationToken cancellationToken = default)
    {
        var user = await users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        user.IsVerified = isVerified;
        user.VerificationRequestedAt = isVerified ? null : user.VerificationRequestedAt;
        users.Update(user);
        await users.SaveChangesAsync(cancellationToken);

        return mapper.Map<AdminUserDto>(user);
    }

    public async Task<AdminUserDto> UpdateUserAsync(int userId, AdminUserUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var user = await users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        var email = dto.Email.Trim().ToLowerInvariant();
        var emailTaken = await users.Query()
            .AnyAsync(u => u.UserId != userId && u.Email == email, cancellationToken);

        if (emailTaken)
            throw new ConflictException("Email is already used by another account.");

        var phoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber.Trim();
        if (phoneNumber is not null)
        {
            var phoneTaken = await users.Query()
                .AnyAsync(u => u.UserId != userId && u.PhoneNumber == phoneNumber, cancellationToken);

            if (phoneTaken)
                throw new ConflictException("Phone number is already used by another account.");
        }

        if (!Enum.TryParse<UserRole>(dto.Role, true, out var role))
            throw new ValidationException("Role must be one of: Student, Driver, Admin.");

        user.FullName = dto.FullName.Trim();
        user.Email = email;
        user.University = dto.University.Trim();
        user.PhoneNumber = phoneNumber;
        user.Role = role;
        user.IsSuspended = dto.IsSuspended;

        users.Update(user);
        await users.SaveChangesAsync(cancellationToken);

        return mapper.Map<AdminUserDto>(user);
    }

    public async Task<bool> DeleteUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await users.GetByIdAsync(userId, cancellationToken);
        if (user is null) return false;

        var userRideIds = await rides.Query()
            .Where(r => r.DriverId == userId)
            .Select(r => r.RideId)
            .ToListAsync(cancellationToken);

        await DeleteRideGraphAsync(userRideIds, cancellationToken);

        var senderMessages = await messages.Query()
            .Where(m => m.SenderId == userId || m.ReceiverId == userId)
            .ToListAsync(cancellationToken);
        foreach (var m in senderMessages) messages.Delete(m);

        var userReviews = await reviews.Query()
            .Where(r => r.ReviewerId == userId || r.TargetUserId == userId)
            .ToListAsync(cancellationToken);
        foreach (var r in userReviews) reviews.Delete(r);

        var userNotifications = await notifications.Query()
            .Where(n => n.UserId == userId)
            .ToListAsync(cancellationToken);
        foreach (var n in userNotifications) notifications.Delete(n);

        var passengerReservations = await reservations.Query()
            .Where(r => r.PassengerId == userId)
            .ToListAsync(cancellationToken);
        foreach (var r in passengerReservations) reservations.Delete(r);

        users.Delete(user);
        await users.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ForceDeleteRideAsync(int rideId, CancellationToken cancellationToken = default)
    {
        var exists = await rides.Query().AnyAsync(r => r.RideId == rideId, cancellationToken);
        if (!exists) return false;

        await DeleteRideGraphAsync(new List<int> { rideId }, cancellationToken);
        await rides.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<AdminStatsDto> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        return new AdminStatsDto
        {
            Users = await users.Query().CountAsync(cancellationToken),
            ActiveUsers = await users.Query().CountAsync(u => !u.IsSuspended, cancellationToken),
            SuspendedUsers = await users.Query().CountAsync(u => u.IsSuspended, cancellationToken),
            Rides = await rides.Query().CountAsync(cancellationToken),
            Reservations = await reservations.Query().CountAsync(cancellationToken),
            Messages = await messages.Query().CountAsync(cancellationToken),
            Reviews = await reviews.Query().CountAsync(cancellationToken),
            Notifications = await notifications.Query().CountAsync(cancellationToken)
        };
    }

    private async Task DeleteRideGraphAsync(List<int> rideIds, CancellationToken cancellationToken)
    {
        if (rideIds.Count == 0) return;

        var ridesToDelete = await rides.Query()
            .Where(r => rideIds.Contains(r.RideId))
            .ToListAsync(cancellationToken);

        var rideMessages = await messages.Query()
            .Where(m => rideIds.Contains(m.RideId))
            .ToListAsync(cancellationToken);
        foreach (var m in rideMessages) messages.Delete(m);

        var rideReviews = await reviews.Query()
            .Where(r => rideIds.Contains(r.RideId))
            .ToListAsync(cancellationToken);
        foreach (var r in rideReviews) reviews.Delete(r);

        var rideReservations = await reservations.Query()
            .Where(r => rideIds.Contains(r.RideId))
            .ToListAsync(cancellationToken);
        foreach (var r in rideReservations) reservations.Delete(r);

        foreach (var ride in ridesToDelete) rides.Delete(ride);
    }
}
