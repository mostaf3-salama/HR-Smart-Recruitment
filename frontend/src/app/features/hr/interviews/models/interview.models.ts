/**
 * Feature 4 — HR: Applicants & Interviews
 * Part owned by mahmoud: "المقابلات والـ Dashboard".
 *
 * These models are the contract between the HR UI and the API.
 * The backend has no Interview endpoints yet, so `MockInterviewsApi`
 * is the default — swap to `HttpInterviewsApi` when the API lands.
 */

/** Interview kinds required by the task sheet. */
export const INTERVIEW_TYPES = ['HR', 'Technical', 'Final'] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

/** Lifecycle status of an interview. */
export const INTERVIEW_STATUSES = ['Scheduled', 'Completed', 'Cancelled'] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

/** HR decision recorded after the interview. */
export const INTERVIEW_RESULTS = ['Passed', 'Failed', 'Rescheduled'] as const;
export type InterviewResult = (typeof INTERVIEW_RESULTS)[number];

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  HR: 'HR Interview',
  Technical: 'Technical Interview',
  Final: 'Final Interview',
};

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  Scheduled: 'Scheduled',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
};

export const INTERVIEW_RESULT_LABELS: Record<InterviewResult, string> = {
  Passed: 'Passed ✓',
  Failed: 'Failed ✕',
  Rescheduled: 'Rescheduled ↻',
};

/** Full interview object — the single source of truth for the UI. */
export interface Interview {
  id: number;
  applicationId: number;
  candidateName: string;
  jobId: number;
  jobTitle: string;
  type: InterviewType;
  /** ISO date-time. */
  scheduledAt: string;
  /** Free text: 'Online – Google Meet', office address… */
  location?: string;
  status: InterviewStatus;
  /** `null` until the result is recorded. */
  result: InterviewResult | null;
  notes?: string;
  createdBy?: string;
  updatedAt?: string;
}

/** Tabs of `/hr/interviews`. */
export type InterviewTab = 'upcoming' | 'past';

/** Body of "schedule an interview" — only Shortlisted candidates. */
export interface ScheduleInterviewRequest {
  applicationId: number;
  type: InterviewType;
  /** ISO date-time built from the `datetime-local` input. */
  scheduledAt: string;
  location?: string;
}

/** Body of "record the interview result". */
export interface RecordInterviewResultRequest {
  result: InterviewResult;
  notes?: string;
}

/** Candidate option of the schedule form (Shortlisted only). */
export interface ShortlistedCandidate {
  applicationId: number;
  candidateName: string;
  jobTitle: string;
}

/** View-model of the interviews page. */
export interface InterviewListVm {
  loading: boolean;
  error: string | null;
  interviews: Interview[];
}
