/**
 * ProjectAssignedItem.cs
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-13
 */
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WarenbuchungApi.Models
{
    public class ProjectAssignedItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string ProjectKey { get; set; } = string.Empty;

        [Required]
        public int ProductId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal DefaultQuantity { get; set; } = 0m;

        [MaxLength(50)]
        public string Unit { get; set; } = "Stück";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey(nameof(ProductId))]
        public virtual Product Product { get; set; } = null!;
    }
}









