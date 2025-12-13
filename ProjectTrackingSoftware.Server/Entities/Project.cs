namespace ProjectTrackingSoftware.Server.Entities
{
    public class Project
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public int ColumnCount { get; set; } = 0;

        // Completion percentage
        public int Completetion => this.Tasks.Count != 0 ? (this.Tasks.Count / this.Tasks.Count(t=> t.ColumnIndex == this.ColumnCount - 1)) * 100 : 100; 

        // Connections
        public ICollection<User> Users { get; set; } = [];

        public ICollection<TaskEntity> Tasks { get; set; } = [];


    }
}
