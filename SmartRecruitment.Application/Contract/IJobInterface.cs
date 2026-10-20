using SmartRecruitment.Application.Common.Results;
using SmartRecruitment.Application.Dtos.Jobs;

namespace SmartRecruitment.Application.Interfaces;

public interface IJobService
{
    Task<ResultData<IEnumerable<JobResponseDto>>> GetAllJobsAsync(bool activeOnly = false, CancellationToken cancellationToken = default);
    Task<ResultData<JobResponseDto>> GetJobByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ResultData<JobResponseDto>> CreateJobAsync(CreateJobDto dto, CancellationToken cancellationToken = default);
    Task<ResultData> UpdateJobAsync(int id, UpdateJobDto dto, CancellationToken cancellationToken = default);
    Task<ResultData> DeleteJobAsync(int id, CancellationToken cancellationToken = default);
    Task<ResultData> ToggleJobStatusAsync(int id, CancellationToken cancellationToken = default);
}