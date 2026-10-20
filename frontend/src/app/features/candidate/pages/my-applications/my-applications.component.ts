import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, defer, map, of } from 'rxjs';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { ScoreBarComponent } from '../../../../shared/components/score-bar/score-bar.component';
import { StatusBadgeComponent, StatusTone } from '../../../../shared/components/status-badge/status-badge.component';
import { CANDIDATE_API } from '../../data/candidate-api';
import { MyApplication } from '../../models/candidate.models';

const LOAD_ERROR = 'Something went wrong while loading your applications. Please try again.';
const STATUS_FILTERS = ['all', 'Submitted', 'Shortlisted', 'Interview', 'Accepted', 'Rejected'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_TONES: Record<string, StatusTone> = {
  Submitted: 'neutral',
  Shortlisted: 'info',
  Interview: 'warn',
  Accepted: 'success',
  Rejected: 'danger',
};

interface MyApplicationsVm {
  loading: boolean;
  error: string | null;
  applications: MyApplication[];
}

/**
 * Feature 3 — ahmed's part. Route: `/candidate/applications`.
 * My applications with status filter + match score.
 */
@Component({
  selector: 'candidate-my-applications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent, EmptyStateComponent, StatusBadgeComponent, ScoreBarComponent],
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyApplicationsComponent implements OnInit {
  private readonly api = inject(CANDIDATE_API);

  readonly statusOptions = STATUS_FILTERS;
  readonly statusControl = new FormControl<StatusFilter>('all', { nonNullable: true });

  private readonly vmSubject = new BehaviorSubject<MyApplicationsVm>({ loading: true, error: null, applications: [] });
  readonly vm$ = this.vmSubject.asObservable();

  ngOnInit(): void {
    this.load();
    this.statusControl.valueChanges.subscribe(() => this.load());
  }

  retry(): void {
    this.load();
  }

  statusTone(status: string): StatusTone {
    return STATUS_TONES[status] ?? 'neutral';
  }

  trackById(_index: number, application: MyApplication): number {
    return application.id;
  }

  private load(): void {
    defer(() => {
      this.vmSubject.next({ loading: true, error: null, applications: [] });
      return this.api.getMyApplications();
    })
      .pipe(
        map((applications) => {
          const filter = this.statusControl.value;
          const filtered =
            filter === 'all' ? applications : applications.filter((app) => app.status === filter);
          return { loading: false, error: null, applications: filtered };
        }),
        catchError(() => of<MyApplicationsVm>({ loading: false, error: LOAD_ERROR, applications: [] })),
      )
      .subscribe((vm) => this.vmSubject.next(vm));
  }
}
