import { Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ForbiddenComponent } from './shared/pages/forbidden/forbidden.component';
import { HomeRedirectComponent } from './shared/pages/home-redirect/home-redirect.component';
import { NotFoundComponent } from './shared/pages/not-found/not-found.component';

/**
 * Root routes (Feature 1 owns this file).
 * - /auth/* is public.
 * - /jobs browsing is public (Feature 2).
 * - /candidate/* requires login (Feature 3).
 * - /hr/* requires login + HR/Admin role (Features 2 & 4).
 */
export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./features/jobs/jobs.routes').then((m) => m.JOBS_PUBLIC_ROUTES),
      },
      {
        path: '',
        canActivate: [authGuard],
        loadChildren: () => import('./features/candidate/candidate.routes').then((m) => m.CANDIDATE_ROUTES),
      },
      {
        path: 'hr',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['HR', 'Admin'] },
        loadChildren: () => import('./features/hr/hr.routes').then((m) => m.HR_ROUTES),
      },
      { path: '', pathMatch: 'full', component: HomeRedirectComponent },
    ],
  },
  { path: 'forbidden', component: ForbiddenComponent, title: 'Forbidden' },
  { path: '**', component: NotFoundComponent, title: 'Not found' },
];
