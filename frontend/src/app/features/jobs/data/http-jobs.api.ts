import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { JobsApi } from './jobs-api';
import { CreateJobRequest, Job, MyHr, UpdateJobRequest } from '../models/job.models';

/** Real HTTP implementation (backend: JobController + GET /api/hr/me). */
@Injectable()
export class HttpJobsApi extends JobsApi {
  private readonly http = inject(HttpClient);
  private readonly jobsUrl = `${environment.apiBaseUrl}/Job`;
  private readonly hrUrl = `${environment.apiBaseUrl}/hr`;

  getJobs(activeOnly = false): Observable<Job[]> {
    let params = new HttpParams();
    if (activeOnly) params = params.set('activeOnly', 'true');
    return this.http.get<Job[]>(this.jobsUrl, { params });
  }

  getJob(id: number): Observable<Job> {
    return this.http.get<Job>(`${this.jobsUrl}/${id}`);
  }

  createJob(request: CreateJobRequest): Observable<Job> {
    return this.http.post<Job>(this.jobsUrl, request);
  }

  updateJob(id: number, request: UpdateJobRequest): Observable<void> {
    return this.http.put<void>(`${this.jobsUrl}/${id}`, request);
  }

  toggleActive(id: number): Observable<void> {
    return this.http.patch<void>(`${this.jobsUrl}/${id}/toggle-status`, {});
  }

  deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`${this.jobsUrl}/${id}`);
  }

  getMyHr(): Observable<MyHr> {
    return this.http.get<MyHr>(`${this.hrUrl}/me`);
  }
}
