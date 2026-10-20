import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, defer, forkJoin, map, of, switchMap } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { APPLICANTS_API, ApplicantsApi } from '../../../hr/applicants/data/applicants-api';
import { JOBS_API } from '../../data/jobs-api';
import { Job } from '../../models/job.models';

const LOAD_ERROR = 'Something went wrong while loading your jobs. Please try again.';

interface ManagedJob extends Job {
  applicantsCount: number | null;
}

interface MyJobsVm {
  loading: boolean;
  error: string | null;
  jobs: ManagedJob[];
}

/**
 * Feature 2 — amgad's part. Route: `/hr/jobs`.
 * My jobs table: applicants count + view applicants, edit, close/open, delete.
 */
@Component({
  selector: 'jobs-my-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent, EmptyStateComponent, StatusBadgeComponent],
  templateUrl: './my-jobs.component.html',
  styleUrls: ['./my-jobs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyJobsComponent implements OnInit {
  private readonly api = inject(JOBS_API);
  private readonly applicantsApi: ApplicantsApi = inject(APPLICANTS_API);
  private readonly toast = inject(ToastService);
  private readonly confirms = inject(ConfirmDialogService);
  private readonly router = inject(Router);

  private readonly vmSubject = new BehaviorSubject<MyJobsVm>({ loading: true, error: null, jobs: [] });
  readonly vm$ = this.vmSubject.asObservable();

  ngOnInit(): void {
    this.load();
  }

  retry(): void {
    this.load();
  }

  goNew(): void {
    this.router.navigate(['/hr/jobs/new']);
  }

  trackByJobId(_index: number, job: ManagedJob): number {
    return job.id;
  }

  async toggle(job: ManagedJob): Promise<void> {
    const { confirmed } = await this.confirms.open({
      title: job.isActive ? `Close "${job.title}"?` : `Reopen "${job.title}"?`,
      message: job.isActive
        ? 'Candidates will no longer be able to apply.'
        : 'Candidates will be able to apply again.',
      confirmText: job.isActive ? 'Close job' : 'Reopen job',
      cancelText: 'Back',
    });
    if (!confirmed) return;

    this.api.toggleActive(job.id).subscribe({
      next: () => {
        this.toast.success(job.isActive ? 'Job closed.' : 'Job reopened ✓');
        this.load();
      },
      error: () => this.toast.error('Could not update the job. Please try again.'),
    });
  }

  async remove(job: ManagedJob): Promise<void> {
    const { confirmed } = await this.confirms.open({
      title: `Delete "${job.title}"?`,
      message: 'This also removes its applications. This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Back',
      danger: true,
    });
    if (!confirmed) return;

    this.api.deleteJob(job.id).subscribe({
      next: () => {
        this.toast.success('Job deleted.');
        this.load();
      },
      error: () => this.toast.error('Could not delete the job. Please try again.'),
    });
  }

  private load(): void {
    this.vmSubject.next({ loading: true, error: null, jobs: [] });

    this.api.getMyHr().pipe(
      catchError(() => of(null)),
      switchMap((me) => {
        if (!me) {
          this.vmSubject.next({
            loading: false,
            error: 'No HR profile is linked to your account. Ask the admin to create one.',
            jobs: [],
          });
          return of(null);
        }
        return this.api.getJobs().pipe(map((jobs) => ({ jobs, hrid: me.hrId })));
      }),
    ).subscribe({
      next: (result) => {
        if (!result) return; // Profile error is already shown.
        this.attachCounts(result.jobs.filter((job) => job.hrid === result.hrid));
      },
      error: () => this.vmSubject.next({ loading: false, error: LOAD_ERROR, jobs: [] }),
    });
  }

  private attachCounts(mine: Job[]): void {
    if (mine.length === 0) {
      this.vmSubject.next({ loading: false, error: null, jobs: [] });
      return;
    }
    forkJoin(
      mine.map((job) =>
        this.applicantsApi.getApplicantsByJob(job.id, {}).pipe(
          map((applicants) => ({ ...job, applicantsCount: applicants.length }) as ManagedJob),
          catchError(() => of({ ...job, applicantsCount: null } as ManagedJob)),
        ),
      ),
    ).subscribe((jobsWithCounts) =>
      this.vmSubject.next({ loading: false, error: null, jobs: jobsWithCounts }),
    );
  }
}
