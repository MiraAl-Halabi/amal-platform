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
    else
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
        Status = OpportunityStatus.PendingReview // Requires admin approval per spec
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

    var appEntity = new Application
    {
        OpportunityId = req.OpportunityId,
        ApplicantId = req.ApplicantId,
        CoverLetter = req.CoverLetter,
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
                    a.Applicant.Profile.ExperienceYears
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
public record SubmitApplicationRequest(Guid OpportunityId, Guid ApplicantId, string CoverLetter);
public record UpdateAppStatusRequest(ApplicationStatus Status, string? Notes);
public record ConfirmEmploymentRequest(UserRole Role, bool Confirmed);
