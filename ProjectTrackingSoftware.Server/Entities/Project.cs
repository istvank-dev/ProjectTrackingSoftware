using System.ComponentModel.DataAnnotations;

namespace ProjectTrackingSoftware.Server.Entities
{
    public class Project
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Title { get; set; }
        public string Description { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public Guid OwnerId { get; set; }
        public User Owner { get; set; }

        public Kanban Kanban { get; set; }

        public ICollection<User> ProjectMembers { get; set; }
    }

    public class ProjectMember
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid ProjectId { get; set; }

        public Project Project { get; set; }

        [Required]
        public Guid UserId { get; set; }

        public User User { get; set; }

        public string Role { get; set; } // Maybe for later
    }
}
