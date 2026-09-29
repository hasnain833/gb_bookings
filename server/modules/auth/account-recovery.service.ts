import { randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import { connectDatabase } from '../../database/connection.js';
import { AuthTokenModel } from '../../models/auth-token.model.js';
import { UserModel } from '../../models/user.model.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import { passwordResetEmail, verificationEmail } from '../email/auth-email.templates.js';
import { isEmailConfigured, sendTransactionalEmail } from '../email/brevo.service.js';
import { resetUserPassword, type SessionMetadata } from './auth.service.js';
import { hashToken } from './auth.tokens.js';

type AuthTokenType = 'email_verification' | 'password_reset';

function appUrl(path: string, token: string) {
  const base = env.APP_URL ?? 'http://localhost:3000';
  const url = new URL(path, base);
  url.searchParams.set('token', token);
  return url.toString();
}

async function requireDatabase() {
  if (!await connectDatabase()) {
    throw new ServiceUnavailableError('Account recovery is unavailable while the database is disconnected.');
  }
}

async function createActionToken(userId: string, type: AuthTokenType, ttlMinutes: number, ipAddress?: string) {
  const now = new Date();
  await AuthTokenModel.updateMany(
    { userId, type, consumedAt: null },
    { $set: { consumedAt: now } },
  );

  const rawToken = randomBytes(48).toString('base64url');
  const document = await AuthTokenModel.create({
    userId,
    type,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    requestedIp: ipAddress,
  });
  return { rawToken, document };
}

async function consumeActionToken(rawToken: string, type: AuthTokenType) {
  const token = await AuthTokenModel.findOneAndUpdate(
    {
      tokenHash: hashToken(rawToken),
      type,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { consumedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!token) throw new AppError(400, 'INVALID_OR_EXPIRED_TOKEN', 'This link is invalid or has expired.');
  return token;
}

export async function sendEmailVerification(userId: string, metadata: SessionMetadata & { requestId?: string }) {
  if (!isEmailConfigured()) {
    throw new AppError(503, 'EMAIL_PROVIDER_NOT_CONFIGURED', 'Transactional email is not configured.');
  }
  await requireDatabase();
  const user = await UserModel.findOne({ _id: userId, status: 'active', deletedAt: null });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User account was not found.');
  if (user.emailVerifiedAt) return { alreadyVerified: true };

  const { rawToken, document } = await createActionToken(
    String(user._id),
    'email_verification',
    env.EMAIL_VERIFICATION_TTL_MINUTES,
    metadata.ipAddress,
  );
  try {
    await sendTransactionalEmail({
      to: { email: user.email, name: user.name },
      subject: 'Verify your GBBookings email',
      htmlContent: verificationEmail(user.name, appUrl('/verify-email', rawToken)),
      tag: 'email-verification',
    });
  } catch (error) {
    await AuthTokenModel.deleteOne({ _id: document._id });
    throw error;
  }

  await recordAuditEvent({
    actorId: String(user._id),
    actorType: 'user',
    action: 'auth.email_verification_requested',
    resourceType: 'user',
    resourceId: user.publicId,
    ...metadata,
  });
  return { alreadyVerified: false };
}

export async function verifyEmail(rawToken: string, metadata: SessionMetadata & { requestId?: string }) {
  await requireDatabase();
  const token = await consumeActionToken(rawToken, 'email_verification');
  const user = await UserModel.findOneAndUpdate(
    { _id: token.userId, status: 'active', deletedAt: null },
    { $set: { emailVerifiedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!user) throw new AppError(400, 'INVALID_OR_EXPIRED_TOKEN', 'This verification link is invalid or has expired.');

  await recordAuditEvent({
    actorId: String(user._id),
    actorType: 'user',
    action: 'auth.email_verified',
    resourceType: 'user',
    resourceId: user.publicId,
    ...metadata,
  });
}

export async function requestPasswordReset(email: string, metadata: SessionMetadata & { requestId?: string }) {
  if (!isEmailConfigured()) {
    throw new AppError(503, 'EMAIL_PROVIDER_NOT_CONFIGURED', 'Transactional email is not configured.');
  }
  await requireDatabase();
  const user = await UserModel.findOne({ email, status: 'active', deletedAt: null });
  if (!user) return;

  const { rawToken, document } = await createActionToken(
    String(user._id),
    'password_reset',
    env.PASSWORD_RESET_TTL_MINUTES,
    metadata.ipAddress,
  );
  try {
    await sendTransactionalEmail({
      to: { email: user.email, name: user.name },
      subject: 'Reset your GBBookings password',
      htmlContent: passwordResetEmail(user.name, appUrl('/reset-password', rawToken)),
      tag: 'password-reset',
    });
  } catch (error) {
    await AuthTokenModel.deleteOne({ _id: document._id });
    console.error(`Password reset email delivery failed [${metadata.requestId ?? 'no-request-id'}]:`, error);
    return;
  }

  await recordAuditEvent({
    actorId: String(user._id),
    actorType: 'user',
    action: 'auth.password_reset_requested',
    resourceType: 'user',
    resourceId: user.publicId,
    ...metadata,
  });
}

export async function resetPassword(rawToken: string, newPassword: string, metadata: SessionMetadata & { requestId?: string }) {
  await requireDatabase();
  const token = await consumeActionToken(rawToken, 'password_reset');
  await resetUserPassword(String(token.userId), newPassword);
  await recordAuditEvent({
    actorId: String(token.userId),
    actorType: 'user',
    action: 'auth.password_reset_completed',
    resourceType: 'user',
    ...metadata,
  });
}
