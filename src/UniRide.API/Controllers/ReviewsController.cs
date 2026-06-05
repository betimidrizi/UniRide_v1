using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;

namespace UniRide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class ReviewsController(IReviewService service) : BaseController
{
    [HttpPost]
    [ProducesResponseType(typeof(ReviewReadDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReviewReadDto>> Create(ReviewCreateDto dto, CancellationToken ct)
    {
        var result = await service.CreateAsync(CurrentUserId, dto, ct);
        return Created(string.Empty, result);
    }

    [HttpGet("user/{userId:int}")]
    [ProducesResponseType(typeof(List<ReviewReadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ReviewReadDto>>> GetForUser(int userId, CancellationToken ct)
        => Ok(await service.GetForUserAsync(userId, ct));

    [HttpGet("mine")]
    [ProducesResponseType(typeof(List<ReviewReadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ReviewReadDto>>> Mine(CancellationToken ct)
        => Ok(await service.GetMineAsync(CurrentUserId, ct));

    [HttpGet("exists")]
    [ProducesResponseType(typeof(ReviewExistsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ReviewExistsResponse>> Exists(
        [FromQuery] int rideId,
        [FromQuery] int targetUserId,
        CancellationToken ct)
        => Ok(new ReviewExistsResponse(await service.ExistsForRideAsync(CurrentUserId, rideId, targetUserId, ct)));
}

public record ReviewExistsResponse(bool Exists);
