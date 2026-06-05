namespace UniRide.Domain.Entities;

/// <summary>
/// Shared audit columns for every persisted entity. The DbContext
/// SaveChangesAsync override stamps CreatedAt / UpdatedAt automatically.
/// </summary>
public abstract class BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
