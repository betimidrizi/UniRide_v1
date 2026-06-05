namespace UniRide.Application.DTOs;

public record RegisterDto(
    string FullName,
    string Email,
    string Password,
    string University,
    string? PhoneNumber);

public record LoginDto(string Email, string Password);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt,
    int UserId,
    string Email,
    string FullName,
    string Role);

public record RefreshTokenRequestDto(string RefreshToken);

public record RevokeRefreshTokenRequestDto(string RefreshToken);
