using UniRide.Application.DTOs;

namespace UniRide.Application.Interfaces;

public interface IUserService
{
    Task<UserProfileDto> GetProfileAsync(int userId, CancellationToken cancellationToken = default);
    Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileDto dto, CancellationToken cancellationToken = default);
    Task<UserProfileDto> RequestVerificationAsync(int userId, CancellationToken cancellationToken = default);
}
