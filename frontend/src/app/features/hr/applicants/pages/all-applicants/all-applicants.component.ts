import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ToastService } from '../../../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { ScoreBarComponent } from '../../../../../shared/components/score-bar/score-bar.component';
import { StatusBadgeComponent, StatusTone } from '../../../../../shared/components/status-badge/status-badge.component';
import { JOBS_API } from '../../../../jobs/data/jobs-api';
import { APPLICANTS_API } from '../../data/applicants-api';
import {
  APPLICATION_STATUSES,
  ApplicantAction,
  ApplicantListItem,
  ApplicantStatusFilter,
  ApplicationStatus,
} from '../../models/applicant.models';
import { StatusActionsComponent } from '../../components/status-actions/status-actions.component';

const LOAD_ERROR = 'Something went wrong while loading the applications. Please try again.';

const STATUS_TONES: Record<ApplicationStatus, StatusTone> = {
  Submitted: 'neutral',
  Shortlisted: 'info',
  Interview: 'warn',
  Accepted: 'success',
  Rejected: 'danger',
};

interface AllApplicantsVm {
  loading: boolean;
  error: string | null;
  applicants: ApplicantListItem[];
}

/**
 * Feature 4 — unified HR inbox. Route: `/hr/applications`.
 * Every applicant of every job owned by the current HR,
 * sorted by Match Score (highest first).
 */
@Component({
  selector: 'hr-all-applicants',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    StatusActionsComponent,
    LoaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    ScoreBarComponent,
  ],
  templateUrl: './all-applicants.component.html',
  styleUrls: ['./all-applicants.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllApplicantsComponent implements OnInit {
  private readonly applicantsApi = inject(APPLICANTS_API);
  private readonly jobsApi = inject(JOBS_API);
  private readonly toast = inject(ToastService);

  readonly statusOptions = APPLICATION_STATUSES;
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<ApplicantStatusFilter>('all', { nonNullable: true });

  private allApplicants: ApplicantListItem[] = [];

  private readonly vmSubject = new BehaviorSubject<AllApplicantsVm>({ loading: true, error: null, applicants: [] });
  readonly vm$ = this.vmSubject.asObservable();

  ngOnInit(): void {
    this.load();
    this.searchControl.valueChanges.subscribe(() => this.applyFilters());
    this.statusControl.valueChanges.subscribe(() => this.applyFilters());
  }

  retry(): void {
    this.load();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusControl.setValue('all');
  }

  onAction(application: ApplicantListItem, request: { action: ApplicantAction; note?: string }): void {
    this.applicantsApi.updateStatus(application.applicationId, request).subscribe({
      next: () => {
        this.toast.success(
          request.action === 'shortlist'
            ? 'Applicant moved to Shortlisted ✓'
            : request.action === 'accept'
              ? 'Applicant accepted ✓'
              : 'Application rejected ✓',
        );
        this.load();
      },
      error: () => this.toast.error('Could not update the application status. Please try again.'),
    });
  }

  trackByApplicationId(_index: number, applicant: ApplicantListItem): number {
    return applicant.applicationId;
  }

  statusTone(status: ApplicationStatus): StatusTone {
    return STATUS_TONES[status] ?? 'neutral';
  }

  private load(): void {
    this.vmSubject.next({ loading: true, error: null, applicants: [] });

    this.jobsApi.getMyHr().pipe(
      catchError(() => of(null)),
      switchMap((me) => {
        if (!me) throw new Error('NO_HR');
        return this.jobsApi.getJobs().pipe(
          map((jobs) => jobs.filter((job) => job.hrid === me.hrId)),
        );
      }),
      switchMap((mine) => {
        if (mine.length === 0) return of([]);
        return forkJoin(mine.map((job) => this.applicantsApi.getApplicantsByJob(job.id, {})));
      }),
    ).subscribe({
      next: (groups) => {
        this.allApplicants = groups
          .flat()
          .sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
        this.applyFilters();
      },
      error: (error: unknown) => {
        const message =
          error instanceof Error && error.message === 'NO_HR'
            ? 'No HR profile is linked to your account. Ask the admin to create one.'
            : LOAD_ERROR;
        this.vmSubject.next({ loading: false, error: message, applicants: [] });
      },
    });
  }

  private applyFilters(): void {
    const term = this.searchControl.value.trim().toLowerCase();
    const status = this.statusControl.value;

    const filtered = this.allApplicants
      .filter((applicant) => status === 'all' || applicant.status === status)
      .filter(
        (applicant) =>
          !term ||
          applicant.candidateName.toLowerCase().includes(term) ||
          applicant.jobTitle.toLowerCase().includes(term) ||
          applicant.skills.some((skill) => skill.toLowerCase().includes(term)),
      );

    this.vmSubject.next({ loading: false, error: null, applicants: filtered });
  }
}
