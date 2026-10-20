namespace SmartRecruitment.Application.Contract;

/// <summary>Extracts plain text from PDF files (implemented in Infrastructure).</summary>
public interface IPdfTextExtractor
{
    /// <summary>Returns all page text, or an empty string if the PDF can't be read.</summary>
    string ExtractText(string filePath);
}
