using UniRide.Application.Interfaces;

namespace UniRide.Infrastructure.Services;

public class PasswordHasher : IPasswordHasher
{
    // Cost factor 12 ≈ ~250ms on modern hardware. Tune up over time.
    private const int WorkFactor = 12;

    public string Hash(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public bool Verify(string password, string hash) =>
        BCrypt.Net.BCrypt.Verify(password, hash);
}
