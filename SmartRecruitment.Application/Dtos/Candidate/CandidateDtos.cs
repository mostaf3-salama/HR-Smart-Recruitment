using System;

namespace SmartRecruitment.Application.Dtos.Candidate;

/// <summary>Candidate-side profile (Feature 3). Name/Email live on the User.</summary>
public class CandidateProfileDto
{
    public int CandidateId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public byte Age { get; set; }
    public string EducationLevel { get; set; } = string.Empty;
    public string UniversityTier { get; set; } = string.Empty;
    public double Cgpa { get; set; }
    public byte Internships { get; set; }
    public byte Projects { get; set; }
    public byte ProgrammingLanguages { get; set; }
    public byte Certifications { get; set; }
    public double ExperienceYears { get; set; }
    public byte Hackathons { get; set; }
    public byte ResearchPapers { get; set; }
    public double SkillsScore { get; set; }
    public double SoftSkillsScore { get; set; }
    public short ResumeLengthWords { get; set; }
    public string CompanyType { get; set; } = string.Empty;
    public string? Skills { get; set; }
    public string? Bio { get; set; }
    public bool HasCv { get; set; }
    public string? CvFileName { get; set; }
}

public class UpsertCandidateProfileDto
{
    public byte Age { get; set; }
    public string EducationLevel { get; set; } = string.Empty;
    public string UniversityTier { get; set; } = string.Empty;
    public double Cgpa { get; set; }
    public byte Internships { get; set; }
    public byte Projects { get; set; }
    public byte ProgrammingLanguages { get; set; }
    public byte Certifications { get; set; }
    public double ExperienceYears { get; set; }
    public byte Hackathons { get; set; }
    public byte ResearchPapers { get; set; }
    public double SkillsScore { get; set; }
    public double SoftSkillsScore { get; set; }
    public short ResumeLengthWords { get; set; }
    public string CompanyType { get; set; } = string.Empty;
    public string? Skills { get; set; }
    public string? Bio { get; set; }
}

public class ApplyJobDto
{
    public int JobId { get; set; }
}

public class CandidateApplicationDto
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public DateTime AppliedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? MatchScore { get; set; }
}
