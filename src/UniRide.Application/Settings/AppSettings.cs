namespace UniRide.Application.Settings;

public sealed class AdminSeedSettings
{
    public const string SectionName = "AdminSeed";

    public string? Email { get; init; }
    public string? Password { get; init; }
    public string? FullName { get; init; }
    public string? University { get; init; }
}

public sealed class CorsSettings
{
    public const string SectionName = "Cors";

    public string[] AllowedOrigins { get; init; } = Array.Empty<string>();
}

public sealed class AuthLockoutSettings
{
    public const string SectionName = "AuthLockout";

    public int MaxFailedAttempts { get; init; } = 5;
    public int LockoutMinutes { get; init; } = 15;
}
