import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogService } from './confirm-dialog.service';

/** Feature 1 — overlay driven by ConfirmDialogService (rendered once in AppComponent). */
@Component({
  selector: 'hr-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overlay" *ngIf="pending$ | async as pending" (click)="cancel(pending)">
      <div class="dialog" role="alertdialog" aria-modal="true" (click)="$event.stopPropagation()">
        <h3>{{ pending.title }}</h3>
        <p *ngIf="pending.message">{{ pending.message }}</p>

        <label class="note" *ngIf="pending.noteField">
          {{ pending.noteLabel ?? 'Note (optional)' }}
          <textarea [(ngModel)]="note" rows="2" maxlength="300" [placeholder]="pending.notePlaceholder ?? ''"></textarea>
        </label>

        <div class="buttons">
          <button type="button" class="btn" (click)="cancel(pending)">{{ pending.cancelText ?? 'Cancel' }}</button>
          <button type="button" class="btn" [class.btn-danger]="pending.danger" [class.btn-primary]="!pending.danger" (click)="confirm(pending)">
            {{ pending.confirmText ?? 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
        padding: 16px;
      }

      .dialog {
        width: min(440px, 100%);
        background: #fff;
        border-radius: 14px;
        padding: 20px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
      }

      h3 {
        margin: 0 0 8px;
        font-size: 16px;
      }

      p {
        margin: 0 0 8px;
        font-size: 14px;
        color: #6b7280;
      }

      .note {
        display: block;
        font-size: 12px;
        color: #6b7280;
      }

      .note textarea {
        display: block;
        width: 100%;
        margin-top: 4px;
        padding: 8px;
        border: 1px solid #d8dee6;
        border-radius: 8px;
        font: inherit;
        resize: vertical;
      }

      .buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 12px;
      }

      .btn {
        border: 1px solid #d8dee6;
        background: #fff;
        border-radius: 10px;
        padding: 8px 16px;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }

      .btn-primary {
        background: #2563eb;
        border-color: #2563eb;
        color: #fff;
      }

      .btn-danger {
        background: #dc2626;
        border-color: #dc2626;
        color: #fff;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  private readonly confirms = inject(ConfirmDialogService);
  readonly pending$ = this.confirms.pending$;
  note = '';

  confirm(pending: { noteField?: boolean }): void {
    this.confirms.answer(true, pending.noteField ? this.note : undefined);
    this.note = '';
  }

  cancel(_pending: unknown): void {
    this.confirms.answer(false);
    this.note = '';
  }
}
