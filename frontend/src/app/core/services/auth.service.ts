import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, LoginResponse, RegisterRequest } from '../models/auth.models';
import { TokenService } from './token.service';

/** The backend wraps auth payloads: { value, isSuccess, errors }. */
interface LoginEnvelope {
  value: LoginResponse;
  isSuccess: boolean;
  errors: string[];
}

/**
 * Feature 1 — identity: login / register / logout.
 *
 * NOTE (backend limitation, to raise with the auth team): the
 * POST /api/Auth/RefreshToken endpoint itself requires [Authorize],
 * so silent token refresh on 401 is impossible — when the access
 * token expires the user simply logs in again.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiBaseUrl}/Auth`;

  private readonly userSubject = new BehaviorSubject<AuthUser | null>(this.restore());
  readonly currentUser$ = this.userSubject.asObservable();

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginEnvelope>(`${this.baseUrl}/Login`, request).pipe(
      map((envelope) => {
        if (!envelope.isSuccess || !envelope.value) {
          throw new Error(envelope.errors?.[0] ?? 'Login failed.');
        }
        return envelope.value;
      }),
      tap((response) => {
        this.tokens.store(response.accessToken, response.refreshToken);
        const user = this.tokens.toUser(response.userId, response.name, response.email);
        this.userSubject.next(user);
      }),
    );
  }

  register(request: RegisterRequest): Observable<unknown> {
    // The backend pins new registrations to the Candidate role.
    return this.http.post(`${this.baseUrl}/Register`, request);
  }

  logout(returnUrl?: string): void {
    this.tokens.clear();
    this.userSubject.next(null);
    this.router.navigate(['/auth/login'], { queryParams: returnUrl ? { returnUrl } : {} });
  }

  /** Home route per role after login. */
  homeFor(role: string): string {
    const normalized = role.toLowerCase();
    return normalized === 'hr' || normalized === 'admin' ? '/hr/dashboard' : '/jobs';
  }

  private restore(): AuthUser | null {
    if (!this.tokens.isLoggedIn()) {
      this.tokens.clear();
      return null;
    }
    const identity = this.tokens.getUserIdentity();
    if (!identity) {
      this.tokens.clear();
      return null;
    }
    return identity;
  }
}
