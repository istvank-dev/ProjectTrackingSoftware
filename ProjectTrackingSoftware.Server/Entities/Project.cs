using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace ProjectTrackingSoftware.Server.Entities
{
    public class Project
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;


        public string ColumnNamesJson { get; set; } = "[]";

        [NotMapped]
        public List<string> ColumnNames
        {
            get
            {
                if (string.IsNullOrWhiteSpace(ColumnNamesJson))
                    return new List<string>();

                try
                {
                    return JsonSerializer.Deserialize<List<string>>(ColumnNamesJson)
                           ?? new List<string>();
                }
                catch
                {
                    return new List<string>();
                }
            }
            set => ColumnNamesJson = JsonSerializer.Serialize(value);
        }


        // Completion percentage
        public int Completetion =>
    Tasks.Count == 0
        ? 100
        : (int)(
            (Tasks.Count(t => t.ColumnIndex == ColumnNames.Count - 1)
             / (double)Tasks.Count) * 100
          );
        // Connections
        public ICollection<User> Users { get; set; } = [];

        public ICollection<TaskEntity> Tasks { get; set; } = [];


    }
}
