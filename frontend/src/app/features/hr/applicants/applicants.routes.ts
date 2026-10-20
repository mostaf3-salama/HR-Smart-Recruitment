import { Routes } from '@angular/router';
import { APPLICANTS_API } from './data/applicants-api';
import { HttpApplicantsApi } from './data/http-applicants.api';
import { MockApplicantsApi } from './data/mock-applicants.api';
import { HttpJobsApi } from '../../jobs/data/http-jobs.api';
import { JOBS_API } from '../../jobs/data/jobs-api';
import { AllApplicantsComponent } from './pages/all-applicants/all-applicants.component';
import { ApplicantListComponent } from './pages/applicant-list/applicant-list.component';
import { ApplicationDetailsComponent } from './pages/application-details/application-details.component';

/**
 * Routes of Mostafa's part of Feature 4.
 * Expected URLs (as agreed in the task sheet):
 *   /hr/jobs/:jobId/applicants
 *   /hr/applications/:id
 *   /hr/applications (unified inbox across all my jobs)
 */
export const APPLICANTS_ROUTES: Routes = [
  {
    path: '',
    // providers: [{ provide: APPLICANTS_API, useClass: MockApplicantsApi }],
    providers: [
      { provide: APPLICANTS_API, useClass: HttpApplicantsApi },
      { provide: JOBS_API, useClass: HttpJobsApi },
    ],
    children: [
      { path: 'applications', component: AllApplicantsComponent, title: 'Candidate Applications' },
      { path: 'jobs/:jobId/applicants', component: ApplicantListComponent, title: 'Job Applicants' },
      { path: 'applications/:id', component: ApplicationDetailsComponent, title: 'Applicant Details' },
    ],
  },
];
