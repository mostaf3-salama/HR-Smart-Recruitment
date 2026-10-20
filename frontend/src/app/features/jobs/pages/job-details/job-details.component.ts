import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, defer, map, of } from 'rxjs';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { JOBS_API } from '../../data/jobs-api';
import { Job } from '../../models/job.models';

const LOAD_ERROR = 'Could not load this job. It may have been removed.';

interface DetailsVm {
  loading: boolean;
  error: string | null;
  job: Job | null;
}

/** Feature 2 — omar's part. Route: `/jobs/:id` (public). */
@Component({
  selector: 'jobs-job-details',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent, StatusBadgeComponent],
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobDetailsComponent implements OnInit {
  private readonly api = inject(JOBS_API);
  private readonly route = inject(ActivatedRoute);

  private readonly vmSubject = new BehaviorSubject<DetailsVm>({ loading: true, error: null, job: null });
  readonly vm$ = this.vmSubject.asObservable();

  ngOnInit(): void {
    this.load();
  }

  retry(): void {
    this.load();
  }

  skillsOf(job: Job): string[] {
    return job.requiredSkills
      .split(',')
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);
  }

  private load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    defer(() => {
      this.vmSubject.next({ loading: true, error: null, job: null });
      return this.api.getJob(id);
    })
      .pipe(
        map((job) => ({ loading: false, error: null, job })),
        catchError(() => of<DetailsVm>({ loading: false, error: LOAD_ERROR, job: null })),
      )
      .subscribe((vm) => this.vmSubject.next(vm));
  }
}
