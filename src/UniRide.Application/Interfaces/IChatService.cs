using UniRide.Application.DTOs;

namespace UniRide.Application.Interfaces;

public interface IChatService
{
    Task<ChatMessageReadDto> SendAsync(ChatSendDto dto, int senderId, CancellationToken cancellationToken = default);
    Task<List<ChatMessageReadDto>> GetConversationAsync(int rideId, int userId, int otherUserId, CancellationToken cancellationToken = default);
    Task<List<ChatThreadDto>> GetThreadsAsync(int userId, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default);
}
