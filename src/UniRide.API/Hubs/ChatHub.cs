using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using UniRide.Application.Interfaces;

namespace UniRide.API.Hubs;

[Authorize]
public class ChatHub(IChatService chatService) : Hub
{
    public static string ConversationGroup(int rideId, int userA, int userB)
    {
        var low = Math.Min(userA, userB);
        var high = Math.Max(userA, userB);
        return $"ride:{rideId}:users:{low}:{high}";
    }

    public async Task JoinConversation(int rideId, int otherUserId)
    {
        var userId = CurrentUserId();
        await chatService.GetConversationAsync(rideId, userId, otherUserId, Context.ConnectionAborted);
        await Groups.AddToGroupAsync(Context.ConnectionId, ConversationGroup(rideId, userId, otherUserId), Context.ConnectionAborted);
    }

    public Task LeaveConversation(int rideId, int otherUserId)
    {
        var userId = CurrentUserId();
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, ConversationGroup(rideId, userId, otherUserId), Context.ConnectionAborted);
    }

    private int CurrentUserId()
    {
        var raw = Context.UserIdentifier
            ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(raw, out var userId))
            throw new HubException("Invalid session.");

        return userId;
    }
}
