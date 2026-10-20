import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, defer, map, of } from 'rxjs';
import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { DASHBOARD_API } from '../../data/dashboard-api';
import { DashboardVm } from '../../models/dashboard.models';

const LOAD_ERROR = 'Something went wrong while loading the dashboard. Please try again.';

/**
 * Feature 4 — mahmoud's part.
 * Route: `/hr/dashboard`
 *  ✔ Active jobs, applicants, upcoming interviews (stat cards)
 *  ✔ Applicants by status (bars)
 *  ✔ Upcoming interviews mini-list (deep-links to /hr/interviews)
 *  ✔ Loading / Error states
 */
@Component({
  selector: 'hr-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(DASHBOARD_API);

  private readonly vmSubject = new BehaviorSubject<DashboardVm>({ loading: true, error: null, stats: null });
  readonly vm$ = this.vmSubject.asObservable();

  ngOnInit(): void {
    this.load();
  }

  /** Retry button of the Error state. */
  retry(): void {
    this.load();
  }

  /** Width % of a status bar relative to the biggest group. */
  barWidth(count: number, max: number): number {
    return max === 0 ? 0 : Math.round((count / max) * 100);
  }

  maxStatusCount(counts: { count: number }[]): number {
    return counts.reduce((max, item) => Math.max(max, item.count), 0);
  }

  private load(): void {
    defer(() => {
      this.vmSubject.next({ loading: true, error: null, stats: null });
      return this.api.getStats();
    })
      .pipe(
        map((stats) => ({ loading: false, error: null, stats })),
        catchError(() => of<DashboardVm>({ loading: false, error: LOAD_ERROR, stats: null })),
      )
      .subscribe((vm) => this.vmSubject.next(vm));
  }
}
