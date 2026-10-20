using System;
using System.Collections.Generic;

namespace SmartRecruitment.Application.Dtos.Hr;

/// <summary>Payload of GET /api/hr/dashboard (Feature 4).</summary>
public class DashboardStatsDto
{
    public int ActiveJobs { get; set; }
    public int TotalApplicants { get; set; }
    public int ShortlistedCount { get; set; }
    public int UpcomingInterviewsCount { get; set; }
    public int AcceptedCount { get; set; }
    public int RejectedCount { get; set; }
    public List<UpcomingInterviewDto> UpcomingInterviews { get; set; } = new();
    public List<ApplicantsByStatusDto> ApplicantsByStatus { get; set; } = new();
}

public class UpcomingInterviewDto
{
    public int Id { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string? Location { get; set; }
}

public class ApplicantsByStatusDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}
