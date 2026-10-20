using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartRecruitment.Domain.Entities;
[Table("Candidates")]
public partial class Candidate
{
    public int CandidateId { get; set; }

    public byte Age { get; set; }

    public string EducationLevel { get; set; } = null!;

    public string UniversityTier { get; set; } = null!;

    public double Cgpa { get; set; }

    public byte Internships { get; set; }

    public byte Projects { get; set; }

    public byte ProgrammingLanguages { get; set; }

    public byte Certifications { get; set; }

    public double ExperienceYears { get; set; }

    public byte Hackathons { get; set; }

    public byte ResearchPapers { get; set; }

    public double SkillsScore { get; set; }

    public bool Hired { get; set; }

    public double SoftSkillsScore { get; set; }

    public short ResumeLengthWords { get; set; }

    public string CompanyType { get; set; } = null!;

    // ---- HR profile fields (Feature 4) ----
    // The ML scoring columns above stay untouched; the fields below are the
    // human profile shown on the HR applicants screens.

    public string? FullName { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    /// <summary>Comma-separated skill list, e.g. "Angular, TypeScript, RxJS".</summary>
    public string? Skills { get; set; }

    public string? Bio { get; set; }

    public string? CvFileName { get; set; }

    public string? CvContentType { get; set; }

    public long? CvSizeBytes { get; set; }

    public byte[]? CvData { get; set; }

    /// <summary>Disk path under wwwroot/uploads/cvs (written by CV upload).</summary>
    public string? CvFilePath { get; set; }

    // ---- AI recommendation fields (job matching from the CV) ----

    /// <summary>Raw text extracted from the uploaded CV PDF (input for the LLM, avoids re-reading the file).</summary>
    public string? CvText { get; set; }

    /// <summary>Structured summary returned by the LLM (JSON: skills, experience, short bio).</summary>
    public string? CvSummary { get; set; }

    public virtual ICollection<Application> Applications { get; set; } = new List<Application>();
}
