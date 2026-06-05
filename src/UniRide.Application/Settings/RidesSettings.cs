namespace UniRide.Application.Settings;

/// <summary>Tunable rules around rides and reservations.</summary>
public sealed class RidesSettings
{
    public const string SectionName = "Rides";

    /// <summary>Reject join requests this many minutes before departure.</summary>
    public int JoinDeadlineMinutes { get; init; } = 15;
}
