namespace ProjectTrackingSoftware.Server.Entities
{
    public class TaskEntity
    {
        public Guid Id { get; set; }
        public string ProjectName { get; set; }
        public int ColumnIndex { get; set; } = 0;
    }
}
