using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;

namespace UniRide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class NotificationsController(INotificationService service) : BaseController
{
    [HttpGet]
    [ProducesResponseType(typeof(List<NotificationReadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<NotificationReadDto>>> GetMine(
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
        => Ok(await service.GetMineAsync(CurrentUserId, limit, ct));

    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(NotificationUnreadCountResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationUnreadCountResponse>> UnreadCount(CancellationToken ct)
        => Ok(new NotificationUnreadCountResponse(await service.GetUnreadCountAsync(CurrentUserId, ct)));

    [HttpPatch("{id:int}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkRead(int id, CancellationToken ct)
    {
        var ok = await service.MarkReadAsync(CurrentUserId, id, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPatch("read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        await service.MarkAllReadAsync(CurrentUserId, ct);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var ok = await service.DeleteAsync(CurrentUserId, id, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("read")]
    [ProducesResponseType(typeof(NotificationDeleteResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationDeleteResponse>> DeleteRead(CancellationToken ct)
        => Ok(new NotificationDeleteResponse(await service.DeleteReadAsync(CurrentUserId, ct)));

    [HttpDelete]
    [ProducesResponseType(typeof(NotificationDeleteResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationDeleteResponse>> DeleteAll(CancellationToken ct)
        => Ok(new NotificationDeleteResponse(await service.DeleteAllAsync(CurrentUserId, ct)));
}

public record NotificationUnreadCountResponse(int Count);
public record NotificationDeleteResponse(int Deleted);
