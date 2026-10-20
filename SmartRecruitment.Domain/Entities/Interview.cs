using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartRecruitment.Domain.Entities;

[Table("Interviews")]
public partial class Interview
{
    public int Id { get; set; }

    public int ApplicationId { get; set; }

    public string Type { get; set; } = null!;

    public DateTime ScheduledAt { get; set; }

    public string? Location { get; set; }

    public string Status { get; set; } = null!;

    public string? Result { get; set; }

    public string? Notes { get; set; }

    public string? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Application Application { get; set; } = null!;
}
