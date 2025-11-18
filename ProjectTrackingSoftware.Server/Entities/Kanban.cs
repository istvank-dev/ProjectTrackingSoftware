using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Net.Sockets;

namespace ProjectTrackingSoftware.Server.Entities
{
    public class Kanban
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid ProjectId { get; set; }
        public Project Project { get; set; }

        public ICollection<KanbanColumn> KanbanColumns { get; set; }
    }

    public class KanbanColumn
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Title { get; set; }

        [Required]
        public string BackgroundColor { get; set; }

        [Required]
        public Guid KanbanId { get; set; }
        public Kanban Kanban { get; set; }

        [Required]
        [Column(TypeName = "numeric(20,6)")]
        public decimal Position { get; set; }

        public ICollection<KanbanTicket> KanbanTickets { get; set; }
    }

    public class KanbanTicket
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Title { get; set; }
        public string Description { get; set; }

        [Required]
        public string BackgroundColor { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public Guid ColumnId { get; set; }
        public KanbanColumn Column { get; set; }

        [Required]
        [Column(TypeName = "numeric(20,6)")]
        public decimal Position { get; set; }

        [Required]
        public Guid OwnerId { get; set; }
        public User Owner { get; set; }
    }
}
