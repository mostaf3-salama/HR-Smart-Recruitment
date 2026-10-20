import { Routes } from '@angular/router';
import { APPLICANTS_ROUTES } from './applicants/applicants.routes';
import { DASHBOARD_ROUTES } from './dashboard/dashboard.routes';
import { INTERVIEW_ROUTES } from './interviews/interviews.routes';
import { HR_JOBS_ROUTES } from '../jobs/jobs.routes';

/**
 * Feature 4 — HR area.
 * Register it in `app.routes.ts` (owned by Feature 1) as:
 *
 *   {
 *     path: 'hr',
 *     canActivate: [authGuard, hrGuard],   // guards from Feature 1
 *     loadChildren: () => import('./features/hr/hr.routes').then((m) => m.HR_ROUTES),
 *   }
 *
 * mostafa owns `applicants/`, mahmoud owns `interviews/` + `dashboard/` —
 * each part keeps its own `providers`, so nobody touches the other's files.
 */
export const HR_ROUTES: Routes = [
  {
    path: '',
    children: [
      ...APPLICANTS_ROUTES,
      ...INTERVIEW_ROUTES,
      ...DASHBOARD_ROUTES,
      ...HR_JOBS_ROUTES,
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
];
