using UniRide.Domain.Entities;

namespace UniRide.Application.Interfaces;

public sealed record JwtTokenResult(string AccessToken, DateTime ExpiresAtUtc);

public interface IJwtTokenService
{
    JwtTokenResult CreateAccessToken(User user);
    string CreateRefreshToken();
}
