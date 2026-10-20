using FluentValidation;
using SmartRecruitment.Application.Dtos.Candidate;

namespace SmartRecruitment.Application.Validation;

public class UpsertCandidateProfileValidator : AbstractValidator<UpsertCandidateProfileDto>
{
    public UpsertCandidateProfileValidator()
    {
        RuleFor(x => x.Age)
            .InclusiveBetween((byte)18, (byte)80)
            .WithMessage("Age must be between 18 and 80.");

        RuleFor(x => x.Cgpa)
            .InclusiveBetween(0.0, 4.0)
            .WithMessage("CGPA must be between 0.0 and 4.0.");

        RuleFor(x => x.EducationLevel)
            .NotEmpty().WithMessage("Education level is required.");

        RuleFor(x => x.UniversityTier)
            .NotEmpty().WithMessage("University tier is required.");

        RuleFor(x => x.CompanyType)
            .NotEmpty().WithMessage("Company type is required.");

        RuleFor(x => x.Skills)
            .MaximumLength(1000).WithMessage("Skills must not exceed 1000 characters.");

        RuleFor(x => x.Bio)
            .MaximumLength(2000).WithMessage("Bio must not exceed 2000 characters.");
    }
}
