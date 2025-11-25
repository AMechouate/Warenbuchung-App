/**
 * ProductsController.cs
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-10
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
    public class ProductsController : ControllerBase
    {
        private readonly WarenbuchungDbContext _context;

        public ProductsController(WarenbuchungDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
        {
            var products = await _context.Products
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    SKU = p.SKU,
                    Price = p.Price,
                    StockQuantity = p.StockQuantity,
                    Unit = p.Unit,
                    LocationStock = p.LocationStock,
                    DefaultSupplier = p.DefaultSupplier,
                    ItemType = p.ItemType,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> SearchProducts([FromQuery] string query)
        {
            if (string.IsNullOrEmpty(query))
            {
                return BadRequest("Search query is required");
            }

            var products = await _context.Products
                .Where(p => p.SKU.Contains(query) || p.Name.Contains(query))
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    SKU = p.SKU,
                    Price = p.Price,
                    StockQuantity = p.StockQuantity,
                    Unit = p.Unit,
                    LocationStock = p.LocationStock,
                    DefaultSupplier = p.DefaultSupplier,
                    ItemType = p.ItemType,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .OrderBy(p => p.Name)
                .ToListAsync();

            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound();
            }

            var productDto = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                SKU = product.SKU,
                Price = product.Price,
                StockQuantity = product.StockQuantity,
                Unit = product.Unit,
                LocationStock = product.LocationStock,
                DefaultSupplier = product.DefaultSupplier,
                ItemType = product.ItemType,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt
            };

            return Ok(productDto);
        }

        [HttpPost]
        public async Task<ActionResult<ProductDto>> CreateProduct(CreateProductDto createProductDto)
        {
            if (await _context.Products.AnyAsync(p => p.SKU == createProductDto.SKU))
            {
                return BadRequest("SKU already exists");
            }

            var product = new Product
            {
                Name = createProductDto.Name,
                Description = createProductDto.Description,
                SKU = createProductDto.SKU,
                Price = createProductDto.Price,
                StockQuantity = createProductDto.StockQuantity,
                Unit = createProductDto.Unit,
                ItemType = string.IsNullOrWhiteSpace(createProductDto.ItemType) ? "Gerät" : createProductDto.ItemType,
                LocationStock = createProductDto.LocationStock,
                CreatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            var productDto = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                SKU = product.SKU,
                Price = product.Price,
                StockQuantity = product.StockQuantity,
                Unit = product.Unit,
                LocationStock = product.LocationStock,
                DefaultSupplier = product.DefaultSupplier,
                ItemType = product.ItemType,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt
            };

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, productDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, UpdateProductDto updateProductDto)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound();
            }

            if (id != product.Id)
            {
                return BadRequest();
            }

            if (await _context.Products.AnyAsync(p => p.SKU == updateProductDto.SKU && p.Id != id))
            {
                return BadRequest("SKU already exists");
            }

            product.Name = updateProductDto.Name;
            product.Description = updateProductDto.Description;
            product.SKU = updateProductDto.SKU;
            product.Price = updateProductDto.Price;
            product.StockQuantity = updateProductDto.StockQuantity;
            product.Unit = updateProductDto.Unit;
            product.ItemType = string.IsNullOrWhiteSpace(updateProductDto.ItemType) ? product.ItemType : updateProductDto.ItemType;
            product.LocationStock = updateProductDto.LocationStock;
            product.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(id))
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
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProductExists(int id)
        {
            return _context.Products.Any(e => e.Id == id);
        }
    }
}
