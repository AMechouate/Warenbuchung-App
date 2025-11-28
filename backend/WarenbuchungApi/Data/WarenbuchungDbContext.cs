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

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
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
                    Name = "Laptop Dell XPS 13",
                    Description = "Hochwertiger Business Laptop",
                    SKU = "DELL-XPS13-001",
                    Price = 1299.99m,
                    StockQuantity = 15,
                    Unit = "Stück",
                    CreatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Id = 2,
                    Name = "MacBook Air M2",
                    Description = "Apple MacBook Air mit M2 Chip",
                    SKU = "APPLE-MBA-M2-001",
                    Price = 1499.99m,
                    StockQuantity = 8,
                    Unit = "Stück",
                    CreatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Id = 3,
                    Name = "Samsung Monitor 27\"",
                    Description = "4K Monitor für professionelle Arbeit",
                    SKU = "SAMSUNG-27-4K-001",
                    Price = 399.99m,
                    StockQuantity = 25,
                    Unit = "Stück",
                    CreatedAt = DateTime.UtcNow
                }
            );

            // Seed user
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    Username = "admin",
                    Email = "admin@warenbuchung.de",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    FirstName = "Admin",
                    LastName = "User",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            );
        }
    }
}
