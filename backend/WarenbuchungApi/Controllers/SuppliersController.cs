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
    public class SuppliersController : ControllerBase
    {
        private readonly WarenbuchungDbContext _context;

        public SuppliersController(WarenbuchungDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SupplierDto>>> GetSuppliers([FromQuery] string? name = null)
        {
            var query = _context.Suppliers.AsQueryable();

            if (!string.IsNullOrEmpty(name))
            {
                query = query.Where(s => s.Name.Contains(name));
            }

            var suppliers = await query
                .OrderBy(s => s.Name)
                .ToListAsync();

            var supplierDtos = suppliers.Select(s => new SupplierDto
            {
                Id = s.Id,
                Name = s.Name,
                ContactPerson = s.ContactPerson,
                Email = s.Email,
                Phone = s.Phone,
                Address = s.Address,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            });

            return Ok(supplierDtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SupplierDto>> GetSupplier(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);

            if (supplier == null)
            {
                return NotFound();
            }

            var supplierDto = new SupplierDto
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactPerson = supplier.ContactPerson,
                Email = supplier.Email,
                Phone = supplier.Phone,
                Address = supplier.Address,
                CreatedAt = supplier.CreatedAt,
                UpdatedAt = supplier.UpdatedAt
            };

            return Ok(supplierDto);
        }

        [HttpPost]
        public async Task<ActionResult<SupplierDto>> CreateSupplier(CreateSupplierDto createSupplierDto)
        {
            var supplier = new Supplier
            {
                Name = createSupplierDto.Name,
                ContactPerson = createSupplierDto.ContactPerson,
                Email = createSupplierDto.Email,
                Phone = createSupplierDto.Phone,
                Address = createSupplierDto.Address,
                CreatedAt = DateTime.UtcNow
            };

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            var supplierDto = new SupplierDto
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactPerson = supplier.ContactPerson,
                Email = supplier.Email,
                Phone = supplier.Phone,
                Address = supplier.Address,
                CreatedAt = supplier.CreatedAt,
                UpdatedAt = supplier.UpdatedAt
            };

            return CreatedAtAction(nameof(GetSupplier), new { id = supplier.Id }, supplierDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSupplier(int id, CreateSupplierDto updateSupplierDto)
        {
            var supplier = await _context.Suppliers.FindAsync(id);

            if (supplier == null)
            {
                return NotFound();
            }

            supplier.Name = updateSupplierDto.Name;
            supplier.ContactPerson = updateSupplierDto.ContactPerson;
            supplier.Email = updateSupplierDto.Email;
            supplier.Phone = updateSupplierDto.Phone;
            supplier.Address = updateSupplierDto.Address;
            supplier.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SupplierExists(id))
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
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);

            if (supplier == null)
            {
                return NotFound();
            }

            // Check if supplier is used in any orders
            var hasOrders = await _context.Orders.AnyAsync(o => o.SupplierId == id);
            if (hasOrders)
            {
                return BadRequest("Cannot delete supplier that is associated with orders");
            }

            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool SupplierExists(int id)
        {
            return _context.Suppliers.Any(e => e.Id == id);
        }
    }
}























