/**
 * Feature 4 — HR: Applicants & Interviews
 * Part owned by Mostafa: "المتقدمين وقرارات الـHR".
 *
 * These models are the contract between the HR UI and the API.
 * They are deliberately independent from the backend DTOs because the
 * backend is not ready yet (no ApplicationController / InterviewController).
 * When the real API lands, only the HTTP adapter has to be re-mapped.
 */
/** Workflow status of an application (mirrors `Application.Status` string on the backend). */
export const APPLICATION_STATUSES = [
  'Submitted',
  'Shortlisted',
  'Interview',
  'Accepted',
  'Rejected',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
/** Filter option of the status select ("all" = بدون فلترة). */
export type ApplicantStatusFilter = ApplicationStatus | 'all';
/** The 3 HR decisions required by the task sheet. */
export type ApplicantAction = 'shortlist' | 'reject' | 'accept';
/** CV file attached to the application (PDF only). */
export interface CvFile {
  fileName: string;
  contentType: string; // 'application/pdf'
  sizeBytes: number;
  /** Direct or signed URL. `null` while the backend has no CV storage yet. */
  url: string | null;
}
export interface StatusHistoryItem {
  status: ApplicationStatus;
  changedAt: string; // ISO date
  changedBy: string; // HR full name, or "النظام" for the initial status
  note?: string;
}
/** Row of the applicants table of a job — sorted by `matchScore` DESC. */
export interface ApplicantListItem {
  applicationId: number;
  jobId: number;
  jobTitle: string;
  candidateId: number;
  candidateName: string;
  email: string;
  phone?: string;
  appliedAt: string; // ISO date
  status: ApplicationStatus;
  /** 0–100, produced by the ML service. `null` = not scored yet. */
  matchScore: number | null;
  /** Declared candidate skills — used by the search box. */
  skills: string[];
  yearsOfExperience: number;
  educationLevel: string;
  hasCv: boolean;
}
export interface EducationItem {
  level: string;
  field?: string;
  university?: string;
  universityTier?: string;
  cgpa?: number;
  graduationYear?: number;
}
export interface ExperienceItem {
  title: string;
  company: string;
  from: string; // ISO date
  to?: string; // ISO date, omit when `isCurrent`
  isCurrent?: boolean;
}
export interface ProjectItem {
  name: string;
  description?: string;
  link?: string;
}
export interface CertificationItem {
  name: string;
  issuer?: string;
  year?: number;
}
/** Full candidate file shown in `/hr/applications/:id`. */
export interface ApplicantDetails extends ApplicantListItem {
  summary?: string;
  /** Skills that match the job's `RequiredSkills`. */
  matchedSkills: string[];
  /** Skills required by the job but missing in the candidate CV. */
  missingSkills: string[];
  /** Human readable feedback produced by the ML model. */
  mlFeedback?: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  cv: CvFile | null;
  statusHistory: StatusHistoryItem[];
  /** Filled as soon as an interview is scheduled (part owned by mahmoud). */
  interview: { id: number; scheduledAt: string; type: string; status: string } | null;
}
/** Query of `GET /hr/jobs/:jobId/applicants`. */
export interface ApplicantsQuery {
  /** Free text: candidate name OR skill. */
  search?: string;
  status?: ApplicantStatusFilter;
}
/** Body of `PATCH /hr/applications/:id/status`. */
export interface UpdateApplicantStatusRequest {
  action: ApplicantAction;
  note?: string;
}
/** View-model of the applicants page. */
export interface ApplicantListVm {
  loading: boolean;
  error: string | null;
  applicants: ApplicantListItem[];
  /** Kept even when the filtered list is empty. */
  jobTitle: string | null;
}