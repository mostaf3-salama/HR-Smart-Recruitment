import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, defer, map, of } from 'rxjs';
import { ToastService } from '../../../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { StatusBadgeComponent, StatusTone } from '../../../../../shared/components/status-badge/status-badge.component';
import { INTERVIEWS_API } from '../../data/interviews-api';
import {
  INTERVIEW_RESULTS,
  INTERVIEW_TYPES,
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
  Interview,
  InterviewListVm,
  InterviewResult,
  InterviewStatus,
  InterviewTab,
  ShortlistedCandidate,
} from '../../models/interview.models';

const LOAD_ERROR = 'Something went wrong while loading the interviews. Please try again.';

const STATUS_TONES: Record<InterviewStatus, StatusTone> = {
  Scheduled: 'info',
  Completed: 'neutral',
  Cancelled: 'danger',
};

const RESULT_TONES: Record<InterviewResult, StatusTone> = {
  Passed: 'success',
  Failed: 'danger',
  Rescheduled: 'warn',
};

/**
 * Feature 4 — mahmoud's part.
 * Route: `/hr/interviews`
 *  ✔ Upcoming / Past tabs
 *  ✔ Schedule an interview for Shortlisted candidates
 *      (also accepts `?applicationId=` from the applicant-details page)
 *  ✔ Record result + notes (Passed / Failed / Rescheduled)
 *  ✔ Cancel a scheduled interview (shared confirm)
 *  ✔ Loading / Error / Empty states (shared components)
 */
@Component({
  selector: 'hr-interview-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent, EmptyStateComponent, StatusBadgeComponent],
  templateUrl: './interview-list.component.html',
  styleUrls: ['./interview-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewListComponent implements OnInit {
  private readonly api = inject(INTERVIEWS_API);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirms = inject(ConfirmDialogService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly typeLabels = INTERVIEW_TYPE_LABELS;
  readonly statusLabels = INTERVIEW_STATUS_LABELS;
  readonly resultLabels = INTERVIEW_RESULT_LABELS;
  readonly resultOptions = INTERVIEW_RESULTS;
  readonly typeOptions = INTERVIEW_TYPES;

  tab: InterviewTab = 'upcoming';

  private readonly vmSubject = new BehaviorSubject<InterviewListVm>({ loading: true, error: null, interviews: [] });
  readonly vm$ = this.vmSubject.asObservable();

  shortlisted: ShortlistedCandidate[] = [];

  /** Schedule form visibility + state. */
  showScheduleForm = false;
  scheduleBusy = false;
  readonly scheduleForm: FormGroup = this.fb.group({
    applicationId: [null as number | null, Validators.required],
    type: ['HR', Validators.required],
    scheduledAt: ['', [Validators.required, this.futureDateValidator]],
    location: ['', Validators.maxLength(200)],
  });

  /** Which interview row has the "record result" panel open. */
  resultForId: number | null = null;
  resultBusy = false;
  readonly resultForm: FormGroup = this.fb.group({
    result: ['Passed' as InterviewResult, Validators.required],
    notes: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    this.api.getShortlistedCandidates().subscribe({
      next: (candidates) => {
        this.shortlisted = candidates;
        this.openScheduleFromQuery();
        // Zoneless: async callbacks don't refresh the view by themselves.
        this.cdr.markForCheck();
      },
      error: () => (this.shortlisted = []),
    });

    this.load();
  }

  switchTab(tab: InterviewTab): void {
    if (this.tab === tab) return;
    this.tab = tab;
    this.resultForId = null;
    this.load();
  }

  /** Retry button of the Error state. */
  retry(): void {
    this.load();
  }

  statusTone(status: InterviewStatus): StatusTone {
    return STATUS_TONES[status] ?? 'neutral';
  }

  resultTone(result: InterviewResult): StatusTone {
    return RESULT_TONES[result] ?? 'neutral';
  }

  // ---------- Schedule ----------

  openSchedule(preselectApplicationId?: number): void {
    this.showScheduleForm = true;
    this.scheduleForm.reset({ applicationId: preselectApplicationId ?? null, type: 'HR', scheduledAt: '', location: '' });
  }

  closeSchedule(): void {
    this.showScheduleForm = false;
  }

  submitSchedule(): void {
    if (this.scheduleForm.invalid || this.scheduleBusy) {
      this.scheduleForm.markAllAsTouched();
      return;
    }
    this.scheduleBusy = true;
    const value = this.scheduleForm.value;
    this.api
      .scheduleInterview({
        applicationId: Number(value.applicationId),
        type: value.type,
        scheduledAt: new Date(value.scheduledAt).toISOString(),
        location: value.location?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.scheduleBusy = false;
          this.showScheduleForm = false;
          this.toast.success('Interview scheduled ✓');
          this.tab = 'upcoming';
          this.load();
        },
        error: () => {
          this.scheduleBusy = false;
          this.toast.error('Could not save. Please try again.');
        },
      });
  }

  // ---------- Result ----------

  openResult(interview: Interview): void {
    this.resultForId = interview.id;
    this.resultForm.reset({ result: 'Passed', notes: '' });
  }

  closeResult(): void {
    this.resultForId = null;
  }

  submitResult(interview: Interview): void {
    if (this.resultForm.invalid || this.resultBusy) {
      this.resultForm.markAllAsTouched();
      return;
    }
    this.resultBusy = true;
    const value = this.resultForm.value;
    this.api.recordResult(interview.id, { result: value.result, notes: value.notes?.trim() || undefined }).subscribe({
      next: (updated) => {
        this.resultBusy = false;
        this.resultForId = null;
        this.toast.success(
          updated.result === 'Passed'
            ? `Recorded ${interview.candidateName} as passed ✓`
            : updated.result === 'Failed'
              ? `Recorded ${interview.candidateName} as failed`
              : 'Interview rescheduled — please set a new time from this page ↻',
        );
        if (updated.result === 'Rescheduled') {
          this.openSchedule(interview.applicationId);
        }
        this.load();
      },
      error: () => {
        this.resultBusy = false;
        this.toast.error('Could not save. Please try again.');
      },
    });
  }

  // ---------- Cancel (shared confirm) ----------

  async askCancel(interview: Interview): Promise<void> {
    const { confirmed } = await this.confirms.open({
      title: `Cancel the interview with ${interview.candidateName}?`,
      confirmText: 'Confirm cancellation',
      cancelText: 'Back',
      danger: true,
    });
    if (!confirmed) return;

    this.api.cancelInterview(interview.id).subscribe({
      next: () => {
        this.toast.success('Interview cancelled');
        this.load();
      },
      error: () => this.toast.error('Could not save. Please try again.'),
    });
  }

  trackByInterviewId(_index: number, interview: Interview): number {
    return interview.id;
  }

  // ---------- Private ----------

  private load(): void {
    defer(() => {
      this.vmSubject.next({ loading: true, error: null, interviews: [] });
      return this.api.getInterviews(this.tab);
    })
      .pipe(
        map((interviews) => ({ loading: false, error: null, interviews })),
        catchError(() => of<InterviewListVm>({ loading: false, error: LOAD_ERROR, interviews: [] })),
      )
      .subscribe((vm) => this.vmSubject.next(vm));
  }

  /** `?applicationId=` deep-link from the applicant-details page. */
  private openScheduleFromQuery(): void {
    const raw = this.route.snapshot.queryParamMap.get('applicationId');
    if (!raw) return;
    const applicationId = Number(raw);
    if (this.shortlisted.some((candidate) => candidate.applicationId === applicationId)) {
      this.openSchedule(applicationId);
    }
  }

  private futureDateValidator(control: { value: string }): { [key: string]: boolean } | null {
    if (!control.value) return null;
    return new Date(control.value).getTime() > Date.now() ? null : { pastDate: true };
  }
}
