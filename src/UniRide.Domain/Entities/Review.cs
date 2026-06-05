namespace UniRide.Domain.Entities;

public class Review : BaseEntity
{
    public int ReviewId { get; set; }
    public int ReviewerId { get; set; }
    public int TargetUserId { get; set; }
    public int RideId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
}
