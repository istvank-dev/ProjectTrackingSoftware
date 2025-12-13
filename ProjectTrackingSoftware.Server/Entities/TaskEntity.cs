namespace ProjectTrackingSoftware.Server.Entities
{
    public class TaskEntity
    {
        public Guid Id { get; set; }
        public string ProjectName { get; set; }
        public int ColumnIndex { get; set; } = 0;

        // Connections

        public Guid ProjectId { get; set; }
        public Project Project { get; set; }

        public User? Asignee { get; set; }
    }
}
