using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WarenbuchungApi.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProjectId",
                table: "Warenausgaenge",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProjectId",
                table: "ProjectAssignedItems",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Projects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProjectNumber = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StartDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    EndDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Location = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Customer = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

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

            migrationBuilder.CreateIndex(
                name: "IX_Warenausgaenge_ProjectId",
                table: "Warenausgaenge",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAssignedItems_ProjectId",
                table: "ProjectAssignedItems",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_Name",
                table: "Projects",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_ProjectNumber",
                table: "Projects",
                column: "ProjectNumber");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectAssignedItems_Projects_ProjectId",
                table: "ProjectAssignedItems",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Warenausgaenge_Projects_ProjectId",
                table: "Warenausgaenge",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectAssignedItems_Projects_ProjectId",
                table: "ProjectAssignedItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Warenausgaenge_Projects_ProjectId",
                table: "Warenausgaenge");

            migrationBuilder.DropTable(
                name: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_Warenausgaenge_ProjectId",
                table: "Warenausgaenge");

            migrationBuilder.DropIndex(
                name: "IX_ProjectAssignedItems_ProjectId",
                table: "ProjectAssignedItems");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "Warenausgaenge");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "ProjectAssignedItems");
        }
    }
}
