import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DashboardApi } from './dashboard-api';
import { DashboardStats } from '../models/dashboard.models';

/**
 * Real HTTP implementation.
 *
 * Backend: HrInterviewsController.GetDashboard (/api/hr/dashboard) +
 * migration Feature4_HrWorkflow. Adjust only the mapping below if the
 * backend DTO changes.
 */
@Injectable()
export class HttpDashboardApi extends DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/hr`;

  getStats(): Observable<DashboardStats> {
    return this.http
      .get<DashboardStats>(`${this.baseUrl}/dashboard`)
      .pipe(map((row) => row as DashboardStats));
  }
}
