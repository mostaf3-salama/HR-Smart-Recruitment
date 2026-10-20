import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warn' | 'danger';

/** Feature 1 — generic status pill. Callers map their status to text + tone. */
@Component({
  selector: 'hr-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <span class="badge" [ngClass]="'is-' + tone"><ng-content></ng-content></span> `,
  styles: [
    `
      .badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .is-neutral {
        background: #f1f5f9;
        color: #475569;
      }

      .is-info {
        background: #eff6ff;
        color: #1d4ed8;
      }

      .is-success {
        background: #f0fdf4;
        color: #15803d;
      }

      .is-warn {
        background: #fef9c3;
        color: #a16207;
      }

      .is-danger {
        background: #fef2f2;
        color: #b91c1c;
      }
    `,
  ],
})
export class StatusBadgeComponent {
  @Input() tone: StatusTone = 'neutral';
}
