using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WarenbuchungApi.Data;
using WarenbuchungApi.DTOs;
using WarenbuchungApi.Models;

namespace WarenbuchungApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly WarenbuchungDbContext _context;

        public OrdersController(WarenbuchungDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders([FromQuery] string? orderNumber = null)
        {
            try
            {
                // Simplified query - get orders first
                List<Order> orders;
                if (!string.IsNullOrWhiteSpace(orderNumber))
                {
                    var normalized = orderNumber.Trim().ToLower();
                    orders = await _context.Orders
                        .Where(o => o.OrderNumber != null && o.OrderNumber.ToLower().Contains(normalized))
                        .OrderByDescending(o => o.OrderDate)
                        .ToListAsync();
                }
                else
                {
                    orders = await _context.Orders
                        .OrderByDescending(o => o.OrderDate)
                        .ToListAsync();
                }

                if (orders == null || orders.Count == 0)
                {
                    return Ok(new List<OrderDto>());
                }

                // Get supplier IDs
                var supplierIds = orders
                    .Where(o => o.SupplierId.HasValue)
                    .Select(o => o.SupplierId!.Value)
                    .Distinct()
                    .ToList();

                // Load suppliers
                var suppliersDict = new Dictionary<int, string>();
                if (supplierIds.Count > 0)
                {
                    var suppliers = await _context.Suppliers
                        .Where(s => supplierIds.Contains(s.Id))
                        .ToListAsync();
                    
                    foreach (var supplier in suppliers)
                    {
                        if (supplier != null && supplier.Name != null)
                        {
                            suppliersDict[supplier.Id] = supplier.Name;
                        }
                    }
                }

                // Get assignment counts
                var orderIds = orders.Select(o => o.Id).ToList();
                var assignmentCounts = new Dictionary<int, int>();
                if (orderIds.Count > 0)
                {
                    var counts = await _context.OrderAssignedItems
                        .Where(a => orderIds.Contains(a.OrderId))
                        .GroupBy(a => a.OrderId)
                        .Select(g => new { OrderId = g.Key, Count = g.Count() })
                        .ToListAsync();
                    
                    foreach (var count in counts)
                    {
                        assignmentCounts[count.OrderId] = count.Count;
                    }
                }

                // Map to DTOs
                var orderDtos = new List<OrderDto>();
                foreach (var order in orders)
                {
                    string? supplierName = null;
                    if (order.SupplierId.HasValue && suppliersDict.TryGetValue(order.SupplierId.Value, out var name))
                    {
                        supplierName = name;
                    }

                    assignmentCounts.TryGetValue(order.Id, out var count);

                    orderDtos.Add(new OrderDto
                    {
                        Id = order.Id,
                        OrderNumber = order.OrderNumber ?? string.Empty,
                        OrderDate = order.OrderDate,
                        Status = order.Status,
                        Supplier = supplierName,
                        SupplierId = order.SupplierId,
                        AssignedItemCount = count,
                        CreatedAt = order.CreatedAt,
                        UpdatedAt = order.UpdatedAt
                    });
                }

                return Ok(orderDtos);
            }
            catch (Exception ex)
            {
                // Enhanced error logging
                Console.WriteLine($"ERROR in GetOrders: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                
                return StatusCode(500, new { 
                    error = "Internal server error", 
                    message = ex.Message, 
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace 
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDto>> GetOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Supplier)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound();
            }

            var assignedCount = await _context.OrderAssignedItems
                .Where(a => a.OrderId == id)
                .CountAsync();

            var orderDto = new OrderDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                OrderDate = order.OrderDate,
                Status = order.Status,
                Supplier = order.Supplier?.Name,
                SupplierId = order.SupplierId,
                AssignedItemCount = assignedCount,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt
            };

            return Ok(orderDto);
        }

        [HttpPost]
        public async Task<ActionResult<OrderDto>> CreateOrder(CreateOrderDto createOrderDto)
        {
            // Validate supplier exists if provided
            if (createOrderDto.SupplierId.HasValue)
            {
                var supplierExists = await _context.Suppliers
                    .AnyAsync(s => s.Id == createOrderDto.SupplierId.Value);

                if (!supplierExists)
                {
                    return BadRequest("Supplier not found");
                }
            }

            var order = new Order
            {
                OrderNumber = createOrderDto.OrderNumber,
                OrderDate = createOrderDto.OrderDate ?? DateTime.UtcNow,
                Status = createOrderDto.Status ?? "Offen",
                SupplierId = createOrderDto.SupplierId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Reload order with supplier
            await _context.Entry(order)
                .Reference(o => o.Supplier)
                .LoadAsync();

            var orderDto = new OrderDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                OrderDate = order.OrderDate,
                Status = order.Status,
                Supplier = order.Supplier?.Name,
                SupplierId = order.SupplierId,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt
            };

            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, orderDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrder(int id, UpdateOrderDto updateOrderDto)
        {
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound();
            }

            if (!string.IsNullOrEmpty(updateOrderDto.OrderNumber))
            {
                order.OrderNumber = updateOrderDto.OrderNumber;
            }

            if (updateOrderDto.OrderDate.HasValue)
            {
                order.OrderDate = updateOrderDto.OrderDate.Value;
            }

            if (!string.IsNullOrEmpty(updateOrderDto.Status))
            {
                order.Status = updateOrderDto.Status;
            }

            // Update supplier if provided
            if (updateOrderDto.SupplierId.HasValue)
            {
                // Validate supplier exists
                var supplierExists = await _context.Suppliers
                    .AnyAsync(s => s.Id == updateOrderDto.SupplierId.Value);

                if (!supplierExists)
                {
                    return BadRequest("Supplier not found");
                }

                order.SupplierId = updateOrderDto.SupplierId.Value;
            }
            else if (updateOrderDto.SupplierId == null && updateOrderDto.SupplierId.HasValue == false)
            {
                // Explicitly set to null if null is provided (to allow clearing the supplier)
                // This is a bit tricky - we'll only clear if a specific flag is set
                // For now, we'll only update if a value is provided
            }

            order.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!OrderExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound();
            }

            // Supplier relationship will be automatically handled by the foreign key constraint
            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool OrderExists(int id)
        {
            return _context.Orders.Any(e => e.Id == id);
        }

        [HttpGet("{id}/items")]
        public async Task<ActionResult<IEnumerable<OrderAssignmentDto>>> GetAssignedItems(int id)
        {
            var orderExists = await _context.Orders.AnyAsync(o => o.Id == id);
            if (!orderExists)
            {
                return NotFound();
            }

            var assignments = await _context.OrderAssignedItems
                .Include(a => a.Product)
                .Where(a => a.OrderId == id)
                .OrderBy(a => a.CreatedAt)
                .ToListAsync();

            var result = assignments.Select(a => new OrderAssignmentDto
            {
                Id = a.Id,
                OrderId = a.OrderId,
                ProductId = a.ProductId,
                ProductName = a.Product?.Name ?? string.Empty,
                ProductSku = a.Product?.SKU ?? string.Empty,
                DefaultQuantity = a.DefaultQuantity,
                Unit = a.Unit,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            });

            return Ok(result);
        }

        [HttpPost("{id}/items")]
        public async Task<ActionResult<OrderAssignmentDto>> CreateAssignedItem(int id, CreateOrderAssignmentDto dto)
        {
            var order = await _context.Orders
                .Include(o => o.AssignedItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound();
            }

            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId);
            if (product == null)
            {
                return BadRequest("Produkt wurde nicht gefunden.");
            }

            var alreadyAssigned = await _context.OrderAssignedItems
                .AnyAsync(a => a.OrderId == id && a.ProductId == dto.ProductId);
            if (alreadyAssigned)
            {
                return Conflict("Produkt ist bereits dieser Bestellung zugewiesen.");
            }

            var unit = string.IsNullOrWhiteSpace(dto.Unit)
                ? (product.Unit ?? "Stück")
                : dto.Unit;

            var quantity = dto.DefaultQuantity.HasValue
                ? dto.DefaultQuantity.Value
                : 0m;

            var assignment = new OrderAssignedItem
            {
                OrderId = id,
                ProductId = product.Id,
                DefaultQuantity = quantity,
                Unit = unit,
                CreatedAt = DateTime.UtcNow
            };

            _context.OrderAssignedItems.Add(assignment);
            await _context.SaveChangesAsync();

            await _context.Entry(assignment).Reference(a => a.Product).LoadAsync();

            var result = new OrderAssignmentDto
            {
                Id = assignment.Id,
                OrderId = assignment.OrderId,
                ProductId = assignment.ProductId,
                ProductName = assignment.Product?.Name ?? string.Empty,
                ProductSku = assignment.Product?.SKU ?? string.Empty,
                DefaultQuantity = assignment.DefaultQuantity,
                Unit = assignment.Unit,
                CreatedAt = assignment.CreatedAt,
                UpdatedAt = assignment.UpdatedAt
            };

            return CreatedAtAction(nameof(GetAssignedItems), new { id }, result);
        }

        [HttpDelete("{orderId}/items/{assignmentId}")]
        public async Task<IActionResult> DeleteAssignedItem(int orderId, int assignmentId)
        {
            var assignment = await _context.OrderAssignedItems
                .FirstOrDefaultAsync(a => a.OrderId == orderId && a.Id == assignmentId);

            if (assignment == null)
            {
                return NotFound();
            }

            _context.OrderAssignedItems.Remove(assignment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}















