using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartRecruitment.Domain.Entities;

/// <summary>
/// Cached AI recommendation: how well one candidate matches one job
/// (score 0-100 plus the reason written by the LLM).
/// Rows are regenerated when the candidate uploads a new CV.
/// </summary>
[Table("JobRecommendations")]
public class JobRecommendation
{
    public int Id { get; set; }

    public int CandidateId { get; set; }

    public int JobId { get; set; }

    /// <summary>Match score 0-100 (higher = better fit).</summary>
    public int Score { get; set; }

    /// <summary>One short sentence explaining the score (written by the AI).</summary>
    public string Reason { get; set; } = null!;

    public DateTime GeneratedAt { get; set; }

    public virtual Candidate Candidate { get; set; } = null!;

    public virtual Job Job { get; set; } = null!;
}
