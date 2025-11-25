/**
 * OrderDto.cs
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
namespace WarenbuchungApi.DTOs
{
    public class OrderDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public string? Status { get; set; }
        public string? Supplier { get; set; }  // Single supplier name
        public int? SupplierId { get; set; }    // Single supplier ID
        public int AssignedItemCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateOrderDto
    {
        public string OrderNumber { get; set; } = string.Empty;
        public DateTime? OrderDate { get; set; }
        public string? Status { get; set; }
        public int? SupplierId { get; set; }  // Single supplier ID
    }

    public class UpdateOrderDto
    {
        public string? OrderNumber { get; set; }
        public DateTime? OrderDate { get; set; }
        public string? Status { get; set; }
        public int? SupplierId { get; set; }  // Single supplier ID
    }

    public class SupplierDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateSupplierDto
    {
        public string Name { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
    }
}
