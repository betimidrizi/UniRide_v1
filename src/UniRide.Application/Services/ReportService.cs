using AutoMapper;
using Microsoft.EntityFrameworkCore;
using UniRide.Application.DTOs;
using UniRide.Application.Interfaces;
using UniRide.Domain.Entities;
using UniRide.Domain.Enums;
using UniRide.Domain.Exceptions;

namespace UniRide.Application.Services;

public class ReportService(
    IRepository<Report> reports,
    IRepository<User> users,
    IRepository<Ride> rides,
    IMapper mapper) : IReportService
{
    public async Task<ReportReadDto> CreateAsync(ReportCreateDto dto, int reporterId, CancellationToken cancellationToken = default)
    {
        if (!dto.TargetUserId.HasValue && !dto.RideId.HasValue)
            throw new ValidationException("Report must target a user or a ride.");

        if (dto.TargetUserId == reporterId)
            throw new ConflictException("You cannot report yourself.");

        if (dto.TargetUserId.HasValue && !await users.QueryNoTracking().AnyAsync(u => u.UserId == dto.TargetUserId, cancellationToken))
            throw new NotFoundException("User", dto.TargetUserId.Value);

        if (dto.RideId.HasValue && !await rides.QueryNoTracking().AnyAsync(r => r.RideId == dto.RideId, cancellationToken))
            throw new NotFoundException("Ride", dto.RideId.Value);

        var report = new Report
        {
            ReporterId = reporterId,
            TargetUserId = dto.TargetUserId,
            RideId = dto.RideId,
            Reason = dto.Reason.Trim(),
            Details = dto.Details.Trim(),
            Status = ReportStatus.Open
        };

        await reports.AddAsync(report, cancellationToken);
        await reports.SaveChangesAsync(cancellationToken);

        var hydrated = await QueryHydrated()
            .FirstAsync(r => r.ReportId == report.ReportId, cancellationToken);

        return mapper.Map<ReportReadDto>(hydrated);
    }

    public async Task<List<ReportReadDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var list = await QueryHydrated()
            .OrderByDescending(r => r.Status == ReportStatus.Open)
            .ThenByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return mapper.Map<List<ReportReadDto>>(list);
    }

    public async Task<ReportReadDto> SetStatusAsync(int reportId, string status, CancellationToken cancellationToken = default)
    {
        var report = await reports.Query()
            .FirstOrDefaultAsync(r => r.ReportId == reportId, cancellationToken)
            ?? throw new NotFoundException("Report", reportId);

        if (!Enum.TryParse<ReportStatus>(status, true, out var next))
            throw new ValidationException("Status must be Open, Resolved, or Dismissed.");

        report.Status = next;
        report.ResolvedAt = next == ReportStatus.Open ? null : DateTime.UtcNow;
        reports.Update(report);
        await reports.SaveChangesAsync(cancellationToken);

        var hydrated = await QueryHydrated()
            .FirstAsync(r => r.ReportId == reportId, cancellationToken);

        return mapper.Map<ReportReadDto>(hydrated);
    }

    private IQueryable<Report> QueryHydrated() =>
        reports.QueryNoTracking()
            .Include(r => r.Reporter)
            .Include(r => r.TargetUser)
            .Include(r => r.Ride);
}
