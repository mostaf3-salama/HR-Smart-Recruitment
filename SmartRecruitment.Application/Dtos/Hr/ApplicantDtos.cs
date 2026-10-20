using System;
using System.Collections.Generic;

namespace SmartRecruitment.Application.Dtos.Hr;

/// <summary>Row of GET /api/hr/jobs/{jobId}/applicants (Feature 4).</summary>
public class ApplicantListItemDto
{
    public int ApplicationId { get; set; }
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public int CandidateId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime AppliedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? MatchScore { get; set; }
    public List<string> Skills { get; set; } = new();
    public int YearsOfExperience { get; set; }
    public string EducationLevel { get; set; } = string.Empty;
    public bool HasCv { get; set; }
}

public class StatusHistoryItemDto
{
    public string Status { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string ChangedBy { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class CvFileDto
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string? Url { get; set; }
}

/// <summary>CV bytes for GET /api/hr/applications/{id}/cv.</summary>
public class CvDownloadDto
{
    public byte[] Data { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = "application/pdf";
    public string FileName { get; set; } = "candidate-cv.pdf";
}

public class ApplicantInterviewInfoDto
{
    public int Id { get; set; }
    public DateTime ScheduledAt { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

/// <summary>Full file of GET /api/hr/applications/{id} (Feature 4).</summary>
public class ApplicantDetailsDto : ApplicantListItemDto
{
    public string? Summary { get; set; }
    public List<string> MatchedSkills { get; set; } = new();
    public List<string> MissingSkills { get; set; } = new();
    public string? MlFeedback { get; set; }
    public List<object> Education { get; set; } = new();
    public List<object> Experience { get; set; } = new();
    public List<object> Projects { get; set; } = new();
    public List<object> Certifications { get; set; } = new();
    public CvFileDto? Cv { get; set; }
    public List<StatusHistoryItemDto> StatusHistory { get; set; } = new();
    public ApplicantInterviewInfoDto? Interview { get; set; }
}

/// <summary>Body of PATCH /api/hr/applications/{id}/status. Action: shortlist | reject | accept.</summary>
public class UpdateApplicationStatusDto
{
    public string Action { get; set; } = string.Empty;
    public string? Note { get; set; }
}

/// <summary>Option of the schedule form: GET /api/hr/applications?status=Shortlisted.</summary>
public class ShortlistedCandidateDto
{
    public int ApplicationId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
}
