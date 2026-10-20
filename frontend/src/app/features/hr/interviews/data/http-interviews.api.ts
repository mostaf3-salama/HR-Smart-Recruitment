import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { InterviewsApi } from './interviews-api';
import {
  Interview,
  InterviewTab,
  RecordInterviewResultRequest,
  ScheduleInterviewRequest,
  ShortlistedCandidate,
} from '../models/interview.models';

/**
 * Real HTTP implementation.
 *
 * Backend: HrInterviewsController (route /api/hr) + migration
 * Feature4_HrWorkflow. To run it locally: SQL Server +
 * `dotnet ef database update`, then run the API.
 * Adjust only the mapping below if the backend DTOs change.
 */
@Injectable()
export class HttpInterviewsApi extends InterviewsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/hr`;

  getInterviews(tab: InterviewTab): Observable<Interview[]> {
    const params = new HttpParams().set('tab', tab);
    return this.http
      .get<Interview[]>(`${this.baseUrl}/interviews`, { params })
      .pipe(map((rows) => rows.map((row) => this.toInterview(row))));
  }

  getShortlistedCandidates(): Observable<ShortlistedCandidate[]> {
    return this.http.get<ShortlistedCandidate[]>(`${this.baseUrl}/applications`, {
      params: new HttpParams().set('status', 'Shortlisted'),
    });
  }

  scheduleInterview(request: ScheduleInterviewRequest): Observable<Interview> {
    return this.http
      .post<Interview>(`${this.baseUrl}/interviews`, request)
      .pipe(map((row) => this.toInterview(row)));
  }

  recordResult(id: number, request: RecordInterviewResultRequest): Observable<Interview> {
    return this.http
      .patch<Interview>(`${this.baseUrl}/interviews/${id}/result`, request)
      .pipe(map((row) => this.toInterview(row)));
  }

  cancelInterview(id: number): Observable<Interview> {
    return this.http
      .delete<Interview>(`${this.baseUrl}/interviews/${id}`)
      .pipe(map((row) => this.toInterview(row)));
  }

  /** Maps the backend payload into the UI model (kept in ONE place only). */
  private toInterview(row: Interview): Interview {
    return {
      id: Number(row.id),
      applicationId: Number(row.applicationId),
      candidateName: String(row.candidateName ?? ''),
      jobId: Number(row.jobId ?? 0),
      jobTitle: String(row.jobTitle ?? ''),
      type: row.type,
      scheduledAt: String(row.scheduledAt),
      location: row.location ? String(row.location) : undefined,
      status: row.status,
      result: row.result ?? null,
      notes: row.notes ? String(row.notes) : undefined,
      createdBy: row.createdBy ? String(row.createdBy) : undefined,
      updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
    };
  }
}
