import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

/**
 * Feature 1 — usage: { canActivate: [roleGuard], data: { roles: ['HR', 'Admin'] } }.
 * Comparison is case-insensitive ('admin' from the backend passes 'Admin').
 */
export const roleGuard: CanActivateFn = (route) => {
  const allowed = ((route.data?.['roles'] as string[] | undefined) ?? []).map((role) => role.toLowerCase());
  const actual = (inject(TokenService).getRole() ?? '').toLowerCase();
  if (allowed.includes(actual)) return true;
  return inject(Router).createUrlTree(['/forbidden']);
};
