using AutoMapper;
using Microsoft.EntityFrameworkCore;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;
using UniRide.Domain.Entities;
using UniRide.Domain.Enums;
using UniRide.Domain.Exceptions;

namespace UniRide.Application.Services;

public class ChatService(
    IRepository<ChatMessage> messages,
    IRepository<Ride> rides,
    IRepository<Reservation> reservations,
    IRepository<User> users,
    IMapper mapper) : IChatService
{
    public async Task<ChatMessageReadDto> SendAsync(ChatSendDto dto, int senderId, CancellationToken cancellationToken = default)
    {
        if (dto.ReceiverId == senderId)
            throw new ConflictException("You cannot send a message to yourself.");

        var ride = await rides.QueryNoTracking()
            .FirstOrDefaultAsync(r => r.RideId == dto.RideId, cancellationToken)
            ?? throw new NotFoundException("Ride", dto.RideId);

        await EnsureValidChannelAsync(ride, senderId, dto.ReceiverId, cancellationToken);

        var message = new ChatMessage
        {
            RideId = dto.RideId,
            SenderId = senderId,
            ReceiverId = dto.ReceiverId,
            Message = dto.Message.Trim(),
            SentAt = DateTime.UtcNow,
            IsRead = false
        };

        await messages.AddAsync(message, cancellationToken);
        await messages.SaveChangesAsync(cancellationToken);

        return mapper.Map<ChatMessageReadDto>(message);
    }

    public async Task<List<ChatMessageReadDto>> GetConversationAsync(int rideId, int userId, int otherUserId, CancellationToken cancellationToken = default)
    {
        var ride = await rides.QueryNoTracking()
            .FirstOrDefaultAsync(r => r.RideId == rideId, cancellationToken)
            ?? throw new NotFoundException("Ride", rideId);

        await EnsureValidChannelAsync(ride, userId, otherUserId, cancellationToken);

        var list = await messages.Query()
            .Where(m =>
                m.RideId == rideId &&
                (
                    (m.SenderId == userId && m.ReceiverId == otherUserId) ||
                    (m.SenderId == otherUserId && m.ReceiverId == userId)
                ))
            .OrderBy(m => m.SentAt)
            .ToListAsync(cancellationToken);

        var unread = list.Where(m => m.ReceiverId == userId && !m.IsRead).ToList();
        if (unread.Count > 0)
        {
            foreach (var m in unread)
                m.IsRead = true;
            await messages.SaveChangesAsync(cancellationToken);
        }

        return mapper.Map<List<ChatMessageReadDto>>(list);
    }

    public async Task<List<ChatThreadDto>> GetThreadsAsync(int userId, CancellationToken cancellationToken = default)
    {
        // 1. Project the (rideId, otherUserId) pairs DB-side, including last message + unread count.
        var threadsRaw = await messages.QueryNoTracking()
            .Where(m => m.SenderId == userId || m.ReceiverId == userId)
            .GroupBy(m => new
            {
                m.RideId,
                OtherUserId = m.SenderId == userId ? m.ReceiverId : m.SenderId
            })
            .Select(g => new
            {
                g.Key.RideId,
                g.Key.OtherUserId,
                LastMessage = g.OrderByDescending(m => m.SentAt).Select(m => m.Message).First(),
                LastMessageAt = g.Max(m => m.SentAt),
                UnreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead)
            })
            .ToListAsync(cancellationToken);

        if (threadsRaw.Count == 0)
            return new List<ChatThreadDto>();

        // 2. Bulk-lookup ride + user metadata.
        var rideIds = threadsRaw.Select(t => t.RideId).Distinct().ToList();
        var userIds = threadsRaw.Select(t => t.OtherUserId).Distinct().ToList();

        var rideLookup = await rides.QueryNoTracking()
            .Where(r => rideIds.Contains(r.RideId))
            .ToDictionaryAsync(r => r.RideId, cancellationToken);

        var userLookup = await users.QueryNoTracking()
            .Where(u => userIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, cancellationToken);

        return threadsRaw
            .Where(t => rideLookup.ContainsKey(t.RideId))
            .OrderByDescending(t => t.LastMessageAt)
            .Select(t =>
            {
                var ride = rideLookup[t.RideId];
                userLookup.TryGetValue(t.OtherUserId, out var other);
                return new ChatThreadDto(
                    t.RideId,
                    t.OtherUserId,
                    other?.FullName ?? $"User {t.OtherUserId}",
                    $"{ride.StartLocation} → {ride.Destination}",
                    t.LastMessage,
                    t.LastMessageAt,
                    t.UnreadCount);
            })
            .ToList();
    }

    public Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default)
    {
        // Inner join enforces "ride must still exist" without a separate trip.
        var q =
            from m in messages.QueryNoTracking()
            join r in rides.QueryNoTracking() on m.RideId equals r.RideId
            where m.ReceiverId == userId && !m.IsRead
            select m.ChatMessageId;

        return q.CountAsync(cancellationToken);
    }

    private async Task EnsureValidChannelAsync(Ride ride, int userId, int otherUserId, CancellationToken cancellationToken)
    {
        var userIsDriver = ride.DriverId == userId;
        var otherIsDriver = ride.DriverId == otherUserId;

        if (!userIsDriver && !otherIsDriver)
            throw new ForbiddenException("Chat is allowed only between driver and confirmed passenger.");

        var passengerId = userIsDriver ? otherUserId : userId;

        var passengerHasReservation = await reservations.Query()
            .AnyAsync(r =>
                r.RideId == ride.RideId &&
                r.PassengerId == passengerId &&
                r.ReservationStatus == ReservationStatus.Confirmed,
                cancellationToken);

        if (!passengerHasReservation)
            throw new ForbiddenException("Chat is allowed only between driver and confirmed passenger.");
    }
}
