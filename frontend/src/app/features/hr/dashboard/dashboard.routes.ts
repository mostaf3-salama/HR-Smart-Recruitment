import { Routes } from '@angular/router';
import { DASHBOARD_API } from './data/dashboard-api';
import { HttpDashboardApi } from './data/http-dashboard.api';
import { MockDashboardApi } from './data/mock-dashboard.api';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

/**
 * Routes of mahmoud's dashboard part of Feature 4.
 * Expected URL (as agreed in the task sheet):
 *   /hr/dashboard
 */
export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    // providers: [{ provide: DASHBOARD_API, useClass: MockDashboardApi }],
    providers: [{ provide: DASHBOARD_API, useClass: HttpDashboardApi }],
    children: [{ path: 'dashboard', component: DashboardComponent, title: 'HR Dashboard' }],
  },
];
