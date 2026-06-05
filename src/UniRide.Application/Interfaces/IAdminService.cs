using UniRide.Application.DTOs;

namespace UniRide.Application.Interfaces;

public interface IAdminService
{
    Task<List<AdminUserDto>> GetUsersAsync(CancellationToken cancellationToken = default);
    Task<AdminUserDto> SetSuspensionAsync(int userId, bool isSuspended, CancellationToken cancellationToken = default);
    Task<AdminUserDto> SetVerificationAsync(int userId, bool isVerified, CancellationToken cancellationToken = default);
    Task<AdminUserDto> UpdateUserAsync(int userId, AdminUserUpdateDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> ForceDeleteRideAsync(int rideId, CancellationToken cancellationToken = default);
    Task<AdminStatsDto> GetStatsAsync(CancellationToken cancellationToken = default);
}
