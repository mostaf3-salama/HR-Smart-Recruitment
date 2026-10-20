import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Interview,
  InterviewTab,
  RecordInterviewResultRequest,
  ScheduleInterviewRequest,
  ShortlistedCandidate,
} from '../models/interview.models';

/**
 * Port used by every Interviews screen (mahmoud's part).
 *
 * Swap the implementation in `interviews.routes.ts`:
 *  - `MockInterviewsApi` → while the backend is not ready (current default)
 *  - `HttpInterviewsApi` → as soon as the `/api/hr/...` endpoints exist
 *
 * NOTE (rule from the task sheet): components must never call HttpClient
 * directly — every HTTP call goes through a service like this one.
 */
export abstract class InterviewsApi {
  /** upcoming = Scheduled · past = Completed / Cancelled. */
  abstract getInterviews(tab: InterviewTab): Observable<Interview[]>;

  /** Shortlisted candidates that can receive a new interview. */
  abstract getShortlistedCandidates(): Observable<ShortlistedCandidate[]>;

  /** Schedule an interview for a Shortlisted candidate. */
  abstract scheduleInterview(request: ScheduleInterviewRequest): Observable<Interview>;

  /** Record the result + notes of a finished interview. */
  abstract recordResult(id: number, request: RecordInterviewResultRequest): Observable<Interview>;

  /** Cancel a scheduled interview. */
  abstract cancelInterview(id: number): Observable<Interview>;
}

export const INTERVIEWS_API = new InjectionToken<InterviewsApi>('HR.InterviewsApi');
