import { Routes } from '@angular/router';
import { HttpApplicantsApi } from '../hr/applicants/data/http-applicants.api';
import { APPLICANTS_API } from '../hr/applicants/data/applicants-api';
import { HttpJobsApi } from './data/http-jobs.api';
import { JOBS_API } from './data/jobs-api';
import { JobDetailsComponent } from './pages/job-details/job-details.component';
import { JobFormComponent } from './pages/job-form/job-form.component';
import { JobListComponent } from './pages/job-list/job-list.component';
import { MyJobsComponent } from './pages/my-jobs/my-jobs.component';

/**
 * Feature 2 — Jobs.
 * Public browsing (omar) needs no guard; management (amgad) lives under
 * /hr and inherits the HR roleGuard from the parent route.
 */
export const JOBS_PUBLIC_ROUTES: Routes = [
  {
    path: '',
    providers: [{ provide: JOBS_API, useClass: HttpJobsApi }],
    children: [
      { path: 'jobs', component: JobListComponent, title: 'Jobs' },
      { path: 'jobs/:id', component: JobDetailsComponent, title: 'Job details' },
    ],
  },
];

export const HR_JOBS_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: JOBS_API, useClass: HttpJobsApi },
      { provide: APPLICANTS_API, useClass: HttpApplicantsApi },
    ],
    children: [
      { path: 'jobs', component: MyJobsComponent, title: 'My jobs' },
      { path: 'jobs/new', component: JobFormComponent, title: 'Post a job' },
      { path: 'jobs/:id/edit', component: JobFormComponent, title: 'Edit job' },
    ],
  },
];
