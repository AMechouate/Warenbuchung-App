using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace WarenbuchungApi.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 1,
                column: "ProjectId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 2,
                column: "ProjectId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 3,
                column: "ProjectId",
                value: 2);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 4,
                column: "ProjectId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 5,
                column: "ProjectId",
                value: 2);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 6,
                column: "ProjectId",
                value: 2);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 7,
                column: "ProjectId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 8,
                column: "ProjectId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 9,
                column: "ProjectId",
                value: 3);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 10,
                column: "ProjectId",
                value: 4);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 11,
                column: "ProjectId",
                value: 4);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 12,
                column: "ProjectId",
                value: 4);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 13,
                column: "ProjectId",
                value: 5);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 14,
                column: "ProjectId",
                value: 5);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 15,
                column: "ProjectId",
                value: 5);

            migrationBuilder.InsertData(
                table: "Projects",
                columns: new[] { "Id", "CreatedAt", "Customer", "Description", "EndDate", "Location", "Name", "ProjectNumber", "StartDate", "Status", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Bauherr München GmbH", "Bürogebäude München", new DateTime(2025, 12, 31, 0, 0, 0, 0, DateTimeKind.Utc), "München", "PROJ-2025-001", "PROJ-2025-001", new DateTime(2025, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Aktiv", null },
                    { 2, new DateTime(2025, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Wohnbau Berlin AG", "Wohnkomplex Berlin", new DateTime(2025, 6, 30, 0, 0, 0, 0, DateTimeKind.Utc), "Berlin", "PROJ-2025-002", "PROJ-2025-002", new DateTime(2025, 3, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Aktiv", null },
                    { 3, new DateTime(2025, 2, 10, 0, 0, 0, 0, DateTimeKind.Utc), "Industriebau Hamburg GmbH", "Industriehalle Hamburg", new DateTime(2025, 11, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Hamburg", "PROJ-2025-003", "PROJ-2025-003", new DateTime(2025, 2, 10, 0, 0, 0, 0, DateTimeKind.Utc), "Pausiert", null },
                    { 4, new DateTime(2025, 4, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Stadt Köln", "Schule Köln", new DateTime(2026, 3, 31, 0, 0, 0, 0, DateTimeKind.Utc), "Köln", "PROJ-2025-004", "PROJ-2025-004", new DateTime(2025, 4, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Aktiv", null },
                    { 5, new DateTime(2023, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Krankenhaus Frankfurt GmbH", "Krankenhaus Frankfurt", new DateTime(2025, 10, 31, 0, 0, 0, 0, DateTimeKind.Utc), "Frankfurt", "PROJ-2025-005", "PROJ-2025-005", new DateTime(2023, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Abgeschlossen", null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Projects",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Projects",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Projects",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Projects",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Projects",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 1,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 2,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 3,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 4,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 5,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 6,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 7,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 8,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 9,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 10,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 11,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 12,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 13,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 14,
                column: "ProjectId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ProjectAssignedItems",
                keyColumn: "Id",
                keyValue: 15,
                column: "ProjectId",
                value: null);
        }
    }
}
