import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';

/** Sends every logged-in user to their own home (HR -> dashboard, Candidate -> jobs). */
@Component({
  selector: 'hr-home-redirect',
  standalone: true,
  template: '',
})
export class HomeRedirectComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (!this.tokens.isLoggedIn()) {
      this.router.navigateByUrl('/auth/login');
      return;
    }
    const role = this.tokens.getRole() ?? '';
    this.router.navigateByUrl(this.auth.homeFor(role));
  }
}
