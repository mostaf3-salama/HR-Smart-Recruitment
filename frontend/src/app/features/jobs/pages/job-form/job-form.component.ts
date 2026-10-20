import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { JOBS_API } from '../../data/jobs-api';

const LOAD_ERROR = 'Could not load the job. Please try again.';

/**
 * Feature 2 — amgad's part. Routes: `/hr/jobs/new` and `/hr/jobs/:id/edit`.
 * One form, two modes (detected from the URL).
 */
@Component({
  selector: 'jobs-job-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent],
  templateUrl: './job-form.component.html',
  styleUrls: ['./job-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobFormComponent implements OnInit {
  private readonly api = inject(JOBS_API);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly editId = this.route.snapshot.paramMap.get('id');
  readonly isEditMode = this.editId !== null && this.route.snapshot.url.some((s) => s.path === 'edit');
  private readonly jobId = this.isEditMode ? Number(this.editId) : null;

  private hrid: number | null = null;

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', Validators.required],
    requiredSkills: ['', Validators.required],
    experienceRequired: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
  });

  loading = true;
  pageError: string | null = null;
  busy = false;
  submitError: string | null = null;

  ngOnInit(): void {
    this.api.getMyHr().subscribe({
      next: (me) => {
        this.hrid = me.hrId;
        if (this.isEditMode) this.loadJob();
        else {
          this.loading = false;
          // Zoneless: async callbacks don't refresh the view by themselves.
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.loading = false;
        this.pageError = 'No HR profile is linked to your account. Ask the admin to create one.';
      },
    });
  }

  submit(): void {
    if (this.form.invalid || this.busy || this.hrid == null) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy = true;
    this.submitError = null;
    const value = this.form.getRawValue();

    if (this.isEditMode && this.jobId != null) {
      this.api
        .updateJob(this.jobId, {
          title: value.title!,
          description: value.description!,
          requiredSkills: value.requiredSkills!,
          experienceRequired: Number(value.experienceRequired),
        })
        .subscribe({
          next: () => this.done('Job updated ✓'),
          error: () => this.fail(),
        });
    } else {
      this.api
        .createJob({
          hrid: this.hrid,
          title: value.title!,
          description: value.description!,
          requiredSkills: value.requiredSkills!,
          experienceRequired: Number(value.experienceRequired),
        })
        .subscribe({
          next: () => this.done('Job posted ✓'),
          error: () => this.fail(),
        });
    }
  }

  private done(message: string): void {
    this.busy = false;
    this.toast.success(message);
    this.router.navigate(['/hr/jobs']);
  }

  private fail(): void {
    this.busy = false;
    this.submitError = 'Could not save the job. Please check the form and try again.';
    // Zoneless: async callbacks don't refresh the view by themselves.
    this.cdr.markForCheck();
  }

  private loadJob(): void {
    this.api.getJob(this.jobId!).subscribe({
      next: (job) => {
        this.loading = false;
        this.form.patchValue({
          title: job.title,
          description: job.description,
          requiredSkills: job.requiredSkills,
          experienceRequired: job.experienceRequired,
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.pageError = LOAD_ERROR;
        this.cdr.markForCheck();
      },
    });
  }
}
