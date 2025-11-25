/**
 * WareneingaengeController.cs
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-12-19
 */

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
    public class WareneingaengeController : ControllerBase
    {
        private readonly WarenbuchungDbContext _context;

        public WareneingaengeController(WarenbuchungDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WareneingangDto>>> GetWareneingaenge([FromQuery] bool? groupByReferenz = false)
        {
            var wareneingaenge = await _context.Wareneingaenge
                .Include(w => w.Product)
                .Select(w => new WareneingangDto
                {
                    Id = w.Id,
                    ProductId = w.ProductId,
                    ProductName = w.Product.Name,
                    ProductSku = w.Product.SKU,
                    ProductType = w.Product.ItemType,
                    Quantity = w.Quantity,
                    UnitPrice = w.UnitPrice,
                    TotalPrice = w.TotalPrice,
                    Erfassungstyp = w.Erfassungstyp,
                    Referenz = w.Referenz,
                    Location = w.Location,
                    Supplier = w.Supplier,
                    BatchNumber = w.BatchNumber,
                    ExpiryDate = w.ExpiryDate,
                    Notes = w.Notes,
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.UpdatedAt
                })
                .OrderByDescending(w => w.CreatedAt)
                .ToListAsync();

            // If groupByReferenz is true, group by Referenz for display purposes
            // The frontend will still receive all items, but they're sorted so items with same Referenz are together
            if (groupByReferenz == true)
            {
                wareneingaenge = wareneingaenge
                    .OrderByDescending(w => w.CreatedAt)
                    .ThenBy(w => w.Referenz ?? "")
                    .ToList();
            }

            return Ok(wareneingaenge);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<WareneingangDto>> GetWareneingang(int id)
        {
            var wareneingang = await _context.Wareneingaenge
                .Include(w => w.Product)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (wareneingang == null)
            {
                return NotFound();
            }

            var wareneingangDto = new WareneingangDto
            {
                Id = wareneingang.Id,
                ProductId = wareneingang.ProductId,
                ProductName = wareneingang.Product.Name,
                ProductSku = wareneingang.Product.SKU,
                ProductType = wareneingang.Product.ItemType,
                Quantity = wareneingang.Quantity,
                UnitPrice = wareneingang.UnitPrice,
                TotalPrice = wareneingang.TotalPrice,
                Erfassungstyp = wareneingang.Erfassungstyp,
                Referenz = wareneingang.Referenz,
                Location = wareneingang.Location,
                Supplier = wareneingang.Supplier,
                BatchNumber = wareneingang.BatchNumber,
                ExpiryDate = wareneingang.ExpiryDate,
                Notes = wareneingang.Notes,
                CreatedAt = wareneingang.CreatedAt,
                UpdatedAt = wareneingang.UpdatedAt
            };

            return Ok(wareneingangDto);
        }

        [HttpPost]
        public async Task<ActionResult<WareneingangDto>> CreateWareneingang(CreateWareneingangDto createWareneingangDto)
        {
            // Validierung: Bei Erfassungstyp "Lager" ist Bemerkung (Notes) ein Pflichtfeld
            if (createWareneingangDto.Erfassungstyp == "Lager" && string.IsNullOrWhiteSpace(createWareneingangDto.Notes))
            {
                return BadRequest("Bei Erfassungstyp 'Lager' muss eine Bemerkung angegeben werden.");
            }

            var product = await _context.Products.FindAsync(createWareneingangDto.ProductId);
            if (product == null)
            {
                return BadRequest("Product not found");
            }

            // Check if this is a Palette entry and convert quantity
            decimal actualQuantity = createWareneingangDto.Quantity;
            if (createWareneingangDto.Notes != null && createWareneingangDto.Notes.Contains("Paletten"))
            {
                // Extract the number of palettes from notes
                var paletteMatch = System.Text.RegularExpressions.Regex.Match(createWareneingangDto.Notes, @"Eingabe:\s*(\d+(?:,\d+)?)\s*Paletten");
                if (paletteMatch.Success)
                {
                    var paletteCount = decimal.Parse(paletteMatch.Groups[1].Value.Replace(',', '.'));
                    actualQuantity = paletteCount * 80; // 1 Palette = 80 Stück
                }
            }

            var totalPrice = actualQuantity * createWareneingangDto.UnitPrice;

            var wareneingang = new Wareneingang
            {
                ProductId = createWareneingangDto.ProductId,
                Quantity = actualQuantity, // Use converted quantity
                UnitPrice = createWareneingangDto.UnitPrice,
                TotalPrice = totalPrice,
                Erfassungstyp = createWareneingangDto.Erfassungstyp,
                Referenz = createWareneingangDto.Referenz,
                Location = createWareneingangDto.Location,
                Supplier = createWareneingangDto.Supplier,
                BatchNumber = createWareneingangDto.BatchNumber,
                ExpiryDate = createWareneingangDto.ExpiryDate,
                Notes = createWareneingangDto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Wareneingaenge.Add(wareneingang);

            // Update stock quantity (use converted quantity)
            product.StockQuantity += (int)actualQuantity;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var wareneingangDto = new WareneingangDto
            {
                Id = wareneingang.Id,
                ProductId = wareneingang.ProductId,
                ProductName = product.Name,
                ProductSku = product.SKU,
                ProductType = product.ItemType,
                Quantity = wareneingang.Quantity,
                UnitPrice = wareneingang.UnitPrice,
                TotalPrice = wareneingang.TotalPrice,
                Erfassungstyp = wareneingang.Erfassungstyp,
                Referenz = wareneingang.Referenz,
                Location = wareneingang.Location,
                Supplier = wareneingang.Supplier,
                BatchNumber = wareneingang.BatchNumber,
                ExpiryDate = wareneingang.ExpiryDate,
                Notes = wareneingang.Notes,
                CreatedAt = wareneingang.CreatedAt,
                UpdatedAt = wareneingang.UpdatedAt
            };

            return CreatedAtAction(nameof(GetWareneingang), new { id = wareneingang.Id }, wareneingangDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWareneingang(int id, UpdateWareneingangDto updateWareneingangDto)
        {
            // Validierung: Bei Erfassungstyp "Lager" ist Bemerkung (Notes) ein Pflichtfeld
            if (updateWareneingangDto.Erfassungstyp == "Lager" && string.IsNullOrWhiteSpace(updateWareneingangDto.Notes))
            {
                return BadRequest("Bei Erfassungstyp 'Lager' muss eine Bemerkung angegeben werden.");
            }

            var wareneingang = await _context.Wareneingaenge.FindAsync(id);
            if (wareneingang == null)
            {
                return NotFound();
            }

            var product = await _context.Products.FindAsync(updateWareneingangDto.ProductId);
            if (product == null)
            {
                return BadRequest("Product not found");
            }

            // Check if this is a Palette entry and convert quantity
            decimal actualQuantity = updateWareneingangDto.Quantity;
            if (updateWareneingangDto.Notes != null && updateWareneingangDto.Notes.Contains("Paletten"))
            {
                // Extract the number of palettes from notes
                var paletteMatch = System.Text.RegularExpressions.Regex.Match(updateWareneingangDto.Notes, @"Eingabe:\s*(\d+(?:,\d+)?)\s*Paletten");
                if (paletteMatch.Success)
                {
                    var paletteCount = decimal.Parse(paletteMatch.Groups[1].Value.Replace(',', '.'));
                    actualQuantity = paletteCount * 80; // 1 Palette = 80 Stück
                }
            }

            // Calculate quantity difference (use converted quantity)
            var quantityDifference = actualQuantity - wareneingang.Quantity;
            var totalPrice = actualQuantity * updateWareneingangDto.UnitPrice;

            wareneingang.ProductId = updateWareneingangDto.ProductId;
            wareneingang.Quantity = actualQuantity; // Use converted quantity
            wareneingang.UnitPrice = updateWareneingangDto.UnitPrice;
            wareneingang.TotalPrice = totalPrice;
            wareneingang.Erfassungstyp = updateWareneingangDto.Erfassungstyp;
            wareneingang.Referenz = updateWareneingangDto.Referenz;
            wareneingang.Location = updateWareneingangDto.Location;
            wareneingang.Supplier = updateWareneingangDto.Supplier;
            wareneingang.BatchNumber = updateWareneingangDto.BatchNumber;
            wareneingang.ExpiryDate = updateWareneingangDto.ExpiryDate;
            wareneingang.Notes = updateWareneingangDto.Notes;
            wareneingang.UpdatedAt = DateTime.UtcNow;

            // Update stock quantity
            product.StockQuantity += (int)quantityDifference;
            product.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WareneingangExists(id))
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
        public async Task<IActionResult> DeleteWareneingang(int id)
        {
            var wareneingang = await _context.Wareneingaenge.FindAsync(id);
            if (wareneingang == null)
            {
                return NotFound();
            }

            // Update stock quantity (subtract the quantity that was added)
            var product = await _context.Products.FindAsync(wareneingang.ProductId);
            if (product != null)
            {
                product.StockQuantity -= (int)wareneingang.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
            }

            _context.Wareneingaenge.Remove(wareneingang);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool WareneingangExists(int id)
        {
            return _context.Wareneingaenge.Any(e => e.Id == id);
        }
    }
}
