using SmartRecruitment.Application.Common.Results;
using SmartRecruitment.Application.Dtos.Hr;
using System.Threading;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Interfaces;

public interface IDashboardService
{
    Task<ResultData<DashboardStatsDto>> GetStatsAsync(CancellationToken cancellationToken = default);
}
