using SmartRecruitment.Application.Common.Results;
using SmartRecruitment.Application.Dtos.Candidate;
using SmartRecruitment.Application.Dtos.Hr;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Interfaces;

public interface ICandidateService
{
    Task<ResultData<CandidateProfileDto>> GetMyProfileAsync(int userId, CancellationToken cancellationToken = default);
    Task<ResultData> UpsertMyProfileAsync(int userId, UpsertCandidateProfileDto dto, CancellationToken cancellationToken = default);
    Task<ResultData> UploadCvAsync(int userId, string fileName, string contentType, long length, Stream content, CancellationToken cancellationToken = default);
    Task<ResultData> ApplyForJobAsync(int userId, ApplyJobDto dto, CancellationToken cancellationToken = default);
    Task<ResultData<IEnumerable<CandidateApplicationDto>>> GetMyApplicationsAsync(int userId, CancellationToken cancellationToken = default);
    Task<ResultData<ApplicantDetailsDto>> GetMyApplicationDetailsAsync(int userId, int applicationId, CancellationToken cancellationToken = default);
}
