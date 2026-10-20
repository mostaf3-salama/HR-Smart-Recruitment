import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

/**
 * Feature 1 — global safety net. Toasts ONLY network failures (status 0)
 * and server crashes (5xx). Anything else (400/401/403/404) is left for
 * the calling page, which shows its own inline message.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          toast.error('No connection to the server. Check that the API is running.');
        } else if (error.status >= 500) {
          toast.error('Something went wrong on the server. Please try again later.');
        }
      }
      return throwError(() => error);
    }),
  );
};
