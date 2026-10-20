import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, Subject, catchError, combineLatest, debounceTime, defer, distinctUntilChanged, map, of, startWith, switchMap, takeUntil } from 'rxjs';
import { ToastService } from '../../../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { ScoreBarComponent } from '../../../../../shared/components/score-bar/score-bar.component';
import { StatusBadgeComponent, StatusTone } from '../../../../../shared/components/status-badge/status-badge.component';
import { APPLICANTS_API } from '../../data/applicants-api';
import {
  APPLICATION_STATUSES,
  ApplicantAction,
  ApplicantListItem,
  ApplicantListVm,
  ApplicantStatusFilter,
  ApplicationStatus,
} from '../../models/applicant.models';
import { StatusActionsComponent } from '../../components/status-actions/status-actions.component';

const LOAD_ERROR = 'Something went wrong while loading the applicants. Please try again.';

const STATUS_TONES: Record<ApplicationStatus, StatusTone> = {
  Submitted: 'neutral',
  Shortlisted: 'info',
  Interview: 'warn',
  Accepted: 'success',
  Rejected: 'danger',
};

const ACTION_FEEDBACK: Record<ApplicantAction, string> = {
  shortlist: 'Applicant moved to Shortlisted ✓',
  accept: 'Applicant accepted ✓',
  reject: 'Application rejected ✓',
};

/**
 * Feature 4 — Mostafa's part.
 * Route: `/hr/jobs/:jobId/applicants`
 *  ✔ Applicants sorted by matchScore DESC
 *  ✔ Filter by status + search by name / skills
 *  ✔ Shortlist / Reject / Accept (shared confirm + toast)
 *  ✔ Loading / Error / Empty states (shared components)
 */
@Component({
  selector: 'hr-applicant-list',
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
  templateUrl: './applicant-list.component.html',
  styleUrls: ['./applicant-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantListComponent implements OnInit {
  private readonly api = inject(APPLICANTS_API);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly jobId = Number(this.route.snapshot.paramMap.get('jobId'));

  readonly statusOptions = APPLICATION_STATUSES;
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<ApplicantStatusFilter>('all', { nonNullable: true });

  private readonly vmSubject = new BehaviorSubject<ApplicantListVm>({
    loading: true,
    error: null,
    applicants: [],
    jobTitle: null,
  });
  private readonly destroy$ = new Subject<void>();
  readonly vm$ = this.vmSubject.asObservable();

  ngOnInit(): void {
    const search$ = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      startWith(this.searchControl.value),
    );
    const status$ = this.statusControl.valueChanges.pipe(
      distinctUntilChanged(),
      startWith(this.statusControl.value),
    );

    combineLatest([search$, status$])
      .pipe(
        switchMap(([search, status]) => this.load(search, status)),
        takeUntil(this.destroy$),
      )
      .subscribe((vm) => this.vmSubject.next(vm));
  }

  onAction(application: ApplicantListItem, request: { action: ApplicantAction; note?: string }): void {
    this.api.updateStatus(application.applicationId, request).subscribe({
      next: () => {
        this.toast.success(ACTION_FEEDBACK[request.action]);
        this.reload();
      },
      error: () => this.toast.error('Could not update the application status. Please try again.'),
    });
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusControl.setValue('all');
  }

  /** Retry button of the Error state. */
  retry(): void {
    this.reload();
  }

  trackByApplicationId(_index: number, applicant: ApplicantListItem): number {
    return applicant.applicationId;
  }

  statusTone(status: ApplicationStatus): StatusTone {
    return STATUS_TONES[status] ?? 'neutral';
  }

  private load(search: string, status: ApplicantStatusFilter): Observable<ApplicantListVm> {
    return defer(() => {
      this.vmSubject.next({ ...this.vmSubject.value, loading: true, error: null });
      return this.api.getApplicantsByJob(this.jobId, { search, status });
    }).pipe(
      map((applicants) => ({
        loading: false,
        error: null,
        applicants,
        jobTitle: applicants[0]?.jobTitle ?? this.vmSubject.value.jobTitle,
      })),
      catchError(() =>
        of<ApplicantListVm>({ loading: false, error: LOAD_ERROR, applicants: [], jobTitle: this.vmSubject.value.jobTitle }),
      ),
    );
  }

  private reload(): void {
    this.load(this.searchControl.value, this.statusControl.value).subscribe((vm) => this.vmSubject.next(vm));
  }
}
