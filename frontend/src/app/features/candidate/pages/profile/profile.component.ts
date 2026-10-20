import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { ScoreBarComponent } from '../../../../shared/components/score-bar/score-bar.component';
import { CANDIDATE_API } from '../../data/candidate-api';
import { CvAnalysis, RecommendedJob, UpsertProfileRequest } from '../../models/candidate.models';

const LOAD_ERROR = 'Could not load your profile. Please try again.';
const MAX_CV_BYTES = 5 * 1024 * 1024;

interface ProfileVm {
  loading: boolean;
  error: string | null;
  exists: boolean;
}

/**
 * Feature 3 — samy's part. Route: `/candidate/profile`.
 * ML profile form + PDF-only CV upload with progress.
 */
@Component({
  selector: 'candidate-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent, ScoreBarComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly api = inject(CANDIDATE_API);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly form = this.fb.group({
    age: [25, [Validators.required, Validators.min(18), Validators.max(80)]],
    educationLevel: ['', Validators.required],
    universityTier: ['', Validators.required],
    cgpa: [0, [Validators.required, Validators.min(0), Validators.max(4)]],
    internships: [0, [Validators.required, Validators.min(0)]],
    projects: [0, [Validators.required, Validators.min(0)]],
    programmingLanguages: [1, [Validators.required, Validators.min(0)]],
    certifications: [0, [Validators.required, Validators.min(0)]],
    experienceYears: [0, [Validators.required, Validators.min(0)]],
    hackathons: [0, [Validators.required, Validators.min(0)]],
    researchPapers: [0, [Validators.required, Validators.min(0)]],
    skillsScore: [0, [Validators.required, Validators.min(0)]],
    softSkillsScore: [0, [Validators.required, Validators.min(0)]],
    resumeLengthWords: [300, [Validators.required, Validators.min(0)]],
    companyType: ['', Validators.required],
    skills: [''],
    bio: [''],
  });

  private readonly vmSubject = new BehaviorSubject<ProfileVm>({ loading: true, error: null, exists: false });
  readonly vm$ = this.vmSubject.asObservable();

  saving = false;
  currentCvName: string | null = null;

  uploading = false;
  uploadProgress = 0;
  uploadError: string | null = null;

  // AI recommendations (appear after a CV upload).
  recsLoading = false;
  recsError: string | null = null;
  recs: RecommendedJob[] | null = null;
  cvAnalysis: CvAnalysis | null = null;

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.api.getMyProfile().subscribe({
      next: (profile) => {
        this.vmSubject.next({ loading: false, error: null, exists: true });
        this.currentCvName = profile.cvFileName ?? null;
        this.form.patchValue({ ...profile });
        // Returning user with a CV → show the cached AI recommendations.
        if (profile.hasCv) {
          this.loadRecommendations();
          this.loadCvAnalysis();
        }
      },
      // 404 = first visit, show a blank form instead of an error.
      error: () => this.vmSubject.next({ loading: false, error: null, exists: false }),
    });
  }

  retry(): void {
    this.vmSubject.next({ loading: true, error: null, exists: false });
    this.api.getMyProfile().subscribe({
      next: (profile) => {
        this.vmSubject.next({ loading: false, error: null, exists: true });
        this.currentCvName = profile.cvFileName ?? null;
        this.form.patchValue({ ...profile });
      },
      error: () => this.vmSubject.next({ loading: false, error: LOAD_ERROR, exists: false }),
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const value = this.form.getRawValue();
    const request: UpsertProfileRequest = {
      age: Number(value.age),
      educationLevel: value.educationLevel!,
      universityTier: value.universityTier!,
      cgpa: Number(value.cgpa),
      internships: Number(value.internships),
      projects: Number(value.projects),
      programmingLanguages: Number(value.programmingLanguages),
      certifications: Number(value.certifications),
      experienceYears: Number(value.experienceYears),
      hackathons: Number(value.hackathons),
      researchPapers: Number(value.researchPapers),
      skillsScore: Number(value.skillsScore),
      softSkillsScore: Number(value.softSkillsScore),
      resumeLengthWords: Number(value.resumeLengthWords),
      companyType: value.companyType!,
      skills: value.skills ?? undefined,
      bio: value.bio ?? undefined,
    };
    this.api.upsertProfile(request).subscribe({
      next: () => {
        this.saving = false;
        this.vmSubject.next({ ...this.vmSubject.value, exists: true });
        this.toast.success('Profile saved ✓');
      },
      error: () => {
        this.saving = false;
        this.toast.error('Could not save the profile. Please try again.');
        // Zoneless: async callbacks don't refresh the view by themselves.
        this.cdr.markForCheck();
      },
    });
  }

  onCvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.uploadError = 'Only PDF files are allowed.';
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      this.uploadError = 'CV must not exceed 5 MB.';
      return;
    }

    this.uploading = true;
    this.uploadProgress = 0;
    this.uploadError = null;

    this.api.uploadCv(file).subscribe({
      next: (percent) => {
        this.uploadProgress = percent;
        // Zoneless: progress ticks must refresh the view manually.
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.uploading = false;
        this.uploadError = this.readServerError(error);
        this.cdr.markForCheck();
      },
      complete: () => {
        this.uploading = false;
        this.currentCvName = file.name;
        this.toast.success('CV uploaded ✓ — the AI is re-ranking jobs for you');
        // The backend already started the AI pipeline during the upload;
        // this call reads the results (or triggers it if it failed earlier).
        this.loadRecommendations();
        this.loadCvAnalysis();
        this.cdr.markForCheck();
      },
    });
  }

  /** Surfaces the backend's own message (e.g. "save your profile first"). */
  private readServerError(error: unknown): string {
    const body = (error as { error?: string[] | string })?.error;
    if (Array.isArray(body) && body.length) return body[0];
    if (typeof body === 'string' && body) return body;
    return 'Upload failed. Please try again.';
  }

  // ---------------------------------------------------------------------------
  // AI recommendations
  // ---------------------------------------------------------------------------

  /** Reads the cached recommendations (the backend regenerates them if missing). */
  loadRecommendations(): void {
    if (this.recsLoading) return;
    this.recsLoading = true;
    this.recsError = null;
    this.cdr.markForCheck();
    this.api.getRecommendedJobs().subscribe({
      next: (jobs) => this.recsLoaded(jobs ?? []),
      error: () => this.recsFailed(),
    });
  }

  /** Forces the AI pipeline to regenerate everything ("Refresh" / "Retry"). */
  refreshRecommendations(): void {
    if (this.recsLoading) return;
    this.recsLoading = true;
    this.recsError = null;
    this.cdr.markForCheck();
    this.api.refreshRecommendations().subscribe({
      next: () => {
        this.loadCvAnalysis();
        this.api.getRecommendedJobs().subscribe({
          next: (jobs) => this.recsLoaded(jobs ?? []),
          error: () => this.recsFailed(),
        });
      },
      error: () => this.recsFailed(),
    });
  }

  private loadCvAnalysis(): void {
    this.api.getCvAnalysis().subscribe({
      next: (analysis) => {
        this.cvAnalysis = analysis;
        this.cdr.markForCheck();
      },
      error: () => {
        /* CV summary is optional — silently ignore. */
      },
    });
  }

  private recsLoaded(jobs: RecommendedJob[]): void {
    this.recs = jobs;
    this.recsLoading = false;
    this.cdr.markForCheck();
  }

  private recsFailed(): void {
    this.recsLoading = false;
    this.recsError = 'Could not load the AI recommendations. Please try again in a moment.';
    this.cdr.markForCheck();
  }

  /** "a, b , c" → ["a", "b", "c"] for the skill chips. */
  splitSkills(value: string | null): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}
