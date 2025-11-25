/**
 * Product.cs
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WarenbuchungApi.Models
{
    public class Product
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(50)]
        public string SKU { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Required]
        [MaxLength(50)]
        public string ItemType { get; set; } = "Gerät";

        [Required]
        public int StockQuantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal LocationStock { get; set; }

        [MaxLength(50)]
        public string? Unit { get; set; }

        [MaxLength(100)]
        public string? DefaultSupplier { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<Wareneingang> Wareneingaenge { get; set; } = new List<Wareneingang>();
        public virtual ICollection<Warenausgang> Warenausgaenge { get; set; } = new List<Warenausgang>();
        public virtual ICollection<OrderAssignedItem> OrderAssignedItems { get; set; } = new List<OrderAssignedItem>();
        public virtual ICollection<ProjectAssignedItem> ProjectAssignedItems { get; set; } = new List<ProjectAssignedItem>();
    }
}
