using FluentValidation;
using SmartRecruitment.Application.Common.Results;
using SmartRecruitment.Application.Dtos.Candidate;
using SmartRecruitment.Application.Dtos.Hr;
using SmartRecruitment.Application.Interfaces;
using SmartRecruitment.Domain.Entities;
using SmartRecruitment.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using HrApplication = SmartRecruitment.Domain.Entities.Application;

namespace SmartRecruitment.Application.Services;

public class CandidateService : ICandidateService
{
    private const long MaxCvBytes = 5 * 1024 * 1024;

    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<UpsertCandidateProfileDto> _profileValidator;
    private readonly IApplicantService _applicants;
    private readonly IJobRecommendationService _recommendations;

    public CandidateService(
        IUnitOfWork unitOfWork,
        IValidator<UpsertCandidateProfileDto> profileValidator,
        IApplicantService applicants,
        IJobRecommendationService recommendations)
    {
        _unitOfWork = unitOfWork;
        _profileValidator = profileValidator;
        _applicants = applicants;
        _recommendations = recommendations;
    }

    public async Task<ResultData<CandidateProfileDto>> GetMyProfileAsync(int userId, CancellationToken cancellationToken = default)
    {
        var link = await _unitOfWork.Repository<CandidateUserLink>()
            .FirstOrDefaultAsync(l => l.UserId == userId, cancellationToken);
        if (link == null)
            return ResultData<CandidateProfileDto>.Failure("No profile linked to this user yet.");

        var candidate = await _unitOfWork.Repository<Candidate>()
            .GetByIdAsync(link.CandidateId, cancellationToken);
        var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken);
        if (candidate == null || user == null)
            return ResultData<CandidateProfileDto>.Failure("Candidate profile record missing.");

        return ResultData<CandidateProfileDto>.Success(new CandidateProfileDto
        {
            CandidateId = candidate.CandidateId,
            Name = user.Name,
            Email = user.Email,
            Age = candidate.Age,
            EducationLevel = candidate.EducationLevel,
            UniversityTier = candidate.UniversityTier,
            Cgpa = candidate.Cgpa,
            Internships = candidate.Internships,
            Projects = candidate.Projects,
            ProgrammingLanguages = candidate.ProgrammingLanguages,
            Certifications = candidate.Certifications,
            ExperienceYears = candidate.ExperienceYears,
            Hackathons = candidate.Hackathons,
            ResearchPapers = candidate.ResearchPapers,
            SkillsScore = candidate.SkillsScore,
            SoftSkillsScore = candidate.SoftSkillsScore,
            ResumeLengthWords = candidate.ResumeLengthWords,
            CompanyType = candidate.CompanyType,
            Skills = candidate.Skills,
            Bio = candidate.Bio,
            HasCv = !string.IsNullOrWhiteSpace(candidate.CvFilePath) && File.Exists(candidate.CvFilePath),
            CvFileName = candidate.CvFileName
        });
    }

    public async Task<ResultData> UpsertMyProfileAsync(int userId, UpsertCandidateProfileDto dto, CancellationToken cancellationToken = default)
    {
        var validationResult = await _profileValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
            return ResultData.Failure(validationResult.Errors.Select(e => e.ErrorMessage));

        
        var link = await _unitOfWork.Repository<CandidateUserLink>()
            .FirstOrDefaultAsync(l => l.UserId == userId, cancellationToken);

        if (link == null)
        {
            var candidate = new Candidate
            {
                Age = dto.Age,
                EducationLevel = dto.EducationLevel,
                UniversityTier = dto.UniversityTier,
                Cgpa = dto.Cgpa,
                Internships = dto.Internships,
                Projects = dto.Projects,
                ProgrammingLanguages = dto.ProgrammingLanguages,
                Certifications = dto.Certifications,
                ExperienceYears = dto.ExperienceYears,
                Hackathons = dto.Hackathons,
                ResearchPapers = dto.ResearchPapers,
                SkillsScore = dto.SkillsScore,
                SoftSkillsScore = dto.SoftSkillsScore,
                ResumeLengthWords = dto.ResumeLengthWords,
                CompanyType = dto.CompanyType,
                Skills = dto.Skills,
                Bio = dto.Bio
            };
            await _unitOfWork.Repository<Candidate>().AddAsync(candidate, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _unitOfWork.Repository<CandidateUserLink>().AddAsync(new CandidateUserLink
            {
                UserId = userId,
                CandidateId = candidate.CandidateId
            }, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        else
        {
            var candidate = await _unitOfWork.Repository<Candidate>()
                .GetByIdAsync(link.CandidateId, cancellationToken);
            if (candidate == null)
                return ResultData.Failure("Linked candidate record not found.");

            candidate.Age = dto.Age;
            candidate.EducationLevel = dto.EducationLevel;
            candidate.UniversityTier = dto.UniversityTier;
            candidate.Cgpa = dto.Cgpa;
            candidate.Internships = dto.Internships;
            candidate.Projects = dto.Projects;
            candidate.ProgrammingLanguages = dto.ProgrammingLanguages;
            candidate.Certifications = dto.Certifications;
            candidate.ExperienceYears = dto.ExperienceYears;
            candidate.Hackathons = dto.Hackathons;
            candidate.ResearchPapers = dto.ResearchPapers;
            candidate.SkillsScore = dto.SkillsScore;
            candidate.SoftSkillsScore = dto.SoftSkillsScore;
            candidate.ResumeLengthWords = dto.ResumeLengthWords;
            candidate.CompanyType = dto.CompanyType;
            candidate.Skills = dto.Skills;
            candidate.Bio = dto.Bio;

            _unitOfWork.Repository<Candidate>().Update(candidate);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return ResultData.Success();
    }

    public async Task<ResultData> UploadCvAsync(
        int userId, string fileName, string contentType, long length, Stream content, CancellationToken cancellationToken = default)
    {
        if (length <= 0)
            return ResultData.Failure("Invalid file.");
        if (length > MaxCvBytes)
            return ResultData.Failure("CV must not exceed 5 MB.");
        if (!string.Equals(contentType, "application/pdf", StringComparison.OrdinalIgnoreCase) &&
            !fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            return ResultData.Failure("Only PDF files are allowed.");

        var link = await _unitOfWork.Repository<CandidateUserLink>()
            .FirstOrDefaultAsync(l => l.UserId == userId, cancellationToken);
        if (link == null)
            return ResultData.Failure("Please create your candidate profile first.");

        var candidate = await _unitOfWork.Repository<Candidate>()
            .GetByIdAsync(link.CandidateId, cancellationToken);
        if (candidate == null)
            return ResultData.Failure("Candidate profile not found.");

        var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "cvs");
        if (!Directory.Exists(folderPath))
            Directory.CreateDirectory(folderPath);

        var storedName = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";
        var filePath = Path.Combine(folderPath, storedName);
        await using (var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await content.CopyToAsync(stream, cancellationToken);
        }

        // Remove the previous file so uploads don't pile up on disk.
        if (!string.IsNullOrWhiteSpace(candidate.CvFilePath))
        {
            try
            {
                if (File.Exists(candidate.CvFilePath))
                    File.Delete(candidate.CvFilePath);
            }
            catch
            {
                // A stale file must never fail the upload.
            }
        }

        candidate.CvFileName = fileName;
        candidate.CvContentType = "application/pdf";
        candidate.CvSizeBytes = length;
        candidate.CvFilePath = filePath;
        _unitOfWork.Repository<Candidate>().Update(candidate);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // AI job matching is best-effort: never fail the upload because of it.
        await RefreshRecommendationsBestEffortAsync(userId);

        return ResultData.Success();
    }

    private async Task RefreshRecommendationsBestEffortAsync(int userId)
    {
        try
        {
            await _recommendations.RefreshRecommendationsAsync(userId, CancellationToken.None);
        }
        catch (OperationCanceledException)
        {
            // Request disconnected during a long AI call — ignore.
        }
        catch
        {
            // AI/PDF/DB errors must never break the upload response.
        }
    }

    public async Task<ResultData> ApplyForJobAsync(int userId, ApplyJobDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.JobId <= 0)
            return ResultData.Failure("Invalid job ID.");

        var link = await _unitOfWork.Repository<CandidateUserLink>()
            .FirstOrDefaultAsync(l => l.UserId == userId, cancellationToken);
        if (link == null)
            return ResultData.Failure("Please complete your profile before applying.");

        var job = await _unitOfWork.Repository<Job>().GetByIdAsync(dto.JobId, cancellationToken);
        if (job == null)
            return ResultData.Failure("Job not found.");
        if (!job.IsActive)
            return ResultData.Failure("This job is no longer accepting applications.");

        var existing = await _unitOfWork.Repository<HrApplication>()
            .FirstOrDefaultAsync(a => a.JobId == dto.JobId && a.CandidateId == link.CandidateId, cancellationToken);
        if (existing != null)
            return ResultData.Failure("You have already applied for this job.");

        await _unitOfWork.Repository<HrApplication>().AddAsync(new HrApplication
        {
            CandidateId = link.CandidateId,
            JobId = dto.JobId,
            AppliedAt = DateTime.UtcNow,
            Status = "Submitted"
        }, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ResultData.Success();
    }

    public async Task<ResultData<IEnumerable<CandidateApplicationDto>>> GetMyApplicationsAsync(
        int userId, CancellationToken cancellationToken = default)
    {
        var link = await _unitOfWork.Repository<CandidateUserLink>()
            .FirstOrDefaultAsync(l => l.UserId == userId, cancellationToken);
        if (link == null)
            return ResultData<IEnumerable<CandidateApplicationDto>>.Success(Enumerable.Empty<CandidateApplicationDto>());

        var applications = await _unitOfWork.Repository<HrApplication>()
            .FindAsync(a => a.CandidateId == link.CandidateId, cancellationToken);

        var items = new List<CandidateApplicationDto>();
        foreach (var application in applications.OrderByDescending(a => a.AppliedAt))
        {
            var job = await _unitOfWork.Repository<Job>().GetByIdAsync(application.JobId, cancellationToken);
            items.Add(new CandidateApplicationDto
            {
                Id = application.Id,
                JobId = application.JobId,
                JobTitle = job?.Title ?? string.Empty,
                AppliedAt = application.AppliedAt,
                Status = application.Status,
                MatchScore = application.MatchScore
            });
        }

        return ResultData<IEnumerable<CandidateApplicationDto>>.Success(items);
    }

    public async Task<ResultData<ApplicantDetailsDto>> GetMyApplicationDetailsAsync(
        int userId, int applicationId, CancellationToken cancellationToken = default)
    {
        var link = await _unitOfWork.Repository<CandidateUserLink>()
            .FirstOrDefaultAsync(l => l.UserId == userId, cancellationToken);
        if (link == null)
            return ResultData<ApplicantDetailsDto>.Failure("No profile linked to this user yet.");

        var application = await _unitOfWork.Repository<HrApplication>()
            .GetByIdAsync(applicationId, cancellationToken);
        if (application == null || application.CandidateId != link.CandidateId)
            return ResultData<ApplicantDetailsDto>.Failure($"Application with ID '{applicationId}' was not found.");

        return await _applicants.GetApplicationDetailsAsync(applicationId, cancellationToken);
    }
}
