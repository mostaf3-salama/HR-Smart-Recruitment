using SmartRecruitment.Domain.Entities;
using SmartRecruitment.Domain.Hr;
using SmartRecruitment.Domain.Interfaces;
using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HrApplication = SmartRecruitment.Domain.Entities.Application;

namespace SmartRecruitment.Infrastructure.Seeder;

/// <summary>
/// Demo graph for the HR UI so the frontend can run against the real API:
/// admin + demo HR (each with company), two jobs, three candidates (each with
/// login user + profile link + CV file), three applications and one interview.
/// Fully idempotent — safe to run on every startup.
/// </summary>
public static class HrDemoSeeder
{
    public static async Task SeedDemoGraphAsync(IUnitOfWork unitOfWork)
    {
        // HR identities are ensured on EVERY run (before any early-return),
        // so databases seeded by older versions get repaired automatically.
        await EnsureHrUserAsync(unitOfWork,
            email: "hr.demo@smartrecruitment.com",
            name: "Demo HR",
            company: "Demo Company");

        // The seeded admin also gets a company so it can post jobs immediately.
        var admin = await unitOfWork.Repository<User>()
            .FirstOrDefaultAsync(u => u.Email == "admin@smartrecruitment.com");
        if (admin != null)
        {
            var adminHr = (await unitOfWork.Repository<Hr>()
                    .FindAsync(h => h.UserId == admin.Id))
                .FirstOrDefault();
            if (adminHr == null)
            {
                await unitOfWork.Repository<Hr>().AddAsync(new Hr
                {
                    UserId = admin.Id,
                    CompanyName = "Admin Company"
                });
                await unitOfWork.SaveChangesAsync();
            }
        }

        var existingJobs = await unitOfWork.Repository<Job>().GetAllAsync();
        if (existingJobs.Any())
            return;

        var hrUser = await unitOfWork.Repository<User>()
            .FirstOrDefaultAsync(u => u.Email == "hr.demo@smartrecruitment.com");
        var hr = (await unitOfWork.Repository<Hr>()
                .FindAsync(h => h.UserId == hrUser!.Id))
            .First();

        var frontendJob = new Job
        {
            Hrid = hr.Id,
            Title = "Front-End Developer (Angular)",
            Description = "Build enterprise Angular applications.",
            RequiredSkills = "Angular, TypeScript, RxJS, SCSS",
            ExperienceRequired = 2,
            CreatedAt = DateTime.UtcNow
        };
        var backendJob = new Job
        {
            Hrid = hr.Id,
            Title = "Backend Developer (.NET)",
            Description = "Build .NET Core APIs with Clean Architecture.",
            RequiredSkills = ".NET Core, C#, EF Core, SQL Server",
            ExperienceRequired = 3,
            CreatedAt = DateTime.UtcNow
        };
        await unitOfWork.Repository<Job>().AddAsync(frontendJob);
        await unitOfWork.Repository<Job>().AddAsync(backendJob);
        await unitOfWork.SaveChangesAsync();

        var ahmed = await AddCandidateAsync(unitOfWork,
            name: "Ahmed Samy Abdelaziz",
            email: "ahmed.samy@mail.com",
            skills: "Angular, TypeScript, RxJS, SCSS, Git",
            years: 4,
            education: "Bachelor's in Computer Science",
            bio: "Front-End developer specialized in Angular.");

        var mona = await AddCandidateAsync(unitOfWork,
            name: "Mona Abdelrahman Khalil",
            email: "mona.abdelrahman@mail.com",
            skills: "Angular, TypeScript, Tailwind, Jest, REST",
            years: 3,
            education: "Bachelor's in Information Technology",
            bio: "Front-End developer focused on performance and user experience.");

        var sara = await AddCandidateAsync(unitOfWork,
            name: "Sara Ibrahim Mansour",
            email: "sara.ibrahim@mail.com",
            skills: ".NET Core, C#, EF Core, SQL Server, Docker",
            years: 5,
            education: "Bachelor's in Computer Science",
            bio: "Backend developer with 5 years of .NET Core experience.");

        await AddApplicationAsync(unitOfWork, ahmed, frontendJob.Id,
            HrWorkflow.ApplicationStatuses.Shortlisted, 92,
            mlFeedback: "Very high match (92%). Strongest points: matching hands-on experience (4 years).",
            note: "Excellent Angular experience, strong CV.", changedBy: "Mostafa (HR)");

        await AddApplicationAsync(unitOfWork, mona, frontendJob.Id,
            HrWorkflow.ApplicationStatuses.Submitted, 88,
            mlFeedback: "Strong match (88%). RxJS should be assessed in the technical interview.",
            note: null, changedBy: null);

        var saraApp = await AddApplicationAsync(unitOfWork, sara, backendJob.Id,
            HrWorkflow.ApplicationStatuses.Interview, 95,
            mlFeedback: "Excellent match (95%). 5 years of .NET Core with Clean Architecture.",
            note: null, changedBy: null);

        await unitOfWork.Repository<Interview>().AddAsync(new Interview
        {
            ApplicationId = saraApp.Id,
            Type = HrWorkflow.InterviewTypes.Technical,
            ScheduledAt = DateTime.UtcNow.AddDays(2),
            Location = "Online - Microsoft Teams",
            Status = HrWorkflow.InterviewStatuses.Scheduled,
            CreatedBy = "Mahmoud (HR)",
            CreatedAt = DateTime.UtcNow
        });
        await unitOfWork.SaveChangesAsync();
    }

    private static async Task EnsureHrUserAsync(IUnitOfWork unitOfWork, string email, string name, string company)
    {
        var user = await unitOfWork.Repository<User>().FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            user = new User
            {
                Name = name,
                Email = email,
                PasswordHash = "DEMO-NO-LOGIN",
                Role = "HR",
                CreatedAt = DateTime.UtcNow
            };
            await unitOfWork.Repository<User>().AddAsync(user);
            await unitOfWork.SaveChangesAsync();
        }

        var hr = (await unitOfWork.Repository<Hr>().FindAsync(h => h.UserId == user.Id)).FirstOrDefault();
        if (hr == null)
        {
            await unitOfWork.Repository<Hr>().AddAsync(new Hr { UserId = user.Id, CompanyName = company });
            await unitOfWork.SaveChangesAsync();
        }
    }

    private static async Task<Candidate> AddCandidateAsync(
        IUnitOfWork unitOfWork, string name, string email,
        string skills, double years, string education, string bio)
    {
        var user = await unitOfWork.Repository<User>().FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            user = new User
            {
                Name = name,
                Email = email,
                PasswordHash = "DEMO-NO-LOGIN",
                Role = "Candidate",
                CreatedAt = DateTime.UtcNow
            };
            await unitOfWork.Repository<User>().AddAsync(user);
            await unitOfWork.SaveChangesAsync();
        }

        var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "cvs");
        if (!Directory.Exists(folderPath))
            Directory.CreateDirectory(folderPath);

        var fileName = name.Replace(' ', '-') + "-CV.pdf";
        var filePath = Path.Combine(folderPath, fileName);
        if (!File.Exists(filePath))
            await File.WriteAllTextAsync(filePath, $"Demo CV of {name}.");

        var candidate = new Candidate
        {
            FullName = name,
            Email = email,
            Skills = skills,
            Bio = bio,
            EducationLevel = education,
            ExperienceYears = years,
            UniversityTier = "Tier 1",
            CompanyType = "Product",
            CvFileName = fileName,
            CvContentType = "application/pdf",
            CvSizeBytes = new FileInfo(filePath).Length,
            CvFilePath = filePath
        };
        await unitOfWork.Repository<Candidate>().AddAsync(candidate);
        await unitOfWork.SaveChangesAsync();

        await unitOfWork.Repository<CandidateUserLink>().AddAsync(new CandidateUserLink
        {
            UserId = user.Id,
            CandidateId = candidate.CandidateId
        });
        await unitOfWork.SaveChangesAsync();

        return candidate;
    }

    private static async Task<HrApplication> AddApplicationAsync(
        IUnitOfWork unitOfWork, Candidate candidate, int jobId,
        string status, decimal matchScore, string mlFeedback,
        string? note, string? changedBy)
    {
        var application = new HrApplication
        {
            CandidateId = candidate.CandidateId,
            JobId = jobId,
            AppliedAt = DateTime.UtcNow.AddDays(-5),
            Status = status,
            MatchScore = matchScore,
            MlFeedback = mlFeedback
        };
        await unitOfWork.Repository<HrApplication>().AddAsync(application);
        await unitOfWork.SaveChangesAsync();

        await unitOfWork.Repository<ApplicationStatusHistory>().AddAsync(new ApplicationStatusHistory
        {
            ApplicationId = application.Id,
            Status = HrWorkflow.ApplicationStatuses.Submitted,
            ChangedAt = application.AppliedAt,
            ChangedBy = "System"
        });

        if (status != HrWorkflow.ApplicationStatuses.Submitted)
        {
            await unitOfWork.Repository<ApplicationStatusHistory>().AddAsync(new ApplicationStatusHistory
            {
                ApplicationId = application.Id,
                Status = status,
                ChangedAt = DateTime.UtcNow.AddDays(-1),
                ChangedBy = changedBy ?? "HR",
                Note = note
            });
        }

        await unitOfWork.SaveChangesAsync();
        return application;
    }
}
