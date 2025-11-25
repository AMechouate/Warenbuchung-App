using BCrypt.Net;

Console.WriteLine("=== BCrypt Hash Generator ===");
Console.WriteLine();

// Generate hash for "password"
string passwordHash = BCrypt.Net.BCrypt.HashPassword("password");
Console.WriteLine($"Hash for 'password': {passwordHash}");
Console.WriteLine();

// Verify existing hash
string existingHash = "$2a$11$u/j1O2ujsjekqZj0iFpWLeNA3r88Nzztnkq4F1HTI8n3EnlqtHrcu";

string[] testPasswords = { "admin123", "password", "password123", "warenbuchung", "test" };

Console.WriteLine("Testing existing hash against passwords:");
foreach (string pwd in testPasswords)
{
    bool matches = BCrypt.Net.BCrypt.Verify(pwd, existingHash);
    Console.WriteLine($"  {pwd}: {(matches ? "✅ MATCH" : "❌ no match")}");
}
























