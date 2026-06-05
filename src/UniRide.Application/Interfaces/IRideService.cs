using UniRide.Application.Common;
using UniRide.Application.DTOs;

namespace UniRide.Application.Interfaces;

public interface IRideService
{
    Task<RideReadDto> CreateAsync(RideCreateDto dto, int driverId, CancellationToken cancellationToken = default);
    Task<PagedResult<RideReadDto>> SearchAsync(RideSearchDto dto, CancellationToken cancellationToken = default);
    Task<List<RideReadDto>> GetMineAsync(int userId, CancellationToken cancellationToken = default);
    Task<RideReadDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<RideReadDto?> UpdateAsync(int id, RideUpdateDto dto, int userId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, int userId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<List<ReservationReadDto>> GetPassengersAsync(int rideId, int userId, bool isAdmin, CancellationToken cancellationToken = default);

    /// <summary>Driver-only transition Open/Full → InProgress. Sets StartedAt.</summary>
    Task<RideReadDto> StartAsync(int rideId, int driverId, CancellationToken cancellationToken = default);

    /// <summary>Driver-only transition → Completed. Sets CompletedAt and notifies passengers.</summary>
    Task<RideReadDto> CompleteAsync(int rideId, int driverId, CancellationToken cancellationToken = default);
}
