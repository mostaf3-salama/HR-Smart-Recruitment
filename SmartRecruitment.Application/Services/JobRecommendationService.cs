using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using SmartRecruitment.Application.Common.Results;
using SmartRecruitment.Application.Contract;
using SmartRecruitment.Application.Dtos.Candidate;
using SmartRecruitment.Domain.Entities;
using SmartRecruitment.Domain.Interfaces;
using SmartRecruitment.Application.Interfaces;

namespace SmartRecruitment.Application.Services;

/// <summary>
/// AI-powered CV → job recommendations.
/// Flow: PDF text → LLM extracts {skills, experience, summary} → heuristic
/// scoring of all active jobs → top jobs get an AI-written reason → cached
/// in JobRecommendations so later requests are instant and LLM-free.
/// If the AI is unavailable the local scoring still works (graceful fallback).
/// </summary>
public class JobRecommendationService : IJobRecommendationService
{
    private const int TopJobCount = 10;
    private const int MaxCvChars = 6000; // keep prompt well inside context limits

    // Weights of the composite score (must sum to 100).
    private const double SkillWeight = 50;
    private const double SemanticWeight = 30;
    private const double ExperienceWeight = 20;

    private readonly IUnitOfWork _unitOfWork;
    private readonly IAiChatClient _ai;
    private readonly IPdfTextExtractor _pdf;

    public JobRecommendationService(IUnitOfWork unitOfWork, IAiChatClient aiChatClient, IPdfTextExtractor pdfTextExtractor)
    {
        _unitOfWork = unitOfWork;
        _ai = aiChatClient;
        _pdf = pdfTextExtractor;
    }

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------

    /// <summary>Called after a CV upload: parse with AI, score jobs, cache results.</summary>
    public async Task<ResultData> RefreshRecommendationsAsync(int userId, CancellationToken cancellationToken = default)
    {
        var link = await _unitOfWork.Repository<CandidateUserLink>()
            .FirstOrDefaultAsync(l => l.UserId == userId, cancellationToken);
        if (link == null)
            return ResultData.Failure("No candidate profile linked to this user.");

        var candidateId = link.CandidateId;
        var candidate = await _unitOfWork.Repository<Candidate>().GetByIdAsync(candidateId, cancellationToken);
        if (candidate == null)
            return ResultData.Failure("Candidate not found.");
        if (string.IsNullOrWhiteSpace(candidate.CvFilePath) || !File.Exists(candidate.CvFilePath))
            return ResultData.Failure("No CV uploaded for this candidate.");

        // 1) Extract PDF text (UglyToad.PdfPig, implemented in Infrastructure).
        var cvText = _pdf.ExtractText(candidate.CvFilePath!);
        if (string.IsNullOrWhiteSpace(cvText))
            return ResultData.Failure("Could not read any text from the CV PDF (is it a scanned image?).");

        candidate.CvText = cvText.Length > MaxCvChars * 2 ? cvText[..(MaxCvChars * 2)] : cvText;

        // 2) LLM: CV text → structured JSON.
        //    If the AI is unavailable (rate limits, outage) we keep going with
        //    whatever the candidate profile has — scoring never hard-fails on AI.
        CvAnalysis analysis;
        try
        {
            analysis = await AnalyzeCvAsync(cvText, cancellationToken);
        }
        catch
        {
            analysis = new CvAnalysis();
        }

        if (analysis.Skills.Count > 0)
        {
            candidate.CvSummary = JsonSerializer.Serialize(analysis);
            candidate.Skills = string.Join(", ", analysis.Skills);
        }

        // 3) Local scoring of every active job (no LLM tokens spent here).
        var jobs = await _unitOfWork.Repository<Job>()
            .FindAsync(j => j.IsActive, cancellationToken);
        var scored = jobs
            .Select(j => (Job: j, Score: ScoreCandidateForJob(candidate, analysis, j)))
            .OrderByDescending(x => x.Score)
            .Take(TopJobCount)
            .Where(x => x.Score > 0)
            .ToList();

        // 4) Replace the cached recommendations for this candidate.
        var old = await _unitOfWork.Repository<JobRecommendation>()
            .FindAsync(r => r.CandidateId == candidateId, cancellationToken);
        foreach (var row in old)
            _unitOfWork.Repository<JobRecommendation>().Delete(row);

        // 5) LLM writes one short reason per job so the UI can show it.
        var reasons = await GenerateReasonsAsync(candidate, analysis, scored, cancellationToken);

        foreach (var (job, score) in scored)
        {
            await _unitOfWork.Repository<JobRecommendation>().AddAsync(new JobRecommendation
            {
                CandidateId = candidateId,
                JobId = job.Id,
                Score = score,
                Reason = reasons.TryGetValue(job.Id, out var reason) ? reason : $"Match score {score}%.",
                GeneratedAt = DateTime.UtcNow
            }, cancellationToken);
        }

        _unitOfWork.Repository<Candidate>().Update(candidate);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ResultData.Success();
    }

    public async Task<ResultData<IEnumerable<RecommendedJobDto>>> GetRecommendedJobsAsync(int userId, CancellationToken cancellationToken = default)
    {
        var link = await _unitOfWork.Repository<CandidateUserLink>()
            .FirstOrDefaultAsync(l => l.UserId == userId, cancellationToken);
        if (link == null)
            return ResultData<IEnumerable<RecommendedJobDto>>.Success(Enumerable.Empty<RecommendedJobDto>());

        var recommendations = await _unitOfWork.Repository<JobRecommendation>()
            .FindAsync(r => r.CandidateId == link.CandidateId, cancellationToken);

        // Lazy refresh: cache is empty (initial view) — build it now so the first
        // request returns data. Later requests are instant (pure DB reads).
        if (recommendations.Count == 0)
        {
            await RefreshRecommendationsAsync(link.UserId, cancellationToken);
            recommendations = await _unitOfWork.Repository<JobRecommendation>()
                .FindAsync(r => r.CandidateId == link.CandidateId, cancellationToken);
        }

        var items = new List<RecommendedJobDto>();
        foreach (var rec in recommendations.OrderByDescending(r => r.Score))
        {
            var job = await _unitOfWork.Repository<Job>().GetByIdAsync(rec.JobId, cancellationToken);
            if (job == null || !job.IsActive)
                continue;

            var hr = await _unitOfWork.Repository<Hr>().GetByIdAsync(job.Hrid, cancellationToken);
            items.Add(new RecommendedJobDto
            {
                JobId = job.Id,
                Title = job.Title,
                Company = hr?.CompanyName,
                RequiredSkills = job.RequiredSkills,
                ExperienceRequired = job.ExperienceRequired,
                Score = rec.Score,
                Reason = rec.Reason,
                GeneratedAt = rec.GeneratedAt
            });
        }

        return ResultData<IEnumerable<RecommendedJobDto>>.Success(items);
    }

    public async Task<ResultData<CvAnalysisDto>> GetCvAnalysisAsync(int userId, CancellationToken cancellationToken = default)
    {
        var link = await _unitOfWork.Repository<CandidateUserLink>()
            .FirstOrDefaultAsync(l => l.UserId == userId, cancellationToken);
        if (link == null)
            return ResultData<CvAnalysisDto>.Failure("No candidate profile linked to this user.");

        var candidate = await _unitOfWork.Repository<Candidate>()
            .GetByIdAsync(link.CandidateId, cancellationToken);
        if (candidate == null || string.IsNullOrWhiteSpace(candidate.CvSummary))
            return ResultData<CvAnalysisDto>.Failure("No CV analysis available yet — upload a CV first.");

        try
        {
            var analysis = JsonSerializer.Deserialize<CvAnalysis>(candidate.CvSummary!.Trim(), JsonOpts) ?? new CvAnalysis();
            return ResultData<CvAnalysisDto>.Success(new CvAnalysisDto
            {
                Skills = analysis.Skills,
                ExperienceYears = analysis.ExperienceYears,
                Summary = analysis.Summary,
                HasCvAnalysis = true
            });
        }
        catch (JsonException)
        {
            return ResultData<CvAnalysisDto>.Failure("Stored CV analysis is invalid.");
        }
    }

    // ------------------------------------------------------------------
    // AI calls
    // ------------------------------------------------------------------

    private async Task<CvAnalysis> AnalyzeCvAsync(string cvText, CancellationToken cancellationToken)
    {
        var trimmed = cvText.Length > MaxCvChars ? cvText[..MaxCvChars] : cvText;
        var prompt =
            "Extract structured data from this CV. Respond with ONLY a JSON object: " +
            "{\"skills\":[\"...\"] (max 15, individual skills), " +
            "\"experience_years\":0.0 (total years of professional experience), " +
            "\"summary\":\"one short English sentence describing the candidate\"}. " +
            "No markdown, no extra text.\n\nCV:\n" + trimmed;

        var raw = await _ai.AskAsync("You extract data from CVs and return only valid JSON.", prompt, 500, cancellationToken);
        var analysis = ParseJson<CvAnalysis>(raw) ?? new CvAnalysis();
        analysis.Skills = analysis.Skills.Select(s => s.Trim()).Where(s => s.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        return analysis;
    }

    private async Task<Dictionary<int, string>> GenerateReasonsAsync(
        Candidate candidate, CvAnalysis analysis, List<(Job Job, int Score)> scored, CancellationToken cancellationToken)
    {
        var result = new Dictionary<int, string>();
        if (scored.Count == 0)
            return result;

        var candidateBlock =
            $"Skills: {string.Join(", ", analysis.Skills)}\n" +
            $"Experience: {analysis.ExperienceYears.ToString(CultureInfo.InvariantCulture)} years\n" +
            $"Summary: {analysis.Summary}";

        var jobsBlock = string.Join("\n",
            scored.Select((x, i) => $"[{i}] Job {x.Job.Id}: {x.Job.Title} " +
                $"(requires {x.Job.ExperienceRequired} yrs: {x.Job.RequiredSkills})"));

        var system =
            "You are a recruitment assistant. For each job below, write ONE short sentence " +
            "(max 20 words) explaining why the candidate fits or does not fit. " +
            "Respond ONLY with a JSON object mapping the job index to the sentence: {\"0\":\"...\",\"1\":\"...\"}. No markdown.";

        var user = $"CANDIDATE:\n{candidateBlock}\n\nJOBS:\n{jobsBlock}";

        try
        {
            var raw = await _ai.AskAsync(system, user, 500, cancellationToken);
            var parsed = ParseJson<Dictionary<string, string>>(raw);
            if (parsed == null)
            {
                // Single retry — free-tier models occasionally return malformed/empty replies.
                await Task.Delay(TimeSpan.FromSeconds(3), cancellationToken);
                raw = await _ai.AskAsync(system, user, 500, cancellationToken);
                parsed = ParseJson<Dictionary<string, string>>(raw);
            }
            if (parsed != null)
            {
                foreach (var (key, value) in parsed)
                {
                    if (int.TryParse(key, out var index) && index >= 0 && index < scored.Count)
                        result[scored[index].Job.Id] = value.Trim();
                }
            }
        }
        catch (Exception)
        {
            // Reasons are a nice-to-have; local fallback text is used instead.
        }

        return result;
    }

    private static T? ParseJson<T>(string raw) where T : class
    {
        try
        {
            // Strip markdown fences or stray prose the model may add.
            var response = raw.Trim();
            var firstBrace = response.IndexOf('{');
            var lastBrace = response.LastIndexOf('}');
            if (firstBrace < 0 || lastBrace <= firstBrace)
                return null;
            response = response.Substring(firstBrace, lastBrace - firstBrace + 1);
            return JsonSerializer.Deserialize<T>(response, JsonOpts);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };

    // ------------------------------------------------------------------
    // Local scoring (runs on every refresh — no LLM, no cost)
    // ------------------------------------------------------------------

    private static int ScoreCandidateForJob(Candidate candidate, CvAnalysis analysis, Job job)
    {
        var candidateSkills = analysis.Skills.Count > 0
            ? analysis.Skills
            : SplitSkills(candidate.Skills);

        var required = SplitSkills(job.RequiredSkills);
        if (required.Count > 0 && candidateSkills.Count > 0)
        {
            var matched = required.Count(r => candidateSkills.Contains(r, StringComparer.OrdinalIgnoreCase));
            var skillScore = SkillWeight * matched / required.Count;

            var experienceScore = candidate.ExperienceYears switch
            {
                var e when e >= job.ExperienceRequired => ExperienceWeight,
                var e when e >= job.ExperienceRequired * 0.5 => ExperienceWeight / 2,
                _ => 0
            };

            var semanticScore = SemanticWeight * TokenOverlap(analysis.Summary + " " + candidate.Bio, job.Description + " " + job.Title);

            return (int)Math.Round(skillScore + experienceScore + semanticScore);
        }

        return 0;
    }

    private static List<string> SplitSkills(string? csv) =>
        string.IsNullOrWhiteSpace(csv)
            ? new List<string>()
            : csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                 .Select(s => s.Trim())
                 .Where(s => s.Length > 0)
                 .ToList();

    /// <summary>Very light semantic proxy: overlap of meaningful words (no external service needed).</summary>
    private static double TokenOverlap(string left, string right)
    {
        var stop = new HashSet<string> { "the", "and", "with", "for", "a", "an", "of", "in", "to", "our", "we", "you", "will", "is", "are" };
        var leftTokens = Tokenize(left).Where(t => !stop.Contains(t)).ToHashSet();
        if (leftTokens.Count == 0) return 0;
        var rightTokens = Tokenize(right).Where(t => !stop.Contains(t)).ToHashSet();
        var overlap = leftTokens.Intersect(rightTokens).Count();
        return Math.Min(1.0, (double)overlap / Math.Max(1, rightTokens.Count));
    }

    private static IEnumerable<string> Tokenize(string text) =>
        (text ?? string.Empty)
            .ToLowerInvariant()
            .Split([' ', ',', '.', ';', ':', '(', ')', '/', '-', '\n', '\r', '\t'], StringSplitOptions.RemoveEmptyEntries)
            .Select(t => t.Trim())
            .Where(t => t.Length > 2);

    /// <summary>What the LLM returns when analyzing a CV (stored as Json on the Candidate row).</summary>
    private sealed class CvAnalysis
    {
        public List<string> Skills { get; set; } = new();
        public double ExperienceYears { get; set; }
        public string Summary { get; set; } = string.Empty;
    }
}
