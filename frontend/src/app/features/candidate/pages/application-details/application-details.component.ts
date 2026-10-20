import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, defer, map, of } from 'rxjs';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { ScoreBarComponent } from '../../../../shared/components/score-bar/score-bar.component';
import { StatusBadgeComponent, StatusTone } from '../../../../shared/components/status-badge/status-badge.component';
import { ApplicantDetails } from '../../../hr/applicants/models/applicant.models';
import { CANDIDATE_API } from '../../data/candidate-api';

const LOAD_ERROR = 'Could not load this application.';
const STATUS_TONES: Record<string, StatusTone> = {
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
 * Feature 3 — ahmed's part. Route: `/candidate/applications/:id`.
 * Status timeline + score + interview info for my own application.
 */
@Component({
  selector: 'candidate-application-details',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent, StatusBadgeComponent, ScoreBarComponent],
  templateUrl: './application-details.component.html',
  styleUrls: ['./application-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateApplicationDetailsComponent implements OnInit {
  private readonly api = inject(CANDIDATE_API);
  private readonly route = inject(ActivatedRoute);

  private readonly vmSubject = new BehaviorSubject<DetailsVm>({ loading: true, error: null, application: null });
  readonly vm$ = this.vmSubject.asObservable();

  ngOnInit(): void {
    this.load();
  }

  retry(): void {
    this.load();
  }

  statusTone(status: string): StatusTone {
    return STATUS_TONES[status] ?? 'neutral';
  }

  private load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    defer(() => {
      this.vmSubject.next({ loading: true, error: null, application: null });
      return this.api.getMyApplicationDetails(id);
    })
      .pipe(
        map((application) => ({ loading: false, error: null, application })),
        catchError(() => of<DetailsVm>({ loading: false, error: LOAD_ERROR, application: null })),
      )
      .subscribe((vm) => this.vmSubject.next(vm));
  }
}
