using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniRide.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UniqueUserPhoneNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE u
                SET PhoneNumber = NULL
                FROM Users u
                WHERE PhoneNumber IS NOT NULL
                  AND UserId NOT IN (
                      SELECT MIN(UserId)
                      FROM Users
                      WHERE PhoneNumber IS NOT NULL
                      GROUP BY PhoneNumber
                  );
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Users_PhoneNumber",
                table: "Users",
                column: "PhoneNumber",
                unique: true,
                filter: "[PhoneNumber] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_PhoneNumber",
                table: "Users");
        }
    }
}
