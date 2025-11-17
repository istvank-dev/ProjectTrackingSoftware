using ProjectTrackingSoftware.Server.Entities;
using ProjectTrackingSoftware.Server.Models;

namespace ProjectTrackingSoftware.Server.Services
{
    public interface IAuthService
    {
        Task<User?> RegisterAsync(UserDto request);

        Task<TokenResponseDto?> LoginAsync(UserDto request);

        Task<TokenResponseDto?> RefreshTokensAsync(RefreshTokenRequestDto request);

        Task<Boolean> RevokeTokensAsync(Guid userId);
    }
}
