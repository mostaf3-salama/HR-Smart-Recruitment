using SmartRecruitment.Application.Common.Results;
using SmartRecruitment.Application.Dtos.Candidate;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Interfaces;

public interface IJobRecommendationService
{
    /// <summary>Regenerates the AI recommendations for a candidate (called after CV upload).</summary>
    Task<ResultData> RefreshRecommendationsAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>Jobs recommended for this candidate with score + AI reason (read from the cache).</summary>
    Task<ResultData<IEnumerable<RecommendedJobDto>>> GetRecommendedJobsAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>Structured CV summary extracted by the AI (skills, experience, bio) if available.</summary>
    Task<ResultData<CvAnalysisDto>> GetCvAnalysisAsync(int userId, CancellationToken cancellationToken = default);
}
