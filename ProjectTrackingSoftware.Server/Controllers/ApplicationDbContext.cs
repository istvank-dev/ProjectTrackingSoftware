using Microsoft.EntityFrameworkCore;
using ProjectTrackingSoftware.Server.Entities;
using System.Net.Sockets;

namespace ProjectTrackingSoftware.Server.Controllers
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectMember> ProjectMembers { get; set; }
        public DbSet<Kanban> Kanbans { get; set; }
        public DbSet<KanbanColumn> KanbanColumns { get; set; }
        public DbSet<KanbanTicket> KanbanTickets { get; set; }

        //public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Table names
            modelBuilder.Entity<KanbanColumn>().ToTable("KanbanColumn");
            modelBuilder.Entity<KanbanTicket>().ToTable("KanbanTicket");

            // Indexes for ordering and lookups
            modelBuilder.Entity<KanbanColumn>()
                .HasIndex(c => new { c.KanbanId, c.Position })
                .HasDatabaseName("idx_kanbancolumn_kanban_pos");

            modelBuilder.Entity<KanbanTicket>()
                .HasIndex(t => new { t.ColumnId, t.Position })
                .HasDatabaseName("idx_kanbanticket_column_pos");

            // Relationships & foreign keys
            modelBuilder.Entity<Project>()
                .HasOne(p => p.Owner)
                .WithMany(u => u.Projects)
                .HasForeignKey(p => p.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Kanban>()
                .HasOne(k => k.Project)
                .WithOne(p => p.Kanban)
                .HasForeignKey<Kanban>(k => k.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<KanbanColumn>()
                .HasOne(c => c.Kanban)
                .WithMany(k => k.KanbanColumns)
                .HasForeignKey(c => c.KanbanId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<KanbanTicket>()
                .HasOne(t => t.Column)
                .WithMany(c => c.KanbanTickets)
                .HasForeignKey(t => t.ColumnId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectMember>()
                .HasIndex(pm => pm.UserId)
                .HasDatabaseName("idx_projectmember_user");

            /*modelBuilder.Entity<ProjectMember>()
                .HasOne(pm => pm.Project)
                .WithMany(p => p.ProjectMembers)        // add ICollection<ProjectMember> ProjectMembers in Project if desired
                .HasForeignKey(pm => pm.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);*/

            modelBuilder.Entity<ProjectMember>()
                .HasIndex(pm => new { pm.ProjectId, pm.UserId })
                .IsUnique(); // optional: enforce single membership


            base.OnModelCreating(modelBuilder);
        }

    }
}
