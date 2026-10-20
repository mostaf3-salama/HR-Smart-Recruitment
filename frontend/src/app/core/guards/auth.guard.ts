import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

/** Feature 1 — blocks anonymous users (remembers where they wanted to go). */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(TokenService).isLoggedIn()) return true;
  return inject(Router).createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};
