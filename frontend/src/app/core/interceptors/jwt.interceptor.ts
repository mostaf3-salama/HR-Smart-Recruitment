import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

/** Auth endpoints carry no token (nothing to attach yet). */
const PUBLIC_URLS = ['/api/Auth/Login', '/api/Auth/Register', '/api/Auth/forgotPassword', '/api/Auth/resetPassword'];

/**
 * Feature 1 — attaches `Authorization: Bearer <jwt>` to every /api call.
 * On 401 the session is dropped and the user returns to /auth/login.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const auth = inject(AuthService);
  const router = inject(Router);

  if (PUBLIC_URLS.some((url) => req.url.includes(url))) {
    return next(req);
  }

  const accessToken = tokens.getAccessToken();
  const authReq = accessToken ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.logout(router.url);
      }
      return throwError(() => error);
    }),
  );
};
