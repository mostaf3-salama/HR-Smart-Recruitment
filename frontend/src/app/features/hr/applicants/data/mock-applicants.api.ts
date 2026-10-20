import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { ApplicantsApi } from './applicants-api';
import {
  ApplicantAction,
  ApplicantDetails,
  ApplicantListItem,
  ApplicantsQuery,
  ApplicantStatusFilter,
  APPLICATION_STATUSES,
  ApplicationStatus,
  UpdateApplicantStatusRequest,
} from '../models/applicant.models';

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

function defaults(
  partial: Partial<ApplicantDetails> &
    Pick<ApplicantDetails, 'applicationId' | 'jobId' | 'jobTitle' | 'candidateId' | 'candidateName'>,
): ApplicantDetails {
  return {
    email: '',
    appliedAt: '2026-10-01T09:00:00Z',
    status: 'Submitted',
    matchScore: null,
    skills: [],
    yearsOfExperience: 0,
    educationLevel: "Bachelor's degree",
    hasCv: false,
    matchedSkills: [],
    missingSkills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    cv: null,
    statusHistory: [{ status: 'Submitted', changedAt: '2026-10-01T09:00:00Z', changedBy: 'System' }],
    interview: null,
    ...partial,
  };
}

/** Demo data — delete this file once HttpApplicantsApi is wired to the real backend. */
const SEED: ApplicantDetails[] = [
  defaults({
    applicationId: 1001, jobId: 1, jobTitle: 'Front-End Developer (Angular)',
    candidateId: 201, candidateName: 'Ahmed Samy Abdelaziz', email: 'ahmed.samy@mail.com', phone: '0100 123 4567',
    appliedAt: '2026-09-28T10:15:00Z', status: 'Shortlisted', matchScore: 92,
    skills: ['Angular', 'TypeScript', 'RxJS', 'SCSS', 'Git'],
    yearsOfExperience: 4, educationLevel: "Bachelor's in Computer Science", hasCv: true,
    summary: 'Front-End developer specialized in Angular, experienced in building enterprise apps, SEO and PWAs.',
    matchedSkills: ['Angular', 'TypeScript', 'RxJS'], missingSkills: ['Nx', 'Storybook'],
    mlFeedback: 'Very high match (92%). Strongest points: matching hands-on experience (4 years), project count and technical certifications. Weakest point: no clear experience with Nx monorepos.',
    education: [{ level: "Bachelor's", field: 'Computer Science', university: 'Ain Shams University', universityTier: 'Tier 1', cgpa: 3.4, graduationYear: 2021 }],
    experience: [
      { title: 'Front-End Developer', company: 'ITWorx', from: '2022-03-01', isCurrent: true },
      { title: 'Junior Front-End', company: 'Route Academy (Internship)', from: '2021-01-01', to: '2022-02-01' },
    ],
    projects: [{ name: 'HR Smart Recruitment', description: 'Smart hiring platform with ML recommendations', link: 'https://github.com/ahmedsamy/hr-smart-recruitment' }],
    certifications: [{ name: 'Meta Front-End Developer', issuer: 'Meta', year: 2023 }],
    cv: { fileName: 'Ahmed-Samy-CV.pdf', contentType: 'application/pdf', sizeBytes: 421_337, url: null },
    statusHistory: [
      { status: 'Submitted', changedAt: '2026-09-28T10:15:00Z', changedBy: 'System' },
      { status: 'Shortlisted', changedAt: '2026-10-01T09:00:00Z', changedBy: 'Mostafa (HR)', note: 'Excellent Angular experience, strong CV.' },
    ],
  }),
  defaults({
    applicationId: 1002, jobId: 1, jobTitle: 'Front-End Developer (Angular)',
    candidateId: 202, candidateName: 'Mona Abdelrahman Khalil', email: 'mona.abdelrahman@mail.com', phone: '0111 987 6543',
    appliedAt: '2026-09-29T14:40:00Z', status: 'Submitted', matchScore: 88,
    skills: ['Angular', 'TypeScript', 'Tailwind', 'Jest', 'REST'],
    yearsOfExperience: 3, educationLevel: "Bachelor's in Information Technology", hasCv: true,
    summary: 'Front-End developer focused on performance and user experience.',
    matchedSkills: ['Angular', 'TypeScript', 'REST'], missingSkills: ['RxJS', 'SCSS'],
    mlFeedback: 'Strong match (88%). 3 years of Angular and TypeScript experience plus testing skills (Jest). RxJS skills should be assessed in the technical interview.',
    education: [{ level: "Bachelor's", field: 'Information Technology', university: 'Cairo University', universityTier: 'Tier 1', cgpa: 3.1, graduationYear: 2022 }],
    experience: [{ title: 'Angular Developer', company: 'Value', from: '2023-01-01', isCurrent: true }],
    projects: [{ name: 'Taskify', description: 'Realtime task management app', link: 'https://github.com/monak/taskify' }],
    cv: { fileName: 'Mona-CV.pdf', contentType: 'application/pdf', sizeBytes: 318_900, url: null },
    statusHistory: [{ status: 'Submitted', changedAt: '2026-09-29T14:40:00Z', changedBy: 'System' }],
  }),
  defaults({
    applicationId: 1003, jobId: 1, jobTitle: 'Front-End Developer (Angular)',
    candidateId: 203, candidateName: 'Karim Fouad Elshamy', email: 'karim.fouad@mail.com', phone: '0122 555 1122',
    appliedAt: '2026-09-30T08:05:00Z', status: 'Submitted', matchScore: 74,
    skills: ['React', 'JavaScript', 'HTML', 'CSS'],
    yearsOfExperience: 2, educationLevel: "Bachelor's in Commerce", hasCv: true,
    summary: 'Strong React background, but only Angular basics.',
    matchedSkills: ['JavaScript', 'HTML', 'CSS'], missingSkills: ['Angular', 'TypeScript', 'RxJS'],
    mlFeedback: 'Average match (74%). React experience transfers easily to Angular, but there is no hands-on TypeScript.',
    experience: [{ title: 'Front-End Developer', company: 'Fruit Online', from: '2024-02-01', isCurrent: true }],
    cv: { fileName: 'Karim-CV.pdf', contentType: 'application/pdf', sizeBytes: 256_001, url: null },
    statusHistory: [{ status: 'Submitted', changedAt: '2026-09-30T08:05:00Z', changedBy: 'System' }],
  }),
  defaults({
    applicationId: 1004, jobId: 1, jobTitle: 'Front-End Developer (Angular)',
    candidateId: 204, candidateName: 'Mostafa Elnagar', email: 'mostafa.elnagar@mail.com', phone: '0109 876 5432',
    appliedAt: '2026-09-20T11:00:00Z', status: 'Interview', matchScore: 65,
    skills: ['Angular', 'JavaScript', 'Bootstrap'],
    yearsOfExperience: 1, educationLevel: 'Higher technical diploma', hasCv: true,
    matchedSkills: ['Angular', 'JavaScript'], missingSkills: ['TypeScript', 'RxJS'],
    mlFeedback: 'Average match (65%). Little experience (1 year), but clear creativity in personal projects.',
    experience: [{ title: 'Front-End Intern', company: 'Alarabiya Group', from: '2025-01-01', to: '2025-12-01' }],
    cv: { fileName: 'Mostafa-CV.pdf', contentType: 'application/pdf', sizeBytes: 189_444, url: null },
    statusHistory: [
      { status: 'Submitted', changedAt: '2026-09-20T11:00:00Z', changedBy: 'System' },
      { status: 'Shortlisted', changedAt: '2026-09-22T10:30:00Z', changedBy: 'Mostafa (HR)' },
      { status: 'Interview', changedAt: '2026-09-25T12:00:00Z', changedBy: 'Mahmoud (HR)', note: 'Technical interview scheduled.' },
    ],
    interview: { id: 501, scheduledAt: '2026-10-14T17:00:00Z', type: 'Technical', status: 'Scheduled' },
  }),
  defaults({
    applicationId: 1005, jobId: 1, jobTitle: 'Front-End Developer (Angular)',
    candidateId: 205, candidateName: 'Heba Allah Mohamed Ramadan', email: 'haba.allah@mail.com',
    appliedAt: '2026-10-02T19:30:00Z', status: 'Submitted', matchScore: null,
    skills: ['Angular', 'Firebase'],
    yearsOfExperience: 0, educationLevel: "Bachelor's in Science", hasCv: false,
    summary: 'Beginner, graduation project built with Firebase.',
    matchedSkills: ['Angular'], missingSkills: ['TypeScript', 'RxJS', 'SCSS'],
    mlFeedback: 'Not evaluated yet (no CV attached).',
    cv: null,
    statusHistory: [{ status: 'Submitted', changedAt: '2026-10-02T19:30:00Z', changedBy: 'System' }],
  }),
  defaults({
    applicationId: 1006, jobId: 1, jobTitle: 'Front-End Developer (Angular)',
    candidateId: 206, candidateName: 'Tarek Elshenawy', email: 'tarek.shenawy@mail.com', phone: '0155 222 3344',
    appliedAt: '2026-09-18T13:10:00Z', status: 'Rejected', matchScore: 41,
    skills: ['HTML', 'CSS', 'jQuery'],
    yearsOfExperience: 5, educationLevel: 'Diploma', hasCv: true,
    matchedSkills: ['HTML', 'CSS'], missingSkills: ['Angular', 'TypeScript'],
    mlFeedback: 'Low match (41%). Years of experience are good but the required technologies are missing from the CV.',
    experience: [{ title: 'Web Designer', company: 'Freelance', from: '2021-01-01', isCurrent: true }],
    cv: { fileName: 'Tarek-CV.pdf', contentType: 'application/pdf', sizeBytes: 143_210, url: null },
    statusHistory: [
      { status: 'Submitted', changedAt: '2026-09-18T13:10:00Z', changedBy: 'System' },
      { status: 'Rejected', changedAt: '2026-09-21T09:45:00Z', changedBy: 'Mostafa (HR)', note: 'Skills do not match the requirements.' },
    ],
  }),
  defaults({
    applicationId: 2001, jobId: 2, jobTitle: 'Backend Developer (.NET)',
    candidateId: 301, candidateName: 'Sara Ibrahim Mansour', email: 'sara.ibrahim@mail.com', phone: '0101 777 8899',
    appliedAt: '2026-09-27T16:20:00Z', status: 'Submitted', matchScore: 95,
    skills: ['.NET Core', 'C#', 'EF Core', 'SQL Server', 'Docker'],
    yearsOfExperience: 5, educationLevel: "Bachelor's in Computer Science", hasCv: true,
    matchedSkills: ['.NET Core', 'C#', 'EF Core', 'SQL Server'], missingSkills: ['Kubernetes'],
    mlFeedback: 'Excellent match (95%). 5 years of .NET Core experience with Clean Architecture.',
    education: [{ level: "Bachelor's", field: 'Computer Science', university: 'Mansoura University', universityTier: 'Tier 1', cgpa: 3.6, graduationYear: 2020 }],
    experience: [{ title: 'Backend Developer', company: 'Valeo', from: '2021-05-01', isCurrent: true }],
    cv: { fileName: 'Sara-CV.pdf', contentType: 'application/pdf', sizeBytes: 512_000, url: null },
    statusHistory: [{ status: 'Submitted', changedAt: '2026-09-27T16:20:00Z', changedBy: 'System' }],
  }),
  defaults({
    applicationId: 2002, jobId: 2, jobTitle: 'Backend Developer (.NET)',
    candidateId: 302, candidateName: 'Youssef Hagagy', email: 'youssef.hagagy@mail.com',
    appliedAt: '2026-09-26T10:00:00Z', status: 'Shortlisted', matchScore: 83,
    skills: ['.NET Core', 'C#', 'Redis', 'RabbitMQ'],
    yearsOfExperience: 4, educationLevel: "Bachelor's in Engineering", hasCv: true,
    matchedSkills: ['.NET Core', 'C#'], missingSkills: ['EF Core', 'SQL Server'],
    mlFeedback: 'Strong match (83%). Good messaging experience, but ORM skills need verification.',
    experience: [{ title: 'Software Engineer', company: 'Barmsila', from: '2022-07-01', isCurrent: true }],
    cv: { fileName: 'Youssef-CV.pdf', contentType: 'application/pdf', sizeBytes: 398_112, url: null },
    statusHistory: [
      { status: 'Submitted', changedAt: '2026-09-26T10:00:00Z', changedBy: 'System' },
      { status: 'Shortlisted', changedAt: '2026-09-28T11:20:00Z', changedBy: 'Mostafa (HR)' },
    ],
  }),
];

const ACTION_STATUS: Record<ApplicantAction, ApplicationStatus> = {
  shortlist: 'Shortlisted',
  reject: 'Rejected',
  accept: 'Accepted',
};

/** In-memory implementation — delete together with the SEED data when the API is ready. */
@Injectable()
export class MockApplicantsApi extends ApplicantsApi {
  private readonly store: ApplicantDetails[] = SEED.map((applicant) => ({
    ...applicant,
    statusHistory: [...applicant.statusHistory],
  }));

  getApplicantsByJob(jobId: number, query: ApplicantsQuery): Observable<ApplicantListItem[]> {
    if (forcedState() === 'error') {
      return throwError(() => new Error('Mock network error')).pipe(delay(LATENCY_MS)) as Observable<ApplicantListItem[]>;
    }

    const search = (query.search ?? '').trim().toLowerCase();
    const status = query.status ?? 'all';

    const items = this.store
      .filter((applicant) => applicant.jobId === jobId)
      .filter((applicant) => status === 'all' || applicant.status === status)
      .filter(
        (applicant) =>
          !search ||
          applicant.candidateName.toLowerCase().includes(search) ||
          applicant.skills.some((skill) => skill.toLowerCase().includes(search)),
      )
      .sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1)) // matchScore DESC, nulls last
      .map((applicant) => this.toList(applicant));

    return of(forcedState() === 'empty' ? [] : items).pipe(delay(LATENCY_MS));
  }

  getApplicationDetails(applicationId: number): Observable<ApplicantDetails> {
    const found = this.store.find((applicant) => applicant.applicationId === applicationId);
    if (forcedState() === 'error' || !found) {
      return throwError(() => new Error('No data for this application (Mock)')) as unknown as Observable<ApplicantDetails>;
    }
    return of({ ...found }).pipe(delay(LATENCY_MS));
  }

  updateStatus(applicationId: number, request: UpdateApplicantStatusRequest): Observable<ApplicantDetails> {
    const found = this.store.find((applicant) => applicant.applicationId === applicationId);
    if (!found) {
      return throwError(() => new Error('No data for this application (Mock)')) as unknown as Observable<ApplicantDetails>;
    }

    const nextStatus = ACTION_STATUS[request.action];
    found.status = nextStatus;
    found.statusHistory = [
      ...found.statusHistory,
      {
        status: nextStatus,
        changedAt: new Date().toISOString(),
        changedBy: 'Mostafa (HR)',
        note: request.note,
      },
    ];

    return of({ ...found }).pipe(delay(300));
  }

  downloadCv(applicationId: number): Observable<Blob> {
    const found = this.store.find((applicant) => applicant.applicationId === applicationId);
    if (!found?.cv) {
      return throwError(() => new Error('The applicant did not attach a CV (Mock)')) as unknown as Observable<Blob>;
    }
    // Placeholder blob — the real endpoint will stream the PDF.
    return of(new Blob([`Mock CV of ${found.candidateName}`], { type: 'text/plain' })).pipe(delay(200));
  }

  private toList(applicant: ApplicantDetails): ApplicantListItem {
    const {
      summary: _summary, matchedSkills: _matched, missingSkills: _missing, mlFeedback: _ml,
      education: _education, experience: _experience, projects: _projects,
      certifications: _certifications, cv, statusHistory: _history, interview: _interview,
      ...listItem
    } = applicant;
    return { ...listItem, hasCv: !!cv };
  }
}
