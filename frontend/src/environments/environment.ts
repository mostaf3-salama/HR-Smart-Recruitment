/**
 * Feature 1 — shared environment (owned by dina & seleem, placeholder values).
 * All HTTP services must read the API root from here, never hardcode URLs.
 */
export const environment = {
  production: false,
  /** Same-origin; the dev-server proxy forwards /api -> http://localhost:5030. */
  apiBaseUrl: '/api',
};
