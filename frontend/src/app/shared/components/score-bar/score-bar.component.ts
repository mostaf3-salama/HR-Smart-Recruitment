import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Feature 1 — 0–100 match-score bar (null = not scored yet). */
@Component({
  selector: 'hr-score-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="score" [ngClass]="scoreClass">
      <span class="score-track"><span class="score-fill" [style.width.%]="score ?? 0"></span></span>
      {{ score == null ? '—' : score + '%' }}
    </span>
  `,
  styles: [
    `
      .score {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-weight: 800;
        font-size: 13px;
      }

      .score-track {
        width: 72px;
        height: 8px;
        border-radius: 999px;
        background: #eef2f7;
        overflow: hidden;
      }

      .score-fill {
        display: block;
        height: 100%;
        border-radius: 999px;
        background: #94a3b8;
      }

      .is-high {
        color: #15803d;
      }

      .is-high .score-fill {
        background: #16a34a;
      }

      .is-mid {
        color: #b45309;
      }

      .is-mid .score-fill {
        background: #f59e0b;
      }

      .is-low {
        color: #b91c1c;
      }

      .is-low .score-fill {
        background: #dc2626;
      }

      .is-none {
        color: #9ca3af;
      }
    `,
  ],
})
export class ScoreBarComponent {
  @Input() score: number | null = null;

  get scoreClass(): string {
    if (this.score == null) return 'is-none';
    if (this.score >= 80) return 'is-high';
    if (this.score >= 60) return 'is-mid';
    return 'is-low';
  }
}
