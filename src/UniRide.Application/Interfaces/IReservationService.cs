using UniRide.Application.DTOs;

namespace UniRide.Application.Interfaces;

public interface IReservationService
{
    Task<ReservationReadDto> JoinRideAsync(int rideId, int passengerId, CancellationToken cancellationToken = default);
    Task<bool> CancelAsync(int reservationId, int userId, CancellationToken cancellationToken = default);
    Task<List<ReservationReadDto>> GetMineAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>Driver-only — accept a pending request, transition to Confirmed, notify passenger.</summary>
    Task<ReservationReadDto> ApproveAsync(int reservationId, int driverId, CancellationToken cancellationToken = default);

    /// <summary>Driver-only — reject a pending request, transition to Cancelled, restore the seat, notify passenger.</summary>
    Task<ReservationReadDto> RejectAsync(int reservationId, int driverId, CancellationToken cancellationToken = default);
}
