using AMAL.Domain.Enums;

namespace AMAL.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public UserRole Role { get; set; } = UserRole.JobSeeker;
    public bool IsEmailVerified { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public JobSeekerProfile? Profile { get; set; }
    public RecruiterProfile? Recruiter { get; set; }
}

public class JobSeekerProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public string ProfessionalHeadline { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string Country { get; set; } = "Palestine";
    public string City { get; set; } = "Gaza";
    public string ProfessionalStatus { get; set; } = "Experienced Professional";
    public string MainCategory { get; set; } = "Software Engineering";
    public string Skills { get; set; } = "C#, React, TypeScript, SQL";
    public string Education { get; set; } = "Bachelor of Computer Science";
    public string ExperienceYears { get; set; } = "3-5 years";
    public string Languages { get; set; } = "Arabic (Native), English (Fluent)";
    public string? CvFileName { get; set; }
    public string? PortfolioUrl { get; set; }
    public bool CvDownloadConsent { get; set; } = true;
    public int ProfileCompletionPercentage { get; set; } = 85;
}

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsVerified { get; set; } = true;

    public ICollection<Opportunity> Opportunities { get; set; } = new List<Opportunity>();
}

public class RecruiterProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public Guid OrganizationId { get; set; }
    public Organization? Organization { get; set; }
    public string Position { get; set; } = "Hiring Lead";
}

public class Opportunity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    public string Title { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DescriptionAr { get; set; } = string.Empty;
    public string Category { get; set; } = "Software Engineering";
    public OpportunityType Type { get; set; } = OpportunityType.Remote;
    public WorkArrangement Arrangement { get; set; } = WorkArrangement.Remote;
    public string Location { get; set; } = "Remote (Worldwide)";
    public string ExperienceLevel { get; set; } = "Mid-Level";
    public decimal MinSalary { get; set; }
    public decimal MaxSalary { get; set; }
    public string Currency { get; set; } = "USD";
    public string Requirements { get; set; } = string.Empty;
    public OpportunityStatus Status { get; set; } = OpportunityStatus.Approved;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? Deadline { get; set; }
    public bool IsFeatured { get; set; } = false;

    public ICollection<Application> Applications { get; set; } = new List<Application>();
}

public class Application
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OpportunityId { get; set; }
    public Opportunity? Opportunity { get; set; }

    public Guid ApplicantId { get; set; }
    public User? Applicant { get; set; }

    public string CoverLetter { get; set; } = string.Empty;
    public string CustomAnswers { get; set; } = string.Empty;
    public string? CvFileName { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Submitted;
    public string? RecruiterNotes { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    // Dual-confirmation employment flow
    public bool RecruiterConfirmedEmployment { get; set; } = false;
    public bool CandidateConfirmedEmployment { get; set; } = false;
    public DateTime? EmploymentConfirmedAt { get; set; }
}

public class Bookmark
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid OpportunityId { get; set; }
    public Opportunity? Opportunity { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
