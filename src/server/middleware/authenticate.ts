import type { RequestHandler } from 'express';
import { connectDatabase } from '../database/connection.js';
import { SessionModel } from '../models/session.model.js';
import { UserModel } from '../models/user.model.js';
import type { UserRole } from '../models/user.model.js';
import type { PermissionKey } from '../models/permission.model.js';
import { hasPermission } from '../modules/auth/rbac.js';
import { AppError, ServiceUnavailableError } from '../shared/app-error.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../modules/auth/auth.tokens.js';
import { asyncHandler } from '../shared/async-handler.js';

export const authenticate: RequestHandler = asyncHandler(async (request, _response, next) => {
  const token = request.cookies?.[ACCESS_COOKIE];
  if (!token) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Please sign in to continue.');

  const payload = verifyAccessToken(token);
  if (!await connectDatabase()) throw new ServiceUnavailableError('Authentication is unavailable while the database is disconnected.');

  const [sessionExists, user] = await Promise.all([
    SessionModel.exists({
      publicId: payload.sid,
      userId: payload.sub,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }),
    UserModel.findOne({ _id: payload.sub, status: 'active', deletedAt: null }).select('roles'),
  ]);
  if (!sessionExists) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Your session is no longer active.');
  if (!user) throw new AppError(403, 'ACCOUNT_UNAVAILABLE', 'This account is not currently active.');

  request.auth = { userId: payload.sub, sessionId: payload.sid, roles: user.roles };
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

export function authorizePermission(permission: PermissionKey): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) return next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Please sign in to continue.'));
    if (!hasPermission(request.auth.roles, permission)) {
      return next(new AppError(403, 'PERMISSION_DENIED', 'You do not have permission to perform this action.'));
    }
    next();
  };
}
