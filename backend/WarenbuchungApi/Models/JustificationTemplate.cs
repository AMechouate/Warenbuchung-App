/**
 * JustificationTemplate.cs
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
using System.ComponentModel.DataAnnotations;

namespace WarenbuchungApi.Models
{
    public class JustificationTemplate
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(500)]
        public string Text { get; set; } = string.Empty;

        public int OrderIndex { get; set; } = 0; // Für Sortierung

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}



















