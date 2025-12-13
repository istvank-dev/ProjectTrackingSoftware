namespace ProjectTrackingSoftware.Server.Models
{
    public class TaskDto
    {
        public Guid ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
    }
}
