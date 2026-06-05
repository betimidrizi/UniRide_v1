namespace UniRide.Application.Settings;

/// <summary>
/// Strongly-typed binding of the "Jwt" section in appsettings. Bound via
/// IOptions&lt;JwtSettings&gt; — services no longer scrape IConfiguration with
/// magic strings.
/// </summary>
public sealed class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Key { get; init; } = string.Empty;
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;

    /// <summary>Access token lifetime in minutes. Default 15.</summary>
    public int AccessTokenMinutes { get; init; } = 15;

    /// <summary>Refresh token lifetime in days. Default 7.</summary>
    public int RefreshTokenDays { get; init; } = 7;
}
