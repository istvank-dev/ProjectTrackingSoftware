using Microsoft.EntityFrameworkCore;
using ProjectTrackingSoftware.Server.Entities;

namespace ProjectTrackingSoftware.Server.Controllers
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
    {
        public DbSet<User> Users { get; set; }
        public DbSet<TaskEntity> Tasks { get; set; }
        public DbSet<Project> Projects { get; set; }
    }
}
