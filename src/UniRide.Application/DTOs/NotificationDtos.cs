namespace UniRide.Application.DTOs;

public record NotificationReadDto(int NotificationId, string Message, bool IsRead, DateTime CreatedAt);
