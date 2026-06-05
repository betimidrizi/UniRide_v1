namespace UniRide.Application.DTOs;

public class UserProfileDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = string.Empty;
    public double Rating { get; set; }
    public bool IsVerified { get; set; }
    public DateTime? VerificationRequestedAt { get; set; }
}

public class UpdateProfileDto
{
    public string FullName { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

public class AdminUserDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = string.Empty;
    public double Rating { get; set; }
    public bool IsSuspended { get; set; }
    public bool IsVerified { get; set; }
    public DateTime? VerificationRequestedAt { get; set; }
}

public class AdminUserUpdateDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string University { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "Student";
    public bool IsSuspended { get; set; }
}

public class AdminStatsDto
{
    public int Users { get; set; }
    public int ActiveUsers { get; set; }
    public int SuspendedUsers { get; set; }
    public int Rides { get; set; }
    public int Reservations { get; set; }
    public int Messages { get; set; }
    public int Reviews { get; set; }
    public int Notifications { get; set; }
}
