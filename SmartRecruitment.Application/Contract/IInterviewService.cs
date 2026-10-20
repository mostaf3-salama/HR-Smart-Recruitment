using SmartRecruitment.Application.Common.Results;
using SmartRecruitment.Application.Dtos.Hr;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Interfaces;

public interface IInterviewService
{
    Task<ResultData<IEnumerable<InterviewDto>>> GetInterviewsAsync(string tab, CancellationToken cancellationToken = default);
    Task<ResultData<InterviewDto>> GetInterviewByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ResultData<InterviewDto>> ScheduleInterviewAsync(ScheduleInterviewDto dto, string createdBy, CancellationToken cancellationToken = default);
    Task<ResultData<InterviewDto>> RecordResultAsync(int id, RecordInterviewResultDto dto, CancellationToken cancellationToken = default);
    Task<ResultData<InterviewDto>> CancelInterviewAsync(int id, CancellationToken cancellationToken = default);
}
