import { Routes } from '@angular/router';
import { HttpCandidateApi } from './data/http-candidate.api';
import { CANDIDATE_API } from './data/candidate-api';
import { HttpJobsApi } from '../jobs/data/http-jobs.api';
import { JOBS_API } from '../jobs/data/jobs-api';
import { ApplyComponent } from './pages/apply/apply.component';
import { CandidateApplicationDetailsComponent } from './pages/application-details/application-details.component';
import { MyApplicationsComponent } from './pages/my-applications/my-applications.component';
import { ProfileComponent } from './pages/profile/profile.component';

/**
 * Feature 3 — candidate side.
 * All routes require login (parent adds authGuard); the apply page reuses
 * the public job summary through JOBS_API.
 */
export const CANDIDATE_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: CANDIDATE_API, useClass: HttpCandidateApi },
      { provide: JOBS_API, useClass: HttpJobsApi },
    ],
    children: [
      { path: 'candidate/profile', component: ProfileComponent, title: 'My profile' },
      { path: 'candidate/applications', component: MyApplicationsComponent, title: 'My applications' },
      { path: 'candidate/applications/:id', component: CandidateApplicationDetailsComponent, title: 'Application details' },
      { path: 'jobs/:id/apply', component: ApplyComponent, title: 'Apply' },
    ],
  },
];
