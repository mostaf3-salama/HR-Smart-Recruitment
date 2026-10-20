import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Feature 1 — 404 page. Also covers routes owned by Features 2 & 3
 * (jobs / candidate pages) until those teams deliver them.
 */
@Component({
  selector: 'hr-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" dir="ltr">
      <h1>404</h1>
      <p>This page doesn't exist yet — it belongs to an upcoming feature.</p>
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
export class NotFoundComponent {}
