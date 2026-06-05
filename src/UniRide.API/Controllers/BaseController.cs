using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace UniRide.API.Controllers;

public abstract class BaseController : ControllerBase
{
    protected int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException());

    protected bool IsAdmin => User.IsInRole("Admin");

    protected string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
}
