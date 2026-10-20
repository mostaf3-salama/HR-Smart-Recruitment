using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartRecruitment.Application.Dtos.Hr;
using SmartRecruitment.Application.Interfaces;

namespace HrSmartRecruitment.Controllers;

/// <summary>
/// HR side — interviews &amp; dashboard (Feature 4, Mahmoud's part).
/// Reads are open like <see cref="JobController"/> reads; mutations require HR/Admin.
/// </summary>
[Route("api/hr")]
[ApiController]
[Authorize(Roles = "Admin,HR,Hr,admin,hr")]
public class HrInterviewsController : ControllerBase
{
    private readonly IInterviewService _interviews;
    private readonly IDashboardService _dashboard;

    public HrInterviewsController(IInterviewService interviews, IDashboardService dashboard)
    {
        _interviews = interviews;
        _dashboard = dashboard;
    }

    [HttpGet("interviews")]
    public async Task<IActionResult> GetInterviews(
        [FromQuery] string tab = "upcoming", CancellationToken cancellationToken = default)
    {
        var result = await _interviews.GetInterviewsAsync(tab, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Errors);
    }

    [HttpGet("interviews/{id:int}")]
    public async Task<IActionResult> GetInterviewById(int id, CancellationToken cancellationToken)
    {
        var result = await _interviews.GetInterviewByIdAsync(id, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Errors);
    }

    [HttpPost("interviews")]
    public async Task<IActionResult> Schedule(
        [FromBody] ScheduleInterviewDto dto, CancellationToken cancellationToken)
    {
        var createdBy = User.Identity?.Name ?? "HR";
        var result = await _interviews.ScheduleInterviewAsync(dto, createdBy, cancellationToken);
        if (result.IsFailure)
            return BadRequest(result.Errors);

        return CreatedAtAction(nameof(GetInterviewById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPatch("interviews/{id:int}/result")]
    public async Task<IActionResult> RecordResult(
        int id, [FromBody] RecordInterviewResultDto dto, CancellationToken cancellationToken)
    {
        var result = await _interviews.RecordResultAsync(id, dto, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Errors);
    }

    [HttpDelete("interviews/{id:int}")]
    public async Task<IActionResult> Cancel(int id, CancellationToken cancellationToken)
    {
        var result = await _interviews.CancelInterviewAsync(id, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Errors);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var result = await _dashboard.GetStatsAsync(cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Errors);
    }
}
