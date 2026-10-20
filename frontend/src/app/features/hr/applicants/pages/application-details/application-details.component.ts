import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, defer, map, of, takeUntil, Subject } from 'rxjs';
import { ToastService } from '../../../../../core/services/toast.service';
import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { StatusBadgeComponent, StatusTone } from '../../../../../shared/components/status-badge/status-badge.component';
import { APPLICANTS_API } from '../../data/applicants-api';
import { ApplicantAction, ApplicantDetails, ApplicationStatus } from '../../models/applicant.models';
import { StatusActionsComponent } from '../../components/status-actions/status-actions.component';

const LOAD_ERROR = 'Could not load the applicant profile. Please try again.';

const STATUS_TONES: Record<ApplicationStatus, StatusTone> = {
  Submitted: 'neutral',
  Shortlisted: 'info',
  Interview: 'warn',
  Accepted: 'success',
  Rejected: 'danger',
};

interface DetailsVm {
  loading: boolean;
  error: string | null;
  application: ApplicantDetails | null;
}

/**
 * Feature 4 — Mostafa's part.
 * Route: `/hr/applications/:id`
 *  ✔ Candidate data, Match Score, ML feedback, matched skills
 *  ✔ CV preview / download (PDF)
 *  ✔ Shortlist / Reject / Accept + status history (shared confirm + toast)
 *  ✔ Loading / Error states (shared loader)
 */
@Component({
  selector: 'hr-application-details',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusActionsComponent, LoaderComponent, StatusBadgeComponent],
  templateUrl: './application-details.component.html',
  styleUrls: ['./application-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationDetailsComponent implements OnInit {
  private readonly api = inject(APPLICANTS_API);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  readonly applicationId = Number(this.route.snapshot.paramMap.get('id'));

  private readonly vmSubject = new BehaviorSubject<DetailsVm>({ loading: true, error: null, application: null });
  readonly vm$ = this.vmSubject.asObservable();

  cvBusy = false;

  ngOnInit(): void {
    this.load();
  }

  onAction(request: { action: ApplicantAction; note?: string }): void {
    this.api.updateStatus(this.applicationId, request).subscribe({
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

  previewCv(): void {
    this.fetchCv('preview');
  }

  downloadCv(): void {
    this.fetchCv('download');
  }

  retry(): void {
    this.load();
  }

  scoreClass(score: number | null): string {
    if (score == null) return 'score-none';
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-mid';
    return 'score-low';
  }

  statusTone(status: ApplicationStatus): StatusTone {
    return STATUS_TONES[status] ?? 'neutral';
  }

  private load(): void {
    defer(() => {
      this.vmSubject.next({ loading: true, error: null, application: this.vmSubject.value.application });
      return this.api.getApplicationDetails(this.applicationId);
    })
      .pipe(
        map((application) => ({ loading: false, error: null, application })),
        catchError(() => of<DetailsVm>({ loading: false, error: LOAD_ERROR, application: null })),
        takeUntil(this.destroy$),
      )
      .subscribe((vm) => this.vmSubject.next(vm));
  }

  private fetchCv(mode: 'preview' | 'download'): void {
    const application = this.vmSubject.value.application;
    this.cvBusy = true;

    this.api.downloadCv(this.applicationId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        if (mode === 'preview') {
          window.open(url, '_blank', 'noopener');
        } else {
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = application?.cv?.fileName ?? 'candidate-cv.pdf';
          anchor.click();
        }
        URL.revokeObjectURL(url);
        this.cvBusy = false;
      },
      error: () => {
        this.toast.error('Could not open the CV. Please try again.');
        this.cvBusy = false;
      },
    });
  }
}
