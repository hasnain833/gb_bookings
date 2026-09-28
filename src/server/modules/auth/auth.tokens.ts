import { createHash, randomBytes } from 'node:crypto';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/app-error.js';
import type { UserRole } from '../../models/user.model.js';

export const ACCESS_COOKIE = 'gb_access_token';
export const REFRESH_COOKIE = 'gb_refresh_token';

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  sid: string;
  roles: UserRole[];
}

export function createRefreshToken() {
  return randomBytes(48).toString('base64url');
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(payload: Pick<AccessTokenPayload, 'sub' | 'sid' | 'roles'>) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.ACCESS_TOKEN_TTL_MINUTES * 60,
    issuer: 'gbbookings-api',
    audience: 'gbbookings-web',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: 'gbbookings-api',
      audience: 'gbbookings-web',
    }) as AccessTokenPayload;
  } catch {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Your session is missing or has expired.');
  }
}
