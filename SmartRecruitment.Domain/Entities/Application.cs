using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartRecruitment.Domain.Entities;
[Table("Applications")]
public partial class Application
{
    public int Id { get; set; }

    public int CandidateId { get; set; }

    public int JobId { get; set; }

    public DateTime AppliedAt { get; set; }

    public string Status { get; set; } = null!;

    public decimal? MatchScore { get; set; }

    /// <summary>Human-readable feedback produced by the ML model (Feature 4).</summary>
    public string? MlFeedback { get; set; }

    public virtual Candidate Candidate { get; set; } = null!;

    public virtual Job Job { get; set; } = null!;

    public virtual ICollection<ApplicationStatusHistory> StatusHistory { get; set; } = new List<ApplicationStatusHistory>();

    public virtual ICollection<Interview> Interviews { get; set; } = new List<Interview>();
}
