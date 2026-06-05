namespace UniRide.Application.DTOs;

public record ChatSendDto(int RideId, int ReceiverId, string Message);

public record ChatMessageReadDto(
    int ChatMessageId,
    int RideId,
    int SenderId,
    int ReceiverId,
    string Message,
    DateTime SentAt,
    bool IsRead);

public record ChatThreadDto(
    int RideId,
    int OtherUserId,
    string OtherUserName,
    string Route,
    string LastMessage,
    DateTime LastMessageAt,
    int UnreadCount);
