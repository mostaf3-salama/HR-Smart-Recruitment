import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/** Feature 1 — Empty state block with an optional action button. */
@Component({
  selector: 'hr-empty-state',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <p>{{ message }}</p>
      <button *ngIf="actionLabel" type="button" class="btn" (click)="action.emit()">{{ actionLabel }}</button>
    </div>
  `,
  styles: [
    `
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 48px 16px;
        text-align: center;
        border: 1px dashed var(--hr-border, #d8dee6);
        border-radius: 14px;
        color: var(--hr-text-muted, #6b7280);
      }

      .empty p {
        margin: 0;
      }

      .btn {
        border: 1px solid var(--hr-border, #d8dee6);
        background: var(--hr-surface, #fff);
        border-radius: 10px;
        padding: 8px 16px;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() message = 'Nothing here yet.';
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();
}
