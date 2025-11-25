using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace WarenbuchungApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "JustificationTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Text = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JustificationTemplates", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SKU = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ItemType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StockQuantity = table.Column<int>(type: "int", nullable: false),
                    LocationStock = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Unit = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DefaultSupplier = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Suppliers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ContactPerson = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Phone = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Address = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Suppliers", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Username = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PasswordHash = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FirstName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LastName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IsAdmin = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Locations = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "WarenausgangReasons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WarenausgangReasons", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ProjectAssignedItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ProjectKey = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    DefaultQuantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Unit = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectAssignedItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectAssignedItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Warenausgaenge",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Customer = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OrderNumber = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Notes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Attribut = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProjectName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Begruendung = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Warenausgaenge", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Warenausgaenge_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Wareneingaenge",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Erfassungstyp = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Referenz = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Location = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Supplier = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BatchNumber = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExpiryDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Notes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Wareneingaenge", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Wareneingaenge_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    OrderNumber = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OrderDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    SupplierId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Orders_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "OrderAssignedItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    DefaultQuantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Unit = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderAssignedItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderAssignedItems_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderAssignedItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "JustificationTemplates",
                columns: new[] { "Id", "CreatedAt", "IsActive", "OrderIndex", "Text", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 1, "Notfall-Entnahme für dringenden Auftrag", null },
                    { 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 2, "Nachbestellung bereits veranlasst", null },
                    { 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 3, "Lieferant bestätigt Nachschub", null },
                    { 4, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 4, "Interne Umbuchung zwischen Standorten", null },
                    { 5, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 5, "Qualitätsprüfung erforderlich", null },
                    { 6, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 6, "Kundenspezifische Anpassung", null },
                    { 7, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 7, "Wartungsarbeiten am Lager", null },
                    { 8, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 8, "Inventur-Korrektur", null }
                });

            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "Id", "CreatedAt", "DefaultSupplier", "Description", "ItemType", "LocationStock", "Name", "Price", "SKU", "StockQuantity", "Unit", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Hochwertiger Trockenbeton im 25kg Sack für Baustellenarbeiten", "Material", 0m, "Betonsack 25kg", 8.49m, "MAT-BETON-25KG-001", 240, "Sack", null },
                    { 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Standard-Portlandzement für Maurer- und Betonarbeiten", "Material", 0m, "Zementsack 25kg", 7.95m, "MAT-ZEMENT-25KG-001", 280, "Sack", null },
                    { 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Gereinigter Bausand im 1 Tonnen BigBag für Beton- und Putzarbeiten", "Material", 0m, "Sand BigBag 1t", 52.50m, "MAT-SAND-1T-001", 35, "BigBag", null },
                    { 4, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Palette mit 240 Hochlochziegeln für Mauerwerksbau", "Material", 0m, "Maurerziegel Palette", 329.00m, "MAT-ZIEGEL-PAL-001", 18, "Palette", null },
                    { 5, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Standard-Gipskartonplatte 2500x1250x12,5 mm für Trockenbau", "Material", 0m, "Gipskartonplatte 12,5mm", 9.80m, "MAT-GKP-125-001", 420, "Platte", null },
                    { 6, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Mineralwolle-Rolle 100 mm, Wärmeleitgruppe 035", "Material", 0m, "Dämmstoffrolle Mineralwolle 100mm", 39.90m, "MAT-DAEMM-100-001", 95, "Rolle", null },
                    { 7, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Zementärer Estrich für Innen- und Außenbereich, 40kg Sack", "Material", 0m, "Estrich Fertigmischung 40kg", 11.20m, "MAT-ESTRICH-40KG-001", 160, "Sack", null },
                    { 8, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Gelöschter Kalk für Verputz- und Mauerarbeiten", "Material", 0m, "Kalkhydrat 25kg", 6.45m, "MAT-KALK-25KG-001", 140, "Sack", null },
                    { 9, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Bewehrungsstahlstäbe B500A, Länge 6 Meter, Durchmesser 12 mm", "Material", 0m, "Armierungsstahl B500 12mm", 14.75m, "MAT-STAHL-12-001", 260, "Stange", null },
                    { 10, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Paket mit 280 Tondachziegeln, passend für 12m² Dachfläche", "Material", 0m, "Dachziegel Paket", 489.00m, "MAT-DACHZIEGEL-001", 22, "Paket", null },
                    { 11, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Konstruktionsvollholz für Dach- und Gebäudekonstruktionen", "Material", 0m, "Holzbalken 60x120x4000", 29.40m, "MAT-HOLZ-60X120-001", 180, "Stück", null },
                    { 12, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Spanplatte P2 für Innenausbau, beidseitig fein geschliffen", "Material", 0m, "Spanplatte 18mm 2500x1250", 21.90m, "MAT-SPAN-18-001", 210, "Platte", null },
                    { 13, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Weichglühendes Kupferrohr, Bündel à 25 Meter, Durchmesser 15 mm", "Material", 0m, "Kupferrohr 15mm Bündel", 189.00m, "MAT-KUPFER-15-001", 32, "Bündel", null },
                    { 14, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Hart-PVC Rohr DN50, Länge 5m, für Abwasserinstallationen", "Material", 0m, "PVC-Abflussrohr 50mm 5m", 17.60m, "MAT-PVC-ROHR-50-001", 150, "Stange", null },
                    { 15, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "MAG-Schweißdraht SG2, 0,8 mm Durchmesser, Rolle 5 kg", "Material", 0m, "Schweißdraht Rolle 5kg", 34.50m, "MAT-SCHWEISS-5KG-001", 85, "Rolle", null },
                    { 16, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Flex-Fugenmörtel 10kg Eimer, geeignet für Innen- und Außenbereich", "Material", 0m, "Fugenmasse 10kg", 18.75m, "MAT-FUGEN-10KG-001", 95, "Eimer", null },
                    { 17, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Flexibler Fliesenkleber für Keramik- und Feinsteinzeug", "Material", 0m, "Fliesenkleber Flex 25kg", 16.40m, "MAT-FLIESEN-25KG-001", 190, "Sack", null },
                    { 18, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Neutralvernetzendes Bau-Silikon, Set mit 6 Kartuschen à 310 ml", "Material", 0m, "Silikon Kartuschen Set 6x310ml", 27.90m, "MAT-SILIKON-SET-001", 110, "Set", null },
                    { 19, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Haftgrundierung für mineralische und organische Putze, 10 Liter", "Material", 0m, "Putzgrund 10L", 24.60m, "MAT-PUTZGRUND-10L-001", 75, "Kanister", null },
                    { 20, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Dispersionsfarbe für Innenräume, hochdeckend, 15 Liter Eimer", "Material", 0m, "Innenfarbe Weiß 15L", 39.50m, "MAT-INNENFARBE-15L-001", 65, "Eimer", null },
                    { 21, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Paket mit 100 Stück Schrauben M6x20mm für Baustellen", "Material", 0m, "Schraubenpaket M6x20", 12.99m, "MAT-SCHRAUBE-M6X20-001", 50, "Paket", null },
                    { 22, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Paket mit 50 Stück Dübel 8mm für Wandmontage", "Material", 0m, "Dübelpaket 8mm", 8.99m, "MAT-DUEBEL-8MM-001", 75, "Paket", null },
                    { 23, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Set aus zwei Montagekleber-Kartuschen für starke Verklebungen", "Material", 0m, "Montagekleber Set 2x290ml", 15.99m, "MAT-MONTAGEKLEBER-001", 30, "Set", null },
                    { 24, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Installationsleitung NYM-J 3x2,5 mm², Trommel mit 100 Metern", "Material", 0m, "Elektrokabel NYM-J 3x2,5 100m", 89.99m, "MAT-KABEL-NYM-3X25-001", 20, "Trommel", null }
                });

            migrationBuilder.InsertData(
                table: "Suppliers",
                columns: new[] { "Id", "Address", "ContactPerson", "CreatedAt", "Email", "Name", "Phone", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "München, Deutschland", "Max Mustermann", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "info@lieferant-a.de", "Lieferant A", "+49 89 123456", null },
                    { 2, "Berlin, Deutschland", "Anna Schmidt", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "info@lieferant-b.de", "Lieferant B", "+49 30 654321", null },
                    { 3, "Hamburg, Deutschland", "Peter Weber", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "info@lieferant-c.de", "Lieferant C", "+49 40 987654", null },
                    { 4, "Köln, Deutschland", "Lisa Müller", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "info@lieferant-d.de", "Lieferant D", "+49 221 111222", null }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FirstName", "IsActive", "IsAdmin", "LastLoginAt", "LastName", "Locations", "PasswordHash", "Username" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@warenbuchung.de", "Admin", true, true, null, "User", "Lagerort München, Lagerort Berlin, Lagerort Hamburg, Köln S04", "$2a$11$u/j1O2ujsjekqZj0iFpWLeNA3r88Nzztnkq4F1HTI8n3EnlqtHrcu", "admin" },
                    { 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "user1@warenbuchung.de", "User", true, false, null, "Eins", "Lagerort München", "$2a$11$u/j1O2ujsjekqZj0iFpWLeNA3r88Nzztnkq4F1HTI8n3EnlqtHrcu", "user1" },
                    { 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "user2@warenbuchung.de", "User", true, false, null, "Zwei", "Lagerort Berlin, Lagerort Hamburg", "$2a$11$u/j1O2ujsjekqZj0iFpWLeNA3r88Nzztnkq4F1HTI8n3EnlqtHrcu", "user2" },
                    { 4, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin1@warenbuchung.de", "Admin", true, true, null, "Eins", "Lagerort München, Lagerort Berlin", "$2a$11$u/j1O2ujsjekqZj0iFpWLeNA3r88Nzztnkq4F1HTI8n3EnlqtHrcu", "admin1" },
                    { 5, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin2@warenbuchung.de", "Admin", true, true, null, "Zwei", "Lagerort Hamburg, Lagerort Köln", "$2a$11$u/j1O2ujsjekqZj0iFpWLeNA3r88Nzztnkq4F1HTI8n3EnlqtHrcu", "admin2" },
                    { 6, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "user3@warenbuchung.de", "User", true, false, null, "Drei", "Lagerort Köln", "$2a$11$u/j1O2ujsjekqZj0iFpWLeNA3r88Nzztnkq4F1HTI8n3EnlqtHrcu", "user3" }
                });

            migrationBuilder.InsertData(
                table: "WarenausgangReasons",
                columns: new[] { "Id", "CreatedAt", "IsActive", "Name", "OrderIndex", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Kommission", 1, null },
                    { 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Auftrag", 2, null },
                    { 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Umbuchung", 3, null },
                    { 4, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Beschädigung", 4, null }
                });

            migrationBuilder.InsertData(
                table: "Orders",
                columns: new[] { "Id", "CreatedAt", "OrderDate", "OrderNumber", "Status", "SupplierId", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), "PO-2025-001", "Offen", 1, null },
                    { 2, new DateTime(2025, 1, 14, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 1, 14, 0, 0, 0, 0, DateTimeKind.Utc), "PO-2025-002", "Teilweise geliefert", 2, null },
                    { 3, new DateTime(2025, 1, 13, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 1, 13, 0, 0, 0, 0, DateTimeKind.Utc), "PO-2025-003", "Offen", 3, null },
                    { 4, new DateTime(2025, 1, 12, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 1, 12, 0, 0, 0, 0, DateTimeKind.Utc), "PO-2025-004", "Offen", 1, null },
                    { 5, new DateTime(2025, 1, 11, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 1, 11, 0, 0, 0, 0, DateTimeKind.Utc), "PO-2025-005", "Abgeschlossen", 4, null },
                    { 6, new DateTime(2025, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), "ORD-001", "Offen", 2, null },
                    { 7, new DateTime(2025, 1, 9, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 1, 9, 0, 0, 0, 0, DateTimeKind.Utc), "ORD-002", "Offen", 3, null },
                    { 8, new DateTime(2025, 1, 8, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 1, 8, 0, 0, 0, 0, DateTimeKind.Utc), "BEST-2025-100", "Offen", 1, null }
                });

            migrationBuilder.InsertData(
                table: "ProjectAssignedItems",
                columns: new[] { "Id", "CreatedAt", "DefaultQuantity", "ProductId", "ProjectKey", "Unit", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 0m, 21, "PROJ-2025-001", "Paket", null },
                    { 2, new DateTime(2025, 1, 20, 0, 10, 0, 0, DateTimeKind.Utc), 0m, 1, "PROJ-2025-001", "Sack", null },
                    { 3, new DateTime(2025, 1, 18, 0, 0, 0, 0, DateTimeKind.Utc), 0m, 23, "PROJ-2025-002", "Set", null },
                    { 4, new DateTime(2025, 1, 20, 0, 20, 0, 0, DateTimeKind.Utc), 0m, 10, "PROJ-2025-001", "Paket", null },
                    { 5, new DateTime(2025, 1, 18, 0, 10, 0, 0, DateTimeKind.Utc), 0m, 7, "PROJ-2025-002", "Sack", null },
                    { 6, new DateTime(2025, 1, 18, 0, 20, 0, 0, DateTimeKind.Utc), 0m, 22, "PROJ-2025-002", "Paket", null },
                    { 7, new DateTime(2025, 1, 16, 0, 0, 0, 0, DateTimeKind.Utc), 0m, 5, "PROJ-2025-003", "Platte", null },
                    { 8, new DateTime(2025, 1, 16, 0, 10, 0, 0, DateTimeKind.Utc), 0m, 12, "PROJ-2025-003", "Platte", null },
                    { 9, new DateTime(2025, 1, 16, 0, 20, 0, 0, DateTimeKind.Utc), 0m, 18, "PROJ-2025-003", "Set", null },
                    { 10, new DateTime(2025, 1, 14, 0, 0, 0, 0, DateTimeKind.Utc), 0m, 6, "PROJ-2025-004", "Rolle", null },
                    { 11, new DateTime(2025, 1, 14, 0, 10, 0, 0, DateTimeKind.Utc), 0m, 15, "PROJ-2025-004", "Rolle", null },
                    { 12, new DateTime(2025, 1, 14, 0, 20, 0, 0, DateTimeKind.Utc), 0m, 24, "PROJ-2025-004", "Trommel", null },
                    { 13, new DateTime(2025, 1, 12, 0, 0, 0, 0, DateTimeKind.Utc), 0m, 2, "PROJ-2025-005", "Sack", null },
                    { 14, new DateTime(2025, 1, 12, 0, 10, 0, 0, DateTimeKind.Utc), 0m, 9, "PROJ-2025-005", "Stange", null },
                    { 15, new DateTime(2025, 1, 12, 0, 20, 0, 0, DateTimeKind.Utc), 0m, 20, "PROJ-2025-005", "Eimer", null }
                });

            migrationBuilder.InsertData(
                table: "OrderAssignedItems",
                columns: new[] { "Id", "CreatedAt", "DefaultQuantity", "OrderId", "ProductId", "Unit", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), 0m, 1, 1, "Sack", null },
                    { 2, new DateTime(2025, 1, 15, 0, 5, 0, 0, DateTimeKind.Utc), 0m, 1, 3, "BigBag", null },
                    { 3, new DateTime(2025, 1, 14, 0, 0, 0, 0, DateTimeKind.Utc), 0m, 2, 21, "Paket", null },
                    { 4, new DateTime(2025, 1, 12, 0, 0, 0, 0, DateTimeKind.Utc), 0m, 4, 5, "Platte", null },
                    { 5, new DateTime(2025, 1, 15, 0, 10, 0, 0, DateTimeKind.Utc), 0m, 1, 10, "Paket", null },
                    { 6, new DateTime(2025, 1, 14, 0, 5, 0, 0, DateTimeKind.Utc), 0m, 2, 2, "Sack", null },
                    { 7, new DateTime(2025, 1, 14, 0, 10, 0, 0, DateTimeKind.Utc), 0m, 2, 16, "Eimer", null },
                    { 8, new DateTime(2025, 1, 13, 0, 0, 0, 0, DateTimeKind.Utc), 0m, 3, 4, "Palette", null },
                    { 9, new DateTime(2025, 1, 13, 0, 5, 0, 0, DateTimeKind.Utc), 0m, 3, 7, "Sack", null },
                    { 10, new DateTime(2025, 1, 13, 0, 10, 0, 0, DateTimeKind.Utc), 0m, 3, 22, "Paket", null },
                    { 11, new DateTime(2025, 1, 12, 0, 5, 0, 0, DateTimeKind.Utc), 0m, 4, 9, "Stange", null },
                    { 12, new DateTime(2025, 1, 12, 0, 10, 0, 0, DateTimeKind.Utc), 0m, 4, 17, "Sack", null },
                    { 13, new DateTime(2025, 1, 11, 0, 0, 0, 0, DateTimeKind.Utc), 0m, 5, 18, "Set", null },
                    { 14, new DateTime(2025, 1, 11, 0, 5, 0, 0, DateTimeKind.Utc), 0m, 5, 20, "Eimer", null },
                    { 15, new DateTime(2025, 1, 11, 0, 10, 0, 0, DateTimeKind.Utc), 0m, 5, 24, "Trommel", null },
                    { 16, new DateTime(2025, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), 0m, 6, 6, "Rolle", null },
                    { 17, new DateTime(2025, 1, 10, 0, 5, 0, 0, DateTimeKind.Utc), 0m, 6, 11, "Stück", null },
                    { 18, new DateTime(2025, 1, 10, 0, 10, 0, 0, DateTimeKind.Utc), 0m, 6, 23, "Set", null },
                    { 19, new DateTime(2025, 1, 9, 0, 0, 0, 0, DateTimeKind.Utc), 0m, 7, 8, "Sack", null },
                    { 20, new DateTime(2025, 1, 9, 0, 5, 0, 0, DateTimeKind.Utc), 0m, 7, 14, "Stange", null },
                    { 21, new DateTime(2025, 1, 9, 0, 10, 0, 0, DateTimeKind.Utc), 0m, 7, 21, "Paket", null },
                    { 22, new DateTime(2025, 1, 8, 0, 0, 0, 0, DateTimeKind.Utc), 0m, 8, 13, "Bündel", null },
                    { 23, new DateTime(2025, 1, 8, 0, 5, 0, 0, DateTimeKind.Utc), 0m, 8, 15, "Rolle", null },
                    { 24, new DateTime(2025, 1, 8, 0, 10, 0, 0, DateTimeKind.Utc), 0m, 8, 19, "Kanister", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_JustificationTemplates_OrderIndex",
                table: "JustificationTemplates",
                column: "OrderIndex");

            migrationBuilder.CreateIndex(
                name: "IX_OrderAssignedItems_OrderId_ProductId",
                table: "OrderAssignedItems",
                columns: new[] { "OrderId", "ProductId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderAssignedItems_ProductId",
                table: "OrderAssignedItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OrderNumber",
                table: "Orders",
                column: "OrderNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_SupplierId",
                table: "Orders",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_SKU",
                table: "Products",
                column: "SKU",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAssignedItems_ProductId",
                table: "ProjectAssignedItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAssignedItems_ProjectKey_ProductId",
                table: "ProjectAssignedItems",
                columns: new[] { "ProjectKey", "ProductId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_Name",
                table: "Suppliers",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_IsActive",
                table: "Users",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Users_IsAdmin",
                table: "Users",
                column: "IsAdmin");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Warenausgaenge_ProductId",
                table: "Warenausgaenge",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_WarenausgangReasons_Name",
                table: "WarenausgangReasons",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_WarenausgangReasons_OrderIndex",
                table: "WarenausgangReasons",
                column: "OrderIndex");

            migrationBuilder.CreateIndex(
                name: "IX_Wareneingaenge_ProductId",
                table: "Wareneingaenge",
                column: "ProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JustificationTemplates");

            migrationBuilder.DropTable(
                name: "OrderAssignedItems");

            migrationBuilder.DropTable(
                name: "ProjectAssignedItems");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Warenausgaenge");

            migrationBuilder.DropTable(
                name: "WarenausgangReasons");

            migrationBuilder.DropTable(
                name: "Wareneingaenge");

            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "Suppliers");
        }
    }
}
