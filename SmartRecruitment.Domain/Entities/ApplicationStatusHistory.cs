using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartRecruitment.Domain.Entities;

[Table("ApplicationStatusHistory")]
public partial class ApplicationStatusHistory
{
    public int Id { get; set; }

    public int ApplicationId { get; set; }

    public string Status { get; set; } = null!;

    public DateTime ChangedAt { get; set; }

    public string ChangedBy { get; set; } = null!;

    public string? Note { get; set; }

    public virtual Application Application { get; set; } = null!;
}
