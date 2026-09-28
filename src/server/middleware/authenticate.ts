import type { RequestHandler } from 'express';
import { connectDatabase } from '../database/connection.js';
import { SessionModel } from '../models/session.model.js';
import type { UserRole } from '../models/user.model.js';
import { AppError, ServiceUnavailableError } from '../shared/app-error.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../modules/auth/auth.tokens.js';
import { asyncHandler } from '../shared/async-handler.js';

export const authenticate: RequestHandler = asyncHandler(async (request, _response, next) => {
  const token = request.cookies?.[ACCESS_COOKIE];
  if (!token) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Please sign in to continue.');

  const payload = verifyAccessToken(token);
  if (!await connectDatabase()) throw new ServiceUnavailableError('Authentication is unavailable while the database is disconnected.');

  const sessionExists = await SessionModel.exists({
    publicId: payload.sid,
    userId: payload.sub,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!sessionExists) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Your session is no longer active.');

  request.auth = { userId: payload.sub, sessionId: payload.sid, roles: payload.roles };
  next();
});

export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) return next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Please sign in to continue.'));
    if (!request.auth.roles.some((role) => allowedRoles.includes(role))) {
      return next(new AppError(403, 'PERMISSION_DENIED', 'You do not have permission to perform this action.'));
    }
    next();
  };
}
