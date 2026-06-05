using Microsoft.EntityFrameworkCore;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;
using UniRide.Domain.Entities;

namespace UniRide.Application.Services;

public class NotificationService(IRepository<Notification> notifications) : INotificationService
{
    public async Task NotifyAsync(int userId, string message, CancellationToken ct = default)
    {
        var entity = new Notification
        {
            UserId = userId,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await notifications.AddAsync(entity, ct);
        await notifications.SaveChangesAsync(ct);
    }

    public async Task<List<NotificationReadDto>> GetMineAsync(int userId, int limit = 50, CancellationToken ct = default)
    {
        if (limit <= 0) limit = 50;
        if (limit > 200) limit = 200;

        return await notifications.QueryNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .Select(n => new NotificationReadDto(n.NotificationId, n.Message, n.IsRead, n.CreatedAt))
            .ToListAsync(ct);
    }

    public Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default) =>
        notifications.QueryNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsRead, ct);

    public async Task<bool> MarkReadAsync(int userId, int notificationId, CancellationToken ct = default)
    {
        var entity = await notifications.Query()
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.UserId == userId, ct);

        if (entity is null)
            return false;

        if (!entity.IsRead)
        {
            entity.IsRead = true;
            notifications.Update(entity);
            await notifications.SaveChangesAsync(ct);
        }

        return true;
    }

    public async Task MarkAllReadAsync(int userId, CancellationToken ct = default)
    {
        var unread = await notifications.Query()
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(ct);

        if (unread.Count == 0)
            return;

        foreach (var n in unread)
            n.IsRead = true;

        await notifications.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(int userId, int notificationId, CancellationToken ct = default)
    {
        var entity = await notifications.Query()
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.UserId == userId, ct);

        if (entity is null)
            return false;

        notifications.Delete(entity);
        await notifications.SaveChangesAsync(ct);
        return true;
    }

    public async Task<int> DeleteReadAsync(int userId, CancellationToken ct = default)
    {
        var read = await notifications.Query()
            .Where(n => n.UserId == userId && n.IsRead)
            .ToListAsync(ct);

        foreach (var n in read)
            notifications.Delete(n);

        if (read.Count > 0)
            await notifications.SaveChangesAsync(ct);

        return read.Count;
    }

    public async Task<int> DeleteAllAsync(int userId, CancellationToken ct = default)
    {
        var mine = await notifications.Query()
            .Where(n => n.UserId == userId)
            .ToListAsync(ct);

        foreach (var n in mine)
            notifications.Delete(n);

        if (mine.Count > 0)
            await notifications.SaveChangesAsync(ct);

        return mine.Count;
    }
}
