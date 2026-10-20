using FluentValidation;
using SmartRecruitment.Application.Common.Results;
using SmartRecruitment.Application.Dtos.Hr;
using SmartRecruitment.Application.Interfaces;
using SmartRecruitment.Domain.Entities;
using SmartRecruitment.Domain.Hr;
using SmartRecruitment.Domain.Interfaces;
using HrApplication = SmartRecruitment.Domain.Entities.Application;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Services;

public class InterviewService : IInterviewService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<ScheduleInterviewDto> _scheduleValidator;
    private readonly IValidator<RecordInterviewResultDto> _resultValidator;

    public InterviewService(
        IUnitOfWork unitOfWork,
        IValidator<ScheduleInterviewDto> scheduleValidator,
        IValidator<RecordInterviewResultDto> resultValidator)
    {
        _unitOfWork = unitOfWork;
        _scheduleValidator = scheduleValidator;
        _resultValidator = resultValidator;
    }

    public async Task<ResultData<IEnumerable<InterviewDto>>> GetInterviewsAsync(
        string tab, CancellationToken cancellationToken = default)
    {
        var normalizedTab = (tab ?? "upcoming").Trim().ToLower();
        if (normalizedTab != "upcoming" && normalizedTab != "past")
            return ResultData<IEnumerable<InterviewDto>>.Failure("Invalid tab. Allowed: upcoming, past.");

        var interviews = await _unitOfWork.Repository<Interview>().GetAllAsync(cancellationToken);

        var filtered = interviews
            .Where(i => normalizedTab == "upcoming"
                ? i.Status == HrWorkflow.InterviewStatuses.Scheduled
                : i.Status != HrWorkflow.InterviewStatuses.Scheduled)
            .OrderBy(i => i.ScheduledAt);

        var ordered = normalizedTab == "upcoming"
            ? filtered.OrderBy(i => i.ScheduledAt)
            : filtered.OrderByDescending(i => i.ScheduledAt);

        var items = new List<InterviewDto>();
        foreach (var interview in ordered)
        {
            var dto = await ToDtoAsync(interview, cancellationToken);
            if (dto != null)
                items.Add(dto);
        }

        return ResultData<IEnumerable<InterviewDto>>.Success(items);
    }

    public async Task<ResultData<InterviewDto>> GetInterviewByIdAsync(
        int id, CancellationToken cancellationToken = default)
    {
        if (id <= 0)
            return ResultData<InterviewDto>.Failure("Invalid interview ID.");

        var interview = await _unitOfWork.Repository<Interview>().GetByIdAsync(id, cancellationToken);
        if (interview == null)
            return ResultData<InterviewDto>.Failure($"Interview with ID '{id}' was not found.");

        var dto = await ToDtoAsync(interview, cancellationToken);
        if (dto == null)
            return ResultData<InterviewDto>.Failure($"Interview with ID '{id}' was not found.");

        return ResultData<InterviewDto>.Success(dto);
    }

    public async Task<ResultData<InterviewDto>> ScheduleInterviewAsync(
        ScheduleInterviewDto dto, string createdBy, CancellationToken cancellationToken = default)
    {
        var validationResult = await _scheduleValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
            return ResultData<InterviewDto>.Failure(validationResult.Errors.Select(e => e.ErrorMessage));

        var application = await _unitOfWork.Repository<HrApplication>()
            .GetByIdAsync(dto.ApplicationId, cancellationToken);
        if (application == null)
            return ResultData<InterviewDto>.Failure($"Application with ID '{dto.ApplicationId}' was not found.");

        if (application.Status != HrWorkflow.ApplicationStatuses.Shortlisted)
            return ResultData<InterviewDto>.Failure("Only Shortlisted applications can receive a new interview.");

        var interview = new Interview
        {
            ApplicationId = application.Id,
            Type = dto.Type.Trim(),
            ScheduledAt = dto.ScheduledAt,
            Location = string.IsNullOrWhiteSpace(dto.Location) ? null : dto.Location!.Trim(),
            Status = HrWorkflow.InterviewStatuses.Scheduled,
            CreatedBy = string.IsNullOrWhiteSpace(createdBy) ? "HR" : createdBy,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<Interview>().AddAsync(interview, cancellationToken);

        application.Status = HrWorkflow.ApplicationStatuses.Interview;
        _unitOfWork.Repository<HrApplication>().Update(application);

        await _unitOfWork.Repository<ApplicationStatusHistory>().AddAsync(new ApplicationStatusHistory
        {
            ApplicationId = application.Id,
            Status = HrWorkflow.ApplicationStatuses.Interview,
            ChangedAt = DateTime.UtcNow,
            ChangedBy = interview.CreatedBy,
            Note = $"Interview scheduled ({interview.Type})."
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = await ToDtoAsync(interview, cancellationToken);
        return ResultData<InterviewDto>.Success(result!);
    }

    public async Task<ResultData<InterviewDto>> RecordResultAsync(
        int id, RecordInterviewResultDto dto, CancellationToken cancellationToken = default)
    {
        if (id <= 0)
            return ResultData<InterviewDto>.Failure("Invalid interview ID.");

        var validationResult = await _resultValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
            return ResultData<InterviewDto>.Failure(validationResult.Errors.Select(e => e.ErrorMessage));

        var interview = await _unitOfWork.Repository<Interview>().GetByIdAsync(id, cancellationToken);
        if (interview == null)
            return ResultData<InterviewDto>.Failure($"Interview with ID '{id}' was not found.");

        if (interview.Status != HrWorkflow.InterviewStatuses.Scheduled)
            return ResultData<InterviewDto>.Failure("Only scheduled interviews can receive a result.");

        var result = dto.Result.Trim();
        var application = await _unitOfWork.Repository<HrApplication>()
            .GetByIdAsync(interview.ApplicationId, cancellationToken);

        if (result == HrWorkflow.InterviewResults.Rescheduled)
        {
            interview.Status = HrWorkflow.InterviewStatuses.Cancelled;
            interview.Result = HrWorkflow.InterviewResults.Rescheduled;
        }
        else
        {
            interview.Status = HrWorkflow.InterviewStatuses.Completed;
            interview.Result = result;

            if (application != null)
            {
                application.Status = result == HrWorkflow.InterviewResults.Passed
                    ? HrWorkflow.ApplicationStatuses.Accepted
                    : HrWorkflow.ApplicationStatuses.Rejected;
                _unitOfWork.Repository<HrApplication>().Update(application);

                await _unitOfWork.Repository<ApplicationStatusHistory>().AddAsync(new ApplicationStatusHistory
                {
                    ApplicationId = application.Id,
                    Status = application.Status,
                    ChangedAt = DateTime.UtcNow,
                    ChangedBy = "HR",
                    Note = $"Interview result: {result}."
                }, cancellationToken);
            }
        }

        interview.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes!.Trim();
        interview.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Repository<Interview>().Update(interview);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var response = await ToDtoAsync(interview, cancellationToken);
        return ResultData<InterviewDto>.Success(response!);
    }

    public async Task<ResultData<InterviewDto>> CancelInterviewAsync(
        int id, CancellationToken cancellationToken = default)
    {
        if (id <= 0)
            return ResultData<InterviewDto>.Failure("Invalid interview ID.");

        var interview = await _unitOfWork.Repository<Interview>().GetByIdAsync(id, cancellationToken);
        if (interview == null)
            return ResultData<InterviewDto>.Failure($"Interview with ID '{id}' was not found.");

        if (interview.Status != HrWorkflow.InterviewStatuses.Scheduled)
            return ResultData<InterviewDto>.Failure("Only scheduled interviews can be cancelled.");

        interview.Status = HrWorkflow.InterviewStatuses.Cancelled;
        interview.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Repository<Interview>().Update(interview);

        var application = await _unitOfWork.Repository<HrApplication>()
            .GetByIdAsync(interview.ApplicationId, cancellationToken);
        if (application != null && application.Status == HrWorkflow.ApplicationStatuses.Interview)
        {
            application.Status = HrWorkflow.ApplicationStatuses.Shortlisted;
            _unitOfWork.Repository<HrApplication>().Update(application);

            await _unitOfWork.Repository<ApplicationStatusHistory>().AddAsync(new ApplicationStatusHistory
            {
                ApplicationId = application.Id,
                Status = HrWorkflow.ApplicationStatuses.Shortlisted,
                ChangedAt = DateTime.UtcNow,
                ChangedBy = "HR",
                Note = "Interview cancelled — back to Shortlisted."
            }, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var response = await ToDtoAsync(interview, cancellationToken);
        return ResultData<InterviewDto>.Success(response!);
    }

    private async Task<InterviewDto?> ToDtoAsync(Interview interview, CancellationToken cancellationToken)
    {
        var application = await _unitOfWork.Repository<HrApplication>()
            .GetByIdAsync(interview.ApplicationId, cancellationToken);
        if (application == null)
            return null;

        var candidate = await _unitOfWork.Repository<Candidate>()
            .GetByIdAsync(application.CandidateId, cancellationToken);
        var job = await _unitOfWork.Repository<Job>().GetByIdAsync(application.JobId, cancellationToken);
        if (candidate == null || job == null)
            return null;

        var link = await _unitOfWork.Repository<CandidateUserLink>()
            .FirstOrDefaultAsync(l => l.CandidateId == candidate.CandidateId, cancellationToken);
        var linkedUser = link == null
            ? null
            : await _unitOfWork.Repository<User>().GetByIdAsync(link.UserId, cancellationToken);

        return new InterviewDto
        {
            Id = interview.Id,
            ApplicationId = application.Id,
            CandidateName = linkedUser != null && !string.IsNullOrWhiteSpace(linkedUser.Name)
                ? linkedUser.Name
                : (!string.IsNullOrWhiteSpace(candidate.FullName)
                    ? candidate.FullName!
                    : $"Candidate #{candidate.CandidateId}"),
            JobId = job.Id,
            JobTitle = job.Title,
            Type = interview.Type,
            ScheduledAt = interview.ScheduledAt,
            Location = interview.Location,
            Status = interview.Status,
            Result = interview.Result,
            Notes = interview.Notes,
            CreatedBy = interview.CreatedBy,
            UpdatedAt = interview.UpdatedAt
        };
    }
}
