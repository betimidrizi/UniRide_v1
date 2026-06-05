namespace UniRide.Domain.Entities;

/// <summary>
/// Long-lived rotating refresh token. Each access-token rotation revokes the
/// previous refresh token (ReplacedByToken) so a stolen token chain can be
/// detected and the whole family revoked.
/// </summary>
public class RefreshToken : BaseEntity
{
    public int RefreshTokenId { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByToken { get; set; }
    public string? CreatedByIp { get; set; }
    public string? RevokedByIp { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => RevokedAt is null && !IsExpired;
}
