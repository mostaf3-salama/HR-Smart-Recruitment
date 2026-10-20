using SmartRecruitment.Application.Common.Results;
using SmartRecruitment.Application.Dtos.Hr;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Interfaces;

public interface IApplicantService
{
    Task<ResultData<IEnumerable<ApplicantListItemDto>>> GetApplicantsByJobAsync(int jobId, string? search, string? status, CancellationToken cancellationToken = default);
    Task<ResultData<ApplicantDetailsDto>> GetApplicationDetailsAsync(int applicationId, CancellationToken cancellationToken = default);
    Task<ResultData<ApplicantDetailsDto>> UpdateApplicationStatusAsync(int applicationId, UpdateApplicationStatusDto dto, string changedBy, CancellationToken cancellationToken = default);
    Task<CvDownloadDto?> GetApplicationCvAsync(int applicationId, CancellationToken cancellationToken = default);
    Task<ResultData<IEnumerable<ShortlistedCandidateDto>>> GetShortlistedCandidatesAsync(CancellationToken cancellationToken = default);
}
