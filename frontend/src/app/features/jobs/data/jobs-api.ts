import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateJobRequest, Job, MyHr, UpdateJobRequest } from '../models/job.models';

/**
 * Port for everything Jobs (Feature 2).
 * The backend is ready, so this ships with the HTTP implementation only.
 * NOTE (rule from the task sheet): components never call HttpClient directly.
 */
export abstract class JobsApi {
  abstract getJobs(activeOnly?: boolean): Observable<Job[]>;
  abstract getJob(id: number): Observable<Job>;
  abstract createJob(request: CreateJobRequest): Observable<Job>;
  abstract updateJob(id: number, request: UpdateJobRequest): Observable<void>;
  abstract toggleActive(id: number): Observable<void>;
  abstract deleteJob(id: number): Observable<void>;
  /** HR identity of the caller (needed as `hrid` when posting a job). */
  abstract getMyHr(): Observable<MyHr>;
}

export const JOBS_API = new InjectionToken<JobsApi>('JobsApi');
