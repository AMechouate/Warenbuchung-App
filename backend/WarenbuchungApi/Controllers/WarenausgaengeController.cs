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
    [Authorize]
    public class WarenausgaengeController : ControllerBase
    {
        private readonly WarenbuchungDbContext _context;

        public WarenausgaengeController(WarenbuchungDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WarenausgangDto>>> GetWarenausgaenge()
        {
            var warenausgaenge = await _context.Warenausgaenge
                .Include(w => w.Product)
                .Select(w => new WarenausgangDto
                {
                    Id = w.Id,
                    ProductId = w.ProductId,
                    ProductName = w.Product.Name,
                    Quantity = w.Quantity,
                    UnitPrice = w.UnitPrice,
                    TotalPrice = w.TotalPrice,
                    Customer = w.Customer,
                    OrderNumber = w.OrderNumber,
                    Notes = w.Notes,
                    Attribut = w.Attribut,
                    ProjectName = w.ProjectName,
                    Begruendung = w.Begruendung,
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.UpdatedAt
                })
                .OrderByDescending(w => w.CreatedAt)
                .ToListAsync();

            return Ok(warenausgaenge);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<WarenausgangDto>> GetWarenausgang(int id)
        {
            var warenausgang = await _context.Warenausgaenge
                .Include(w => w.Product)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (warenausgang == null)
            {
                return NotFound();
            }

            var warenausgangDto = new WarenausgangDto
            {
                Id = warenausgang.Id,
                ProductId = warenausgang.ProductId,
                ProductName = warenausgang.Product.Name,
                Quantity = warenausgang.Quantity,
                UnitPrice = warenausgang.UnitPrice,
                TotalPrice = warenausgang.TotalPrice,
                Customer = warenausgang.Customer,
                OrderNumber = warenausgang.OrderNumber,
                Notes = warenausgang.Notes,
                Attribut = warenausgang.Attribut,
                ProjectName = warenausgang.ProjectName,
                Begruendung = warenausgang.Begruendung,
                CreatedAt = warenausgang.CreatedAt,
                UpdatedAt = warenausgang.UpdatedAt
            };

            return Ok(warenausgangDto);
        }

        [HttpPost]
        public async Task<ActionResult<WarenausgangDto>> CreateWarenausgang(CreateWarenausgangDto createWarenausgangDto)
        {
            var product = await _context.Products.FindAsync(createWarenausgangDto.ProductId);
            if (product == null)
            {
                return BadRequest("Product not found");
            }

            // Allow negative stock with justification
            // Stock validation removed - negative stock is now allowed

            var totalPrice = createWarenausgangDto.Quantity * createWarenausgangDto.UnitPrice;

            var warenausgang = new Warenausgang
            {
                ProductId = createWarenausgangDto.ProductId,
                Quantity = createWarenausgangDto.Quantity,
                UnitPrice = createWarenausgangDto.UnitPrice,
                TotalPrice = totalPrice,
                Customer = createWarenausgangDto.Customer,
                OrderNumber = createWarenausgangDto.OrderNumber,
                Notes = createWarenausgangDto.Notes,
                Attribut = createWarenausgangDto.Attribut,
                ProjectName = createWarenausgangDto.ProjectName,
                Begruendung = createWarenausgangDto.Begruendung,
                CreatedAt = DateTime.UtcNow
            };

            _context.Warenausgaenge.Add(warenausgang);

            // Update stock quantity
            product.StockQuantity -= createWarenausgangDto.Quantity;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var warenausgangDto = new WarenausgangDto
            {
                Id = warenausgang.Id,
                ProductId = warenausgang.ProductId,
                ProductName = product.Name,
                Quantity = warenausgang.Quantity,
                UnitPrice = warenausgang.UnitPrice,
                TotalPrice = warenausgang.TotalPrice,
                Customer = warenausgang.Customer,
                OrderNumber = warenausgang.OrderNumber,
                Notes = warenausgang.Notes,
                Attribut = warenausgang.Attribut,
                ProjectName = warenausgang.ProjectName,
                Begruendung = warenausgang.Begruendung,
                CreatedAt = warenausgang.CreatedAt,
                UpdatedAt = warenausgang.UpdatedAt
            };

            return CreatedAtAction(nameof(GetWarenausgang), new { id = warenausgang.Id }, warenausgangDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWarenausgang(int id, UpdateWarenausgangDto updateWarenausgangDto)
        {
            var warenausgang = await _context.Warenausgaenge.FindAsync(id);
            if (warenausgang == null)
            {
                return NotFound();
            }

            var product = await _context.Products.FindAsync(updateWarenausgangDto.ProductId);
            if (product == null)
            {
                return BadRequest("Product not found");
            }

            // Calculate quantity difference
            var quantityDifference = updateWarenausgangDto.Quantity - warenausgang.Quantity;
            var totalPrice = updateWarenausgangDto.Quantity * updateWarenausgangDto.UnitPrice;

            // Allow negative stock with justification
            // Stock validation removed - negative stock is now allowed

            warenausgang.ProductId = updateWarenausgangDto.ProductId;
            warenausgang.Quantity = updateWarenausgangDto.Quantity;
            warenausgang.UnitPrice = updateWarenausgangDto.UnitPrice;
            warenausgang.TotalPrice = totalPrice;
            warenausgang.Customer = updateWarenausgangDto.Customer;
            warenausgang.OrderNumber = updateWarenausgangDto.OrderNumber;
            warenausgang.Notes = updateWarenausgangDto.Notes;
            warenausgang.Attribut = updateWarenausgangDto.Attribut;
            warenausgang.ProjectName = updateWarenausgangDto.ProjectName;
            warenausgang.Begruendung = updateWarenausgangDto.Begruendung;
            warenausgang.UpdatedAt = DateTime.UtcNow;

            // Update stock quantity
            product.StockQuantity -= quantityDifference;
            product.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WarenausgangExists(id))
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
        public async Task<IActionResult> DeleteWarenausgang(int id)
        {
            var warenausgang = await _context.Warenausgaenge.FindAsync(id);
            if (warenausgang == null)
            {
                return NotFound();
            }

            // Update stock quantity (add back the quantity that was removed)
            var product = await _context.Products.FindAsync(warenausgang.ProductId);
            if (product != null)
            {
                product.StockQuantity += warenausgang.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
            }

            _context.Warenausgaenge.Remove(warenausgang);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool WarenausgangExists(int id)
        {
            return _context.Warenausgaenge.Any(e => e.Id == id);
        }
    }
}
