namespace UniRide.Application.DTOs;

public class ReportCreateDto
{
    public int? TargetUserId { get; set; }
    public int? RideId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
}

public class ReportReadDto
{
    public int ReportId { get; set; }
    public int ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public int? TargetUserId { get; set; }
    public string? TargetUserName { get; set; }
    public int? RideId { get; set; }
    public string? RideRoute { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
