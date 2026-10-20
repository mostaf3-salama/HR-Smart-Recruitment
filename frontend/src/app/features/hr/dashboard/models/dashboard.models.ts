/**
 * Feature 4 — HR: Applicants & Interviews
 * Part owned by mahmoud: "المقابلات والـ Dashboard".
 *
 * Simple HR dashboard: active jobs, applicants, upcoming interviews.
 */

/** One upcoming interview shown in the dashboard side list. */
export interface UpcomingInterviewItem {
  id: number;
  candidateName: string;
  jobTitle: string;
  type: string;
  scheduledAt: string; // ISO date-time
  location?: string;
}

/** Applicants grouped by status (for the status bars). */
export interface ApplicantsByStatus {
  status: string;
  count: number;
}

export interface DashboardStats {
  activeJobs: number;
  totalApplicants: number;
  shortlistedCount: number;
  upcomingInterviewsCount: number;
  acceptedCount: number;
  rejectedCount: number;
  upcomingInterviews: UpcomingInterviewItem[];
  applicantsByStatus: ApplicantsByStatus[];
}

/** View-model of the dashboard page. */
export interface DashboardVm {
  loading: boolean;
  error: string | null;
  stats: DashboardStats | null;
}
