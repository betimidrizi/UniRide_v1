using UniRide.Application.DTOs;

namespace UniRide.Application.Interfaces;

public interface INotificationService
{
    /// <summary>Insert a notification for a user (no SaveChanges — caller decides). Cheap, fire-and-forget shape but actually async.</summary>
    Task NotifyAsync(int userId, string message, CancellationToken ct = default);

    Task<List<NotificationReadDto>> GetMineAsync(int userId, int limit = 50, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default);
    Task<bool> MarkReadAsync(int userId, int notificationId, CancellationToken ct = default);
    Task MarkAllReadAsync(int userId, CancellationToken ct = default);
    Task<bool> DeleteAsync(int userId, int notificationId, CancellationToken ct = default);
    Task<int> DeleteReadAsync(int userId, CancellationToken ct = default);
    Task<int> DeleteAllAsync(int userId, CancellationToken ct = default);
}
