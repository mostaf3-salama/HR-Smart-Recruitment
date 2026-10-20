import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Feature 1 — spinner block for Loading states. */
@Component({
  selector: 'hr-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="loader" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <p><ng-content>Loading…</ng-content></p>
    </div>
  `,
  styles: [
    `
      .loader {
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

      .loader p {
        margin: 0;
      }

      .spinner {
        width: 34px;
        height: 34px;
        border: 3px solid var(--hr-border, #d8dee6);
        border-top-color: var(--hr-primary, #2563eb);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoaderComponent {
  @Input() text = 'Loading…';
}
