import { HttpClient, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, filter, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApplicantDetails } from '../../hr/applicants/models/applicant.models';
import { CandidateApi } from './candidate-api';
import { CandidateProfile, CvAnalysis, MyApplication, RecommendedJob, UpsertProfileRequest, UploadProgress } from '../models/candidate.models';

/** Real HTTP implementation (backend: CandidateController). */
@Injectable()
export class HttpCandidateApi extends CandidateApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/Candidate`;

  getMyProfile(): Observable<CandidateProfile> {
    return this.http.get<CandidateProfile>(`${this.baseUrl}/profile`);
  }

  upsertProfile(request: UpsertProfileRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/profile`, request);
  }

  uploadCv(file: File): Observable<UploadProgress> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http
      .post(`${this.baseUrl}/upload-cv`, form, { reportProgress: true, observe: 'events' })
      .pipe(
        filter((event) => event.type === HttpEventType.UploadProgress || event.type === HttpEventType.Response),
        map((event) => {
          if (event.type === HttpEventType.Response) return 100;
          const total = event.total ?? file.size;
          return total > 0 ? Math.round((event.loaded / total) * 100) : 0;
        }),
      );
  }

  applyForJob(jobId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/apply-job`, { jobId });
  }

  getMyApplications(): Observable<MyApplication[]> {
    return this.http.get<MyApplication[]>(`${this.baseUrl}/my-applications`);
  }

  getMyApplicationDetails(id: number): Observable<ApplicantDetails> {
    return this.http.get<ApplicantDetails>(`${this.baseUrl}/my-applications/${id}`);
  }

  getRecommendedJobs(): Observable<RecommendedJob[]> {
    return this.http.get<RecommendedJob[]>(`${this.baseUrl}/recommended-jobs`);
  }

  getCvAnalysis(): Observable<CvAnalysis> {
    return this.http.get<CvAnalysis>(`${this.baseUrl}/cv-analysis`);
  }

  refreshRecommendations(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/recommended-jobs/refresh`, {});
  }
}
