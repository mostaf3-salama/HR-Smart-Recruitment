using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Dtos.Jobs
{
    public class JobResponseDto
    {
        public int Id { get; set; }
        public int Hrid { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string RequiredSkills { get; set; } = string.Empty;
        public int ExperienceRequired { get; set; } 

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
