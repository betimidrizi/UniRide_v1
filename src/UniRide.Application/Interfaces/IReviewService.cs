using UniRide.Application.DTOs;

namespace UniRide.Application.Interfaces;

public interface IReviewService
{
    Task<ReviewReadDto> CreateAsync(int reviewerId, ReviewCreateDto dto, CancellationToken ct = default);
    Task<List<ReviewReadDto>> GetForUserAsync(int targetUserId, CancellationToken ct = default);
    Task<List<ReviewReadDto>> GetMineAsync(int userId, CancellationToken ct = default);
    Task<bool> ExistsForRideAsync(int reviewerId, int rideId, int targetUserId, CancellationToken ct = default);
}
