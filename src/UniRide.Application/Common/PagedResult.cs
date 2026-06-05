namespace UniRide.Application.Common;

/// <summary>Paged response envelope. Returned from any list endpoint
/// that supports paging so clients know total count + page metadata.</summary>
public sealed class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int Total { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }

    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(Total / (double)PageSize);
    public bool HasNext => Page < TotalPages;
    public bool HasPrevious => Page > 1;

    public static PagedResult<T> Create(IReadOnlyList<T> items, int total, int page, int pageSize) =>
        new() { Items = items, Total = total, Page = page, PageSize = pageSize };
}
