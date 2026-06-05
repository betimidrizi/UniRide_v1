using UniRide.Application.DTOs;

namespace UniRide.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto, string? ip, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> LoginAsync(LoginDto dto, string? ip, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> RefreshAsync(string refreshToken, string? ip, CancellationToken cancellationToken = default);
    Task RevokeAsync(string refreshToken, string? ip, CancellationToken cancellationToken = default);
}
