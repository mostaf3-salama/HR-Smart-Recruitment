import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { JOBS_API } from '../../../jobs/data/jobs-api';
import { Job } from '../../../jobs/models/job.models';
import { CANDIDATE_API } from '../../data/candidate-api';

interface ApplyVm {
  loading: boolean;
  error: string | null;
  job: Job | null;
}

/**
 * Feature 3 — samy's part. Route: `/jobs/:id/apply` (login required).
 * One-click apply with the default CV; duplicate applications are blocked
 * by the backend with a clear message.
 */
@Component({
  selector: 'candidate-apply',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent],
  templateUrl: './apply.component.html',
  styleUrls: ['./apply.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplyComponent implements OnInit {
  private readonly jobs = inject(JOBS_API);
  private readonly api = inject(CANDIDATE_API);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly vmSubject = new BehaviorSubject<ApplyVm>({ loading: true, error: null, job: null });
  readonly vm$ = this.vmSubject.asObservable();

  applying = false;
  applyError: string | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.jobs.getJob(id).subscribe({
      next: (job) => this.vmSubject.next({ loading: false, error: null, job }),
      error: () => this.vmSubject.next({ loading: false, error: 'Could not load this job.', job: null }),
    });
  }

  submit(job: Job): void {
    if (this.applying) return;
    this.applying = true;
    this.applyError = null;

    this.api.applyForJob(job.id).subscribe({
      next: () => {
        this.applying = false;
        this.toast.success('Application submitted ✓');
        this.router.navigate(['/candidate/applications']);
      },
      error: (error: unknown) => {
        this.applying = false;
        this.applyError = this.readError(error);
        // Zoneless: async callbacks don't refresh the view by themselves.
        this.cdr.markForCheck();
      },
    });
  }

  private readError(error: unknown): string {
    const message = (error as { error?: string[] | string })?.error;
    if (Array.isArray(message) && message.length) return message[0];
    if (typeof message === 'string' && message) return message;
    return 'Could not submit the application. Please try again.';
  }
}
