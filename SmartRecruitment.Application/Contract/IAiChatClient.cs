using System.Threading;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Contract;

/// <summary>
/// Client for the AI backend (OpenRouter-compatible chat API).
/// Infrastructure implements it; Application services only see this interface.
/// </summary>
public interface IAiChatClient
{
    /// <summary>Sends a chat request and returns the model's reply text.</summary>
    Task<string> AskAsync(string systemPrompt, string userPrompt, int maxTokens = 500, CancellationToken cancellationToken = default);
}
