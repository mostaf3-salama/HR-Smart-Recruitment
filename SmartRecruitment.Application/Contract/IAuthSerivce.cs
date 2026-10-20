using SmartRecruitment.Application.Common.Results;
using SmartRecruitment.Application.Dtos.Auth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Contract
{
    public interface IAuthService
    {
        Task<ResultData<LoginResponse>> RegisterAsync(RegisterRequestDto registerRequestDto);
        Task<ResultData<LoginResponse>> LoginAsync(LoginRequest loginRequest);
        Task<ResultData<LoginResponse>> RefreshTokenAsync(RefreshTokenRequest refreshTokenRequest);
        Task<ResultData> ForgotPasswordAsync(ForgotPasswordRequest forgotPasswordRequest);
        Task<ResultData> ResetPasswordAsync(ResetPasswordRequest request);

        Task<ResultData> CreateHrByAdminAsync(CreateHrByAdmin createHrByAdmin); 
        Task<ResultData> CreateAdminAsync(CreateAdminRequestDto createAdminRequestDto); 

    }
}
