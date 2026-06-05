using Microsoft.EntityFrameworkCore;
using UniRide.Domain.Entities;

namespace UniRide.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Ride> Rides => Set<Ride>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Report> Reports => Set<Report>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampAuditColumns();
        BumpRowVersions();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        StampAuditColumns();
        BumpRowVersions();
        return base.SaveChanges();
    }

    private void StampAuditColumns()
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    break;
            }
        }
    }

    /// <summary>
    /// On SQLite there is no native rowversion type, so we bump the byte[]
    /// manually here. On SQL Server EF wires up the actual rowversion column
    /// and this no-ops because the property is store-generated.
    /// </summary>
    private void BumpRowVersions()
    {
        if (!IsSqlite()) return;

        foreach (var entry in ChangeTracker.Entries<Ride>())
        {
            if (entry.State is EntityState.Added or EntityState.Modified)
                entry.Entity.RowVersion = Guid.NewGuid().ToByteArray();
        }
    }

    private bool IsSqlite() => Database.ProviderName?.Contains("Sqlite", StringComparison.OrdinalIgnoreCase) ?? false;

    protected override void OnModelCreating(ModelBuilder b)
    {
        var sqlite = Database.ProviderName?.Contains("Sqlite", StringComparison.OrdinalIgnoreCase) ?? false;

        // ── User ─────────────────────────────────────────────────────────
        b.Entity<User>(e =>
        {
            e.HasKey(u => u.UserId);
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.PhoneNumber)
                .IsUnique()
                .HasFilter(sqlite ? "PhoneNumber IS NOT NULL" : "[PhoneNumber] IS NOT NULL");
            e.Property(u => u.FullName).IsRequired().HasMaxLength(120);
            e.Property(u => u.Email).IsRequired().HasMaxLength(256);
            e.Property(u => u.PasswordHash).IsRequired().HasMaxLength(256);
            e.Property(u => u.University).IsRequired().HasMaxLength(120);
            e.Property(u => u.PhoneNumber).HasMaxLength(32);
            e.Property(u => u.ProfileImageUrl).HasMaxLength(512);
        });

        // ── Ride ─────────────────────────────────────────────────────────
        b.Entity<Ride>(e =>
        {
            e.HasKey(r => r.RideId);
            e.Property(r => r.StartLocation).IsRequired().HasMaxLength(200);
            e.Property(r => r.Destination).IsRequired().HasMaxLength(200);
            e.Property(r => r.University).IsRequired().HasMaxLength(120);
            e.Property(r => r.Price).HasPrecision(18, 2);
            e.Property(r => r.RecurrenceGroupId).HasMaxLength(64);

            if (sqlite)
            {
                // SQLite has no rowversion type; use a manually-bumped concurrency token.
                e.Property(r => r.RowVersion).IsConcurrencyToken();
            }
            else
            {
                e.Property(r => r.RowVersion).IsRowVersion();
            }

            e.HasOne(r => r.Driver)
                .WithMany(u => u.Rides)
                .HasForeignKey(r => r.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(r => r.DriverId);
            e.HasIndex(r => r.DepartureTime);
            e.HasIndex(r => r.University);
            e.HasIndex(r => r.Status);
            e.HasIndex(r => r.RecurrenceGroupId);
        });

        b.Entity<Report>(e =>
        {
            e.HasKey(r => r.ReportId);
            e.Property(r => r.Reason).IsRequired().HasMaxLength(120);
            e.Property(r => r.Details).HasMaxLength(1000);
            e.HasIndex(r => r.ReporterId);
            e.HasIndex(r => r.TargetUserId);
            e.HasIndex(r => r.RideId);
            e.HasIndex(r => r.Status);

            e.HasOne(r => r.Reporter)
                .WithMany()
                .HasForeignKey(r => r.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(r => r.TargetUser)
                .WithMany()
                .HasForeignKey(r => r.TargetUserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(r => r.Ride)
                .WithMany()
                .HasForeignKey(r => r.RideId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Reservation ──────────────────────────────────────────────────
        b.Entity<Reservation>(e =>
        {
            e.HasKey(r => r.ReservationId);

            e.HasOne(r => r.Ride)
                .WithMany(ride => ride.Reservations)
                .HasForeignKey(r => r.RideId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.Passenger)
                .WithMany(u => u.Reservations)
                .HasForeignKey(r => r.PassengerId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(r => r.RideId);
            e.HasIndex(r => r.PassengerId);
            e.HasIndex(r => new { r.RideId, r.PassengerId, r.ReservationStatus });
        });

        // ── ChatMessage ──────────────────────────────────────────────────
        b.Entity<ChatMessage>(e =>
        {
            e.HasKey(m => m.ChatMessageId);
            e.Property(m => m.Message).IsRequired().HasMaxLength(2000);
            e.HasIndex(m => m.RideId);
            e.HasIndex(m => m.SenderId);
            e.HasIndex(m => m.ReceiverId);
            e.HasIndex(m => new { m.ReceiverId, m.IsRead });
        });

        // ── Review ───────────────────────────────────────────────────────
        b.Entity<Review>(e =>
        {
            e.HasKey(r => r.ReviewId);
            e.Property(r => r.Comment).HasMaxLength(1000);
            e.HasIndex(r => r.ReviewerId);
            e.HasIndex(r => r.TargetUserId);
            e.HasIndex(r => r.RideId);
        });

        // ── Notification ─────────────────────────────────────────────────
        b.Entity<Notification>(e =>
        {
            e.HasKey(n => n.NotificationId);
            e.Property(n => n.Message).IsRequired().HasMaxLength(500);
            e.HasIndex(n => n.UserId);
            e.HasIndex(n => new { n.UserId, n.IsRead });
        });

        // ── RefreshToken ─────────────────────────────────────────────────
        b.Entity<RefreshToken>(e =>
        {
            e.HasKey(t => t.RefreshTokenId);
            e.Property(t => t.Token).IsRequired().HasMaxLength(256);
            e.HasIndex(t => t.Token).IsUnique();
            e.HasIndex(t => t.UserId);

            e.HasOne(t => t.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
