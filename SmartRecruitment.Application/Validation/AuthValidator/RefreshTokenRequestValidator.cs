using FluentValidation;
using SmartRecruitment.Application.Dtos.Auth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Validation.AuthValidator
{
    public class RefreshTokenRequestValidator:AbstractValidator<RefreshTokenRequest>
    {
        public RefreshTokenRequestValidator()
        {
          
            RuleFor(x => x.RefreshToken)
                .NotEmpty()
                .WithMessage("Refresh token is required.");
        }
    }
}
