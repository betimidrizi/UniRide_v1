using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;

namespace UniRide.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class ReportsController(IReportService reports) : BaseController
{
    [HttpPost]
    [ProducesResponseType(typeof(ReportReadDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ReportReadDto>> Create(ReportCreateDto dto, CancellationToken ct)
    {
        var report = await reports.CreateAsync(dto, CurrentUserId, ct);
        return CreatedAtAction(nameof(GetAll), new { id = report.ReportId }, report);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<ReportReadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ReportReadDto>>> GetAll(CancellationToken ct)
        => Ok(await reports.GetAllAsync(ct));

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ReportReadDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ReportReadDto>> SetStatus(int id, ReportStatusUpdateDto dto, CancellationToken ct)
        => Ok(await reports.SetStatusAsync(id, dto.Status, ct));
}

public record ReportStatusUpdateDto(string Status);
