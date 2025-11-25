/**
 * SettingsDto.cs
 * 
 * @author Adam Mechouate
 * @company OPTIMI Solutions GmbH
 * @email adam.mechouate7@gmail.com
 * @date 2025-11-06
 */
namespace WarenbuchungApi.DTOs
{
    public class CreateUserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public bool IsAdmin { get; set; } = false;
        public string? Locations { get; set; }
    }

    public class UpdateUserDto
    {
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public bool? IsAdmin { get; set; }
        public bool? IsActive { get; set; }
        public string? Locations { get; set; }
    }

    // Note: UserDto is defined in AuthDto.cs, but we need this version for settings with string Locations
    public class SettingsUserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public bool IsActive { get; set; }
        public bool IsAdmin { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public string? Locations { get; set; }
    }

    public class WarenausgangReasonDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateWarenausgangReasonDto
    {
        public string Name { get; set; } = string.Empty;
        public int OrderIndex { get; set; } = 0;
    }

    public class UpdateWarenausgangReasonDto
    {
        public string? Name { get; set; }
        public int? OrderIndex { get; set; }
        public bool? IsActive { get; set; }
    }

    public class JustificationTemplateDto
    {
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateJustificationTemplateDto
    {
        public string Text { get; set; } = string.Empty;
        public int OrderIndex { get; set; } = 0;
    }

    public class UpdateJustificationTemplateDto
    {
        public string? Text { get; set; }
        public int? OrderIndex { get; set; }
        public bool? IsActive { get; set; }
    }
}
