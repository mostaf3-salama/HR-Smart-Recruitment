using System.ComponentModel.DataAnnotations.Schema;

namespace SmartRecruitment.Domain.Entities;

[Table("CandidateUserLinks")]
public class CandidateUserLink
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int CandidateId { get; set; }
    public Candidate Candidate { get; set; } = null!;
}
