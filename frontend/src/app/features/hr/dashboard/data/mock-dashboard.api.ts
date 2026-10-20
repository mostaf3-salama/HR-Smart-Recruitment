import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { DashboardApi } from './dashboard-api';
import { DashboardStats } from '../models/dashboard.models';
/** Simulated network latency so Loading states can be seen. */
const LATENCY_MS = 450;
/**
 * Force a state for QA while the backend is missing:
 *  ?hrMock=error  → the call fails (test the Error state)
 */
function forcedState(): 'error' | null {
  return new URLSearchParams(window.location.search).get('hrMock') === 'error' ? 'error' : null;
}
/** Demo data — delete this file once HttpDashboardApi is wired to the real backend. */
const STATS: DashboardStats = {
  activeJobs: 5,
  totalApplicants: 32,
  shortlistedCount: 9,
  upcomingInterviewsCount: 3,
  acceptedCount: 4,
  rejectedCount: 11,
  upcomingInterviews: [
    {
      id: 502,
      candidateName: 'Ahmed Samy Abdelaziz',
      jobTitle: 'Front-End Developer (Angular)',
      type: 'HR',
      scheduledAt: '2026-10-13T10:00:00',
      location: 'Head office — Nasr City',
    },
    {
      id: 501,
      candidateName: 'Mostafa Elnagar',
      jobTitle: 'Front-End Developer (Angular)',
      type: 'Technical',
      scheduledAt: '2026-10-14T17:00:00',
      location: 'Online – Google Meet',
    },
    {
      id: 503,
      candidateName: 'Youssef Hagagy',
      jobTitle: 'Backend Developer (.NET)',
      type: 'Technical',
      scheduledAt: '2026-10-15T12:30:00',
      location: 'Online – Microsoft Teams',
    },
  ],
  applicantsByStatus: [
    { status: 'Submitted', count: 8 },
    { status: 'Shortlisted', count: 9 },
    { status: 'Interview', count: 0 },
    { status: 'Accepted', count: 4 },
    { status: 'Rejected', count: 11 },
  ],
};
/** In-memory implementation — delete together with the STATS data when the API is ready. */
@Injectable()
export class MockDashboardApi extends DashboardApi {
  getStats(): Observable<DashboardStats> {
    if (forcedState() === 'error') {
      return throwError(() => new Error('Mock network error')).pipe(delay(LATENCY_MS)) as Observable<DashboardStats>;
    }
    return of(structuredClone(STATS)).pipe(delay(LATENCY_MS));
  }
}