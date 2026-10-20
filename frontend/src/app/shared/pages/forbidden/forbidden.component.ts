import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Feature 1 — 403 page (wrong role for the area). */
@Component({
  selector: 'hr-forbidden',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" dir="ltr">
      <h1>403</h1>
      <p>You don't have permission to open this area.</p>
      <a routerLink="/">Back to home</a>
    </div>
  `,
  styles: [
    `
      .page {
        min-height: 80vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #1f2937;
      }

      h1 {
        margin: 0;
        font-size: 56px;
      }

      p {
        margin: 0;
        color: #6b7280;
      }

      a {
        margin-top: 8px;
        color: #2563eb;
      }
    `,
  ],
})
export class ForbiddenComponent {}
