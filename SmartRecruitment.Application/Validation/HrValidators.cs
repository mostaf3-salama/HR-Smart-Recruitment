using FluentValidation;
using SmartRecruitment.Application.Dtos.Hr;
using SmartRecruitment.Domain.Hr;
using System;
using System.Linq;

namespace SmartRecruitment.Application.Validation;

public class UpdateApplicationStatusDtoValidator : AbstractValidator<UpdateApplicationStatusDto>
{
    private static readonly string[] AllowedActions =
    {
        HrWorkflow.ApplicationActions.Shortlist,
        HrWorkflow.ApplicationActions.Reject,
        HrWorkflow.ApplicationActions.Accept
    };

    public UpdateApplicationStatusDtoValidator()
    {
        RuleFor(x => x.Action)
            .NotEmpty().WithMessage("Action is required.")
            .Must(a => AllowedActions.Contains(a.Trim().ToLower()))
            .WithMessage("Invalid action. Allowed: shortlist, reject, accept.");

        RuleFor(x => x.Note)
            .MaximumLength(300).WithMessage("Note must not exceed 300 characters.");
    }
}

public class ScheduleInterviewDtoValidator : AbstractValidator<ScheduleInterviewDto>
{
    private static readonly string[] AllowedTypes =
    {
        HrWorkflow.InterviewTypes.Hr,
        HrWorkflow.InterviewTypes.Technical,
        HrWorkflow.InterviewTypes.Final
    };

    public ScheduleInterviewDtoValidator()
    {
        RuleFor(x => x.ApplicationId)
            .GreaterThan(0).WithMessage("Application ID must be a positive integer.");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Interview type is required.")
            .Must(t => AllowedTypes.Contains(t.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage("Invalid interview type. Allowed: HR, Technical, Final.");

        RuleFor(x => x.ScheduledAt)
            .GreaterThan(DateTime.UtcNow).WithMessage("The interview must be scheduled in the future.");

        RuleFor(x => x.Location)
            .MaximumLength(200).WithMessage("Location must not exceed 200 characters.");
    }
}

public class RecordInterviewResultDtoValidator : AbstractValidator<RecordInterviewResultDto>
{
    private static readonly string[] AllowedResults =
    {
        HrWorkflow.InterviewResults.Passed,
        HrWorkflow.InterviewResults.Failed,
        HrWorkflow.InterviewResults.Rescheduled
    };

    public RecordInterviewResultDtoValidator()
    {
        RuleFor(x => x.Result)
            .NotEmpty().WithMessage("Result is required.")
            .Must(r => AllowedResults.Contains(r.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage("Invalid result. Allowed: Passed, Failed, Rescheduled.");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Notes must not exceed 500 characters.");
    }
}
