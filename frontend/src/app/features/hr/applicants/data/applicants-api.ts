import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApplicantDetails,
  ApplicantListItem,
  ApplicantsQuery,
  UpdateApplicantStatusRequest,
} from '../models/applicant.models';

/**
 * Port used by every Applicants screen.
 *
 * Swap the implementation in `applicants.routes.ts`:
 *  - `MockApplicantsApi` → while the backend is not ready (current default)
 *  - `HttpApplicantsApi` → as soon as the `/api/hr/...` endpoints exist
 *
 * NOTE (rule from the task sheet): components must never call HttpClient
 * directly — every HTTP call goes through a service like this one.
 */
export abstract class ApplicantsApi {
  /** Applicants of a job, sorted by matchScore DESC. */
  abstract getApplicantsByJob(jobId: number, query: ApplicantsQuery): Observable<ApplicantListItem[]>;

  /** Full candidate file (match score, ML feedback, CV, history…). */
  abstract getApplicationDetails(applicationId: number): Observable<ApplicantDetails>;
  /** shortlist / reject / accept — returns the updated application. */
  abstract updateStatus(
    applicationId: number,
    request: UpdateApplicantStatusRequest,
  ): Observable<ApplicantDetails>;
  /** Returns the CV as a Blob so the UI can preview / download it. */
  abstract downloadCv(applicationId: number): Observable<Blob>;
}
export const APPLICANTS_API = new InjectionToken<ApplicantsApi>('HR.ApplicantsApi');
