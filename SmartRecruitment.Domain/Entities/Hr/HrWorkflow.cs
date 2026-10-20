namespace SmartRecruitment.Domain.Hr;

/// <summary>
/// Workflow constants of Feature 4 (HR: Applicants &amp; Interviews).
/// Stored as plain strings in the database (same approach as <c>userRole</c>).
/// </summary>
public static class HrWorkflow
{
    public static class ApplicationStatuses
    {
        public const string Submitted = "Submitted";
        public const string Shortlisted = "Shortlisted";
        public const string Interview = "Interview";
        public const string Accepted = "Accepted";
        public const string Rejected = "Rejected";
    }

    public static class ApplicationActions
    {
        public const string Shortlist = "shortlist";
        public const string Reject = "reject";
        public const string Accept = "accept";
    }

    public static class InterviewTypes
    {
        public const string Hr = "HR";
        public const string Technical = "Technical";
        public const string Final = "Final";
    }

    public static class InterviewStatuses
    {
        public const string Scheduled = "Scheduled";
        public const string Completed = "Completed";
        public const string Cancelled = "Cancelled";
    }

    public static class InterviewResults
    {
        public const string Passed = "Passed";
        public const string Failed = "Failed";
        public const string Rescheduled = "Rescheduled";
    }
}
