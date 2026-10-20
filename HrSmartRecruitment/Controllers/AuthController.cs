using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SmartRecruitment.Application.Contract;
using SmartRecruitment.Application.Dtos.Auth;
namespace HrSmartRecruitment.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        //  (Candidate Register)
        [HttpPost("Register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto registerRequestDto)
        {
            var result = await _authService.RegisterAsync(registerRequestDto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // (Admin, HR, Candidate)
        [HttpPost("Login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest loginRequest)
        {
            var result = await _authService.LoginAsync(loginRequest);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // (Admin, HR, Candidate)
        [HttpPost("RefreshToken")]
        [Authorize] 
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest refreshTokenRequest)
        {
            var result = await _authService.RefreshTokenAsync(refreshTokenRequest);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        [HttpPost("forgotPassword")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest forgotPasswordRequest)
        {
            var result = await _authService.ForgotPasswordAsync(forgotPasswordRequest);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("resetPassword")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest resetPasswordRequest)
        {
            var result = await _authService.ResetPasswordAsync(resetPasswordRequest);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("CreateHrByAdmin")]
        [Authorize(Roles = "Admin,admin")]
        public async Task<IActionResult> CreateHrByAdmin([FromBody] CreateHrByAdmin createHrByAdmin)
        {
            var result = await _authService.CreateHrByAdminAsync(createHrByAdmin);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("create-admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminRequestDto createAdminRequestDto)
        {
            var result = await _authService.CreateAdminAsync(createAdminRequestDto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}