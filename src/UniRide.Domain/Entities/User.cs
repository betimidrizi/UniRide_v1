using UniRide.Domain.Enums;

namespace UniRide.Domain.Entities;

public class User : BaseEntity
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public UserRole Role { get; set; } = UserRole.Student;
    public double Rating { get; set; }
    public string? ProfileImageUrl { get; set; }
    public bool IsSuspended { get; set; }
    public bool IsVerified { get; set; }
    public DateTime? VerificationRequestedAt { get; set; }

    // Account lockout / brute-force protection
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockedOutUntil { get; set; }

    public ICollection<Ride> Rides { get; set; } = new List<Ride>();
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
