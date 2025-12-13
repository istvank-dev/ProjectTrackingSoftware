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
                                //.Include(p => p.Tasks)
                                .Select(p => new
                                {
                                    Id = p.Id,
                                    Name = p.Name,
                                    ColumnCount = p.ColumnCount,
                                    Completetion = p.Completetion,
                                    Tasks = p.Tasks.Select(t => new  { 
                                        t.Id,
                                        t.ProjectName
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
        public async Task<IActionResult> Create(ProjectDto project)
        {

            if (project == null || string.IsNullOrWhiteSpace(project.Name))
                return BadRequest("Project name is required");

            // Find user
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                return BadRequest("Invalid user token");
            }

            var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);
            if (user == null) return NotFound();

            //Create new Project
            var id = Guid.NewGuid();

            var newProject = new Project()
            {
                Id = id,
                Name = project.Name,
                ColumnCount = project.ColumnCount,
                Users = [user]
            };
            _context.Projects.Add(newProject);
            _context.SaveChanges();

            // Return new project
            var existing = _context.Projects
                    .Include(p => p.Users)
                    .Include(p => p.Tasks)
                    .Select(p => new
                    {
                        Id = p.Id,
                        Name = p.Name,
                        ColumnCount = p.ColumnCount,
                        Completetion = p.Completetion,
                        Tasks = p.Tasks,
                        Users = p.Users.Select(p => p.Username)
                    })
                    .FirstOrDefault(x => x.Id == id);

            if (existing == null) return NotFound();

            return Ok(existing);

        }

        // Not sure if there is a cleaner way to do this but it should work
        // Puts the given user from the body into the project from the url id
        // body : { Name : "userName"}
        //POST: api/project/invite/{projectId}
        [HttpPost("{id}")]
        public async Task<IActionResult> Invite(Guid id, InviteDto invite)
        {

            if (string.IsNullOrEmpty(invite.Name)) return NotFound();

            var user = await _context.Users.FirstOrDefaultAsync(x => x.Username == invite.Name);
            if (user == null) return NotFound();

            var project = await _context.Projects.FirstOrDefaultAsync(x => x.Id == id);
            if (project == null) return NotFound();

            project.Users.Add(user);
            _context.SaveChanges();

            return Ok();

        }
    }


}

public class InviteDto
{
    public string Name { get; set; } = string.Empty;
}
public class ProjectDto
{
    public string Name { get; set; } = string.Empty;
    public int ColumnCount { get; set; } = 3;
}

