using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using WarenbuchungApi.Data;
using WarenbuchungApi.DTOs;
using WarenbuchungApi.Models;
using System.Security.Claims;

namespace WarenbuchungApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SettingsController : ControllerBase
    {
        private readonly WarenbuchungDbContext _context;

        public SettingsController(WarenbuchungDbContext context)
        {
            _context = context;
        }

        // Helper method to check if current user is admin
        private async Task<bool> IsCurrentUserAdminAsync()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return false;
            }

            var user = await _context.Users.FindAsync(userId);
            return user != null && user.IsAdmin;
        }

        // ========== USER MANAGEMENT ==========
        
        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<SettingsUserDto>>> GetUsers([
            FromQuery] string? search, [FromQuery] string? role, [FromQuery] bool includeInactive = true)
        {
            if (!await IsCurrentUserAdminAsync())
            {
                return Forbid();
            }

            var usersQuery = _context.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var trimmed = search.Trim();
                var likePattern = $"%{trimmed}%";

                usersQuery = usersQuery.Where(u =>
                    EF.Functions.Like(u.Username, likePattern) ||
                    EF.Functions.Like(u.Email, likePattern) ||
                    (u.FirstName != null && EF.Functions.Like(u.FirstName, likePattern)) ||
                    (u.LastName != null && EF.Functions.Like(u.LastName, likePattern)));
            }

            if (!string.IsNullOrWhiteSpace(role))
            {
                var normalizedRole = role.Trim().ToLowerInvariant();
                usersQuery = normalizedRole switch
                {
                    "admin" => usersQuery.Where(u => u.IsAdmin),
                    "user" or "normal" or "standard" => usersQuery.Where(u => !u.IsAdmin),
                    _ => usersQuery
                };
            }

            if (!includeInactive)
            {
                usersQuery = usersQuery.Where(u => u.IsActive);
            }

            var users = await usersQuery
                .OrderBy(u => u.Username)
                .Select(u => new SettingsUserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    IsActive = u.IsActive,
                    IsAdmin = u.IsAdmin,
                    CreatedAt = u.CreatedAt,
                    LastLoginAt = u.LastLoginAt,
                    Locations = u.Locations
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPost("users")]
        public async Task<ActionResult<SettingsUserDto>> CreateUser(CreateUserDto createUserDto)
        {
            if (!await IsCurrentUserAdminAsync())
            {
                return Forbid();
            }

            // Check if username or email already exists
            if (await _context.Users.AnyAsync(u => u.Username == createUserDto.Username))
            {
                return BadRequest("Username already exists");
            }

            if (await _context.Users.AnyAsync(u => u.Email == createUserDto.Email))
            {
                return BadRequest("Email already exists");
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password);

            var user = new User
            {
                Username = createUserDto.Username,
                Email = createUserDto.Email,
                PasswordHash = passwordHash,
                FirstName = createUserDto.FirstName,
                LastName = createUserDto.LastName,
                IsAdmin = createUserDto.IsAdmin,
                IsActive = true,
                Locations = createUserDto.Locations,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var userDto = new SettingsUserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                IsActive = user.IsActive,
                IsAdmin = user.IsAdmin,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                Locations = user.Locations
            };

            return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, userDto);
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updateUserDto)
        {
            if (!await IsCurrentUserAdminAsync())
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            if (!string.IsNullOrEmpty(updateUserDto.Username) && updateUserDto.Username != user.Username)
            {
                if (await _context.Users.AnyAsync(u => u.Username == updateUserDto.Username && u.Id != id))
                {
                    return BadRequest("Username already exists");
                }
                user.Username = updateUserDto.Username;
            }

            if (!string.IsNullOrEmpty(updateUserDto.Email) && updateUserDto.Email != user.Email)
            {
                if (await _context.Users.AnyAsync(u => u.Email == updateUserDto.Email && u.Id != id))
                {
                    return BadRequest("Email already exists");
                }
                user.Email = updateUserDto.Email;
            }

            if (!string.IsNullOrEmpty(updateUserDto.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(updateUserDto.Password);
            }

            if (!string.IsNullOrEmpty(updateUserDto.FirstName))
            {
                user.FirstName = updateUserDto.FirstName;
            }

            if (!string.IsNullOrEmpty(updateUserDto.LastName))
            {
                user.LastName = updateUserDto.LastName;
            }

            if (updateUserDto.IsAdmin.HasValue)
            {
                user.IsAdmin = updateUserDto.IsAdmin.Value;
            }

            if (updateUserDto.IsActive.HasValue)
            {
                user.IsActive = updateUserDto.IsActive.Value;
            }

            if (!string.IsNullOrEmpty(updateUserDto.Locations))
            {
                user.Locations = updateUserDto.Locations;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            if (!await IsCurrentUserAdminAsync())
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Prevent deleting yourself
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim != null && int.TryParse(userIdClaim, out int currentUserId) && currentUserId == id)
            {
                return BadRequest("Cannot delete your own account");
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ========== WARENAUSGANG REASONS ==========

        [HttpGet("reasons")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<WarenausgangReasonDto>>> GetReasons()
        {
            // Public endpoint - all users can see active reasons
            var reasons = await _context.WarenausgangReasons
                .Where(r => r.IsActive)
                .OrderBy(r => r.OrderIndex)
                .ThenBy(r => r.Name)
                .Select(r => new WarenausgangReasonDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    OrderIndex = r.OrderIndex,
                    IsActive = r.IsActive,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt
                })
                .ToListAsync();

            return Ok(reasons);
        }

        [HttpGet("reasons/all")]
        public async Task<ActionResult<IEnumerable<WarenausgangReasonDto>>> GetAllReasons()
        {
            if (!await IsCurrentUserAdminAsync())
            {
                return Forbid();
            }

            var reasons = await _context.WarenausgangReasons
                .OrderBy(r => r.OrderIndex)
                .ThenBy(r => r.Name)
                .Select(r => new WarenausgangReasonDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    OrderIndex = r.OrderIndex,
                    IsActive = r.IsActive,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt
                })
                .ToListAsync();

            return Ok(reasons);
        }

        [HttpPost("reasons")]
        public async Task<ActionResult<WarenausgangReasonDto>> CreateReason(CreateWarenausgangReasonDto createReasonDto)
        {
            if (!await IsCurrentUserAdminAsync())
            {
                return Forbid();
            }

            var reason = new WarenausgangReason
            {
                Name = createReasonDto.Name,
                OrderIndex = createReasonDto.OrderIndex,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.WarenausgangReasons.Add(reason);
            await _context.SaveChangesAsync();

            var reasonDto = new WarenausgangReasonDto
            {
                Id = reason.Id,
                Name = reason.Name,
                OrderIndex = reason.OrderIndex,
                IsActive = reason.IsActive,
                CreatedAt = reason.CreatedAt,
                UpdatedAt = reason.UpdatedAt
            };

            return CreatedAtAction(nameof(GetReasons), new { id = reason.Id }, reasonDto);
        }

        [HttpPut("reasons/{id}")]
        public async Task<IActionResult> UpdateReason(int id, UpdateWarenausgangReasonDto updateReasonDto)
        {
            if (!await IsCurrentUserAdminAsync())
            {
                return Forbid();
            }

            var reason = await _context.WarenausgangReasons.FindAsync(id);
            if (reason == null)
            {
                return NotFound();
            }

            if (!string.IsNullOrEmpty(updateReasonDto.Name))
            {
                reason.Name = updateReasonDto.Name;
            }

            if (updateReasonDto.OrderIndex.HasValue)
            {
                reason.OrderIndex = updateReasonDto.OrderIndex.Value;
            }

            if (updateReasonDto.IsActive.HasValue)
            {
                reason.IsActive = updateReasonDto.IsActive.Value;
            }

            reason.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("reasons/{id}")]
        public async Task<IActionResult> DeleteReason(int id)
        {
            if (!await IsCurrentUserAdminAsync())
            {
                return Forbid();
            }

            var reason = await _context.WarenausgangReasons.FindAsync(id);
            if (reason == null)
            {
                return NotFound();
            }

            _context.WarenausgangReasons.Remove(reason);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ========== JUSTIFICATION TEMPLATES ==========

        [HttpGet("justifications")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<JustificationTemplateDto>>> GetJustifications()
        {
            // Public endpoint - all users can see active justifications
            var templates = await _context.JustificationTemplates
                .Where(j => j.IsActive)
                .OrderBy(j => j.OrderIndex)
                .ThenBy(j => j.Text)
                .Select(j => new JustificationTemplateDto
                {
                    Id = j.Id,
                    Text = j.Text,
                    OrderIndex = j.OrderIndex,
                    IsActive = j.IsActive,
                    CreatedAt = j.CreatedAt,
                    UpdatedAt = j.UpdatedAt
                })
                .ToListAsync();

            return Ok(templates);
        }

        [HttpGet("justifications/all")]
        public async Task<ActionResult<IEnumerable<JustificationTemplateDto>>> GetAllJustifications()
        {
            if (!await IsCurrentUserAdminAsync())
            {
                return Forbid();
            }

            var templates = await _context.JustificationTemplates
                .OrderBy(j => j.OrderIndex)
                .ThenBy(j => j.Text)
                .Select(j => new JustificationTemplateDto
                {
                    Id = j.Id,
                    Text = j.Text,
                    OrderIndex = j.OrderIndex,
                    IsActive = j.IsActive,
                    CreatedAt = j.CreatedAt,
                    UpdatedAt = j.UpdatedAt
                })
                .ToListAsync();

            return Ok(templates);
        }

        [HttpPost("justifications")]
        public async Task<ActionResult<JustificationTemplateDto>> CreateJustification(CreateJustificationTemplateDto createTemplateDto)
        {
            if (!await IsCurrentUserAdminAsync())
            {
                return Forbid();
            }

            var template = new JustificationTemplate
            {
                Text = createTemplateDto.Text,
                OrderIndex = createTemplateDto.OrderIndex,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.JustificationTemplates.Add(template);
            await _context.SaveChangesAsync();

            var templateDto = new JustificationTemplateDto
            {
                Id = template.Id,
                Text = template.Text,
                OrderIndex = template.OrderIndex,
                IsActive = template.IsActive,
                CreatedAt = template.CreatedAt,
                UpdatedAt = template.UpdatedAt
            };

            return CreatedAtAction(nameof(GetJustifications), new { id = template.Id }, templateDto);
        }

        [HttpPut("justifications/{id}")]
        public async Task<IActionResult> UpdateJustification(int id, UpdateJustificationTemplateDto updateTemplateDto)
        {
            if (!await IsCurrentUserAdminAsync())
            {
                return Forbid();
            }

            var template = await _context.JustificationTemplates.FindAsync(id);
            if (template == null)
            {
                return NotFound();
            }

            if (!string.IsNullOrEmpty(updateTemplateDto.Text))
            {
                template.Text = updateTemplateDto.Text;
            }

            if (updateTemplateDto.OrderIndex.HasValue)
            {
                template.OrderIndex = updateTemplateDto.OrderIndex.Value;
            }

            if (updateTemplateDto.IsActive.HasValue)
            {
                template.IsActive = updateTemplateDto.IsActive.Value;
            }

            template.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("justifications/{id}")]
        public async Task<IActionResult> DeleteJustification(int id)
        {
            if (!await IsCurrentUserAdminAsync())
            {
                return Forbid();
            }

            var template = await _context.JustificationTemplates.FindAsync(id);
            if (template == null)
            {
                return NotFound();
            }

            _context.JustificationTemplates.Remove(template);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

