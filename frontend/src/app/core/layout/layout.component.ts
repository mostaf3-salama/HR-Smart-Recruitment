import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../services/loading.service';

/**
 * Feature 1 — application shell: topbar + role-based sidebar + content.
 * HR/Admin see the HireDesk links; candidates see placeholders until
 * Feature 3 delivers their pages.
 */
@Component({
  selector: 'hr-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly loading = inject(LoadingService);

  readonly user$ = this.auth.currentUser$;
  readonly loadingActive$ = this.loading.active$;
  readonly isHr$ = this.auth.currentUser$.pipe(
    map((user) => !!user && ['hr', 'admin'].includes(user.role.toLowerCase())),
  );

  logout(): void {
    this.auth.logout();
  }
}
