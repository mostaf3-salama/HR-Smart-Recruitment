import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

/** Feature 1 — global toast stack (rendered once in AppComponent). */
@Component({
  selector: 'hr-toast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      <div *ngFor="let toast of toasts$ | async" class="toast" [ngClass]="'is-' + toast.tone" role="status">
        <span>{{ toast.message }}</span>
        <button type="button" class="toast-close" (click)="dismiss(toast.id)" aria-label="Dismiss">✕</button>
      </div>
    </div>
  `,
  styles: [
    `
      .toasts {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 1000;
        width: min(480px, calc(100vw - 32px));
      }

      .toast {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        background: #0f172a;
        color: #f1f5f9;
      }

      .toast.is-success {
        background: #15803d;
        color: #fff;
      }

      .toast.is-error {
        background: #b91c1c;
        color: #fff;
      }

      .toast-close {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 14px;
        opacity: 0.8;
      }
    `,
  ],
})
export class ToastComponent {
  private readonly toastService = inject(ToastService);
  readonly toasts$ = this.toastService.toasts$;

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
