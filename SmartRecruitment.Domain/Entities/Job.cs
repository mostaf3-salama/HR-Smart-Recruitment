using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartRecruitment.Domain.Entities;
[Table("Jobs")]
public partial class Job
{
    public int Id { get; set; }

    public int Hrid { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string RequiredSkills { get; set; } = null!;

    public int ExperienceRequired { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Application> Applications { get; set; } = new List<Application>();

    public virtual Hr Hr { get; set; } = null!;
}
