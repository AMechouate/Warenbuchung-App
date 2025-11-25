/**
 * OrderAssignmentDto.cs
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-13
 */
namespace WarenbuchungApi.DTOs
{
    public class OrderAssignmentDto
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductSku { get; set; } = string.Empty;
        public decimal DefaultQuantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateOrderAssignmentDto
    {
        public int ProductId { get; set; }
        public decimal? DefaultQuantity { get; set; }
        public string? Unit { get; set; }
    }
}









