using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using ProjectTrackingSoftware.Server.Entities;
using ProjectTrackingSoftware.Server.Models;
using ProjectTrackingSoftware.Server.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace ProjectTrackingSoftware.Server.Controllers
{
    [Route("api/[controller]")] // This will be "api/auth/"
    [ApiController]
    // "IConfiguration configuration" is basically the appsettings.json file
    public class AuthController(IAuthService authService) : ControllerBase
    {
        public static User user = new();


        [HttpPost("register")]
        public async Task<ActionResult<User>> Register(UserDto request)
        {
            var user = await authService.RegisterAsync(request);

            if(user is null)
            {
                return BadRequest("Registration failed: Username already exists.");
            }

            return Ok(user);
        }

        [HttpPost("login")]
        public async Task<ActionResult<TokenResponseDto>> Login(UserDto request)
        {
            var result = await authService.LoginAsync(request);

            if(result is null)
            {
                return BadRequest("Login failed: Ivalid username or password.");
            }

            return Ok(result);
        }

        [Authorize]
        [HttpGet("authorized-only")]
        public IActionResult AuthenticatedOnlyEndpoint()
        {
            return Ok("You are authenticated!");
        }

        [Authorize(Roles = "Admin")] // Can add more roles with comma, for example: "Admin,Editor"
        [HttpGet("admin-only")]
        public IActionResult AdminOnlyEndpoint()
        {
            return Ok("You are an Admin!");
        }

        [HttpPost("refresh-token")]
        public async Task<ActionResult<TokenResponseDto>> RefreshToken(RefreshTokenRequestDto request)
        {
            var result = await authService.RefreshTokensAsync(request);
            if(result is null || result.AccessToken is null || result.RefreshToken is null)
            {
                return Unauthorized("Invalid refresh token!");
            }
            return Ok(result);
        }
    }
}
