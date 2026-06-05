using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;
using UniRide.API.Hubs;

namespace UniRide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class ChatController(IChatService service, IHubContext<ChatHub> hub) : BaseController
{
    [HttpPost]
    [ProducesResponseType(typeof(ChatMessageReadDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ChatMessageReadDto>> Send(ChatSendDto dto, CancellationToken ct)
    {
        var result = await service.SendAsync(dto, CurrentUserId, ct);
        var group = ChatHub.ConversationGroup(result.RideId, result.SenderId, result.ReceiverId);
        var receiverUnreadCount = await service.GetUnreadCountAsync(result.ReceiverId, ct);
        await hub.Clients.Group(group).SendAsync("ReceiveMessage", result, ct);
        await hub.Clients.User(result.ReceiverId.ToString()).SendAsync("UnreadCountChanged", receiverUnreadCount, ct);
        return Created(string.Empty, result);
    }

    [HttpGet("conversation")]
    [ProducesResponseType(typeof(List<ChatMessageReadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<ChatMessageReadDto>>> Conversation(
        [FromQuery] int rideId,
        [FromQuery] int otherUserId,
        CancellationToken ct)
        => Ok(await service.GetConversationAsync(rideId, CurrentUserId, otherUserId, ct));

    [HttpGet("threads")]
    [ProducesResponseType(typeof(List<ChatThreadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ChatThreadDto>>> Threads(CancellationToken ct)
        => Ok(await service.GetThreadsAsync(CurrentUserId, ct));

    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(UnreadCountResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<UnreadCountResponse>> UnreadCount(CancellationToken ct)
        => Ok(new UnreadCountResponse(await service.GetUnreadCountAsync(CurrentUserId, ct)));
}

public record UnreadCountResponse(int Count);
