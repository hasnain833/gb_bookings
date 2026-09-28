import type { Response } from 'express';
import { env } from '../../config/env.js';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth.tokens.js';

const common = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api',
};

export function setAuthCookies(
  response: Response,
  accessToken: string,
  refreshToken: string,
  refreshExpiresAt: Date,
) {
  response.cookie(ACCESS_COOKIE, accessToken, {
    ...common,
    maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000,
  });
  response.cookie(REFRESH_COOKIE, refreshToken, {
    ...common,
    expires: refreshExpiresAt,
  });
}

export function clearAuthCookies(response: Response) {
  response.clearCookie(ACCESS_COOKIE, common);
  response.clearCookie(REFRESH_COOKIE, common);
}
