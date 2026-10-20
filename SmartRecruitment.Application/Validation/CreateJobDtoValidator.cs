using FluentValidation;
using SmartRecruitment.Application.Dtos.Jobs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Validation
{
    public class CreateJobDtoValidator : AbstractValidator<CreateJobDto>
    {
        public CreateJobDtoValidator()
        {
            RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Job title is required.")
            .MaximumLength(150).WithMessage("Job title must not exceed 150 characters.");

   

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Job description is required.");

            RuleFor(x => x.RequiredSkills)
                .NotEmpty().WithMessage("Required skills are required.");

        }
    }
}
