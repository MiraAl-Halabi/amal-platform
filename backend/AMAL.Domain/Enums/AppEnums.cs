using System.Text.Json.Serialization;

namespace AMAL.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum UserRole
{
    JobSeeker,
    Recruiter,
    Admin
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OpportunityType
{
    FullTime,
    PartTime,
    Remote,
    Freelance,
    Internship,
    Volunteer,
    Scholarship
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum WorkArrangement
{
    Remote,
    Onsite,
    Hybrid
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OpportunityStatus
{
    Draft,
    PendingReview,
    Approved,
    Paused,
    Closed,
    Expired
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ApplicationStatus
{
    Submitted,
    UnderReview,
    Shortlisted,
    Interview,
    Accepted,
    Rejected
}
