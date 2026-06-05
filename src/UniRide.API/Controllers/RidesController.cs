using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniRide.Application.Common;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;

namespace UniRide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class RidesController(IRideService service) : BaseController
{
    [HttpPost]
    [ProducesResponseType(typeof(RideReadDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RideReadDto>> Create(RideCreateDto dto, CancellationToken ct)
    {
        var ride = await service.CreateAsync(dto, CurrentUserId, ct);
        return CreatedAtAction(nameof(Get), new { id = ride.RideId }, ride);
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<RideReadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<RideReadDto>>> Search([FromQuery] RideSearchDto dto, CancellationToken ct)
    {
        dto.IncludeArchived = dto.IncludeArchived && IsAdmin;
        return Ok(await service.SearchAsync(dto, ct));
    }

    [HttpGet("mine")]
    [ProducesResponseType(typeof(List<RideReadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<RideReadDto>>> Mine(CancellationToken ct)
        => Ok(await service.GetMineAsync(CurrentUserId, ct));

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(RideReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RideReadDto>> Get(int id, CancellationToken ct)
    {
        var ride = await service.GetByIdAsync(id, ct);
        return ride is null ? NotFound() : Ok(ride);
    }

    [HttpGet("{id:int}/passengers")]
    [ProducesResponseType(typeof(List<ReservationReadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<ReservationReadDto>>> Passengers(int id, CancellationToken ct)
        => Ok(await service.GetPassengersAsync(id, CurrentUserId, IsAdmin, ct));

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(RideReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RideReadDto>> Update(int id, RideUpdateDto dto, CancellationToken ct)
    {
        var result = await service.UpdateAsync(id, dto, CurrentUserId, IsAdmin, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var ok = await service.DeleteAsync(id, CurrentUserId, IsAdmin, ct);
        return ok ? NoContent() : NotFound();
    }

    /// <summary>Driver-only: transition ride into InProgress, stamps StartedAt, notifies passengers.</summary>
    [HttpPatch("{id:int}/start")]
    [ProducesResponseType(typeof(RideReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RideReadDto>> Start(int id, CancellationToken ct)
        => Ok(await service.StartAsync(id, CurrentUserId, ct));

    /// <summary>Driver-only: transition ride to Completed, prompts reviews.</summary>
    [HttpPatch("{id:int}/complete")]
    [ProducesResponseType(typeof(RideReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RideReadDto>> Complete(int id, CancellationToken ct)
        => Ok(await service.CompleteAsync(id, CurrentUserId, ct));
}
