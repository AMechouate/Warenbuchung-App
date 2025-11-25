/**
 * ProjectAssignmentsController.cs
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-13
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
    [Route("api/projects/{projectKey}/items")]
    [Authorize]
    public class ProjectAssignmentsController : ControllerBase
    {
        private readonly WarenbuchungDbContext _context;

        public ProjectAssignmentsController(WarenbuchungDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectAssignmentDto>>> GetAssignedItems(string projectKey)
        {
            if (string.IsNullOrWhiteSpace(projectKey))
            {
                return BadRequest("Projektkennung ist erforderlich.");
            }

            var assignments = await _context.ProjectAssignedItems
                .Include(a => a.Product)
                .Where(a => a.ProjectKey == projectKey)
                .OrderBy(a => a.CreatedAt)
                .ToListAsync();

            var result = assignments.Select(a => new ProjectAssignmentDto
            {
                Id = a.Id,
                ProjectKey = a.ProjectKey,
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

        [HttpPost]
        public async Task<ActionResult<ProjectAssignmentDto>> CreateAssignedItem(string projectKey, CreateProjectAssignmentDto dto)
        {
            if (string.IsNullOrWhiteSpace(projectKey))
            {
                return BadRequest("Projektkennung ist erforderlich.");
            }

            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId);
            if (product == null)
            {
                return BadRequest("Produkt wurde nicht gefunden.");
            }

            var alreadyAssigned = await _context.ProjectAssignedItems
                .AnyAsync(a => a.ProjectKey == projectKey && a.ProductId == dto.ProductId);
            if (alreadyAssigned)
            {
                return Conflict("Produkt ist diesem Projekt bereits zugewiesen.");
            }

            var assignment = new ProjectAssignedItem
            {
                ProjectKey = projectKey,
                ProductId = product.Id,
                DefaultQuantity = dto.DefaultQuantity ?? 0m,
                Unit = string.IsNullOrWhiteSpace(dto.Unit) ? (product.Unit ?? "Stück") : dto.Unit,
                CreatedAt = DateTime.UtcNow
            };

            _context.ProjectAssignedItems.Add(assignment);
            await _context.SaveChangesAsync();

            await _context.Entry(assignment).Reference(a => a.Product).LoadAsync();

            var result = new ProjectAssignmentDto
            {
                Id = assignment.Id,
                ProjectKey = assignment.ProjectKey,
                ProductId = assignment.ProductId,
                ProductName = assignment.Product?.Name ?? string.Empty,
                ProductSku = assignment.Product?.SKU ?? string.Empty,
                DefaultQuantity = assignment.DefaultQuantity,
                Unit = assignment.Unit,
                CreatedAt = assignment.CreatedAt,
                UpdatedAt = assignment.UpdatedAt
            };

            return CreatedAtAction(nameof(GetAssignedItems), new { projectKey }, result);
        }

        [HttpDelete("{assignmentId}")]
        public async Task<IActionResult> DeleteAssignedItem(string projectKey, int assignmentId)
        {
            var assignment = await _context.ProjectAssignedItems
                .FirstOrDefaultAsync(a => a.ProjectKey == projectKey && a.Id == assignmentId);

            if (assignment == null)
            {
                return NotFound();
            }

            _context.ProjectAssignedItems.Remove(assignment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}









