using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;
using UniRide.Application.Settings;
using UniRide.Domain.Entities;
using UniRide.Domain.Enums;
using UniRide.Domain.Exceptions;

namespace UniRide.Application.Services;

public class ReservationService(
    IRepository<Reservation> reservations,
    IRepository<Ride> rides,
    IRepository<User> users,
    INotificationService notifications,
    IOptions<RidesSettings> ridesOptions,
    IMapper mapper) : IReservationService
{
    private const int MaxRetries = 3;
    private readonly RidesSettings _ridesSettings = ridesOptions.Value;

    public async Task<ReservationReadDto> JoinRideAsync(int rideId, int passengerId, CancellationToken cancellationToken = default)
    {
        for (var attempt = 0; attempt < MaxRetries; attempt++)
        {
            try
            {
                return await TryJoinAsync(rideId, passengerId, cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (attempt == MaxRetries - 1)
                    throw new ConflictException("Could not reserve seat — please try again.");
            }
        }

        throw new ConflictException("Could not reserve seat — please try again.");
    }

    private async Task<ReservationReadDto> TryJoinAsync(int rideId, int passengerId, CancellationToken cancellationToken)
    {
        var ride = await rides.Query()
            .FirstOrDefaultAsync(r => r.RideId == rideId, cancellationToken)
            ?? throw new NotFoundException("Ride", rideId);

        if (ride.DriverId == passengerId)
            throw new ConflictException("A driver cannot join their own ride.");

        if (ride.Status is RideStatus.Cancelled or RideStatus.Completed or RideStatus.InProgress)
            throw new ConflictException($"Ride is {ride.Status} — no longer accepting reservations.");

        if (ride.AvailableSeats <= 0 || ride.Status == RideStatus.Full)
            throw new ConflictException("No seats available for this ride.");

        // Reservation deadline — refuse if too close to departure.
        var deadline = ride.DepartureTime.AddMinutes(-_ridesSettings.JoinDeadlineMinutes);
        if (DateTime.UtcNow > deadline)
            throw new ConflictException($"Reservations close {_ridesSettings.JoinDeadlineMinutes} minutes before departure.");

        var alreadyJoined = await reservations.Query()
            .AnyAsync(r =>
                r.RideId == rideId &&
                r.PassengerId == passengerId &&
                r.ReservationStatus != ReservationStatus.Cancelled,
                cancellationToken);

        if (alreadyJoined)
            throw new ConflictException("You have already requested a seat on this ride.");

        // Hold the seat while Pending — restored on Reject.
        ride.AvailableSeats--;
        ride.Status = ride.AvailableSeats == 0 ? RideStatus.Full : RideStatus.Open;

        var reservation = new Reservation
        {
            RideId = rideId,
            PassengerId = passengerId,
            ReservationStatus = ReservationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await reservations.AddAsync(reservation, cancellationToken);
        rides.Update(ride);
        await reservations.SaveChangesAsync(cancellationToken);

        // Notify the driver
        var passenger = await users.QueryNoTracking().FirstOrDefaultAsync(u => u.UserId == passengerId, cancellationToken);
        await notifications.NotifyAsync(
            ride.DriverId,
            $"{passenger?.FullName ?? $"User {passengerId}"} requested a seat on your ride to {ride.Destination}.",
            cancellationToken);

        var hydrated = await reservations.QueryNoTracking()
            .Include(r => r.Passenger)
            .Include(r => r.Ride)!.ThenInclude(x => x!.Driver)
            .FirstAsync(r => r.ReservationId == reservation.ReservationId, cancellationToken);

        return mapper.Map<ReservationReadDto>(hydrated);
    }

    public async Task<bool> CancelAsync(int reservationId, int userId, CancellationToken cancellationToken = default)
    {
        var reservation = await reservations.Query()
            .Include(r => r.Ride)
            .FirstOrDefaultAsync(r => r.ReservationId == reservationId, cancellationToken);

        if (reservation is null)
            return false;

        if (reservation.PassengerId != userId)
            throw new ForbiddenException();

        if (reservation.ReservationStatus == ReservationStatus.Cancelled)
            throw new ConflictException("Reservation is already cancelled.");

        reservation.ReservationStatus = ReservationStatus.Cancelled;

        if (reservation.Ride is not null)
        {
            reservation.Ride.AvailableSeats++;
            reservation.Ride.Status = RideStatus.Open;
            rides.Update(reservation.Ride);
        }

        await reservations.SaveChangesAsync(cancellationToken);

        if (reservation.Ride is not null)
        {
            var passenger = await users.QueryNoTracking().FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);
            await notifications.NotifyAsync(
                reservation.Ride.DriverId,
                $"{passenger?.FullName ?? $"User {userId}"} cancelled their reservation on your ride to {reservation.Ride.Destination}.",
                cancellationToken);
        }

        return true;
    }

    public async Task<List<ReservationReadDto>> GetMineAsync(int userId, CancellationToken cancellationToken = default)
    {
        var list = await reservations.QueryNoTracking()
            .Include(r => r.Passenger)
            .Include(r => r.Ride)!.ThenInclude(ride => ride!.Driver)
            .Where(r =>
                r.PassengerId == userId &&
                r.ReservationStatus != ReservationStatus.Cancelled &&
                r.Ride != null &&
                r.Ride.Status != RideStatus.Completed &&
                r.Ride.Status != RideStatus.Cancelled)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return mapper.Map<List<ReservationReadDto>>(list);
    }

    public async Task<ReservationReadDto> ApproveAsync(int reservationId, int driverId, CancellationToken cancellationToken = default)
    {
        var reservation = await reservations.Query()
            .Include(r => r.Ride)
            .Include(r => r.Passenger)
            .FirstOrDefaultAsync(r => r.ReservationId == reservationId, cancellationToken)
            ?? throw new NotFoundException("Reservation", reservationId);

        if (reservation.Ride is null || reservation.Ride.DriverId != driverId)
            throw new ForbiddenException("Only the driver can approve this reservation.");

        if (reservation.ReservationStatus == ReservationStatus.Confirmed)
            return mapper.Map<ReservationReadDto>(reservation);

        if (reservation.ReservationStatus != ReservationStatus.Pending)
            throw new ConflictException($"Cannot approve a reservation in state '{reservation.ReservationStatus}'.");

        reservation.ReservationStatus = ReservationStatus.Confirmed;
        reservations.Update(reservation);
        await reservations.SaveChangesAsync(cancellationToken);

        await notifications.NotifyAsync(
            reservation.PassengerId,
            $"Your seat on the ride to {reservation.Ride.Destination} was confirmed.",
            cancellationToken);

        var hydrated = await reservations.QueryNoTracking()
            .Include(r => r.Passenger)
            .Include(r => r.Ride)!.ThenInclude(x => x!.Driver)
            .FirstAsync(r => r.ReservationId == reservation.ReservationId, cancellationToken);

        return mapper.Map<ReservationReadDto>(hydrated);
    }

    public async Task<ReservationReadDto> RejectAsync(int reservationId, int driverId, CancellationToken cancellationToken = default)
    {
        var reservation = await reservations.Query()
            .Include(r => r.Ride)
            .FirstOrDefaultAsync(r => r.ReservationId == reservationId, cancellationToken)
            ?? throw new NotFoundException("Reservation", reservationId);

        if (reservation.Ride is null || reservation.Ride.DriverId != driverId)
            throw new ForbiddenException("Only the driver can reject this reservation.");

        if (reservation.ReservationStatus == ReservationStatus.Cancelled)
            return mapper.Map<ReservationReadDto>(reservation);

        if (reservation.ReservationStatus != ReservationStatus.Pending)
            throw new ConflictException($"Cannot reject a reservation in state '{reservation.ReservationStatus}'.");

        reservation.ReservationStatus = ReservationStatus.Cancelled;

        // Restore the seat
        reservation.Ride.AvailableSeats++;
        reservation.Ride.Status = RideStatus.Open;
        rides.Update(reservation.Ride);
        reservations.Update(reservation);
        await reservations.SaveChangesAsync(cancellationToken);

        await notifications.NotifyAsync(
            reservation.PassengerId,
            $"Your seat request for the ride to {reservation.Ride.Destination} was declined.",
            cancellationToken);

        var hydrated = await reservations.QueryNoTracking()
            .Include(r => r.Passenger)
            .Include(r => r.Ride)!.ThenInclude(x => x!.Driver)
            .FirstAsync(r => r.ReservationId == reservation.ReservationId, cancellationToken);

        return mapper.Map<ReservationReadDto>(hydrated);
    }
}
