namespace ProjectTrackingSoftware.Server.Entities
{
    // User table in the database
    public class User
    {
        // Needs a primary key
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public string? RefreshToken { get; set; }

        public DateTime? RefreshTokenExpiryTime { get; set; }

        public ICollection<Project> Projects { get; set; }
    }
}
