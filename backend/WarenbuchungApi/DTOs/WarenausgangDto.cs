/**
 * WarenausgangDto.cs
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
namespace WarenbuchungApi.DTOs
{
    public class WarenausgangDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string? Customer { get; set; }
        public string? OrderNumber { get; set; }
        public string? Notes { get; set; }
        public string? Attribut { get; set; }
        public string? ProjectName { get; set; }
        public string? Begruendung { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateWarenausgangDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Customer { get; set; }
        public string? OrderNumber { get; set; }
        public string? Notes { get; set; }
        public string? Attribut { get; set; }
        public string? ProjectName { get; set; }
        public string? Begruendung { get; set; }
    }

    public class UpdateWarenausgangDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Customer { get; set; }
        public string? OrderNumber { get; set; }
        public string? Notes { get; set; }
        public string? Attribut { get; set; }
        public string? ProjectName { get; set; }
        public string? Begruendung { get; set; }
    }
}
