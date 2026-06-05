using UniRide.Domain.Enums;

namespace UniRide.Domain.Entities;

public class Report : BaseEntity
{
    public int ReportId { get; set; }
    public int ReporterId { get; set; }
    public User? Reporter { get; set; }
    public int? TargetUserId { get; set; }
    public User? TargetUser { get; set; }
    public int? RideId { get; set; }
    public Ride? Ride { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public ReportStatus Status { get; set; } = ReportStatus.Open;
    public DateTime? ResolvedAt { get; set; }
}
