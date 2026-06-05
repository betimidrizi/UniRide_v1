using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;

namespace UniRide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class UsersController(IUserService service) : BaseController
{
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserProfileDto>> Me(CancellationToken ct)
        => Ok(await service.GetProfileAsync(CurrentUserId, ct));

    [HttpPut("me")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserProfileDto>> Update(UpdateProfileDto dto, CancellationToken ct)
        => Ok(await service.UpdateProfileAsync(CurrentUserId, dto, ct));

    [HttpPatch("me/request-verification")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserProfileDto>> RequestVerification(CancellationToken ct)
        => Ok(await service.RequestVerificationAsync(CurrentUserId, ct));
}
