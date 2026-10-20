using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartRecruitment.Application.Dtos.Hr;
using SmartRecruitment.Application.Interfaces;
using SmartRecruitment.Domain.Entities;
using SmartRecruitment.Domain.Interfaces;
using System.Security.Claims;

namespace HrSmartRecruitment.Controllers;

/// <summary>
/// HR side — applicants &amp; decisions (Feature 4, Mostafa's part).
/// Reads are open like <see cref="JobController"/> reads; mutations require HR/Admin.
/// </summary>
[Route("api/hr")]
[ApiController]
[Authorize(Roles = "Admin,HR,Hr,admin,hr")]
public class HrApplicantsController : ControllerBase
{
    private readonly IApplicantService _service;
    private readonly IUnitOfWork _unitOfWork;

    public HrApplicantsController(IApplicantService service, IUnitOfWork unitOfWork)
    {
        _service = service;
        _unitOfWork = unitOfWork;
    }

    /// <summary>HR identity of the caller (used by the HR jobs pages).</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyHr(CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();

        var hr = (await _unitOfWork.Repository<Hr>()
                .FindAsync(h => h.UserId == userId, cancellationToken))
            .FirstOrDefault();
        if (hr == null)
            return NotFound(new[] { "No HR profile linked to this user. Ask the admin to create one." });

        return Ok(new { hrId = hr.Id, companyName = hr.CompanyName });
    }

    [HttpGet("jobs/{jobId:int}/applicants")]
    public async Task<IActionResult> GetApplicantsByJob(
        int jobId, [FromQuery] string? search, [FromQuery] string? status, CancellationToken cancellationToken)
    {
        var result = await _service.GetApplicantsByJobAsync(jobId, search, status, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Errors);
    }

    [HttpGet("applications")]
    public async Task<IActionResult> GetShortlisted([FromQuery] string? status, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("Shortlisted", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new[] { "Only status=Shortlisted is supported here." });

        var result = await _service.GetShortlistedCandidatesAsync(cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Errors);
    }

    [HttpGet("applications/{id:int}")]
    public async Task<IActionResult> GetApplicationDetails(int id, CancellationToken cancellationToken)
    {
        var result = await _service.GetApplicationDetailsAsync(id, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Errors);
    }

    [HttpPatch("applications/{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id, [FromBody] UpdateApplicationStatusDto dto, CancellationToken cancellationToken)
    {
        var changedBy = User.Identity?.Name ?? "HR";
        var result = await _service.UpdateApplicationStatusAsync(id, dto, changedBy, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Errors);
    }

    [HttpGet("applications/{id:int}/cv")]
    public async Task<IActionResult> DownloadCv(int id, CancellationToken cancellationToken)
    {
        var cv = await _service.GetApplicationCvAsync(id, cancellationToken);
        if (cv == null)
            return NotFound(new[] { "No CV attached to this application." });

        return File(cv.Data, cv.ContentType, cv.FileName);
    }
}
