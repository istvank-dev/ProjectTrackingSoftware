using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectTrackingSoftware.Server.Entities;
using ProjectTrackingSoftware.Server.Models;
using System.Text.Json;

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

        [Consumes("application/json")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaskDto task)
        {
            if (task == null || string.IsNullOrWhiteSpace(task.ProjectName))
                return BadRequest("Task name is required");

            var project = _context.Projects
                                .FirstOrDefault(x => x.Id == task.ProjectId);

            if (project == null) return NotFound("Project not found");

            var id = Guid.NewGuid();
            var newTask = new TaskEntity
            {
                Id = Guid.NewGuid(),
                ProjectId = project.Id,
                ProjectName = task.ProjectName,
                ColumnIndex = task.ColumnIndex
            };
            //project.Tasks.Add(newTask);
            _context.Tasks.Add(newTask);
            _context.SaveChanges();
           // return Ok(task);
            return Ok(newTask);
        }/**/

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

        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok("TaskController is alive");
        }

        [AllowAnonymous]
        [HttpGet("pong")]
        public IActionResult Pong()
        {
            return Ok("pong ok");
        }


        [AllowAnonymous]
        [HttpPost("post-alive")]
        public IActionResult PostAlive()
        {
            return Ok("post alive");
        }
        public record TestBody(string Message);
        [Authorize]
        [Consumes("application/json")]
        [HttpPost("oldtest")]
        public IActionResult PostTest([FromBody] JsonElement body)
        {
            try
            {
                return Ok(body);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.ToString());
            }
        }

        [AllowAnonymous]
        [HttpPost("whoami")]
        public IActionResult WhoAmI()
        {
            return Ok("This is the TaskController you edited");
        }

        /*[AllowAnonymous]
        [HttpPost]
        public IActionResult PostRoot()
        {
            return Ok("post root works");
        }/**/


        public class CreateTaskTestDto
        {
            public Guid ProjectId { get; set; }
            public string ProjectName { get; set; }
        }

        [Authorize]
        [Consumes("application/json")]
        [HttpPost("oldtest2")]
        public IActionResult PostTest([FromBody] CreateTaskTestDto dto)
        {
            return Ok(new
            {
                receivedProjectId = dto.ProjectId,
                receivedProjectName = dto.ProjectName
            });
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
