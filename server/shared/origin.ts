import { env } from '../config/env.js';

const allowedCorsOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(env.APP_URL ? [new URL(env.APP_URL).origin] : []),
]);

/** Origins allowed to call the API with cookies (CORS) and to open the realtime socket. */
export function isAllowedOrigin(origin: string, host?: string) {
  if (allowedCorsOrigins.has(origin)) return true;
  // Browsers send Origin on same-origin POSTs, so the deployed domain must always pass.
  try { return new URL(origin).host === host; } catch { return false; }
}
