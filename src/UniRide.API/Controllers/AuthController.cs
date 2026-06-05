using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;

namespace UniRide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController(IAuthService auth) : BaseController
{
    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto, CancellationToken ct)
        => Ok(await auth.RegisterAsync(dto, ClientIp, ct));

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto, CancellationToken ct)
        => Ok(await auth.LoginAsync(dto, ClientIp, ct));

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Refresh(RefreshTokenRequestDto dto, CancellationToken ct)
        => Ok(await auth.RefreshAsync(dto.RefreshToken, ClientIp, ct));

    [HttpPost("revoke")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Revoke(RevokeRefreshTokenRequestDto dto, CancellationToken ct)
    {
        await auth.RevokeAsync(dto.RefreshToken, ClientIp, ct);
        return NoContent();
    }
}
