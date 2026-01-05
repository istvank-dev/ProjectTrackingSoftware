using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectTrackingSoftware.Server.Entities;
using ProjectTrackingSoftware.Server.Services;
using System.Security.Claims;

namespace ProjectTrackingSoftware.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly ApplicationDbContext _context;


        public ProjectController(ApplicationDbContext context)
        {
            _context = context;
        }

        ////GET: api/project/{id}
        [HttpGet("{id}")]
        public IActionResult GetOne(Guid id)
        {

            var existing = _context.Projects
                                //.Include(p => p.Users)
                                .Include(p => p.Tasks)
                                .Select(p => new
                                {
                                    Id = p.Id,
                                    Name = p.Name,
                                    ColumnNames = p.ColumnNames,
                                    Completetion = p.Completetion,
                                    Tasks = p.Tasks.Select(t => new  { 
                                        t.Id,
                                        t.ProjectName,
                                        t.ColumnIndex

                                    }),
                                    Users = p.Users.Select(p => p.Username)
                                })
                                .FirstOrDefault(x => x.Id == id);

            if (existing == null) return NotFound();

            return Ok(existing);
        }

        // Gets all projects that the user is part of (Sender of the request)
        ////GET: api/project
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                return BadRequest("Invalid user token");
            }

            var projects = await _context.Projects.Where(p => p.Users.Any(u => u.Id == userId)).ToListAsync();
            return Ok(projects);
        }


        // Creates a new project and returns the project details the same way getOne does
        //POST: api/project
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProjectDto project)
        {
            if (project == null || string.IsNullOrWhiteSpace(project.Name))
                return BadRequest("Project name is required");

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
                return BadRequest("Invalid user token");

            var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);
            if (user == null) return NotFound();

            var columnNames = project.ColumnNames?.Count > 0
                ? project.ColumnNames
                : new List<string> { "To Do", "In Progress", "Done" };

            var id = Guid.NewGuid();

            var newProject = new Project
            {
                Id = id,
                Name = project.Name,
                ColumnNames = columnNames,
                Users = [user]
            };

            _context.Projects.Add(newProject);
            await _context.SaveChangesAsync();

            var existing = _context.Projects
                .Include(p => p.Users)
                .Include(p => p.Tasks)
                .Select(p => new
                {
                    Id = p.Id,
                    Name = p.Name,
                    ColumnNames = p.ColumnNames,
                    Completetion = p.Completetion,
                    Tasks = p.Tasks.Select(t => new
                    {
                        t.Id,
                        t.ProjectName,
                        t.ColumnIndex
                    }),
                    Users = p.Users.Select(u => u.Username)
                })
                .FirstOrDefault(x => x.Id == id);

            return Ok(existing);
        }


        // Not sure if there is a cleaner way to do this but it should work
        // Puts the given user from the body into the project from the url id
        // body : { Name : "userName"}
        //POST: api/project/invite/{projectId}
        [HttpPost("{id}/invite")]
        public async Task<IActionResult> Invite(Guid id, InviteDto invite)
        {
            if (string.IsNullOrWhiteSpace(invite.Name))
                return BadRequest("Username required");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == invite.Name);
            if (user == null)
                return NotFound("User not found");

            var project = await _context.Projects
                .Include(p => p.Users)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound("Project not found");

            if (project.Users.Any(u => u.Id == user.Id))
                return BadRequest("User already in project");

            project.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(project.Users.Select(u => u.Username));
        }
 

        // DELETE: api/project/{id}/leave
        [HttpDelete("{id}/leave")]
        public async Task<IActionResult> LeaveProject(Guid id)
        {
            // Get current user
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
                return BadRequest("Invalid user token");

            var project = await _context.Projects
                .Include(p => p.Users)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound("Project not found");

            var user = project.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
                return BadRequest("User is not part of this project");

            // Remove user from project
            project.Users.Remove(user);

            // If no users left, delete the project
            if (project.Users.Count == 0)
            {
                _context.Projects.Remove(project);
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/columns")]
        public async Task<IActionResult> AddColumn(Guid id, [FromBody] AddColumnDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Column name required");

            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == id);
            if (project == null) return NotFound();

            var columns = project.ColumnNames;
            columns.Add(dto.Name);
            project.ColumnNames = columns;

            await _context.SaveChangesAsync();

            return Ok(project.ColumnNames);
        }



    }


}
public class AddColumnDto
{
    public string Name { get; set; } = string.Empty;
}

public class InviteDto
{
    public string Name { get; set; } = string.Empty;
}
public class ProjectDto
{
    public string Name { get; set; } = string.Empty;
    public List<string>? ColumnNames { get; set; }
}


