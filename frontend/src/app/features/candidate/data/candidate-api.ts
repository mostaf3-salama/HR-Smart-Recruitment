import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { ApplicantDetails } from '../../hr/applicants/models/applicant.models';
import { CandidateProfile, CvAnalysis, MyApplication, RecommendedJob, UpsertProfileRequest, UploadProgress } from '../models/candidate.models';

/**
 * Port for the candidate side (Feature 3).
 * Backend: CandidateController. NOTE: components never call HttpClient directly.
 */
export abstract class CandidateApi {
  abstract getMyProfile(): Observable<CandidateProfile>;
  abstract upsertProfile(request: UpsertProfileRequest): Observable<void>;
  /** Emits 0–100 while uploading, completes when the server confirms. */
  abstract uploadCv(file: File): Observable<UploadProgress>;
  abstract applyForJob(jobId: number): Observable<void>;
  abstract getMyApplications(): Observable<MyApplication[]>;
  abstract getMyApplicationDetails(id: number): Observable<ApplicantDetails>;
  /** AI: jobs ranked for the logged-in candidate (empty list = nothing cached yet). */
  abstract getRecommendedJobs(): Observable<RecommendedJob[]>;
  /** AI: what the pipeline extracted from the uploaded CV. */
  abstract getCvAnalysis(): Observable<CvAnalysis>;
  /** AI: force-regenerates recommendations (re-runs the LLM pipeline). */
  abstract refreshRecommendations(): Observable<void>;
}

export const CANDIDATE_API = new InjectionToken<CandidateApi>('CandidateApi');
