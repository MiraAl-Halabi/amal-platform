using AMAL.Domain.Entities;
using AMAL.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AMAL.Infrastructure.Data;

public static class DbInitializer
{
    public static void Initialize(AmalDbContext context)
    {
        context.Database.EnsureCreated();

        try
        {
            context.Database.ExecuteSqlRaw("ALTER TABLE Applications ADD COLUMN CvFileName TEXT;");
        }
        catch
        {
            // Column already exists or table freshly created
        }

        if (context.Users.Any())
        {
            return; // DB already seeded
        }

        // 1. Seed Organizations
        var techOrg = new Organization
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = "Skyline Digital Solutions (UK & MENA)",
            Description = "Global digital product studio connecting worldwide clients with exceptional Palestinian developers.",
            Industry = "Software & IT",
            Location = "London, UK & Gaza",
            ContactEmail = "careers@skylinedigital.example",
            Website = "https://skylinedigital.example",
            IsVerified = true
        };

        var medicalOrg = new Organization
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Name = "Hope Health Network",
            Description = "International health humanitarian initiative providing telemedicine and research coordination.",
            Industry = "Healthcare & Non-profit",
            Location = "Geneva & Gaza",
            ContactEmail = "hr@hopehealth.example",
            Website = "https://hopehealth.example",
            IsVerified = true
        };

        context.Organizations.AddRange(techOrg, medicalOrg);

        // 2. Seed Users
        var adminUser = new User
        {
            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Email = "admin@amal.ps",
            FullName = "Amal System Administrator",
            Role = UserRole.Admin,
            Phone = "+970599000001",
            PasswordHash = "admin123" // MVP simplified auth
        };

        var recruiterUser = new User
        {
            Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Email = "recruiter@skylinedigital.example",
            FullName = "Tariq Mansour",
            Role = UserRole.Recruiter,
            Phone = "+970599000002",
            PasswordHash = "recruiter123"
        };

        var seekerUser = new User
        {
            Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            Email = "ahmed.gaza@example.com",
            FullName = "Ahmed Al-Masri",
            Role = UserRole.JobSeeker,
            Phone = "+970599000003",
            PasswordHash = "seeker123"
        };

        context.Users.AddRange(adminUser, recruiterUser, seekerUser);

        // 3. Profiles
        var recruiterProfile = new RecruiterProfile
        {
            UserId = recruiterUser.Id,
            OrganizationId = techOrg.Id,
            Position = "Engineering Director"
        };

        var seekerProfile = new JobSeekerProfile
        {
            UserId = seekerUser.Id,
            ProfessionalHeadline = "Senior Full-Stack Engineer | .NET & React Specialist",
            Bio = "Software developer from Gaza City with 5+ years building scalable cloud services, web applications, and resilient APIs. Passionate about contributing to global remote teams.",
            Country = "Palestine",
            City = "Gaza City",
            ProfessionalStatus = "Experienced Professional",
            MainCategory = "Software Engineering",
            Skills = "C#, ASP.NET Core, React, TypeScript, PostgreSQL, Docker, Redis",
            Education = "B.Sc. Software Engineering - Islamic University of Gaza (2020)",
            ExperienceYears = "5 years",
            Languages = "Arabic (Native), English (Fluent - C1)",
            CvFileName = "Ahmed_AlMasri_Resume.pdf",
            PortfolioUrl = "https://github.com/ahmed-amal-demo",
            ProfileCompletionPercentage = 95
        };

        context.RecruiterProfiles.Add(recruiterProfile);
        context.JobSeekerProfiles.Add(seekerProfile);

        // 4. Seed Opportunities
        var opp1 = new Opportunity
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            OrganizationId = techOrg.Id,
            Title = "Senior Full-Stack .NET & React Engineer",
            TitleAr = "مهندس برمجيات أول Full-Stack (.NET و React)",
            Description = "We are seeking a talented Senior Full-Stack Engineer based in Gaza or West Bank to join our international client delivery team. High flexibility, asynchronous workflows, and direct compensation support.",
            DescriptionAr = "نبحث عن مهندس برمجيات متقدم Full-Stack للعمل عن بعد مع فرقنا الدولية. نوفر مرونة كاملة في ساعات العمل، وتواصلاً غير متزامن يلائم ظروف العمل.",
            Category = "Software Engineering",
            Type = OpportunityType.Remote,
            Arrangement = WorkArrangement.Remote,
            Location = "Remote (Gaza / Global)",
            ExperienceLevel = "Senior",
            MinSalary = 2000,
            MaxSalary = 3200,
            Currency = "USD",
            Requirements = "- 4+ years of professional experience in C# / ASP.NET Core.\n- Solid experience in React with TypeScript.\n- Experience in PostgreSQL and relational data design.\n- Ability to work independently with stable asynchronous communication.",
            Status = OpportunityStatus.Approved,
            IsFeatured = true,
            CreatedAt = DateTime.UtcNow.AddDays(-3)
        };

        var opp2 = new Opportunity
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            OrganizationId = techOrg.Id,
            Title = "Bilingual UI/UX & Product Designer (Figma)",
            TitleAr = "مصمم واجهات وتجربة مستخدم UI/UX (عربي / إنجليزي)",
            Description = "Create modern, accessible, human-centric interfaces for bilingual SaaS platforms with RTL/LTR design support.",
            DescriptionAr = "تصميم واجهات مستخدم حديثة وسهلة الوصول تدعم اللغتين العربية والإنجليزية بأنماط RTL و LTR.",
            Category = "Design & Creative",
            Type = OpportunityType.Freelance,
            Arrangement = WorkArrangement.Remote,
            Location = "Remote",
            ExperienceLevel = "Mid-Level",
            MinSalary = 1200,
            MaxSalary = 1800,
            Currency = "USD",
            Requirements = "- Proficient in Figma design systems.\n- Strong portfolio demonstrating accessible and clean RTL/LTR interfaces.\n- Good English communication skills.",
            Status = OpportunityStatus.Approved,
            IsFeatured = true,
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        };

        var opp3 = new Opportunity
        {
            Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            OrganizationId = medicalOrg.Id,
            Title = "Medical Translation & Research Assistant",
            TitleAr = "مساعد بحث وترجمة طبية وإنسانية",
            Description = "Assist in coordinating bilingual medical documentation and health survey data.",
            DescriptionAr = "المساعدة في ترجمة الوثائق الطبية واستطلاعات الرأي الصحية للمبادرات الإنسانية.",
            Category = "Medicine & Healthcare",
            Type = OpportunityType.PartTime,
            Arrangement = WorkArrangement.Remote,
            Location = "Remote (Gaza)",
            ExperienceLevel = "Junior",
            MinSalary = 600,
            MaxSalary = 900,
            Currency = "USD",
            Requirements = "- Background in medicine, pharmacy, or professional medical translation.\n- Native Arabic and excellent English.",
            Status = OpportunityStatus.PendingReview,
            IsFeatured = false,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        context.Opportunities.AddRange(opp1, opp2, opp3);

        // 5. Seed Initial Application
        var app = new AMAL.Domain.Entities.Application
        {
            Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
            OpportunityId = opp1.Id,
            ApplicantId = seekerUser.Id,
            CoverLetter = "Dear Hiring Team, I have been building high-performance .NET Core and React applications for over 5 years. I am resilient, detail-oriented, and excited to contribute to Skyline Digital Solutions from Gaza.",
            Status = ApplicationStatus.UnderReview,
            SubmittedAt = DateTime.UtcNow.AddDays(-1)
        };

        context.Applications.Add(app);

        context.SaveChanges();
    }
}
