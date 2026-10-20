import { Injectable } from '@angular/core';
import { AuthUser } from '../models/auth.models';

const ACCESS_KEY = 'hr_access_token';
const REFRESH_KEY = 'hr_refresh_token';

interface JwtPayload {
  exp?: number;
  sub?: string;
  name?: string;
  email?: string;
  role?: string;
  [claim: string]: unknown;
}

/** .NET serializes ClaimTypes.* to long URIs — accept both forms. */
const CLAIM_ALIASES: Record<'sub' | 'name' | 'email' | 'role', string[]> = {
  sub: ['sub', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
  name: ['name', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
  email: ['email', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
  role: ['role', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
};

function readClaim(payload: JwtPayload, key: keyof typeof CLAIM_ALIASES): string | null {
  for (const name of CLAIM_ALIASES[key]) {
    const value = payload[name];
    if (typeof value === 'string' && value) return value;
  }
  return null;
}

/**
 * Feature 1 — stores the JWT + refresh token and answers
 * "is anyone logged in?" / "which role?" from the token payload.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  store(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isExpired(token);
  }

  getRole(): string | null {
    const payload = this.readPayload();
    return payload ? readClaim(payload, 'role') : null;
  }

  getUserIdentity(): { id: number; name: string; email: string; role: string } | null {
    const payload = this.readPayload();
    if (!payload) return null;
    const role = readClaim(payload, 'role');
    if (!role) return null;
    return {
      id: Number(readClaim(payload, 'sub') ?? 0),
      name: readClaim(payload, 'name') ?? '',
      email: readClaim(payload, 'email') ?? '',
      role,
    };
  }

  toUser(userId: number, name: string, email: string): AuthUser | null {
    const role = this.getRole();
    if (!role) return null;
    return { id: userId, name, email, role };
  }

  private isExpired(token: string): boolean {
    const exp = this.readPayload(token)?.exp;
    if (!exp) return true;
    return Date.now() >= exp * 1000;
  }

  private readPayload(token?: string): JwtPayload | null {
    const raw = token ?? this.getAccessToken();
    if (!raw) return null;
    try {
      const [, payload] = raw.split('.');
      return JSON.parse(atob(payload)) as JwtPayload;
    } catch {
      return null;
    }
  }
}
