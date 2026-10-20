using System.Linq;
using SmartRecruitment.Application.Contract;

namespace SmartRecruitment.Infrastructure.InfrasturcureServices;

/// <summary>PDF text extraction via UglyToad.PdfPig (no native dependencies).</summary>
public class PdfTextExtractor : IPdfTextExtractor
{
    public string ExtractText(string filePath)
    {
        try
        {
            using var document = UglyToad.PdfPig.PdfDocument.Open(filePath);
            return string.Join("\n", document.GetPages().Select(p => p.Text));
        }
        catch
        {
            // Corrupt or scanned (image-only) PDF — caller decides how to handle empty text.
            return string.Empty;
        }
    }
}
