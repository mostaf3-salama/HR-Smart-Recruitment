import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ApplicantAction, ApplicantListItem, APPLICATION_STATUSES, ApplicationStatus } from '../../models/applicant.models';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';

/** Label + color of every status chip. */
export const STATUS_META: Record<ApplicationStatus, { label: string; className: string }> = {
  Submitted: { label: 'Submitted', className: 'is-submitted' },
  Shortlisted: { label: 'Shortlisted', className: 'is-shortlisted' },
  Interview: { label: 'Interview', className: 'is-interview' },
  Accepted: { label: 'Accepted', className: 'is-accepted' },
  Rejected: { label: 'Rejected', className: 'is-rejected' },
};

const CONFIRM_TEXT: Record<ApplicantAction, { title: string; danger?: boolean }> = {
  shortlist: { title: 'Move the applicant to Shortlisted?' },
  accept: { title: 'Confirm accepting the applicant?' },
  reject: { title: 'Confirm rejecting the application?', danger: true },
};

/**
 * HR decision bar: Shortlist / Reject / Accept.
 * Confirmation goes through the shared <hr-confirm-dialog> (Feature 1).
 */
@Component({
  selector: 'hr-status-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-actions.component.html',
  styleUrls: ['./status-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusActionsComponent {
  private readonly confirms = inject(ConfirmDialogService);

  @Input({ required: true }) application!: ApplicantListItem;
  /** `true` = icon-only buttons inside the table row. */
  @Input() compact = false;
  @Input() disabled = false;

  @Output() actionRequested = new EventEmitter<{ action: ApplicantAction; note?: string }>();

  readonly statuses = APPLICATION_STATUSES;

  get canShortlist(): boolean {
    return this.application.status === 'Submitted';
  }

  get canAccept(): boolean {
    return this.application.status === 'Shortlisted' || this.application.status === 'Interview';
  }

  get canReject(): boolean {
    return this.application.status !== 'Accepted' && this.application.status !== 'Rejected';
  }

  async request(action: ApplicantAction, event?: Event): Promise<void> {
    event?.stopPropagation();
    if (this.disabled) return;

    const config = CONFIRM_TEXT[action];
    const { confirmed, note } = await this.confirms.open({
      title: config.title,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      danger: config.danger,
      noteField: true,
      noteLabel: 'Note (optional)',
      notePlaceholder: 'e.g. Great Angular experience…',
    });

    if (confirmed) {
      this.actionRequested.emit({ action, note });
    }
  }
}
