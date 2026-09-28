import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { AppError } from '../../shared/app-error.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { logger } from '../../config/logger.js';
import { isEmailConfigured } from '../email/brevo.service.js';
import {
  requestPasswordReset,
  resetPassword,
  sendEmailVerification,
  verifyEmail,
} from './account-recovery.service.js';
import { clearAuthCookies, setAuthCookies } from './auth.cookies.js';
import {
  changePasswordSchema,
  disableTwoFactorSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sessionIdParamsSchema,
  tokenSchema,
  twoFactorSetupSchema,
  updateProfileSchema,
  verifyOtpSchema,
} from './auth.schemas.js';
import {
  changeUserPassword,
  completeTwoFactorLogin,
  beginTwoFactorSetup,
  disableTwoFactor,
  enableTwoFactor,
  getUserById,
  loginUser,
  listUserSessions,
  refreshSession,
  registerUser,
  revokeAllSessions,
  revokeSession,
  revokeUserSession,
  sessionMetadata,
  updateUserProfile,
} from './auth.service.js';
import { REFRESH_COOKIE } from './auth.tokens.js';

export const authRouter = Router();

const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'AUTH_RATE_LIMITED', message: 'Too many authentication attempts. Please try again later.' },
  },
});

authRouter.post('/register', authenticationLimiter, validate('body', registerSchema), asyncHandler(async (request, response) => {
  const result = await registerUser(request.body, sessionMetadata(request));
  setAuthCookies(
    response,
    result.session.accessToken,
    result.session.refreshToken,
    result.session.refreshExpiresAt,
  );
  let emailVerificationSent = false;
  if (isEmailConfigured()) {
    try {
      await sendEmailVerification(result.userId, { ...sessionMetadata(request), requestId: String(request.id) });
      emailVerificationSent = true;
    } catch (error) {
      logger.error({ err: error, requestId: request.id }, 'Registration verification email failed');
    }
  }
  response.status(201).json({ user: result.user, emailVerificationSent });
}));

authRouter.post('/login', authenticationLimiter, validate('body', loginSchema), asyncHandler(async (request, response) => {
  const result = await loginUser(request.body, sessionMetadata(request));
  if (result.requiresTwoFactor) {
    response.status(202).json(result);
    return;
  }
  setAuthCookies(
    response,
    result.session.accessToken,
    result.session.refreshToken,
    result.session.refreshExpiresAt,
  );
  response.json({ user: result.user });
}));

authRouter.post('/login/verify-otp', authenticationLimiter, validate('body', verifyOtpSchema), asyncHandler(async (request, response) => {
  const result = await completeTwoFactorLogin(request.body.challengeId, request.body.code, sessionMetadata(request));
  setAuthCookies(response, result.session.accessToken, result.session.refreshToken, result.session.refreshExpiresAt);
  response.json({ user: result.user });
}));

authRouter.post('/refresh', authenticationLimiter, asyncHandler(async (request, response) => {
  const rawRefreshToken = request.cookies?.[REFRESH_COOKIE];
  if (!rawRefreshToken) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Your session has expired. Please sign in again.');
  const result = await refreshSession(rawRefreshToken, sessionMetadata(request));
  setAuthCookies(
    response,
    result.session.accessToken,
    result.session.refreshToken,
    result.session.refreshExpiresAt,
  );
  response.json({ user: result.user });
}));

authRouter.post('/logout', asyncHandler(async (request, response) => {
  await revokeSession(request.cookies?.[REFRESH_COOKIE]);
  clearAuthCookies(response);
  response.status(204).send();
}));

authRouter.post('/logout-all', authenticate, asyncHandler(async (request, response) => {
  await revokeAllSessions(request.auth!.userId);
  clearAuthCookies(response);
  response.status(204).send();
}));

authRouter.get('/sessions', authenticate, asyncHandler(async (request, response) => {
  const sessions = await listUserSessions(request.auth!.userId, request.auth!.sessionId);
  response.json({ data: sessions });
}));

authRouter.delete('/sessions/:id', authenticate, validate('params', sessionIdParamsSchema), asyncHandler(async (request, response) => {
  await revokeUserSession(request.auth!.userId, request.params.id, sessionMetadata(request));
  if (request.params.id === request.auth!.sessionId) clearAuthCookies(response);
  response.status(204).send();
}));

authRouter.get('/me', authenticate, asyncHandler(async (request, response) => {
  const user = await getUserById(request.auth!.userId);
  response.json({ user: user.public });
}));

authRouter.patch('/me', authenticate, validate('body', updateProfileSchema), asyncHandler(async (request, response) => {
  const user = await updateUserProfile(request.auth!.userId, request.body);
  response.json({ user });
}));

authRouter.post('/change-password', authenticate, validate('body', changePasswordSchema), asyncHandler(async (request, response) => {
  await changeUserPassword(request.auth!.userId, request.body.currentPassword, request.body.newPassword);
  clearAuthCookies(response);
  response.status(204).send();
}));

authRouter.post('/two-factor/setup', authenticationLimiter, authenticate, validate('body', twoFactorSetupSchema), asyncHandler(async (request, response) => {
  const challenge = await beginTwoFactorSetup(request.auth!.userId, request.body.channel, sessionMetadata(request));
  response.json(challenge);
}));

authRouter.post('/two-factor/enable', authenticationLimiter, authenticate, validate('body', verifyOtpSchema), asyncHandler(async (request, response) => {
  const user = await enableTwoFactor(request.auth!.userId, request.body.challengeId, request.body.code, sessionMetadata(request));
  response.json({ user });
}));

authRouter.post('/two-factor/disable', authenticationLimiter, authenticate, validate('body', disableTwoFactorSchema), asyncHandler(async (request, response) => {
  await disableTwoFactor(request.auth!.userId, request.body.password, sessionMetadata(request));
  clearAuthCookies(response);
  response.status(204).send();
}));

authRouter.post('/email-verification/request', authenticationLimiter, authenticate, asyncHandler(async (request, response) => {
  const result = await sendEmailVerification(request.auth!.userId, {
    ...sessionMetadata(request),
    requestId: String(request.id),
  });
  response.json(result);
}));

authRouter.post('/email-verification/confirm', authenticationLimiter, validate('body', tokenSchema), asyncHandler(async (request, response) => {
  await verifyEmail(request.body.token, { ...sessionMetadata(request), requestId: String(request.id) });
  response.status(204).send();
}));

authRouter.post('/forgot-password', authenticationLimiter, validate('body', forgotPasswordSchema), asyncHandler(async (request, response) => {
  await requestPasswordReset(request.body.email, { ...sessionMetadata(request), requestId: String(request.id) });
  response.status(202).json({
    message: 'If an active account exists for that email, password reset instructions will be sent.',
  });
}));

authRouter.post('/reset-password', authenticationLimiter, validate('body', resetPasswordSchema), asyncHandler(async (request, response) => {
  await resetPassword(request.body.token, request.body.newPassword, {
    ...sessionMetadata(request),
    requestId: String(request.id),
  });
  clearAuthCookies(response);
  response.status(204).send();
}));
