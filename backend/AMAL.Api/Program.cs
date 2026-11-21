using AMAL.Domain.Entities;
using AMAL.Domain.Enums;
using AMAL.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Configure CORS for Vite Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Database (SQLite for immediate zero-config local run, interchangeable with PostgreSQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? "Data Source=amal.db";

builder.Services.AddDbContext<AmalDbContext>(options =>
{
    options.UseSqlite(connectionString);
});

builder.Services.AddEndpointsApiExplorer();

// Ignore cycles during JSON serialization
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

var app = builder.Build();

app.UseCors("AllowFrontend");

// Auto migrate and seed database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AmalDbContext>();
    DbInitializer.Initialize(db);
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// Auth: Login
app.MapPost("/api/v1/auth/login", async (AmalDbContext db, LoginRequest request) =>
{
    var user = await db.Users
        .Include(u => u.Profile)
        .Include(u => u.Recruiter)
        .ThenInclude(r => r!.Organization)
        .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

    if (user == null || user.PasswordHash != request.Password)
    {
        return Results.BadRequest(new { message = "Invalid email or password" });
    }

    // Fallback: If recruiter user doesn't have an organization explicitly linked, link default tech organization
    var organization = user.Recruiter?.Organization;
    if (user.Role == UserRole.Recruiter && organization == null)
    {
        organization = await db.Organizations.FirstOrDefaultAsync();
    }

    return Results.Ok(new
    {
        user.Id,
        user.Email,
        user.FullName,
        Role = user.Role.ToString(),
        user.Phone,
        Profile = user.Profile,
        Organization = organization
    });
});

// Opportunities: Search and Filter Feed
app.MapGet("/api/v1/opportunities", async (AmalDbContext db, string? query, string? category, string? type, string? status) =>
{
    var q = db.Opportunities.Include(o => o.Organization).AsQueryable();

    if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OpportunityStatus>(status, true, out var parsedStatus))
    {
        q = q.Where(o => o.Status == parsedStatus);
    }
    else if (status != "All")
    {
        q = q.Where(o => o.Status == OpportunityStatus.Approved);
    }

    if (!string.IsNullOrWhiteSpace(category) && category != "All")
    {
        q = q.Where(o => o.Category == category);
    }

    if (!string.IsNullOrWhiteSpace(query))
    {
        var lower = query.ToLower();
        q = q.Where(o => o.Title.ToLower().Contains(lower) || 
                         o.TitleAr.Contains(lower) || 
                         o.Organization!.Name.ToLower().Contains(lower));
    }

    var list = await q.OrderByDescending(o => o.IsFeatured)
                      .ThenByDescending(o => o.CreatedAt)
                      .ToListAsync();

    return Results.Ok(list);
});

// Opportunities: Get by ID
app.MapGet("/api/v1/opportunities/{id:guid}", async (AmalDbContext db, Guid id) =>
{
    var opp = await db.Opportunities
        .Include(o => o.Organization)
        .FirstOrDefaultAsync(o => o.Id == id);

    return opp != null ? Results.Ok(opp) : Results.NotFound();
});

// Recruiter: Publish Opportunity
app.MapPost("/api/v1/opportunities", async (AmalDbContext db, CreateOpportunityRequest req) =>
{
    var opp = new Opportunity
    {
        OrganizationId = req.OrganizationId,
        Title = req.Title,
        TitleAr = req.TitleAr ?? req.Title,
        Description = req.Description,
        DescriptionAr = req.DescriptionAr ?? req.Description,
        Category = req.Category,
        Type = req.Type,
        Arrangement = req.Arrangement,
        Location = req.Location,
        ExperienceLevel = req.ExperienceLevel,
        MinSalary = req.MinSalary,
        MaxSalary = req.MaxSalary,
        Currency = req.Currency,
        Requirements = req.Requirements,
        Status = OpportunityStatus.Approved // Set approved directly for demo/production testing
    };

    db.Opportunities.Add(opp);
    await db.SaveChangesAsync();

    return Results.Created($"/api/v1/opportunities/{opp.Id}", opp);
});

// Admin: Moderate (Approve/Reject) Opportunity
app.MapPatch("/api/v1/admin/opportunities/{id:guid}/status", async (AmalDbContext db, Guid id, UpdateStatusRequest req) =>
{
    var opp = await db.Opportunities.FindAsync(id);
    if (opp == null) return Results.NotFound();

    opp.Status = req.Status;
    await db.SaveChangesAsync();
    return Results.Ok(opp);
});

// Applications: Submit Application
app.MapPost("/api/v1/applications", async (AmalDbContext db, SubmitApplicationRequest req) =>
{
    var exists = await db.Applications.AnyAsync(a => a.OpportunityId == req.OpportunityId && a.ApplicantId == req.ApplicantId);
    if (exists)
    {
        return Results.BadRequest(new { message = "You have already applied to this opportunity." });
    }

    var candidateProfile = await db.JobSeekerProfiles.FirstOrDefaultAsync(p => p.UserId == req.ApplicantId);

    var appEntity = new Application
    {
        OpportunityId = req.OpportunityId,
        ApplicantId = req.ApplicantId,
        CoverLetter = req.CoverLetter,
        CvFileName = !string.IsNullOrWhiteSpace(req.CvFileName) ? req.CvFileName : candidateProfile?.CvFileName,
        Status = ApplicationStatus.Submitted
    };

    db.Applications.Add(appEntity);
    await db.SaveChangesAsync();

    return Results.Ok(appEntity);
});

// Applications: Get Applications for Job Seeker
app.MapGet("/api/v1/applications/seeker/{userId:guid}", async (AmalDbContext db, Guid userId) =>
{
    var apps = await db.Applications
        .Include(a => a.Opportunity)
        .ThenInclude(o => o!.Organization)
        .Where(a => a.ApplicantId == userId)
        .OrderByDescending(a => a.SubmittedAt)
        .ToListAsync();

    return Results.Ok(apps);
});

// Applications: Get Applications for Recruiter Organization
app.MapGet("/api/v1/applications/recruiter/{orgId:guid}", async (AmalDbContext db, Guid orgId) =>
{
    var apps = await db.Applications
        .Include(a => a.Opportunity)
        .Include(a => a.Applicant)
        .ThenInclude(u => u!.Profile)
        .Where(a => a.Opportunity!.OrganizationId == orgId)
        .OrderByDescending(a => a.SubmittedAt)
        .Select(a => new
        {
            a.Id,
            a.OpportunityId,
            a.ApplicantId,
            a.CoverLetter,
            a.CvFileName,
            Status = a.Status.ToString(),
            a.RecruiterNotes,
            a.SubmittedAt,
            a.RecruiterConfirmedEmployment,
            a.CandidateConfirmedEmployment,
            a.EmploymentConfirmedAt,
            Opportunity = a.Opportunity == null ? null : new
            {
                a.Opportunity.Id,
                a.Opportunity.Title,
                a.Opportunity.TitleAr,
                a.Opportunity.Category,
                a.Opportunity.Location,
                a.Opportunity.MinSalary,
                a.Opportunity.MaxSalary,
                a.Opportunity.Currency
            },
            Applicant = a.Applicant == null ? null : new
            {
                a.Applicant.Id,
                a.Applicant.FullName,
                a.Applicant.Email,
                a.Applicant.Phone,
                Profile = a.Applicant.Profile == null ? null : new
                {
                    a.Applicant.Profile.Bio,
                    a.Applicant.Profile.Skills,
                    a.Applicant.Profile.City,
                    a.Applicant.Profile.Education,
                    a.Applicant.Profile.ExperienceYears,
                    a.Applicant.Profile.CvFileName,
                    a.Applicant.Profile.PortfolioUrl
                }
            }
        })
        .ToListAsync();

    return Results.Ok(apps);
});

// Recruiter: Update Application Status (Shortlist, Accept, Reject)
app.MapPatch("/api/v1/applications/{id:guid}/status", async (AmalDbContext db, Guid id, UpdateAppStatusRequest req) =>
{
    var appEntity = await db.Applications.FindAsync(id);
    if (appEntity == null) return Results.NotFound();

    appEntity.Status = req.Status;
    if (req.Notes != null)
    {
        appEntity.RecruiterNotes = req.Notes;
    }

    await db.SaveChangesAsync();
    return Results.Ok(appEntity);
});

// Confirmation: Dual Employment Confirmation Flow
app.MapPost("/api/v1/applications/{id:guid}/confirm-employment", async (AmalDbContext db, Guid id, ConfirmEmploymentRequest req) =>
{
    var appEntity = await db.Applications.FindAsync(id);
    if (appEntity == null) return Results.NotFound();

    if (req.Role == UserRole.Recruiter)
    {
        appEntity.RecruiterConfirmedEmployment = req.Confirmed;
    }
    else if (req.Role == UserRole.JobSeeker)
    {
        appEntity.CandidateConfirmedEmployment = req.Confirmed;
    }

    if (appEntity.RecruiterConfirmedEmployment && appEntity.CandidateConfirmedEmployment)
    {
        appEntity.EmploymentConfirmedAt = DateTime.UtcNow;
    }

    await db.SaveChangesAsync();
    return Results.Ok(appEntity);
});

// Admin: System Metrics
app.MapGet("/api/v1/admin/metrics", async (AmalDbContext db) =>
{
    var totalSeekers = await db.Users.CountAsync(u => u.Role == UserRole.JobSeeker);
    var totalRecruiters = await db.Users.CountAsync(u => u.Role == UserRole.Recruiter);
    var totalOpportunities = await db.Opportunities.CountAsync();
    var pendingOpportunities = await db.Opportunities.CountAsync(o => o.Status == OpportunityStatus.PendingReview);
    var totalApplications = await db.Applications.CountAsync();
    var confirmedEmployments = await db.Applications.CountAsync(a => a.EmploymentConfirmedAt != null);

    return Results.Ok(new
    {
        totalSeekers,
        totalRecruiters,
        totalOpportunities,
        pendingOpportunities,
        totalApplications,
        confirmedEmployments
    });
});

// Job Seeker: Get Profile
app.MapGet("/api/v1/profile/seeker/{userId:guid}", async (AmalDbContext db, Guid userId) =>
{
    var profile = await db.JobSeekerProfiles
        .Include(p => p.User)
        .FirstOrDefaultAsync(p => p.UserId == userId);

    if (profile == null)
    {
        var user = await db.Users.FindAsync(userId);
        if (user == null) return Results.NotFound();

        profile = new JobSeekerProfile
        {
            UserId = userId,
            ProfessionalHeadline = "Software Developer from Gaza",
            Bio = "Skilled technology professional based in Gaza, seeking remote opportunities.",
            City = "Gaza City",
            Skills = "React, C#, TypeScript",
            Education = "Bachelor's Degree",
            ExperienceYears = "3-5 years"
        };
        db.JobSeekerProfiles.Add(profile);
        await db.SaveChangesAsync();
    }

    return Results.Ok(new
    {
        profile.Id,
        profile.UserId,
        profile.ProfessionalHeadline,
        profile.Bio,
        profile.Country,
        profile.City,
        profile.ProfessionalStatus,
        profile.MainCategory,
        profile.Skills,
        profile.Education,
        profile.ExperienceYears,
        profile.Languages,
        profile.PortfolioUrl,
        profile.CvFileName,
        profile.ProfileCompletionPercentage,
        FullName = profile.User?.FullName,
        Email = profile.User?.Email,
        Phone = profile.User?.Phone
    });
});

// Job Seeker: Update Profile
app.MapPut("/api/v1/profile/seeker/{userId:guid}", async (AmalDbContext db, Guid userId, UpdateProfileRequest req) =>
{
    var profile = await db.JobSeekerProfiles
        .Include(p => p.User)
        .FirstOrDefaultAsync(p => p.UserId == userId);

    if (profile == null)
    {
        profile = new JobSeekerProfile { UserId = userId };
        db.JobSeekerProfiles.Add(profile);
    }

    profile.ProfessionalHeadline = req.ProfessionalHeadline ?? profile.ProfessionalHeadline;
    profile.Bio = req.Bio ?? profile.Bio;
    profile.City = req.City ?? profile.City;
    profile.Skills = req.Skills ?? profile.Skills;
    profile.Education = req.Education ?? profile.Education;
    profile.ExperienceYears = req.ExperienceYears ?? profile.ExperienceYears;
    profile.Languages = req.Languages ?? profile.Languages;
    profile.PortfolioUrl = req.PortfolioUrl ?? profile.PortfolioUrl;
    profile.MainCategory = req.MainCategory ?? profile.MainCategory;

    if (profile.User != null && !string.IsNullOrWhiteSpace(req.FullName))
    {
        profile.User.FullName = req.FullName;
    }
    if (profile.User != null && !string.IsNullOrWhiteSpace(req.Phone))
    {
        profile.User.Phone = req.Phone;
    }

    // Calculate dynamic completion score
    int score = 30; // base score for registered user
    if (!string.IsNullOrWhiteSpace(profile.ProfessionalHeadline)) score += 15;
    if (!string.IsNullOrWhiteSpace(profile.Bio)) score += 15;
    if (!string.IsNullOrWhiteSpace(profile.Skills)) score += 10;
    if (!string.IsNullOrWhiteSpace(profile.Education)) score += 10;
    if (!string.IsNullOrWhiteSpace(profile.PortfolioUrl)) score += 10;
    if (!string.IsNullOrWhiteSpace(profile.CvFileName)) score += 10;
    profile.ProfileCompletionPercentage = Math.Min(score, 100);

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        profile.Id,
        profile.UserId,
        profile.ProfessionalHeadline,
        profile.Bio,
        profile.Country,
        profile.City,
        profile.ProfessionalStatus,
        profile.MainCategory,
        profile.Skills,
        profile.Education,
        profile.ExperienceYears,
        profile.Languages,
        profile.PortfolioUrl,
        profile.CvFileName,
        profile.ProfileCompletionPercentage,
        FullName = profile.User?.FullName,
        Email = profile.User?.Email,
        Phone = profile.User?.Phone
    });
});

// Job Seeker: Upload CV / Resume
app.MapPost("/api/v1/profile/seeker/{userId:guid}/cv", async (AmalDbContext db, Guid userId, HttpRequest req) =>
{
    if (!req.HasFormContentType || !req.Form.Files.Any())
    {
        return Results.BadRequest(new { message = "No file uploaded" });
    }

    var file = req.Form.Files[0];
    if (file.Length == 0)
    {
        return Results.BadRequest(new { message = "Empty file uploaded" });
    }

    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
    var allowedExtensions = new[] { ".pdf", ".docx", ".doc" };
    if (!allowedExtensions.Contains(ext))
    {
        return Results.BadRequest(new { message = "Only PDF, DOC, or DOCX formats are allowed." });
    }

    if (file.Length > 10 * 1024 * 1024)
    {
        return Results.BadRequest(new { message = "File size cannot exceed 10MB." });
    }

    var profile = await db.JobSeekerProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
    if (profile == null)
    {
        return Results.NotFound(new { message = "Candidate profile not found." });
    }

    var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "cvs");
    if (!Directory.Exists(uploadDir))
    {
        Directory.CreateDirectory(uploadDir);
    }

    var safeBase = Path.GetFileNameWithoutExtension(file.FileName);
    safeBase = string.Join("_", safeBase.Split(Path.GetInvalidFileNameChars()));
    var storedFileName = $"{userId.ToString().Substring(0, 8)}_{DateTime.UtcNow.Ticks}_{safeBase}{ext}";
    var targetPath = Path.Combine(uploadDir, storedFileName);

    using (var stream = new FileStream(targetPath, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    profile.CvFileName = storedFileName;

    // Recalculate completion score
    int score = 30;
    if (!string.IsNullOrWhiteSpace(profile.ProfessionalHeadline)) score += 15;
    if (!string.IsNullOrWhiteSpace(profile.Bio)) score += 15;
    if (!string.IsNullOrWhiteSpace(profile.Skills)) score += 10;
    if (!string.IsNullOrWhiteSpace(profile.Education)) score += 10;
    if (!string.IsNullOrWhiteSpace(profile.PortfolioUrl)) score += 10;
    if (!string.IsNullOrWhiteSpace(profile.CvFileName)) score += 10;
    profile.ProfileCompletionPercentage = Math.Min(score, 100);

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        message = "CV uploaded successfully",
        fileName = storedFileName,
        originalName = file.FileName,
        profileCompletionPercentage = profile.ProfileCompletionPercentage,
        downloadUrl = $"/api/v1/files/cv/{storedFileName}"
    });
});

// File Serving: Serve / Download Candidate CV
app.MapGet("/api/v1/files/cv/{fileName}", (string fileName) =>
{
    var cleanName = Path.GetFileName(fileName);
    var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "cvs");
    var filePath = Path.Combine(uploadDir, cleanName);

    if (!File.Exists(filePath))
    {
        return Results.NotFound(new { message = "Requested CV file was not found." });
    }

    var ext = Path.GetExtension(cleanName).ToLowerInvariant();
    var contentType = ext switch
    {
        ".pdf" => "application/pdf",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".doc" => "application/msword",
        _ => "application/octet-stream"
    };

    return Results.File(filePath, contentType, fileDownloadName: cleanName, enableRangeProcessing: true);
});

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapFallbackToFile("index.html");

var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Run($"http://0.0.0.0:{port}");

// Request Records
public record LoginRequest(string Email, string Password);
public record CreateOpportunityRequest(
    Guid OrganizationId, 
    string Title, 
    string? TitleAr, 
    string Description, 
    string? DescriptionAr, 
    string Category, 
    OpportunityType Type, 
    WorkArrangement Arrangement, 
    string Location, 
    string ExperienceLevel, 
    decimal MinSalary, 
    decimal MaxSalary, 
    string Currency, 
    string Requirements
);
public record UpdateStatusRequest(OpportunityStatus Status);
public record SubmitApplicationRequest(Guid OpportunityId, Guid ApplicantId, string CoverLetter, string? CvFileName = null);
public record UpdateAppStatusRequest(ApplicationStatus Status, string? Notes);
public record ConfirmEmploymentRequest(UserRole Role, bool Confirmed);
public record UpdateProfileRequest(
    string? FullName,
    string? Phone,
    string? ProfessionalHeadline,
    string? Bio,
    string? City,
    string? MainCategory,
    string? Skills,
    string? Education,
    string? ExperienceYears,
    string? Languages,
    string? PortfolioUrl
);
