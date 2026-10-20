using System;
using System.Collections.Generic;

namespace SmartRecruitment.Application.Dtos.Candidate;

/// <summary>A job recommended for the current candidate, with its AI score and reason.</summary>
public class RecommendedJobDto
{
    public int JobId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Company { get; set; }
    public string RequiredSkills { get; set; } = string.Empty;
    public int ExperienceRequired { get; set; }
    public decimal Score { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
}

/// <summary>Structured data the AI extracted from the candidate's CV.</summary>
public class CvAnalysisDto
{
    public List<string> Skills { get; set; } = new();
    public double ExperienceYears { get; set; }
    public string Summary { get; set; } = string.Empty;
    public bool HasCvAnalysis { get; set; }
}
