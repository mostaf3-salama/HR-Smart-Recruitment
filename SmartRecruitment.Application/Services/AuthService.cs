using FluentValidation;
using Microsoft.AspNetCore.Identity;
using SmartRecruitment.Application.Common.Results;
using SmartRecruitment.Application.Contract;
using SmartRecruitment.Application.Dtos.Auth;
using SmartRecruitment.Domain.Entities;
using SmartRecruitment.Domain.Entities.Auth;
using SmartRecruitment.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly PasswordHasher<User> _passwordHasher;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtService _jwtService;
        private readonly IValidator<RegisterRequestDto> _registerValidator;
        private readonly IValidator<LoginRequest> _loginValidator;
        private readonly IValidator<RefreshTokenRequest> _refreshTokenValidator;
        private readonly IValidator<ResetPasswordRequest> _resetPasswordValidator;
        private readonly IEmailService _emailService;
        private readonly IValidator<CreateHrByAdmin> _createHrByAdminValidator;
        private readonly IValidator<CreateAdminRequestDto> _createAdminValidator;

        public AuthService(
            IUnitOfWork unitOfWork,
            IJwtService jwtService,
            IValidator<RegisterRequestDto> registerValidator,
            IValidator<LoginRequest> loginValidator,
            IValidator<RefreshTokenRequest> refreshTokenValidator,
            IValidator<ResetPasswordRequest> resetPasswordValidator,
            IEmailService emailService,
            IValidator<CreateHrByAdmin> createHrByAdminValidator,
            IValidator<CreateAdminRequestDto> createAdminValidator  
            )
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _registerValidator = registerValidator;
            _loginValidator = loginValidator;
            _refreshTokenValidator = refreshTokenValidator;
            _resetPasswordValidator = resetPasswordValidator;
            _emailService = emailService;
            _createHrByAdminValidator = createHrByAdminValidator;
       _createAdminValidator = createAdminValidator;
            _passwordHasher = new PasswordHasher<User>();
        }

        public async Task<ResultData<LoginResponse>> RegisterAsync(RegisterRequestDto registerRequestDto)
        {
            var validationResult = await _registerValidator.ValidateAsync(registerRequestDto);
            if (!validationResult.IsValid)
            {
                return ResultData<LoginResponse>.Failure(validationResult.Errors.Select(e => e.ErrorMessage));
            }

            var existingUser = await _unitOfWork.Repository<User>().FirstOrDefaultAsync(u => u.Email == registerRequestDto.Email);
            if (existingUser != null)
            {
                return ResultData<LoginResponse>.Failure("Email already exists.");
            }

            var user = new User
            {
                Name = registerRequestDto.Name,
                Email = registerRequestDto.Email,
                Role = "Candidate",
                CreatedAt = DateTime.UtcNow,
                RefreshTokens = new List<RefreshToken>()
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, registerRequestDto.Password);

            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshTokens.Add(new RefreshToken
            {
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            });

            await _unitOfWork.Repository<User>().AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            var response = new LoginResponse
            {
                UserId = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };

            return ResultData<LoginResponse>.Success(response);
        }

        public async Task<ResultData<LoginResponse>> LoginAsync(LoginRequest loginRequest)
        {
            var validationResult = await _loginValidator.ValidateAsync(loginRequest);
            if (!validationResult.IsValid)
            {
                return ResultData<LoginResponse>.Failure(validationResult.Errors.Select(e => e.ErrorMessage));
            }

            var user = await _unitOfWork.Repository<User>().FirstOrDefaultAsync(u => u.Email == loginRequest.Email);
            if (user == null)
            {
                return ResultData<LoginResponse>.Failure("Invalid email or password.");
            }

            var passwordResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                loginRequest.Password);

            if (passwordResult == PasswordVerificationResult.Failed)
            {
                return ResultData<LoginResponse>.Failure("Invalid email or password.");
            }

            var accessToken = _jwtService.GenerateAccessToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();

            if (user.RefreshTokens == null)
            {
                user.RefreshTokens = new List<RefreshToken>();
            }

            user.RefreshTokens.Add(new RefreshToken
            {
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            });

            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            var response = new LoginResponse
            {
                UserId = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                AccessToken = accessToken,
                RefreshToken = refreshToken
            };

            return ResultData<LoginResponse>.Success(response);
        }

        public async Task<ResultData<LoginResponse>> RefreshTokenAsync(RefreshTokenRequest refreshTokenRequest)
        {
            var validationResult = await _refreshTokenValidator.ValidateAsync(refreshTokenRequest);
            if (!validationResult.IsValid)
            {
                return ResultData<LoginResponse>.Failure(validationResult.Errors.Select(e => e.ErrorMessage));
            }

            var user = await _unitOfWork.Repository<User>().FirstOrDefaultAsync(u =>
                u.RefreshTokens.Any(t => t.Token == refreshTokenRequest.RefreshToken));

            if (user == null)
            {
                return ResultData<LoginResponse>.Failure("Invalid refresh token.");
            }

            var existingRefreshToken = user.RefreshTokens.FirstOrDefault(t => t.Token == refreshTokenRequest.RefreshToken);

            if (existingRefreshToken == null || existingRefreshToken.ExpiresAt <= DateTime.UtcNow)
            {
                return ResultData<LoginResponse>.Failure("Expired or invalid refresh token.");
            }

            var newAccessToken = _jwtService.GenerateAccessToken(user);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshTokens.Remove(existingRefreshToken);
            user.RefreshTokens.Add(new RefreshToken
            {
                Token = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            });

            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            var response = new LoginResponse
            {
                UserId = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            };

            return ResultData<LoginResponse>.Success(response);
        }

        public async Task<ResultData> ForgotPasswordAsync(ForgotPasswordRequest forgotPasswordRequest)
        {
            var email = forgotPasswordRequest.Email.Trim().ToLower();
            var user = await _unitOfWork.Repository<User>().FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                return ResultData.Success();
            }

            var resetToken = Guid.NewGuid().ToString();

            if (user.PasswordResetTokens == null)
            {
                user.PasswordResetTokens = new List<PasswordResetToken>();
            }

            user.PasswordResetTokens.Add(new PasswordResetToken
            {
                Token = resetToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                CreatedAt = DateTime.UtcNow
            });

            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            var emailBody = $@"
            <div style='font-family: Arial, sans-serif; padding: 20px;'>
                <h2>Reset Your Password</h2>
                <p>Your password reset token is:</p>
                <h3 style='color: #007bff;'>{resetToken}</h3>
                <p>Use this token along with your email in Swagger / Postman at the <b>/api/Auth/resetPassword</b> endpoint.</p>
            </div>";

            _ = Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendEmailAsync(user.Email, "Reset Password Request", emailBody);
                }
                catch (Exception)
                {
                    // Logging
                }
            });

            return ResultData.Success();
        }

        public async Task<ResultData> ResetPasswordAsync(ResetPasswordRequest request)
        {
            var validationResult = await _resetPasswordValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return ResultData.Failure(validationResult.Errors.Select(e => e.ErrorMessage));
            }

            var email = request.Email.Trim().ToLower();
            var inputToken = request.Token.Trim();

            var user = await _unitOfWork.Repository<User>().FirstOrDefaultAsync(
                u => u.Email == email && u.PasswordResetTokens.Any(t => t.Token == inputToken)
            );

            if (user == null)
            {
                return ResultData.Failure("Invalid email or reset token.");
            }

            var resetTokenEntity = user.PasswordResetTokens
                .FirstOrDefault(t => string.Equals(t.Token.Trim(), inputToken, StringComparison.Ordinal));

            if (resetTokenEntity == null || resetTokenEntity.ExpiresAt <= DateTime.UtcNow)
            {
                return ResultData.Failure("Token has expired or is invalid.");
            }
            user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
            user.PasswordResetTokens.Remove(resetTokenEntity);

            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            return ResultData.Success();
        }

        public async Task<ResultData> CreateHrByAdminAsync(CreateHrByAdmin createHrByAdmin)
        {
            // 1. Validation
            var validationResult = await _createHrByAdminValidator.ValidateAsync(createHrByAdmin);
            if (!validationResult.IsValid)
            {
                return ResultData.Failure(validationResult.Errors.Select(e => e.ErrorMessage));
            }

            var existingUser = await _unitOfWork.Repository<User>().FirstOrDefaultAsync(u => u.Email == createHrByAdmin.Email);
            if (existingUser != null)
            {
                return ResultData.Failure("Email already exists.");
            }

            // 3. Create User Instance
            var user = new User
            {
                Name = createHrByAdmin.Name,
                Email = createHrByAdmin.Email,
                Role = "HR",
                CreatedAt = DateTime.UtcNow,
                RefreshTokens = new List<RefreshToken>()
            };

            // 4. Hash & Assign Password (حل مشكلة الـ NULL)
            user.PasswordHash = _passwordHasher.HashPassword(user, createHrByAdmin.Password);
            // 5. Save to Database
            await _unitOfWork.Repository<User>().AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return ResultData.Success();
        }

        public async Task<ResultData> CreateAdminAsync(CreateAdminRequestDto createAdminRequestDto)
        {

            //validate
            var validationResult =await  _createAdminValidator.ValidateAsync(createAdminRequestDto);
            if (!validationResult.IsValid)
            {
                return ResultData.Failure(validationResult.Errors.Select(e => e.ErrorMessage));

            }
            var existingUser = await _unitOfWork.Repository<User>().FirstOrDefaultAsync(u => u.Email == createAdminRequestDto.Email)        ;
            if (existingUser != null)
            {
                return ResultData.Failure("Email already exists.");
            }
            var adminUser = new User
            {
                Name = createAdminRequestDto.Name,
                Email = createAdminRequestDto.Email,
                Role = "Admin",
                CreatedAt = DateTime.UtcNow,
                RefreshTokens = new List<RefreshToken>()
            };
            await _unitOfWork.Repository<User>().AddAsync(adminUser);
            await _unitOfWork.SaveChangesAsync();
            return ResultData.Success();
        }
    }

}