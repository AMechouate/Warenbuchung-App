/**
 * WarenbuchungDbContext.cs
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-10
 */

using Microsoft.EntityFrameworkCore;
using WarenbuchungApi.Models;

namespace WarenbuchungApi.Data
{
    public class WarenbuchungDbContext : DbContext
    {
        public WarenbuchungDbContext(DbContextOptions<WarenbuchungDbContext> options) : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }
        public DbSet<Wareneingang> Wareneingaenge { get; set; }
        public DbSet<Warenausgang> Warenausgaenge { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<OrderAssignedItem> OrderAssignedItems { get; set; }
        public DbSet<ProjectAssignedItem> ProjectAssignedItems { get; set; }
        public DbSet<WarenausgangReason> WarenausgangReasons { get; set; }
        public DbSet<JustificationTemplate> JustificationTemplates { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Product entity
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasIndex(e => e.SKU).IsUnique();
                entity.Property(e => e.Price).HasPrecision(18, 2);
            });

            // Configure Wareneingang entity
            modelBuilder.Entity<Wareneingang>(entity =>
            {
                entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
                entity.Property(e => e.TotalPrice).HasPrecision(18, 2);
                
                entity.HasOne(d => d.Product)
                    .WithMany(p => p.Wareneingaenge)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Warenausgang entity
            modelBuilder.Entity<Warenausgang>(entity =>
            {
                entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
                entity.Property(e => e.TotalPrice).HasPrecision(18, 2);
                
                entity.HasOne(d => d.Product)
                    .WithMany(p => p.Warenausgaenge)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure OrderAssignedItem entity
            modelBuilder.Entity<OrderAssignedItem>(entity =>
            {
                entity.Property(e => e.DefaultQuantity).HasPrecision(18, 2);
                entity.HasIndex(e => new { e.OrderId, e.ProductId }).IsUnique();

                entity.HasOne(d => d.Order)
                    .WithMany(o => o.AssignedItems)
                    .HasForeignKey(d => d.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.OrderAssignedItems)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure ProjectAssignedItem entity
            modelBuilder.Entity<ProjectAssignedItem>(entity =>
            {
                entity.Property(e => e.DefaultQuantity).HasPrecision(18, 2);
                entity.HasIndex(e => new { e.ProjectKey, e.ProductId }).IsUnique();

                entity.HasOne(d => d.Product)
                    .WithMany(p => p.ProjectAssignedItems)
                    .HasForeignKey(d => d.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.IsAdmin);
                entity.HasIndex(e => e.IsActive);
            });

            // Configure Order entity
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasIndex(e => e.OrderNumber);
                
                // Configure 1:1 relationship with Supplier
                entity.HasOne(o => o.Supplier)
                    .WithMany(s => s.Orders)
                    .HasForeignKey(o => o.SupplierId)
                    .OnDelete(DeleteBehavior.SetNull);  // Set to null if supplier is deleted
            });

            // Configure Supplier entity
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.HasIndex(e => e.Name);
            });

            // Configure WarenausgangReason entity
            modelBuilder.Entity<WarenausgangReason>(entity =>
            {
                entity.HasIndex(e => e.Name);
                entity.HasIndex(e => e.OrderIndex);
            });

            // Configure JustificationTemplate entity
            modelBuilder.Entity<JustificationTemplate>(entity =>
            {
                entity.HasIndex(e => e.OrderIndex);
            });

            // Seed data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed products
            modelBuilder.Entity<Product>().HasData(
                new Product
                {
                    Id = 1,
                    Name = "Betonsack 25kg",
                    Description = "Hochwertiger Trockenbeton im 25kg Sack für Baustellenarbeiten",
                    SKU = "MAT-BETON-25KG-001",
                    Price = 8.49m,
                    StockQuantity = 240,
                    Unit = "Sack",
                    ItemType = "Material",
                    DefaultSupplier = null,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 2,
                    Name = "Zementsack 25kg",
                    Description = "Standard-Portlandzement für Maurer- und Betonarbeiten",
                    SKU = "MAT-ZEMENT-25KG-001",
                    Price = 7.95m,
                    StockQuantity = 280,
                    Unit = "Sack",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 3,
                    Name = "Sand BigBag 1t",
                    Description = "Gereinigter Bausand im 1 Tonnen BigBag für Beton- und Putzarbeiten",
                    SKU = "MAT-SAND-1T-001",
                    Price = 52.50m,
                    StockQuantity = 35,
                    Unit = "BigBag",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 4,
                    Name = "Maurerziegel Palette",
                    Description = "Palette mit 240 Hochlochziegeln für Mauerwerksbau",
                    SKU = "MAT-ZIEGEL-PAL-001",
                    Price = 329.00m,
                    StockQuantity = 18,
                    Unit = "Palette",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 5,
                    Name = "Gipskartonplatte 12,5mm",
                    Description = "Standard-Gipskartonplatte 2500x1250x12,5 mm für Trockenbau",
                    SKU = "MAT-GKP-125-001",
                    Price = 9.80m,
                    StockQuantity = 420,
                    Unit = "Platte",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 6,
                    Name = "Dämmstoffrolle Mineralwolle 100mm",
                    Description = "Mineralwolle-Rolle 100 mm, Wärmeleitgruppe 035",
                    SKU = "MAT-DAEMM-100-001",
                    Price = 39.90m,
                    StockQuantity = 95,
                    Unit = "Rolle",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 7,
                    Name = "Estrich Fertigmischung 40kg",
                    Description = "Zementärer Estrich für Innen- und Außenbereich, 40kg Sack",
                    SKU = "MAT-ESTRICH-40KG-001",
                    Price = 11.20m,
                    StockQuantity = 160,
                    Unit = "Sack",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 8,
                    Name = "Kalkhydrat 25kg",
                    Description = "Gelöschter Kalk für Verputz- und Mauerarbeiten",
                    SKU = "MAT-KALK-25KG-001",
                    Price = 6.45m,
                    StockQuantity = 140,
                    Unit = "Sack",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 9,
                    Name = "Armierungsstahl B500 12mm",
                    Description = "Bewehrungsstahlstäbe B500A, Länge 6 Meter, Durchmesser 12 mm",
                    SKU = "MAT-STAHL-12-001",
                    Price = 14.75m,
                    StockQuantity = 260,
                    Unit = "Stange",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 10,
                    Name = "Dachziegel Paket",
                    Description = "Paket mit 280 Tondachziegeln, passend für 12m² Dachfläche",
                    SKU = "MAT-DACHZIEGEL-001",
                    Price = 489.00m,
                    StockQuantity = 22,
                    Unit = "Paket",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 11,
                    Name = "Holzbalken 60x120x4000",
                    Description = "Konstruktionsvollholz für Dach- und Gebäudekonstruktionen",
                    SKU = "MAT-HOLZ-60X120-001",
                    Price = 29.40m,
                    StockQuantity = 180,
                    Unit = "Stück",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 12,
                    Name = "Spanplatte 18mm 2500x1250",
                    Description = "Spanplatte P2 für Innenausbau, beidseitig fein geschliffen",
                    SKU = "MAT-SPAN-18-001",
                    Price = 21.90m,
                    StockQuantity = 210,
                    Unit = "Platte",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 13,
                    Name = "Kupferrohr 15mm Bündel",
                    Description = "Weichglühendes Kupferrohr, Bündel à 25 Meter, Durchmesser 15 mm",
                    SKU = "MAT-KUPFER-15-001",
                    Price = 189.00m,
                    StockQuantity = 32,
                    Unit = "Bündel",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 14,
                    Name = "PVC-Abflussrohr 50mm 5m",
                    Description = "Hart-PVC Rohr DN50, Länge 5m, für Abwasserinstallationen",
                    SKU = "MAT-PVC-ROHR-50-001",
                    Price = 17.60m,
                    StockQuantity = 150,
                    Unit = "Stange",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 15,
                    Name = "Schweißdraht Rolle 5kg",
                    Description = "MAG-Schweißdraht SG2, 0,8 mm Durchmesser, Rolle 5 kg",
                    SKU = "MAT-SCHWEISS-5KG-001",
                    Price = 34.50m,
                    StockQuantity = 85,
                    Unit = "Rolle",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 16,
                    Name = "Fugenmasse 10kg",
                    Description = "Flex-Fugenmörtel 10kg Eimer, geeignet für Innen- und Außenbereich",
                    SKU = "MAT-FUGEN-10KG-001",
                    Price = 18.75m,
                    StockQuantity = 95,
                    Unit = "Eimer",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 17,
                    Name = "Fliesenkleber Flex 25kg",
                    Description = "Flexibler Fliesenkleber für Keramik- und Feinsteinzeug",
                    SKU = "MAT-FLIESEN-25KG-001",
                    Price = 16.40m,
                    StockQuantity = 190,
                    Unit = "Sack",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 18,
                    Name = "Silikon Kartuschen Set 6x310ml",
                    Description = "Neutralvernetzendes Bau-Silikon, Set mit 6 Kartuschen à 310 ml",
                    SKU = "MAT-SILIKON-SET-001",
                    Price = 27.90m,
                    StockQuantity = 110,
                    Unit = "Set",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 19,
                    Name = "Putzgrund 10L",
                    Description = "Haftgrundierung für mineralische und organische Putze, 10 Liter",
                    SKU = "MAT-PUTZGRUND-10L-001",
                    Price = 24.60m,
                    StockQuantity = 75,
                    Unit = "Kanister",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 20,
                    Name = "Innenfarbe Weiß 15L",
                    Description = "Dispersionsfarbe für Innenräume, hochdeckend, 15 Liter Eimer",
                    SKU = "MAT-INNENFARBE-15L-001",
                    Price = 39.50m,
                    StockQuantity = 65,
                    Unit = "Eimer",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 21,
                    Name = "Schraubenpaket M6x20",
                    Description = "Paket mit 100 Stück Schrauben M6x20mm für Baustellen",
                    SKU = "MAT-SCHRAUBE-M6X20-001",
                    Price = 12.99m,
                    StockQuantity = 50,
                    Unit = "Paket",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 22,
                    Name = "Dübelpaket 8mm",
                    Description = "Paket mit 50 Stück Dübel 8mm für Wandmontage",
                    SKU = "MAT-DUEBEL-8MM-001",
                    Price = 8.99m,
                    StockQuantity = 75,
                    Unit = "Paket",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 23,
                    Name = "Montagekleber Set 2x290ml",
                    Description = "Set aus zwei Montagekleber-Kartuschen für starke Verklebungen",
                    SKU = "MAT-MONTAGEKLEBER-001",
                    Price = 15.99m,
                    StockQuantity = 30,
                    Unit = "Set",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Product
                {
                    Id = 24,
                    Name = "Elektrokabel NYM-J 3x2,5 100m",
                    Description = "Installationsleitung NYM-J 3x2,5 mm², Trommel mit 100 Metern",
                    SKU = "MAT-KABEL-NYM-3X25-001",
                    Price = 89.99m,
                    StockQuantity = 20,
                    Unit = "Trommel",
                    ItemType = "Material",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            // Seed users
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    Username = "admin",
                    Email = "admin@warenbuchung.de",
                    PasswordHash = "$2a$11$u/j1O2ujsjekqZj0iFpWLeNA3r88Nzztnkq4F1HTI8n3EnlqtHrcu",
                    FirstName = "Admin",
                    LastName = "User",
                    IsActive = true,
                    IsAdmin = true,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    Locations = "Lagerort München, Lagerort Berlin, Lagerort Hamburg, Köln S04"
                },
                new User
                {
                    Id = 2,
                    Username = "user1",
                    Email = "user1@warenbuchung.de",
                    PasswordHash = "$2a$11$u/j1O2ujsjekqZj0iFpWLeNA3r88Nzztnkq4F1HTI8n3EnlqtHrcu", // Password: "admin123"
                    FirstName = "User",
                    LastName = "Eins",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    Locations = "Lagerort München"
                },
                new User
                {
                    Id = 3,
                    Username = "user2",
                    Email = "user2@warenbuchung.de",
                    PasswordHash = "$2a$11$u/j1O2ujsjekqZj0iFpWLeNA3r88Nzztnkq4F1HTI8n3EnlqtHrcu", // Password: "admin123"
                    FirstName = "User",
                    LastName = "Zwei",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    Locations = "Lagerort Berlin, Lagerort Hamburg"
                },
                new User
                {
                    Id = 4,
                    Username = "admin1",
                    Email = "admin1@warenbuchung.de",
                    PasswordHash = "$2a$11$u/j1O2ujsjekqZj0iFpWLeNA3r88Nzztnkq4F1HTI8n3EnlqtHrcu",
                    FirstName = "Admin",
                    LastName = "Eins",
                    IsActive = true,
                    IsAdmin = true,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    Locations = "Lagerort München, Lagerort Berlin"
                },
                new User
                {
                    Id = 5,
                    Username = "admin2",
                    Email = "admin2@warenbuchung.de",
                    PasswordHash = "$2a$11$u/j1O2ujsjekqZj0iFpWLeNA3r88Nzztnkq4F1HTI8n3EnlqtHrcu",
                    FirstName = "Admin",
                    LastName = "Zwei",
                    IsActive = true,
                    IsAdmin = true,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    Locations = "Lagerort Hamburg, Lagerort Köln"
                },
                new User
                {
                    Id = 6,
                    Username = "user3",
                    Email = "user3@warenbuchung.de",
                    PasswordHash = "$2a$11$u/j1O2ujsjekqZj0iFpWLeNA3r88Nzztnkq4F1HTI8n3EnlqtHrcu",
                    FirstName = "User",
                    LastName = "Drei",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    Locations = "Lagerort Köln"
                }
            );

            // Seed suppliers
            modelBuilder.Entity<Supplier>().HasData(
                new Supplier
                {
                    Id = 1,
                    Name = "Lieferant A",
                    ContactPerson = "Max Mustermann",
                    Email = "info@lieferant-a.de",
                    Phone = "+49 89 123456",
                    Address = "München, Deutschland",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Supplier
                {
                    Id = 2,
                    Name = "Lieferant B",
                    ContactPerson = "Anna Schmidt",
                    Email = "info@lieferant-b.de",
                    Phone = "+49 30 654321",
                    Address = "Berlin, Deutschland",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Supplier
                {
                    Id = 3,
                    Name = "Lieferant C",
                    ContactPerson = "Peter Weber",
                    Email = "info@lieferant-c.de",
                    Phone = "+49 40 987654",
                    Address = "Hamburg, Deutschland",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Supplier
                {
                    Id = 4,
                    Name = "Lieferant D",
                    ContactPerson = "Lisa Müller",
                    Email = "info@lieferant-d.de",
                    Phone = "+49 221 111222",
                    Address = "Köln, Deutschland",
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            // Seed orders with multiple suppliers
            modelBuilder.Entity<Order>().HasData(
                new Order
                {
                    Id = 1,
                    OrderNumber = "PO-2025-001",
                    OrderDate = new DateTime(2025, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                    Status = "Offen",
                    SupplierId = 1,  // Lieferant A
                    CreatedAt = new DateTime(2025, 1, 15, 0, 0, 0, DateTimeKind.Utc)
                },
                new Order
                {
                    Id = 2,
                    OrderNumber = "PO-2025-002",
                    OrderDate = new DateTime(2025, 1, 14, 0, 0, 0, DateTimeKind.Utc),
                    Status = "Teilweise geliefert",
                    SupplierId = 2,  // Lieferant B (nur erster Lieferant)
                    CreatedAt = new DateTime(2025, 1, 14, 0, 0, 0, DateTimeKind.Utc)
                },
                new Order
                {
                    Id = 3,
                    OrderNumber = "PO-2025-003",
                    OrderDate = new DateTime(2025, 1, 13, 0, 0, 0, DateTimeKind.Utc),
                    Status = "Offen",
                    SupplierId = 3,  // Lieferant C
                    CreatedAt = new DateTime(2025, 1, 13, 0, 0, 0, DateTimeKind.Utc)
                },
                new Order
                {
                    Id = 4,
                    OrderNumber = "PO-2025-004",
                    OrderDate = new DateTime(2025, 1, 12, 0, 0, 0, DateTimeKind.Utc),
                    Status = "Offen",
                    SupplierId = 1,  // Lieferant A (nur erster Lieferant)
                    CreatedAt = new DateTime(2025, 1, 12, 0, 0, 0, DateTimeKind.Utc)
                },
                new Order
                {
                    Id = 5,
                    OrderNumber = "PO-2025-005",
                    OrderDate = new DateTime(2025, 1, 11, 0, 0, 0, DateTimeKind.Utc),
                    Status = "Abgeschlossen",
                    SupplierId = 4,  // Lieferant D
                    CreatedAt = new DateTime(2025, 1, 11, 0, 0, 0, DateTimeKind.Utc)
                },
                new Order
                {
                    Id = 6,
                    OrderNumber = "ORD-001",
                    OrderDate = new DateTime(2025, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                    Status = "Offen",
                    SupplierId = 2,  // Lieferant B
                    CreatedAt = new DateTime(2025, 1, 10, 0, 0, 0, DateTimeKind.Utc)
                },
                new Order
                {
                    Id = 7,
                    OrderNumber = "ORD-002",
                    OrderDate = new DateTime(2025, 1, 9, 0, 0, 0, DateTimeKind.Utc),
                    Status = "Offen",
                    SupplierId = 3,  // Lieferant C (nur erster Lieferant)
                    CreatedAt = new DateTime(2025, 1, 9, 0, 0, 0, DateTimeKind.Utc)
                },
                new Order
                {
                    Id = 8,
                    OrderNumber = "BEST-2025-100",
                    OrderDate = new DateTime(2025, 1, 8, 0, 0, 0, DateTimeKind.Utc),
                    Status = "Offen",
                    SupplierId = 1,  // Lieferant A
                    CreatedAt = new DateTime(2025, 1, 8, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            // Seed order assigned items
            modelBuilder.Entity<OrderAssignedItem>().HasData(
                new OrderAssignedItem
                {
                    Id = 1,
                    OrderId = 1,
                    ProductId = 1,
                    DefaultQuantity = 0m,
                    Unit = "Sack",
                    CreatedAt = new DateTime(2025, 1, 15, 0, 0, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 2,
                    OrderId = 1,
                    ProductId = 3,
                    DefaultQuantity = 0m,
                    Unit = "BigBag",
                    CreatedAt = new DateTime(2025, 1, 15, 0, 5, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 3,
                    OrderId = 2,
                    ProductId = 21,
                    DefaultQuantity = 0m,
                    Unit = "Paket",
                    CreatedAt = new DateTime(2025, 1, 14, 0, 0, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 4,
                    OrderId = 4,
                    ProductId = 5,
                    DefaultQuantity = 0m,
                    Unit = "Platte",
                    CreatedAt = new DateTime(2025, 1, 12, 0, 0, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 5,
                    OrderId = 1,
                    ProductId = 10,
                    DefaultQuantity = 0m,
                    Unit = "Paket",
                    CreatedAt = new DateTime(2025, 1, 15, 0, 10, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 6,
                    OrderId = 2,
                    ProductId = 2,
                    DefaultQuantity = 0m,
                    Unit = "Sack",
                    CreatedAt = new DateTime(2025, 1, 14, 0, 5, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 7,
                    OrderId = 2,
                    ProductId = 16,
                    DefaultQuantity = 0m,
                    Unit = "Eimer",
                    CreatedAt = new DateTime(2025, 1, 14, 0, 10, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 8,
                    OrderId = 3,
                    ProductId = 4,
                    DefaultQuantity = 0m,
                    Unit = "Palette",
                    CreatedAt = new DateTime(2025, 1, 13, 0, 0, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 9,
                    OrderId = 3,
                    ProductId = 7,
                    DefaultQuantity = 0m,
                    Unit = "Sack",
                    CreatedAt = new DateTime(2025, 1, 13, 0, 5, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 10,
                    OrderId = 3,
                    ProductId = 22,
                    DefaultQuantity = 0m,
                    Unit = "Paket",
                    CreatedAt = new DateTime(2025, 1, 13, 0, 10, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 11,
                    OrderId = 4,
                    ProductId = 9,
                    DefaultQuantity = 0m,
                    Unit = "Stange",
                    CreatedAt = new DateTime(2025, 1, 12, 0, 5, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 12,
                    OrderId = 4,
                    ProductId = 17,
                    DefaultQuantity = 0m,
                    Unit = "Sack",
                    CreatedAt = new DateTime(2025, 1, 12, 0, 10, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 13,
                    OrderId = 5,
                    ProductId = 18,
                    DefaultQuantity = 0m,
                    Unit = "Set",
                    CreatedAt = new DateTime(2025, 1, 11, 0, 0, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 14,
                    OrderId = 5,
                    ProductId = 20,
                    DefaultQuantity = 0m,
                    Unit = "Eimer",
                    CreatedAt = new DateTime(2025, 1, 11, 0, 5, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 15,
                    OrderId = 5,
                    ProductId = 24,
                    DefaultQuantity = 0m,
                    Unit = "Trommel",
                    CreatedAt = new DateTime(2025, 1, 11, 0, 10, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 16,
                    OrderId = 6,
                    ProductId = 6,
                    DefaultQuantity = 0m,
                    Unit = "Rolle",
                    CreatedAt = new DateTime(2025, 1, 10, 0, 0, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 17,
                    OrderId = 6,
                    ProductId = 11,
                    DefaultQuantity = 0m,
                    Unit = "Stück",
                    CreatedAt = new DateTime(2025, 1, 10, 0, 5, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 18,
                    OrderId = 6,
                    ProductId = 23,
                    DefaultQuantity = 0m,
                    Unit = "Set",
                    CreatedAt = new DateTime(2025, 1, 10, 0, 10, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 19,
                    OrderId = 7,
                    ProductId = 8,
                    DefaultQuantity = 0m,
                    Unit = "Sack",
                    CreatedAt = new DateTime(2025, 1, 9, 0, 0, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 20,
                    OrderId = 7,
                    ProductId = 14,
                    DefaultQuantity = 0m,
                    Unit = "Stange",
                    CreatedAt = new DateTime(2025, 1, 9, 0, 5, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 21,
                    OrderId = 7,
                    ProductId = 21,
                    DefaultQuantity = 0m,
                    Unit = "Paket",
                    CreatedAt = new DateTime(2025, 1, 9, 0, 10, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 22,
                    OrderId = 8,
                    ProductId = 13,
                    DefaultQuantity = 0m,
                    Unit = "Bündel",
                    CreatedAt = new DateTime(2025, 1, 8, 0, 0, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 23,
                    OrderId = 8,
                    ProductId = 15,
                    DefaultQuantity = 0m,
                    Unit = "Rolle",
                    CreatedAt = new DateTime(2025, 1, 8, 0, 5, 0, DateTimeKind.Utc)
                },
                new OrderAssignedItem
                {
                    Id = 24,
                    OrderId = 8,
                    ProductId = 19,
                    DefaultQuantity = 0m,
                    Unit = "Kanister",
                    CreatedAt = new DateTime(2025, 1, 8, 0, 10, 0, DateTimeKind.Utc)
                }
            );

            // Seed project assigned items
            modelBuilder.Entity<ProjectAssignedItem>().HasData(
                new ProjectAssignedItem
                {
                    Id = 1,
                    ProjectKey = "PROJ-2025-001",
                    ProductId = 21,
                    DefaultQuantity = 0m,
                    Unit = "Paket",
                    CreatedAt = new DateTime(2025, 1, 20, 0, 0, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 2,
                    ProjectKey = "PROJ-2025-001",
                    ProductId = 1,
                    DefaultQuantity = 0m,
                    Unit = "Sack",
                    CreatedAt = new DateTime(2025, 1, 20, 0, 10, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 3,
                    ProjectKey = "PROJ-2025-002",
                    ProductId = 23,
                    DefaultQuantity = 0m,
                    Unit = "Set",
                    CreatedAt = new DateTime(2025, 1, 18, 0, 0, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 4,
                    ProjectKey = "PROJ-2025-001",
                    ProductId = 10,
                    DefaultQuantity = 0m,
                    Unit = "Paket",
                    CreatedAt = new DateTime(2025, 1, 20, 0, 20, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 5,
                    ProjectKey = "PROJ-2025-002",
                    ProductId = 7,
                    DefaultQuantity = 0m,
                    Unit = "Sack",
                    CreatedAt = new DateTime(2025, 1, 18, 0, 10, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 6,
                    ProjectKey = "PROJ-2025-002",
                    ProductId = 22,
                    DefaultQuantity = 0m,
                    Unit = "Paket",
                    CreatedAt = new DateTime(2025, 1, 18, 0, 20, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 7,
                    ProjectKey = "PROJ-2025-003",
                    ProductId = 5,
                    DefaultQuantity = 0m,
                    Unit = "Platte",
                    CreatedAt = new DateTime(2025, 1, 16, 0, 0, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 8,
                    ProjectKey = "PROJ-2025-003",
                    ProductId = 12,
                    DefaultQuantity = 0m,
                    Unit = "Platte",
                    CreatedAt = new DateTime(2025, 1, 16, 0, 10, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 9,
                    ProjectKey = "PROJ-2025-003",
                    ProductId = 18,
                    DefaultQuantity = 0m,
                    Unit = "Set",
                    CreatedAt = new DateTime(2025, 1, 16, 0, 20, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 10,
                    ProjectKey = "PROJ-2025-004",
                    ProductId = 6,
                    DefaultQuantity = 0m,
                    Unit = "Rolle",
                    CreatedAt = new DateTime(2025, 1, 14, 0, 0, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 11,
                    ProjectKey = "PROJ-2025-004",
                    ProductId = 15,
                    DefaultQuantity = 0m,
                    Unit = "Rolle",
                    CreatedAt = new DateTime(2025, 1, 14, 0, 10, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 12,
                    ProjectKey = "PROJ-2025-004",
                    ProductId = 24,
                    DefaultQuantity = 0m,
                    Unit = "Trommel",
                    CreatedAt = new DateTime(2025, 1, 14, 0, 20, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 13,
                    ProjectKey = "PROJ-2025-005",
                    ProductId = 2,
                    DefaultQuantity = 0m,
                    Unit = "Sack",
                    CreatedAt = new DateTime(2025, 1, 12, 0, 0, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 14,
                    ProjectKey = "PROJ-2025-005",
                    ProductId = 9,
                    DefaultQuantity = 0m,
                    Unit = "Stange",
                    CreatedAt = new DateTime(2025, 1, 12, 0, 10, 0, DateTimeKind.Utc)
                },
                new ProjectAssignedItem
                {
                    Id = 15,
                    ProjectKey = "PROJ-2025-005",
                    ProductId = 20,
                    DefaultQuantity = 0m,
                    Unit = "Eimer",
                    CreatedAt = new DateTime(2025, 1, 12, 0, 20, 0, DateTimeKind.Utc)
                }
            );

            // Seed Warenausgang Reasons
            modelBuilder.Entity<WarenausgangReason>().HasData(
                new WarenausgangReason { Id = 1, Name = "Kommission", OrderIndex = 1, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new WarenausgangReason { Id = 2, Name = "Auftrag", OrderIndex = 2, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new WarenausgangReason { Id = 3, Name = "Umbuchung", OrderIndex = 3, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new WarenausgangReason { Id = 4, Name = "Beschädigung", OrderIndex = 4, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );

            // Seed Justification Templates
            modelBuilder.Entity<JustificationTemplate>().HasData(
                new JustificationTemplate { Id = 1, Text = "Notfall-Entnahme für dringenden Auftrag", OrderIndex = 1, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new JustificationTemplate { Id = 2, Text = "Nachbestellung bereits veranlasst", OrderIndex = 2, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new JustificationTemplate { Id = 3, Text = "Lieferant bestätigt Nachschub", OrderIndex = 3, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new JustificationTemplate { Id = 4, Text = "Interne Umbuchung zwischen Standorten", OrderIndex = 4, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new JustificationTemplate { Id = 5, Text = "Qualitätsprüfung erforderlich", OrderIndex = 5, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new JustificationTemplate { Id = 6, Text = "Kundenspezifische Anpassung", OrderIndex = 6, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new JustificationTemplate { Id = 7, Text = "Wartungsarbeiten am Lager", OrderIndex = 7, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new JustificationTemplate { Id = 8, Text = "Inventur-Korrektur", OrderIndex = 8, IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        }
    }
}
