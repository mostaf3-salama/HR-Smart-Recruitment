using System;

namespace SmartRecruitment.Application.Dtos.Hr;

/// <summary>Interview object of GET /api/hr/interviews (Feature 4).</summary>
public class InterviewDto
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public int JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string? Location { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Result { get; set; }
    public string? Notes { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>Body of POST /api/hr/interviews. Type: HR | Technical | Final.</summary>
public class ScheduleInterviewDto
{
    public int ApplicationId { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public string? Location { get; set; }
}

/// <summary>Body of PATCH /api/hr/interviews/{id}/result. Result: Passed | Failed | Rescheduled.</summary>
public class RecordInterviewResultDto
{
    public string Result { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
