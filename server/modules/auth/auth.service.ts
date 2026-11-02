import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import type { Request } from 'express';
import { connectDatabase } from '../../database/connection.js';
import { SessionModel } from '../../models/session.model.js';
import { UserModel, type UserRole } from '../../models/user.model.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { env } from '../../config/env.js';
import { createRefreshToken, hashToken, signAccessToken } from './auth.tokens.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import { createOtpChallenge, consumeOtpChallenge } from '../otp/otp.service.js';
import type { OtpChannel } from '../otp/otp-provider.js';
import { TrustedDeviceModel } from '../../models/trusted-device.model.js';
import { isTrustedDevice, rememberDevice, REMEMBER_DAYS } from './trusted-device.service.js';
import { BookingModel } from '../../models/booking.model.js';
import { VendorModel } from '../../models/vendor.model.js';
import { VendorMemberModel } from '../../models/vendor-member.model.js';
import { todayInPakistan } from '../bookings/stay-dates.js';

const PASSWORD_COST = 12;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
// Version of the Terms and Privacy Policy a new account accepts.
const POLICY_VERSION = '2026-10-13';
const dummyPasswordHash = bcrypt.hash('invalid-password-placeholder', PASSWORD_COST);

export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
  requestId?: string;
}

export function sessionMetadata(request: Request): SessionMetadata {
  return {
    userAgent: request.get('user-agent')?.slice(0, 500),
    ipAddress: request.ip?.slice(0, 100),
    requestId: String(request.id),
  };
}

async function requireDatabase() {
  if (!await connectDatabase()) {
    throw new ServiceUnavailableError('Authentication is unavailable while the database is disconnected.');
  }
}

function publicUser(user: any) {
  return {
    id: user.publicId,
    email: user.email,
    name: user.name,
    phone: user.phone ?? undefined,
    role: (user.roles?.[0] ?? 'customer') as UserRole,
    roles: (user.roles ?? ['customer']) as UserRole[],
    emailVerified: Boolean(user.emailVerifiedAt),
    twoFactorEnabled: Boolean(user.twoFactor?.enabled),
    twoFactorChannel: user.twoFactor?.channel ?? 'email',
    memberSince: user.createdAt,
  };
}

export async function issueSession(user: any, rememberMe: boolean, metadata: SessionMetadata) {
  const refreshToken = createRefreshToken();
  const ttlDays = rememberMe ? REMEMBER_DAYS : env.REFRESH_TOKEN_TTL_DAYS;
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  const session = await SessionModel.create({
    userId: user._id,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt,
    rememberMe,
    ...metadata,
  });

  return {
    accessToken: signAccessToken({
      sub: String(user._id),
      sid: session.publicId,
      roles: user.roles,
    }),
    refreshToken,
    refreshExpiresAt: expiresAt,
    sessionId: session.publicId,
    rememberMe,
  };
}

export async function registerUser(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  acceptTerms: true;
}, metadata: SessionMetadata) {
  await requireDatabase();

  const existing = await UserModel.exists({ email: input.email, deletedAt: null });
  if (existing) throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'An account already exists for this email address.');

  const challenge = await createOtpChallenge({
    channel: 'email', destination: input.email, recipientName: input.name, purpose: 'signup',
    requestedIp: metadata.ipAddress,
    registration: { name: input.name, email: input.email, phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, PASSWORD_COST), termsAcceptedAt: new Date(), policyVersion: POLICY_VERSION },
  });
  return { requiresEmailVerification: true as const, ...challenge };
}

export async function completeRegistration(challengeId: string, code: string, metadata: SessionMetadata) {
  await requireDatabase();
  const challenge = await consumeOtpChallenge(challengeId, code, 'signup');
  if (!challenge.registration) throw new AppError(400, 'INVALID_OR_EXPIRED_OTP', 'Please start signup again to request a new code.');
  const registration = challenge.registration;
  try {
    const user = await UserModel.create({
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      passwordHash: registration.passwordHash,
      termsAcceptedAt: registration.termsAcceptedAt,
      policyVersion: registration.policyVersion,
      emailVerifiedAt: new Date(),
      roles: ['customer'],
    });
    return { user: publicUser(user), session: await issueSession(user, false, metadata) };
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'An account already exists for this email address.');
    }
    throw error;
  }
}

export async function loginUser(
  input: { email: string; password: string; rememberMe: boolean },
  metadata: SessionMetadata,
  trustedDeviceToken?: string,
) {
  await requireDatabase();
  const user = await UserModel.findOne({ email: input.email, deletedAt: null })
    .select('+passwordHash +failedLoginAttempts +lockedUntil');

  if (!user) {
    await bcrypt.compare(input.password, await dummyPasswordHash);
    await recordAuditEvent({
      actorType: 'system', action: 'auth.login_failed_unknown_user', resourceType: 'authentication',
      ...metadata,
      metadata: { emailFingerprint: createHash('sha256').update(input.email).digest('hex') },
    });
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  if (user.status !== 'active') {
    throw new AppError(403, 'ACCOUNT_UNAVAILABLE', 'This account is not currently active.');
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await recordAuditEvent({
      actorId: String(user._id), actorType: 'user', action: 'auth.login_blocked_lockout',
      resourceType: 'user', resourceId: user.publicId, ...metadata,
    });
    throw new AppError(429, 'ACCOUNT_TEMPORARILY_LOCKED', 'Too many failed login attempts. Please try again later.');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    const failedAttempts = (user.failedLoginAttempts ?? 0) + 1;
    user.failedLoginAttempts = failedAttempts;
    user.lockedUntil = failedAttempts >= MAX_FAILED_LOGINS
      ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
      : null;
    await user.save();
    await recordAuditEvent({
      actorId: String(user._id), actorType: 'user',
      action: failedAttempts >= MAX_FAILED_LOGINS ? 'auth.account_locked' : 'auth.login_failed_password',
      resourceType: 'user', resourceId: user.publicId, ...metadata,
      metadata: { failedAttempts },
    });
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();
  return completeSignIn(user, input.rememberMe, metadata, trustedDeviceToken, 'auth.login_succeeded');
}

/** After the first factor (password or Google): asks for the two-step code unless the device is trusted, else starts a session. */
async function completeSignIn(user: any, rememberMe: boolean, metadata: SessionMetadata, trustedDeviceToken: string | undefined, auditAction: string) {
  if (user.twoFactor?.enabled && !(rememberMe && await isTrustedDevice(String(user._id), trustedDeviceToken, metadata.userAgent))) {
    const challenge = await createOtpChallenge({
      userId: String(user._id),
      channel: user.twoFactor.channel,
      destination: user.twoFactor.channel === 'sms' ? user.phone : user.email,
      recipientName: user.name,
      purpose: 'two_factor_login',
      rememberMe,
      requestedIp: metadata.ipAddress,
    });
    await recordAuditEvent({
      actorId: String(user._id), actorType: 'user', action: 'auth.two_factor_challenge_sent',
      resourceType: 'user', resourceId: user.publicId, ...metadata,
    });
    return { requiresTwoFactor: true as const, ...challenge };
  }
  const session = await issueSession(user, rememberMe, metadata);
  await recordAuditEvent({
    actorId: String(user._id), actorType: 'user', action: auditAction,
    resourceType: 'session', ...metadata,
  });
  return { requiresTwoFactor: false as const, user: publicUser(user), session };
}

/**
 * Checks a Google ID token with Google and returns the verified profile.
 * ponytail: Google's tokeninfo endpoint (one HTTPS call per sign-in); verify locally against Google's JWKS if sign-in volume gets high.
 */
async function verifyGoogleCredential(credential: string) {
  if (!env.GOOGLE_CLIENT_ID) throw new AppError(503, 'GOOGLE_SIGN_IN_UNAVAILABLE', 'Google sign-in is not available right now.');
  let info: any;
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { signal: AbortSignal.timeout(10_000) });
    info = response.ok ? await response.json() : null;
  } catch {
    throw new ServiceUnavailableError('Google could not be reached. Please try again.');
  }
  // tokeninfo has already checked the signature and expiry; the audience and issuer are ours to check.
  if (!info || info.aud !== env.GOOGLE_CLIENT_ID || !['accounts.google.com', 'https://accounts.google.com'].includes(info.iss) || !info.sub || !info.email) {
    throw new AppError(401, 'GOOGLE_TOKEN_INVALID', 'Google sign-in failed. Please try again.');
  }
  if (info.email_verified !== true && info.email_verified !== 'true') {
    throw new AppError(401, 'GOOGLE_EMAIL_UNVERIFIED', 'Your Google email address is not verified.');
  }
  return { googleId: String(info.sub), email: String(info.email).toLowerCase(), name: String(info.name || info.email.split('@')[0]).slice(0, 120) };
}

/**
 * Sign in with Google. An existing account with the same (Google-verified) email is linked to the Google account;
 * otherwise a customer account is created. Two-step sign-in still applies to accounts that have it on.
 */
export async function googleSignIn(credential: string, rememberMe: boolean, metadata: SessionMetadata, trustedDeviceToken?: string) {
  const profile = await verifyGoogleCredential(credential);
  await requireDatabase();
  let user = await UserModel.findOne({ googleId: profile.googleId, deletedAt: null })
    ?? await UserModel.findOne({ email: profile.email, deletedAt: null });
  let created = false;
  if (!user) {
    try {
      user = await UserModel.create({
        name: profile.name.length >= 2 ? profile.name : 'Guest',
        email: profile.email,
        googleId: profile.googleId,
        // No password yet; "Forgot password" sets one.
        passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), PASSWORD_COST),
        emailVerifiedAt: new Date(),
        termsAcceptedAt: new Date(),
        policyVersion: POLICY_VERSION,
        roles: ['customer'],
      });
      created = true;
    } catch (error: any) {
      // A parallel first sign-in created it; use that one.
      if (error?.code !== 11000) throw error;
      user = await UserModel.findOne({ email: profile.email, deletedAt: null });
      if (!user) throw error;
    }
  }
  if (user.status !== 'active') throw new AppError(403, 'ACCOUNT_UNAVAILABLE', 'This account is not currently active.');
  if (user.googleId && user.googleId !== profile.googleId) {
    throw new AppError(409, 'GOOGLE_ACCOUNT_MISMATCH', 'This email is linked to a different Google account. Sign in with your password instead.');
  }
  if (!user.googleId || !user.emailVerifiedAt) {
    // An unverified email may have been registered by someone else: Google proves ownership, so their password and sessions go.
    if (!user.emailVerifiedAt) {
      user.passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), PASSWORD_COST);
      await revokeAllSessions(String(user._id));
    }
    user.googleId = profile.googleId;
    user.emailVerifiedAt ??= new Date();
    await user.save();
    await recordAuditEvent({
      actorId: String(user._id), actorType: 'user', action: 'auth.google_linked',
      resourceType: 'user', resourceId: user.publicId, ...metadata,
    });
  }
  return completeSignIn(user, rememberMe, metadata, trustedDeviceToken, created ? 'auth.google_signup' : 'auth.google_login_succeeded');
}

export async function completeTwoFactorLogin(challengeId: string, code: string, metadata: SessionMetadata) {
  await requireDatabase();
  const challenge = await consumeOtpChallenge(challengeId, code, 'two_factor_login');
  const user = await UserModel.findOne({ _id: challenge.userId, status: 'active', deletedAt: null });
  if (!user || !user.twoFactor?.enabled) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'This two-factor challenge is no longer valid.');
  }
  const session = await issueSession(user, challenge.rememberMe, metadata);
  const trustedDevice = challenge.rememberMe ? await rememberDevice(String(user._id), session.sessionId, metadata.userAgent) : undefined;
  await recordAuditEvent({
    actorId: String(user._id), actorType: 'user', action: 'auth.two_factor_login_succeeded',
    resourceType: 'session', ...metadata,
  });
  return { user: publicUser(user), session, trustedDevice };
}

export async function refreshSession(rawRefreshToken: string, metadata: SessionMetadata) {
  await requireDatabase();
  const tokenHash = hashToken(rawRefreshToken);
  const session = await SessionModel.findOne({
    refreshTokenHash: tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).select('+refreshTokenHash');

  if (!session) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Your session has expired. Please sign in again.');

  const user = await UserModel.findOne({ _id: session.userId, status: 'active', deletedAt: null });
  if (!user) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Your session has expired. Please sign in again.');

  const refreshToken = createRefreshToken();
  const rotated = await SessionModel.findOneAndUpdate(
    { _id: session._id, refreshTokenHash: tokenHash, revokedAt: null },
    {
      $set: {
        refreshTokenHash: hashToken(refreshToken),
        lastUsedAt: new Date(),
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
      },
    },
    { returnDocument: 'after' },
  );

  if (!rotated) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Your session has expired. Please sign in again.');

  return {
    user: publicUser(user),
    session: {
      accessToken: signAccessToken({ sub: String(user._id), sid: rotated.publicId, roles: user.roles }),
      refreshToken,
      refreshExpiresAt: rotated.expiresAt,
      rememberMe: Boolean(rotated.rememberMe),
    },
  };
}

export async function revokeSession(rawRefreshToken?: string) {
  if (!rawRefreshToken || !await connectDatabase()) return;
  await SessionModel.updateOne(
    { refreshTokenHash: hashToken(rawRefreshToken), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function revokeAllSessions(userId: string) {
  await requireDatabase();
  await SessionModel.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
  await TrustedDeviceModel.deleteMany({ userId });
}

export async function getUserById(userId: string) {
  await requireDatabase();
  const user = await UserModel.findOne({ _id: userId, status: 'active', deletedAt: null });
  if (!user) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Your account is unavailable.');
  return { document: user, public: publicUser(user) };
}

export async function updateUserProfile(userId: string, input: { name?: string; phone?: string }) {
  await requireDatabase();
  const update = { ...input, ...(input.phone === '' ? { phone: null } : {}) };
  const user = await UserModel.findOneAndUpdate(
    { _id: userId, status: 'active', deletedAt: null },
    { $set: update },
    { returnDocument: 'after', runValidators: true },
  );
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User account was not found.');
  return publicUser(user);
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
  await requireDatabase();
  const user = await UserModel.findOne({ _id: userId, status: 'active', deletedAt: null }).select('+passwordHash');
  if (!user || !await bcrypt.compare(currentPassword, user.passwordHash)) {
    throw new AppError(400, 'CURRENT_PASSWORD_INCORRECT', 'Current password is incorrect.');
  }
  user.passwordHash = await bcrypt.hash(newPassword, PASSWORD_COST);
  user.passwordChangedAt = new Date();
  await user.save();
  await revokeAllSessions(String(user._id));
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await requireDatabase();
  const user = await UserModel.findOne({ _id: userId, status: 'active', deletedAt: null }).select('+passwordHash');
  if (!user) throw new AppError(400, 'INVALID_OR_EXPIRED_TOKEN', 'This password reset link is invalid or has expired.');
  user.passwordHash = await bcrypt.hash(newPassword, PASSWORD_COST);
  user.passwordChangedAt = new Date();
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();
  await revokeAllSessions(String(user._id));
}

export async function beginTwoFactorSetup(userId: string, channel: OtpChannel, metadata: SessionMetadata) {
  await requireDatabase();
  const user = await UserModel.findOne({ _id: userId, status: 'active', deletedAt: null });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User account was not found.');
  if (user.twoFactor?.enabled) throw new AppError(409, 'TWO_FACTOR_ALREADY_ENABLED', 'Two-factor authentication is already enabled.');

  const destination = channel === 'sms' ? user.phone : user.email;
  const verified = channel === 'sms' ? user.phoneVerifiedAt : user.emailVerifiedAt;
  if (!destination || !verified) {
    throw new AppError(409, 'OTP_DESTINATION_NOT_VERIFIED', `Verify your ${channel === 'sms' ? 'phone number' : 'email address'} first.`);
  }
  return createOtpChallenge({
    userId, channel, destination, recipientName: user.name, purpose: 'two_factor_setup',
    requestedIp: metadata.ipAddress,
  });
}

export async function enableTwoFactor(userId: string, challengeId: string, code: string, metadata: SessionMetadata) {
  await requireDatabase();
  const challenge = await consumeOtpChallenge(challengeId, code, 'two_factor_setup', userId);
  if (String(challenge.userId) !== userId) throw new AppError(403, 'PERMISSION_DENIED', 'This challenge belongs to another account.');
  const user = await UserModel.findOneAndUpdate(
    { _id: userId, status: 'active', deletedAt: null },
    { $set: { twoFactor: { enabled: true, channel: challenge.channel, enabledAt: new Date() } } },
    { returnDocument: 'after' },
  );
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User account was not found.');
  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'auth.two_factor_enabled',
    resourceType: 'user', resourceId: user.publicId, ...metadata,
    metadata: { channel: challenge.channel },
  });
  return publicUser(user);
}

export async function disableTwoFactor(userId: string, password: string, metadata: SessionMetadata) {
  await requireDatabase();
  const user = await UserModel.findOne({ _id: userId, status: 'active', deletedAt: null }).select('+passwordHash');
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    throw new AppError(400, 'CURRENT_PASSWORD_INCORRECT', 'Current password is incorrect.');
  }
  user.twoFactor = { enabled: false, channel: 'email', enabledAt: null };
  await user.save();
  await revokeAllSessions(userId);
  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'auth.two_factor_disabled',
    resourceType: 'user', resourceId: user.publicId, ...metadata,
  });
}

export async function listUserSessions(userId: string, currentSessionId: string) {
  await requireDatabase();
  const sessions = await SessionModel.find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } })
    .sort({ lastUsedAt: -1, createdAt: -1 })
    .lean();
  return sessions.map((session: any) => ({
    id: session.publicId,
    current: session.publicId === currentSessionId,
    userAgent: session.userAgent ?? 'Unknown device',
    ipAddress: session.ipAddress ?? undefined,
    createdAt: session.createdAt,
    lastUsedAt: session.lastUsedAt,
    expiresAt: session.expiresAt,
  }));
}

export async function revokeUserSession(userId: string, sessionId: string, metadata: SessionMetadata) {
  await requireDatabase();
  const session = await SessionModel.findOneAndUpdate(
    { userId, publicId: sessionId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!session) throw new AppError(404, 'SESSION_NOT_FOUND', 'Active session was not found.');
  await TrustedDeviceModel.deleteMany({ userId, sessionId });
  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'auth.session_revoked',
    resourceType: 'session', resourceId: sessionId, ...metadata,
  });
}

/** Why this account cannot be deleted by its owner yet, or null. */
async function deletionBlocker(user: any) {
  if ((user.roles ?? []).some((role: string) => role !== 'customer')
    || await VendorModel.exists({ ownerId: user._id }) || await VendorMemberModel.exists({ userId: user._id })) {
    return 'Partner and admin accounts are closed by GBBookings support. Email info@gbbookings.com.';
  }
  if (await BookingModel.exists({ customerId: user._id, status: { $in: ['pending', 'confirmed'] }, checkOut: { $gte: todayInPakistan() } })) {
    return 'You have an upcoming or current booking. Cancel it, or wait until the stay is over, then delete your account.';
  }
  return null;
}

/** Step 1 of deleting an account: checks it can be deleted and emails a confirmation code. */
export async function requestAccountDeletion(userId: string, metadata: SessionMetadata) {
  await requireDatabase();
  const user = await UserModel.findOne({ _id: userId, status: 'active', deletedAt: null });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User account was not found.');
  const blocker = await deletionBlocker(user);
  if (blocker) throw new AppError(409, 'ACCOUNT_DELETION_BLOCKED', blocker);
  return createOtpChallenge({
    userId, channel: 'email', destination: user.email, recipientName: user.name, purpose: 'account_deletion',
    requestedIp: metadata.ipAddress,
  });
}

/**
 * Step 2: with the emailed code, anonymises the account and signs it out everywhere. The email is freed for a new sign-up.
 * Bookings keep their guest snapshot (name, email, phone): partners and tax records need them.
 */
export async function deleteAccount(userId: string, challengeId: string, code: string, metadata: SessionMetadata) {
  await requireDatabase();
  await consumeOtpChallenge(challengeId, code, 'account_deletion', userId);
  const user = await UserModel.findOne({ _id: userId, status: 'active', deletedAt: null });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User account was not found.');
  const blocker = await deletionBlocker(user);
  if (blocker) throw new AppError(409, 'ACCOUNT_DELETION_BLOCKED', blocker);
  await UserModel.updateOne({ _id: user._id }, {
    $set: {
      email: `deleted-${user.publicId}@deleted.invalid`, name: 'Deleted user',
      passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), PASSWORD_COST),
      wishlist: [], status: 'archived', deletedAt: new Date(),
      twoFactor: { enabled: false, channel: 'email', enabledAt: null },
    },
    $unset: { phone: 1, googleId: 1, phoneVerifiedAt: 1 },
  });
  await revokeAllSessions(userId);
  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'auth.account_deleted',
    resourceType: 'user', resourceId: user.publicId, ...metadata,
  });
}
