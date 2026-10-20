using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartRecruitment.Application.Dtos.Candidate;
using SmartRecruitment.Application.Interfaces;
using System.Security.Claims;

namespace HrSmartRecruitment.Controllers;

/// <summary>Candidate side — profile, CV, applications (Feature 3).</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Candidate")]
public class CandidateController : ControllerBase
{
    private readonly ICandidateService _service;
    private readonly IJobRecommendationService _recommendations;

    public CandidateController(ICandidateService service, IJobRecommendationService recommendations)
    {
        _service = service;
        _recommendations = recommendations;
    }

    private int CurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("profile")]
    public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
    {
        var result = await _service.GetMyProfileAsync(CurrentUserId(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Errors);
    }

    [HttpPost("profile")]
    public async Task<IActionResult> UpsertProfile([FromBody] UpsertCandidateProfileDto dto, CancellationToken cancellationToken)
    {
        var result = await _service.UpsertMyProfileAsync(CurrentUserId(), dto, cancellationToken);
        return result.IsSuccess ? Ok() : BadRequest(result.Errors);
    }

    [HttpPost("upload-cv")]
    public async Task<IActionResult> UploadCv(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null)
            return BadRequest(new[] { "No file was uploaded." });

        await using var stream = file.OpenReadStream();
        var result = await _service.UploadCvAsync(
            CurrentUserId(), file.FileName, file.ContentType, file.Length, stream, cancellationToken);
        return result.IsSuccess ? Ok() : BadRequest(result.Errors);
    }

    [HttpPost("apply-job")]
    public async Task<IActionResult> ApplyJob([FromBody] ApplyJobDto dto, CancellationToken cancellationToken)
    {
        var result = await _service.ApplyForJobAsync(CurrentUserId(), dto, cancellationToken);
        return result.IsSuccess ? Ok() : BadRequest(result.Errors);
    }

    [HttpGet("my-applications")]
    public async Task<IActionResult> GetMyApplications(CancellationToken cancellationToken)
    {
        var result = await _service.GetMyApplicationsAsync(CurrentUserId(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Errors);
    }

    [HttpGet("my-applications/{id:int}")]
    public async Task<IActionResult> GetMyApplicationDetails(int id, CancellationToken cancellationToken)
    {
        var result = await _service.GetMyApplicationDetailsAsync(CurrentUserId(), id, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Errors);
    }

    /// <summary>AI-recommended jobs based on the candidate's CV (cached — generated on CV upload).</summary>
    [HttpGet("recommended-jobs")]
    public async Task<IActionResult> GetRecommendedJobs(CancellationToken cancellationToken)
    {
        var result = await _recommendations.GetRecommendedJobsAsync(CurrentUserId(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Errors);
    }

    /// <summary>AI summary of the candidate's CV: extracted skills, experience and bio.</summary>
    [HttpGet("cv-analysis")]
    public async Task<IActionResult> GetCvAnalysis(CancellationToken cancellationToken)
    {
        var result = await _recommendations.GetCvAnalysisAsync(CurrentUserId(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Errors);
    }

    /// <summary>Force-regenerates the AI recommendations (e.g. after profile edits or when the AI was down).</summary>
    [HttpPost("recommended-jobs/refresh")]
    public async Task<IActionResult> RefreshRecommendedJobs(CancellationToken cancellationToken)
    {
        var result = await _recommendations.RefreshRecommendationsAsync(CurrentUserId(), cancellationToken);
        return result.IsSuccess ? Ok() : BadRequest(result.Errors);
    }
}
