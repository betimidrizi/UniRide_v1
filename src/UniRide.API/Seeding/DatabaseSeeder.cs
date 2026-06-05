using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;
using UniRide.Application.Interfaces;
using UniRide.Application.Settings;
using UniRide.Domain.Entities;
using UniRide.Domain.Enums;
using UniRide.Infrastructure.Data;

namespace UniRide.API.Seeding;

/// <summary>
/// Applies migrations (SQL Server) or EnsureCreated (SQLite dev) +
/// seeds the admin user defined in AdminSeed settings.
/// </summary>
public static class DatabaseSeeder
{
    public static async Task ApplyAsync(IServiceProvider services, ILogger logger)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var providerName = db.Database.ProviderName ?? string.Empty;
        if (providerName.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            // Dev SQLite path — no migrations, schema is generated from model.
            await db.Database.EnsureCreatedAsync();
            await EnsureSqliteDevSchemaAsync(db);
            logger.LogInformation("Database ensured (SQLite, model-based).");
        }
        else
        {
            await db.Database.MigrateAsync();
            logger.LogInformation("Database migrations applied.");
        }

        var seed = scope.ServiceProvider
            .GetRequiredService<Microsoft.Extensions.Options.IOptions<AdminSeedSettings>>().Value;
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        if (string.IsNullOrWhiteSpace(seed.Email) || string.IsNullOrWhiteSpace(seed.Password))
        {
            logger.LogInformation("AdminSeed not configured. Skipping admin user seeding.");
            return;
        }

        var email = seed.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email))
            return;

        db.Users.Add(new User
        {
            FullName = seed.FullName ?? "UniRide Admin",
            Email = email,
            PasswordHash = hasher.Hash(seed.Password),
            University = seed.University ?? "UniRide",
            Role = UserRole.Admin,
            IsVerified = true
        });

        await db.SaveChangesAsync();
        logger.LogInformation("Seeded admin account {Email}", email);
    }

    private static async Task EnsureSqliteDevSchemaAsync(AppDbContext db)
    {
        if (!await HasColumnAsync(db, "Users", "IsVerified"))
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE Users ADD COLUMN IsVerified INTEGER NOT NULL DEFAULT 0;");

        if (!await HasColumnAsync(db, "Users", "VerificationRequestedAt"))
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE Users ADD COLUMN VerificationRequestedAt TEXT NULL;");

        if (!await HasColumnAsync(db, "Rides", "IsRecurring"))
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE Rides ADD COLUMN IsRecurring INTEGER NOT NULL DEFAULT 0;");

        if (!await HasColumnAsync(db, "Rides", "RecurrenceGroupId"))
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE Rides ADD COLUMN RecurrenceGroupId TEXT NULL;");

        if (!await HasColumnAsync(db, "Rides", "RecurrenceIndex"))
            await db.Database.ExecuteSqlRawAsync("ALTER TABLE Rides ADD COLUMN RecurrenceIndex INTEGER NULL;");

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS Reports (
                ReportId INTEGER NOT NULL CONSTRAINT PK_Reports PRIMARY KEY AUTOINCREMENT,
                ReporterId INTEGER NOT NULL,
                TargetUserId INTEGER NULL,
                RideId INTEGER NULL,
                Reason TEXT NOT NULL,
                Details TEXT NOT NULL,
                Status INTEGER NOT NULL,
                ResolvedAt TEXT NULL,
                CreatedAt TEXT NOT NULL,
                UpdatedAt TEXT NULL,
                CONSTRAINT FK_Reports_Users_ReporterId FOREIGN KEY (ReporterId) REFERENCES Users (UserId) ON DELETE RESTRICT,
                CONSTRAINT FK_Reports_Users_TargetUserId FOREIGN KEY (TargetUserId) REFERENCES Users (UserId) ON DELETE RESTRICT,
                CONSTRAINT FK_Reports_Rides_RideId FOREIGN KEY (RideId) REFERENCES Rides (RideId) ON DELETE CASCADE
            );
            """);

        await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Rides_RecurrenceGroupId ON Rides (RecurrenceGroupId);");
        await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Reports_ReporterId ON Reports (ReporterId);");
        await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Reports_TargetUserId ON Reports (TargetUserId);");
        await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Reports_RideId ON Reports (RideId);");
        await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS IX_Reports_Status ON Reports (Status);");
        await db.Database.ExecuteSqlRawAsync("""
            UPDATE Users
            SET PhoneNumber = NULL
            WHERE PhoneNumber IS NOT NULL
              AND UserId NOT IN (
                  SELECT MIN(UserId)
                  FROM Users
                  WHERE PhoneNumber IS NOT NULL
                  GROUP BY PhoneNumber
              );
            """);
        await db.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS IX_Users_PhoneNumber ON Users (PhoneNumber) WHERE PhoneNumber IS NOT NULL;");
    }

    private static async Task<bool> HasColumnAsync(AppDbContext db, string table, string column)
    {
        var connection = db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = $"PRAGMA table_info({table});";
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            if (string.Equals(reader.GetString(1), column, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }
}
