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
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Services;

public class ApplicantService : IApplicantService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<UpdateApplicationStatusDto> _statusValidator;

    public ApplicantService(IUnitOfWork unitOfWork, IValidator<UpdateApplicationStatusDto> statusValidator)
    {
        _unitOfWork = unitOfWork;
        _statusValidator = statusValidator;
    }

    public async Task<ResultData<IEnumerable<ApplicantListItemDto>>> GetApplicantsByJobAsync(
        int jobId, string? search, string? status, CancellationToken cancellationToken = default)
    {
        if (jobId <= 0)
            return ResultData<IEnumerable<ApplicantListItemDto>>.Failure("Invalid job ID.");

        var job = await _unitOfWork.Repository<Job>().GetByIdAsync(jobId, cancellationToken);
        if (job == null)
            return ResultData<IEnumerable<ApplicantListItemDto>>.Failure($"Job with ID '{jobId}' was not found.");

        var applications = await _unitOfWork.Repository<HrApplication>()
            .FindAsync(a => a.JobId == jobId, cancellationToken);

        var normalizedStatus = (status ?? "all").Trim();
        var normalizedSearch = (search ?? string.Empty).Trim().ToLower();

        var items = new List<ApplicantListItemDto>();
        foreach (var application in applications)
        {
            if (!normalizedStatus.Equals("all", StringComparison.OrdinalIgnoreCase) &&
                !application.Status.Equals(normalizedStatus, StringComparison.OrdinalIgnoreCase))
                continue;

            var candidate = await _unitOfWork.Repository<Candidate>()
                .GetByIdAsync(application.CandidateId, cancellationToken);
            if (candidate == null)
                continue;

            var dto = await ToListItemAsync(application, job, candidate, cancellationToken);

            if (!string.IsNullOrEmpty(normalizedSearch) &&
                !dto.CandidateName.ToLower().Contains(normalizedSearch) &&
                !dto.Skills.Any(s => s.ToLower().Contains(normalizedSearch)))
                continue;

            items.Add(dto);
        }

        var ordered = items
            .OrderByDescending(i => i.MatchScore ?? -1)
            .ToList();

        return ResultData<IEnumerable<ApplicantListItemDto>>.Success(ordered);
    }

    public async Task<ResultData<ApplicantDetailsDto>> GetApplicationDetailsAsync(
        int applicationId, CancellationToken cancellationToken = default)
    {
        var loaded = await LoadApplicationAsync(applicationId, cancellationToken);
        if (loaded == null)
            return ResultData<ApplicantDetailsDto>.Failure($"Application with ID '{applicationId}' was not found.");

        return ResultData<ApplicantDetailsDto>.Success(loaded);
    }

    public async Task<ResultData<ApplicantDetailsDto>> UpdateApplicationStatusAsync(
        int applicationId, UpdateApplicationStatusDto dto, string changedBy, CancellationToken cancellationToken = default)
    {
        if (applicationId <= 0)
            return ResultData<ApplicantDetailsDto>.Failure("Invalid application ID.");

        var validationResult = await _statusValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
            return ResultData<ApplicantDetailsDto>.Failure(validationResult.Errors.Select(e => e.ErrorMessage));

        var application = await _unitOfWork.Repository<HrApplication>().GetByIdAsync(applicationId, cancellationToken);
        if (application == null)
            return ResultData<ApplicantDetailsDto>.Failure($"Application with ID '{applicationId}' was not found.");

        var action = dto.Action.Trim().ToLower();
        var nextStatus = action switch
        {
            HrWorkflow.ApplicationActions.Shortlist => HrWorkflow.ApplicationStatuses.Shortlisted,
            HrWorkflow.ApplicationActions.Accept => HrWorkflow.ApplicationStatuses.Accepted,
            HrWorkflow.ApplicationActions.Reject => HrWorkflow.ApplicationStatuses.Rejected,
            _ => null
        };

        if (nextStatus == null)
            return ResultData<ApplicantDetailsDto>.Failure("Invalid action. Allowed: shortlist, reject, accept.");

        if (!IsTransitionAllowed(application.Status, nextStatus))
            return ResultData<ApplicantDetailsDto>.Failure(
                $"Cannot move application from '{application.Status}' to '{nextStatus}'.");

        application.Status = nextStatus;
        _unitOfWork.Repository<HrApplication>().Update(application);

        await _unitOfWork.Repository<ApplicationStatusHistory>().AddAsync(new ApplicationStatusHistory
        {
            ApplicationId = application.Id,
            Status = nextStatus,
            ChangedAt = DateTime.UtcNow,
            ChangedBy = string.IsNullOrWhiteSpace(changedBy) ? "HR" : changedBy,
            Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note!.Trim()
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var details = await LoadApplicationAsync(applicationId, cancellationToken);
        return ResultData<ApplicantDetailsDto>.Success(details!);
    }

    public async Task<CvDownloadDto?> GetApplicationCvAsync(
        int applicationId, CancellationToken cancellationToken = default)
    {
        var application = await _unitOfWork.Repository<HrApplication>()
            .GetByIdAsync(applicationId, cancellationToken);
        if (application == null)
            return null;

        var candidate = await _unitOfWork.Repository<Candidate>()
            .GetByIdAsync(application.CandidateId, cancellationToken);
        if (candidate == null || string.IsNullOrWhiteSpace(candidate.CvFilePath) || !File.Exists(candidate.CvFilePath))
            return null;

        var bytes = await File.ReadAllBytesAsync(candidate.CvFilePath!, cancellationToken);
        return new CvDownloadDto
        {
            Data = bytes,
            ContentType = string.IsNullOrWhiteSpace(candidate.CvContentType)
                ? "application/pdf"
                : candidate.CvContentType!,
            FileName = string.IsNullOrWhiteSpace(candidate.CvFileName)
                ? "candidate-cv.pdf"
                : candidate.CvFileName!
        };
    }

    public async Task<ResultData<IEnumerable<ShortlistedCandidateDto>>> GetShortlistedCandidatesAsync(
        CancellationToken cancellationToken = default)
    {
        var applications = await _unitOfWork.Repository<HrApplication>()
            .FindAsync(a => a.Status == HrWorkflow.ApplicationStatuses.Shortlisted, cancellationToken);

        var items = new List<ShortlistedCandidateDto>();
        foreach (var application in applications)
        {
            var profile = await LoadProfileAsync(application.CandidateId, cancellationToken);
            var job = await _unitOfWork.Repository<Job>().GetByIdAsync(application.JobId, cancellationToken);
            if (profile == null || job == null)
                continue;

            items.Add(new ShortlistedCandidateDto
            {
                ApplicationId = application.Id,
                CandidateName = profile.DisplayName,
                JobTitle = job.Title
            });
        }

        return ResultData<IEnumerable<ShortlistedCandidateDto>>.Success(items);
    }

    // ---------- Mapping helpers ----------

    private async Task<ApplicantDetailsDto?> LoadApplicationAsync(int applicationId, CancellationToken cancellationToken)
    {
        var application = await _unitOfWork.Repository<HrApplication>().GetByIdAsync(applicationId, cancellationToken);
        if (application == null)
            return null;

        var candidate = await _unitOfWork.Repository<Candidate>()
            .GetByIdAsync(application.CandidateId, cancellationToken);
        var job = await _unitOfWork.Repository<Job>().GetByIdAsync(application.JobId, cancellationToken);
        if (candidate == null || job == null)
            return null;

        var profile = await LoadProfileAsync(candidate.CandidateId, cancellationToken);
        var displayName = profile?.DisplayName ?? DisplayName(candidate);
        var email = profile?.Email ?? candidate.Email ?? string.Empty;

        var history = (await _unitOfWork.Repository<ApplicationStatusHistory>()
                .FindAsync(h => h.ApplicationId == application.Id, cancellationToken))
            .OrderBy(h => h.ChangedAt)
            .Select(h => new StatusHistoryItemDto
            {
                Status = h.Status,
                ChangedAt = h.ChangedAt,
                ChangedBy = h.ChangedBy,
                Note = h.Note
            })
            .ToList();

        if (history.Count == 0)
        {
            history.Add(new StatusHistoryItemDto
            {
                Status = HrWorkflow.ApplicationStatuses.Submitted,
                ChangedAt = application.AppliedAt,
                ChangedBy = "System"
            });
        }

        var scheduledInterview = (await _unitOfWork.Repository<Interview>()
                .FindAsync(i => i.ApplicationId == application.Id &&
                                i.Status == HrWorkflow.InterviewStatuses.Scheduled, cancellationToken))
            .OrderBy(i => i.ScheduledAt)
            .FirstOrDefault();

        var candidateSkills = SplitSkills(candidate.Skills);
        var requiredSkills = SplitSkills(job.RequiredSkills);
        var requiredSet = new HashSet<string>(requiredSkills, StringComparer.OrdinalIgnoreCase);
        var hasCv = !string.IsNullOrWhiteSpace(candidate.CvFilePath) && File.Exists(candidate.CvFilePath);

        var dto = await ToListItemAsync(application, job, candidate, cancellationToken);
        return new ApplicantDetailsDto
        {
            ApplicationId = dto.ApplicationId,
            JobId = dto.JobId,
            JobTitle = dto.JobTitle,
            CandidateId = dto.CandidateId,
            CandidateName = dto.CandidateName,
            Email = dto.Email,
            Phone = dto.Phone,
            AppliedAt = dto.AppliedAt,
            Status = dto.Status,
            MatchScore = dto.MatchScore,
            Skills = dto.Skills,
            YearsOfExperience = dto.YearsOfExperience,
            EducationLevel = dto.EducationLevel,
            HasCv = dto.HasCv,
            Summary = string.IsNullOrWhiteSpace(candidate.Bio) ? null : candidate.Bio,
            MatchedSkills = candidateSkills.Where(s => requiredSet.Contains(s)).ToList(),
            MissingSkills = requiredSkills.Where(s => !candidateSkills.Contains(s, StringComparer.OrdinalIgnoreCase)).ToList(),
            MlFeedback = string.IsNullOrWhiteSpace(application.MlFeedback) ? null : application.MlFeedback,
            Cv = !hasCv ? null : new CvFileDto
            {
                FileName = candidate.CvFileName ?? "candidate-cv.pdf",
                ContentType = candidate.CvContentType ?? "application/pdf",
                SizeBytes = candidate.CvSizeBytes ?? new FileInfo(candidate.CvFilePath!).Length,
                Url = null
            },
            StatusHistory = history,
            Interview = scheduledInterview == null ? null : new ApplicantInterviewInfoDto
            {
                Id = scheduledInterview.Id,
                ScheduledAt = scheduledInterview.ScheduledAt,
                Type = scheduledInterview.Type,
                Status = scheduledInterview.Status
            }
        };
    }

    private async Task<ApplicantListItemDto> ToListItemAsync(
        HrApplication application, Job job, Candidate candidate, CancellationToken cancellationToken)
    {
        var profile = await LoadProfileAsync(candidate.CandidateId, cancellationToken);
        var displayName = profile?.DisplayName
            ?? (string.IsNullOrWhiteSpace(candidate.FullName) ? $"Candidate #{candidate.CandidateId}" : candidate.FullName!);
        var email = profile?.Email ?? candidate.Email ?? string.Empty;
        var hasCv = !string.IsNullOrWhiteSpace(candidate.CvFilePath) && File.Exists(candidate.CvFilePath);

        return new ApplicantListItemDto
        {
            ApplicationId = application.Id,
            JobId = job.Id,
            JobTitle = job.Title,
            CandidateId = candidate.CandidateId,
            CandidateName = displayName,
            Email = email,
            Phone = string.IsNullOrWhiteSpace(candidate.Phone) ? null : candidate.Phone,
            AppliedAt = application.AppliedAt,
            Status = application.Status,
            MatchScore = application.MatchScore,
            Skills = SplitSkills(candidate.Skills),
            YearsOfExperience = (int)Math.Floor(candidate.ExperienceYears),
            EducationLevel = candidate.EducationLevel,
            HasCv = hasCv
        };
    }

    private static string DisplayName(Candidate candidate)
        => string.IsNullOrWhiteSpace(candidate.FullName)
            ? $"Candidate #{candidate.CandidateId}"
            : candidate.FullName!;

    /// <summary>Human identity lives on the linked User; Candidate columns are fallback.</summary>
    private async Task<CandidateProfileRef?> LoadProfileAsync(int candidateId, CancellationToken cancellationToken)
    {
        var link = await _unitOfWork.Repository<CandidateUserLink>()
            .FirstOrDefaultAsync(l => l.CandidateId == candidateId, cancellationToken);
        if (link == null)
            return null;

        var user = await _unitOfWork.Repository<User>().GetByIdAsync(link.UserId, cancellationToken);
        if (user == null)
            return null;

        return new CandidateProfileRef
        {
            DisplayName = string.IsNullOrWhiteSpace(user.Name) ? $"Candidate #{candidateId}" : user.Name,
            Email = user.Email ?? string.Empty
        };
    }

    private sealed class CandidateProfileRef
    {
        public string DisplayName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    private static bool IsTransitionAllowed(string current, string next)
    {
        if (current == HrWorkflow.ApplicationStatuses.Accepted ||
            current == HrWorkflow.ApplicationStatuses.Rejected)
            return false;

        if (next == HrWorkflow.ApplicationStatuses.Shortlisted)
            return current == HrWorkflow.ApplicationStatuses.Submitted;

        if (next == HrWorkflow.ApplicationStatuses.Accepted)
            return current == HrWorkflow.ApplicationStatuses.Shortlisted ||
                   current == HrWorkflow.ApplicationStatuses.Interview;

        return true; // Reject is allowed from any non-final status.
    }

    private static List<string> SplitSkills(string? csv)
    {
        if (string.IsNullOrWhiteSpace(csv))
            return new List<string>();

        return csv.Split(new[] { ',', ';', '|' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(s => s.Trim())
            .Where(s => s.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
