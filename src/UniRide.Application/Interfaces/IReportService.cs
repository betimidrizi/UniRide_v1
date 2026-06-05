using UniRide.Application.DTOs;

namespace UniRide.Application.Interfaces;

public interface IReportService
{
    Task<ReportReadDto> CreateAsync(ReportCreateDto dto, int reporterId, CancellationToken cancellationToken = default);
    Task<List<ReportReadDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ReportReadDto> SetStatusAsync(int reportId, string status, CancellationToken cancellationToken = default);
}
