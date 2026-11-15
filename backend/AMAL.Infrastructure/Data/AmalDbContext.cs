using Microsoft.EntityFrameworkCore;
using AMAL.Domain.Entities;

namespace AMAL.Infrastructure.Data;

public class AmalDbContext : DbContext
{
    public AmalDbContext(DbContextOptions<AmalDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<JobSeekerProfile> JobSeekerProfiles => Set<JobSeekerProfile>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<RecruiterProfile> RecruiterProfiles => Set<RecruiterProfile>();
    public DbSet<Opportunity> Opportunities => Set<Opportunity>();
    public DbSet<AMAL.Domain.Entities.Application> Applications => Set<AMAL.Domain.Entities.Application>();
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<JobSeekerProfile>()
            .HasOne(p => p.User)
            .WithOne(u => u.Profile)
            .HasForeignKey<JobSeekerProfile>(p => p.UserId);

        modelBuilder.Entity<RecruiterProfile>()
            .HasOne(r => r.User)
            .WithOne(u => u.Recruiter)
            .HasForeignKey<RecruiterProfile>(r => r.UserId);

        modelBuilder.Entity<Opportunity>()
            .HasOne(o => o.Organization)
            .WithMany(org => org.Opportunities)
            .HasForeignKey(o => o.OrganizationId);

        modelBuilder.Entity<AMAL.Domain.Entities.Application>()
            .HasOne(a => a.Opportunity)
            .WithMany(o => o.Applications)
            .HasForeignKey(a => a.OpportunityId);

        modelBuilder.Entity<AMAL.Domain.Entities.Application>()
            .HasOne(a => a.Applicant)
            .WithMany()
            .HasForeignKey(a => a.ApplicantId);
    }
}
