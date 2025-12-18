using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectTrackingSoftware.Server.Entities;
using ProjectTrackingSoftware.Server.Models;
using Microsoft.AspNetCore.Authorization;

namespace ProjectTrackingSoftware.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TaskController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TaskController(ApplicationDbContext context)
        {
            _context = context;
        }

        //POST: api/task
        [HttpPost]
        public async Task<IActionResult> Create(TaskDto task)
        {
            if (task == null || string.IsNullOrWhiteSpace(task.ProjectName))
                return BadRequest("Task name is required");

            var project = _context.Projects
                                .FirstOrDefault(x => x.Id == task.ProjectId);

            if (project == null) return NotFound();

            var id = Guid.NewGuid();
            var newTask = new TaskEntity() { Id = id, ProjectId = project.Id, ColumnIndex = 0, ProjectName = task.ProjectName };
            //project.Tasks.Add(newTask);
            _context.Tasks.Add(newTask);
            _context.SaveChanges();
            return Ok(task);
        }

        //GET: api/task
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tasks = await _context.Tasks.ToListAsync();
            return Ok(tasks);
        }
        
        //GET: api/task/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTask(Guid id)
        {
            var existing = _context.Tasks.FirstOrDefault(x => x.Id == id);
            if(existing == null) return NotFound();

            return Ok(existing);
        } 

        //PUT: api/task/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, TaskPutDto task)
        {
            var existing = _context.Tasks.FirstOrDefault(x => x.Id == id);
            if(existing == null) return NotFound();

            existing.ProjectId = task.ProjectId;
            existing.ProjectName = task.ProjectName;
            existing.ColumnIndex = task.ColumnIndex;

            _context.SaveChanges();
            return Ok(existing);
        }

        //DELETE: api/task/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var existing = _context.Tasks.FirstOrDefault(x => x.Id == id);
            if(existing == null) return NotFound();

            _context.Tasks.Remove(existing);
            _context.SaveChanges();

            return NoContent();
        }


    }

    public class TaskPutDto
    {
        public Guid Id { get; set; }
        public string ProjectName { get; set; }
        public int ColumnIndex { get; set; } = 0;
        public Guid ProjectId { get; set; }
    }
}
