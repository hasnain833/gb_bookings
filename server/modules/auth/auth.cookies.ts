import type { Response } from 'express';
import { env } from '../../config/env.js';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth.tokens.js';
import { TRUSTED_DEVICE_COOKIE } from './trusted-device.service.js';

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
  rememberMe = false,
) {
  response.cookie(ACCESS_COOKIE, accessToken, {
    ...common,
    ...(rememberMe ? { maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000 } : {}),
  });
  response.cookie(REFRESH_COOKIE, refreshToken, {
    ...common,
    ...(rememberMe ? { expires: refreshExpiresAt } : {}),
  });
}

export function clearAuthCookies(response: Response) {
  response.clearCookie(ACCESS_COOKIE, common);
  response.clearCookie(REFRESH_COOKIE, common);
}

export function setTrustedDeviceCookie(response: Response, device?: { token: string; expiresAt: Date }) {
  if (device) response.cookie(TRUSTED_DEVICE_COOKIE, device.token, { ...common, expires: device.expiresAt });
}

export function clearTrustedDeviceCookie(response: Response) {
  response.clearCookie(TRUSTED_DEVICE_COOKIE, common);
}
