namespace UniRide.Domain.Entities;

public class ChatMessage : BaseEntity
{
    public int ChatMessageId { get; set; }
    public int RideId { get; set; }
    public int SenderId { get; set; }
    public int ReceiverId { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; }
}
