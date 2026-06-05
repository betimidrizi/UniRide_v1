using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;

namespace UniRide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class ReservationsController(IReservationService service) : BaseController
{
    /// <summary>Request a seat on the given ride for the current passenger. Status starts as Pending until the driver approves.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ReservationReadDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReservationReadDto>> Join(JoinReservationDto dto, CancellationToken ct)
    {
        var result = await service.JoinRideAsync(dto.RideId, CurrentUserId, ct);
        return CreatedAtAction(nameof(Mine), null, result);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancel(int id, CancellationToken ct)
    {
        var ok = await service.CancelAsync(id, CurrentUserId, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("mine")]
    [ProducesResponseType(typeof(List<ReservationReadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ReservationReadDto>>> Mine(CancellationToken ct)
        => Ok(await service.GetMineAsync(CurrentUserId, ct));

    /// <summary>Driver-only: approve a pending reservation → Confirmed.</summary>
    [HttpPatch("{id:int}/approve")]
    [ProducesResponseType(typeof(ReservationReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReservationReadDto>> Approve(int id, CancellationToken ct)
        => Ok(await service.ApproveAsync(id, CurrentUserId, ct));

    /// <summary>Driver-only: reject a pending reservation → Cancelled, seat restored.</summary>
    [HttpPatch("{id:int}/reject")]
    [ProducesResponseType(typeof(ReservationReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReservationReadDto>> Reject(int id, CancellationToken ct)
        => Ok(await service.RejectAsync(id, CurrentUserId, ct));
}

public record JoinReservationDto(int RideId);
