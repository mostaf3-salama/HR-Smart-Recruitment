import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApplicantsApi } from './applicants-api';
import {
  ApplicantDetails,
  ApplicantListItem,
  ApplicantsQuery,
  UpdateApplicantStatusRequest,
} from '../models/applicant.models';

/**
 * Real HTTP implementation.
 *
 * Backend: HrApplicantsController (route /api/hr) + migration
 * Feature4_HrWorkflow. To run it locally: SQL Server + 
 * `dotnet ef database update`, then run the API (see backend README notes).
 * Adjust only the mapping below if the backend DTOs change.
 */
@Injectable()
export class HttpApplicantsApi extends ApplicantsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/hr`;

  getApplicantsByJob(jobId: number, query: ApplicantsQuery): Observable<ApplicantListItem[]> {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    if (query.status && query.status !== 'all') params = params.set('status', query.status);

    return this.http
      .get<Record<string, unknown>[]>(`${this.baseUrl}/jobs/${jobId}/applicants`, { params })
      .pipe(map((rows) => rows.map((row) => this.toListItem(row))));
  }
  getApplicationDetails(applicationId: number): Observable<ApplicantDetails> {
    return this.http
      .get<unknown>(`${this.baseUrl}/applications/${applicationId}`)
      .pipe(map((row) => row as ApplicantDetails));
  }
  updateStatus(applicationId: number, request: UpdateApplicantStatusRequest): Observable<ApplicantDetails> {
    return this.http
      .patch<unknown>(`${this.baseUrl}/applications/${applicationId}/status`, request)
      .pipe(map((row) => row as ApplicantDetails));
  }
  downloadCv(applicationId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/applications/${applicationId}/cv`, { responseType: 'blob' });
  }
  /** Maps the backend payload into the UI model (kept in ONE place only). */
  private toListItem(row: Record<string, unknown>): ApplicantListItem {
    return {
      applicationId: Number(row['id'] ?? row['applicationId']),
      jobId: Number(row['jobId']),
      jobTitle: String(row['jobTitle'] ?? ''),
      candidateId: Number(row['candidateId']),
      candidateName: String(row['candidateName'] ?? ''),
      email: String(row['email'] ?? ''),
      phone: row['phone'] ? String(row['phone']) : undefined,
      appliedAt: String(row['appliedAt']),
      status: String(row['status'] ?? 'Submitted') as ApplicantListItem['status'],
      matchScore: row['matchScore'] == null ? null : Number(row['matchScore']),
      skills: Array.isArray(row['skills']) ? (row['skills'] as string[]) : [],
      yearsOfExperience: Number(row['yearsOfExperience'] ?? 0),
      educationLevel: String(row['educationLevel'] ?? ''),
      hasCv: Boolean(row['hasCv'] ?? row['cv']),
    };
  }
}
