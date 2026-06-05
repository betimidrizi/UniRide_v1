using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;

namespace UniRide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
public class AdminController(IAdminService admin) : BaseController
{
    [HttpGet("users")]
    [ProducesResponseType(typeof(List<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AdminUserDto>>> Users(CancellationToken ct)
        => Ok(await admin.GetUsersAsync(ct));

    [HttpPatch("users/{id:int}/suspend")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminUserDto>> Suspend(int id, CancellationToken ct)
        => Ok(await admin.SetSuspensionAsync(id, true, ct));

    [HttpPatch("users/{id:int}/restore")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminUserDto>> Restore(int id, CancellationToken ct)
        => Ok(await admin.SetSuspensionAsync(id, false, ct));

    [HttpPatch("users/{id:int}/verify")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminUserDto>> Verify(int id, CancellationToken ct)
        => Ok(await admin.SetVerificationAsync(id, true, ct));

    [HttpPatch("users/{id:int}/unverify")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminUserDto>> Unverify(int id, CancellationToken ct)
        => Ok(await admin.SetVerificationAsync(id, false, ct));

    [HttpPut("users/{id:int}")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminUserDto>> UpdateUser(int id, AdminUserUpdateDto dto, CancellationToken ct)
        => Ok(await admin.UpdateUserAsync(id, dto, ct));

    [HttpDelete("users/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(int id, CancellationToken ct)
    {
        var ok = await admin.DeleteUserAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("rides/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ForceDeleteRide(int id, CancellationToken ct)
    {
        var ok = await admin.ForceDeleteRideAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("statistics")]
    [ProducesResponseType(typeof(AdminStatsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminStatsDto>> Stats(CancellationToken ct)
        => Ok(await admin.GetStatsAsync(ct));
}
