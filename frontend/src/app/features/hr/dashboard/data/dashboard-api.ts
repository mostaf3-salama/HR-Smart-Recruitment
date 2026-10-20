import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardStats } from '../models/dashboard.models';

/**
 * Port used by the HR dashboard (mahmoud's part).
 *
 * Swap the implementation in `dashboard.routes.ts`:
 *  - `MockDashboardApi` → while the backend is not ready (current default)
 *  - `HttpDashboardApi` → as soon as the `/api/hr/dashboard` endpoint exists
 */
export abstract class DashboardApi {
  abstract getStats(): Observable<DashboardStats>;
}

export const DASHBOARD_API = new InjectionToken<DashboardApi>('HR.DashboardApi');
