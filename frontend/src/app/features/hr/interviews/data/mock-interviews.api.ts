import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { InterviewsApi } from './interviews-api';
import {
  Interview,
  InterviewTab,
  RecordInterviewResultRequest,
  ScheduleInterviewRequest,
  ShortlistedCandidate,
} from '../models/interview.models';

/** Simulated network latency so Loading states can be seen. */
const LATENCY_MS = 450;

/**
 * Force a state for QA while the backend is missing:
 *  ?hrMock=error  → every call fails (test the Error state)
 *  ?hrMock=empty  → every list is empty (test the Empty state)
 */
function forcedState(): 'error' | 'empty' | null {
  const value = new URLSearchParams(window.location.search).get('hrMock');
  return value === 'error' || value === 'empty' ? value : null;
}

/** Demo data — delete this file once HttpInterviewsApi is wired to the real backend. */
const SEED: Interview[] = [
  {
    id: 502,
    applicationId: 1001,
    candidateName: 'Ahmed Samy Abdelaziz',
    jobId: 1,
    jobTitle: 'Front-End Developer (Angular)',
    type: 'HR',
    scheduledAt: '2026-10-13T10:00:00',
    location: 'Head office — Nasr City, 3rd floor',
    status: 'Scheduled',
    result: null,
    createdBy: 'Mahmoud (HR)',
  },
  {
    id: 501,
    applicationId: 1004,
    candidateName: 'Mostafa Elnagar',
    jobId: 1,
    jobTitle: 'Front-End Developer (Angular)',
    type: 'Technical',
    scheduledAt: '2026-10-14T17:00:00',
    location: 'Online – Google Meet',
    status: 'Scheduled',
    result: null,
    createdBy: 'Mahmoud (HR)',
  },
  {
    id: 503,
    applicationId: 2002,
    candidateName: 'Youssef Hagagy',
    jobId: 2,
    jobTitle: 'Backend Developer (.NET)',
    type: 'Technical',
    scheduledAt: '2026-10-15T12:30:00',
    location: 'Online – Microsoft Teams',
    status: 'Scheduled',
    result: null,
    createdBy: 'Mahmoud (HR)',
  },
  {
    id: 500,
    applicationId: 1007,
    candidateName: 'Omar Khaled Elmansoury',
    jobId: 1,
    jobTitle: 'Front-End Developer (Angular)',
    type: 'Technical',
    scheduledAt: '2026-09-25T14:00:00',
    location: 'Online – Google Meet',
    status: 'Completed',
    result: 'Failed',
    notes: 'Good Angular basics, but RxJS and state management are weak. Rejection recommended.',
    createdBy: 'Mahmoud (HR)',
    updatedAt: '2026-09-25T15:30:00',
  },
  {
    id: 499,
    applicationId: 2003,
    candidateName: 'Laila Hassan Ali',
    jobId: 2,
    jobTitle: 'Backend Developer (.NET)',
    type: 'Final',
    scheduledAt: '2026-09-20T11:00:00',
    location: 'Head office — Nasr City, 3rd floor',
    status: 'Completed',
    result: 'Passed',
    notes: 'Excellent in system design and behavioral questions. Strong candidate for the final offer.',
    createdBy: 'Mahmoud (HR)',
    updatedAt: '2026-09-20T12:15:00',
  },
  {
    id: 498,
    applicationId: 1008,
    candidateName: 'Karim Adel Sherif',
    jobId: 1,
    jobTitle: 'Front-End Developer (Angular)',
    type: 'HR',
    scheduledAt: '2026-09-18T09:30:00',
    location: 'Online – Zoom',
    status: 'Cancelled',
    result: null,
    notes: 'The applicant asked to cancel for personal reasons.',
    createdBy: 'Mahmoud (HR)',
    updatedAt: '2026-09-17T20:00:00',
  },
];

/** Shortlisted candidates available for scheduling (mirrors mostafa's mock data). */
const SHORTLISTED: ShortlistedCandidate[] = [
  { applicationId: 1001, candidateName: 'Ahmed Samy Abdelaziz', jobTitle: 'Front-End Developer (Angular)' },
  { applicationId: 1002, candidateName: 'Mona Abdelrahman Khalil', jobTitle: 'Front-End Developer (Angular)' },
  { applicationId: 2002, candidateName: 'Youssef Hagagy', jobTitle: 'Backend Developer (.NET)' },
  { applicationId: 2001, candidateName: 'Sara Ibrahim Mansour', jobTitle: 'Backend Developer (.NET)' },
];

/** In-memory implementation — delete together with the SEED data when the API is ready. */
@Injectable()
export class MockInterviewsApi extends InterviewsApi {
  private readonly store: Interview[] = SEED.map((interview) => ({ ...interview }));
  private nextId = 1000;

  getInterviews(tab: InterviewTab): Observable<Interview[]> {
    if (forcedState() === 'error') {
      return throwError(() => new Error('Mock network error')).pipe(delay(LATENCY_MS)) as Observable<Interview[]>;
    }

    const items = this.store
      .filter((interview) => (tab === 'upcoming' ? interview.status === 'Scheduled' : interview.status !== 'Scheduled'))
      .sort((a, b) =>
        tab === 'upcoming'
          ? a.scheduledAt.localeCompare(b.scheduledAt) // الأقرب أولاً
          : b.scheduledAt.localeCompare(a.scheduledAt), // الأحدث أولاً
      )
      .map((interview) => ({ ...interview }));

    return of(forcedState() === 'empty' ? [] : items).pipe(delay(LATENCY_MS));
  }

  getShortlistedCandidates(): Observable<ShortlistedCandidate[]> {
    if (forcedState() === 'error') {
      return throwError(() => new Error('Mock network error')).pipe(delay(LATENCY_MS)) as Observable<ShortlistedCandidate[]>;
    }
    return of(SHORTLISTED.map((candidate) => ({ ...candidate }))).pipe(delay(200));
  }

  scheduleInterview(request: ScheduleInterviewRequest): Observable<Interview> {
    const candidate = SHORTLISTED.find((c) => c.applicationId === request.applicationId);
    if (!candidate) {
      return throwError(() => new Error('This applicant is not Shortlisted (Mock)')) as unknown as Observable<Interview>;
    }

    const interview: Interview = {
      id: this.nextId++,
      applicationId: candidate.applicationId,
      candidateName: candidate.candidateName,
      jobId: 0,
      jobTitle: candidate.jobTitle,
      type: request.type,
      scheduledAt: request.scheduledAt,
      location: request.location?.trim() || undefined,
      status: 'Scheduled',
      result: null,
      createdBy: 'Mahmoud (HR)',
    };
    this.store.push(interview);
    return of({ ...interview }).pipe(delay(300));
  }

  recordResult(id: number, request: RecordInterviewResultRequest): Observable<Interview> {
    const found = this.store.find((interview) => interview.id === id);
    if (!found || found.status !== 'Scheduled') {
      return throwError(() => new Error('This interview is not available for recording a result (Mock)')) as unknown as Observable<Interview>;
    }

    if (request.result === 'Rescheduled') {
      // التأجيل = إلغاء دي + مطلوب جدولة جديدة من نفس الصفحة.
      found.status = 'Cancelled';
      found.result = 'Rescheduled';
    } else {
      found.status = 'Completed';
      found.result = request.result;
    }
    found.notes = request.notes?.trim() || undefined;
    found.updatedAt = new Date().toISOString();
    return of({ ...found }).pipe(delay(300));
  }

  cancelInterview(id: number): Observable<Interview> {
    const found = this.store.find((interview) => interview.id === id);
    if (!found || found.status !== 'Scheduled') {
      return throwError(() => new Error('This interview is not available for cancellation (Mock)')) as unknown as Observable<Interview>;
    }
    found.status = 'Cancelled';
    found.updatedAt = new Date().toISOString();
    return of({ ...found }).pipe(delay(300));
  }
}
