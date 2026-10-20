import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, debounceTime, defer, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { StatusBadgeComponent, StatusTone } from '../../../../shared/components/status-badge/status-badge.component';
import { JOBS_API } from '../../data/jobs-api';
import { Job } from '../../models/job.models';

const LOAD_ERROR = 'Something went wrong while loading the jobs. Please try again.';
const PAGE_SIZE = 6;

interface JobListVm {
  loading: boolean;
  error: string | null;
  jobs: Job[];
  total: number;
}

/**
 * Feature 2 — omar's part. Route: `/jobs` (public).
 * Active job cards + search + experience filter + pagination.
 */
@Component({
  selector: 'jobs-job-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent, EmptyStateComponent, StatusBadgeComponent],
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobListComponent implements OnInit {
  private readonly api = inject(JOBS_API);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly experienceControl = new FormControl<number | null>(null);

  page = 1;
  readonly pageSize = PAGE_SIZE;

  private readonly vmSubject = new BehaviorSubject<JobListVm>({ loading: true, error: null, jobs: [], total: 0 });
  readonly vm$ = this.vmSubject.asObservable();

  ngOnInit(): void {
    const search$ = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      startWith(this.searchControl.value),
    );
    const experience$ = this.experienceControl.valueChanges.pipe(
      distinctUntilChanged(),
      startWith(this.experienceControl.value),
    );

    combineLatest([search$, experience$])
      .pipe(switchMap(([search, maxExperience]) => this.load(search, maxExperience)))
      .subscribe((vm) => {
        this.page = 1;
        this.vmSubject.next(vm);
      });
  }

  retry(): void {
    this.load(this.searchControl.value, this.experienceControl.value).subscribe((vm) => this.vmSubject.next(vm));
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.experienceControl.setValue(null);
  }

  prevPage(): void {
    if (this.page > 1) this.page--;
  }

  nextPage(totalPages: number): void {
    if (this.page < totalPages) this.page++;
  }

  totalPages(total: number): number {
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  pagedJobs(jobs: Job[]): Job[] {
    const start = (this.page - 1) * this.pageSize;
    return jobs.slice(start, start + this.pageSize);
  }

  skillsOf(job: Job): string[] {
    return job.requiredSkills
      .split(',')
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);
  }

  badgeTone(job: Job): StatusTone {
    return job.isActive ? 'success' : 'neutral';
  }

  trackByJobId(_index: number, job: Job): number {
    return job.id;
  }

  private load(search: string, maxExperience: number | null) {
    return defer(() => {
      this.vmSubject.next({ loading: true, error: null, jobs: [], total: 0 });
      return this.api.getJobs(true);
    }).pipe(
      map((jobs) => {
        const term = search.trim().toLowerCase();
        const filtered = jobs
          .filter((job) => maxExperience == null || job.experienceRequired <= maxExperience)
          .filter(
            (job) =>
              !term ||
              job.title.toLowerCase().includes(term) ||
              job.description.toLowerCase().includes(term) ||
              job.requiredSkills.toLowerCase().includes(term),
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return { loading: false, error: null, jobs: filtered, total: filtered.length };
      }),
      catchError(() => of<JobListVm>({ loading: false, error: LOAD_ERROR, jobs: [], total: 0 })),
    );
  }
}
