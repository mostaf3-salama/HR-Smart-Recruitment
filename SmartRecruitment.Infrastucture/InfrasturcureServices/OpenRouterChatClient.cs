using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SmartRecruitment.Application.Contract;

namespace SmartRecruitment.Infrastructure.InfrasturcureServices;

/// <summary>
/// Calls an OpenRouter-compatible chat completion endpoint.
/// Model/API key come from configuration ("OpenRouter" section) — no keys in code.
/// If the configured free model is throttled (429), it retries once with the
/// "openrouter/free" auto-router which picks any available free model.
/// </summary>
public class OpenRouterChatClient : IAiChatClient
{
    private readonly HttpClient _http;
    private readonly string? _model;
    private readonly string? _apiKey;
    private readonly ILogger<OpenRouterChatClient> _logger;

    public OpenRouterChatClient(HttpClient http, IConfiguration configuration, ILogger<OpenRouterChatClient> logger)
    {
        // Typed HttpClient (base address comes from AddHttpClient); headers are set once here.
        _http = http;
        _logger = logger;
        _model = configuration["OpenRouter:Model"];
        _apiKey = configuration["OpenRouter:ApiKey"];

        if (!string.IsNullOrEmpty(_apiKey))
        {
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            // Optional attribution headers OpenRouter uses for app rankings.
            _http.DefaultRequestHeaders.TryAddWithoutValidation("HTTP-Referer", "http://localhost:5030");
            _http.DefaultRequestHeaders.TryAddWithoutValidation("X-Title", "HrSmartRecruitment");
        }
    }

    public async Task<string> AskAsync(string systemPrompt, string userPrompt, int maxTokens = 500, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(_apiKey))
            throw new InvalidOperationException("OpenRouter:ApiKey is not configured.");

        var messages = new object[]
        {
            new { role = "system", content = systemPrompt },
            new { role = "user",   content = userPrompt }
        };

        var (ok, body) = await PostCompletionAsync(_model, messages, maxTokens, cancellationToken);
        if (!ok)
        {
            _logger.LogWarning("Primary model {Model} failed, falling back to openrouter/free. Body: {Body}", _model, Truncate(body, 200));
            (ok, body) = await PostCompletionAsync("openrouter/free", messages, maxTokens, cancellationToken);
            if (!ok)
                throw new HttpRequestException($"OpenRouter call failed: {Truncate(body, 300)}");
        }

        var content = ExtractMessageContent(body);
        if (string.IsNullOrWhiteSpace(content))
            throw new InvalidOperationException("OpenRouter returned an empty completion.");

        return content!;
    }

    private async Task<(bool Ok, string Body)> PostCompletionAsync(
        string? model, object[] messages, int maxTokens, CancellationToken cancellationToken)
    {
        var payload = new
        {
            model,
            temperature = 0, // deterministic output => stable JSON
            max_tokens = maxTokens,
            messages
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };

        try
        {
            using var response = await _http.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            return (response.IsSuccessStatusCode, body);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "OpenRouter request threw for model {Model}.", model);
            return (false, ex.Message);
        }
    }

    private static string? ExtractMessageContent(string rawBody)
    {
        try
        {
            using var doc = JsonDocument.Parse(rawBody);
            return doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value.Substring(0, maxLength);
}
