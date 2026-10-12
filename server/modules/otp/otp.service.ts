import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';
import { OtpChallengeModel } from '../../models/otp-challenge.model.js';
import { AppError } from '../../shared/app-error.js';
import { otpProvider, type OtpChannel, type OtpDelivery } from './otp-provider.js';

function hashCode(challengeId: string, code: string) {
  return createHmac('sha256', env.JWT_ACCESS_SECRET).update(`${challengeId}:${code}`).digest();
}

function codeMatches(challengeId: string, code: string, storedHash: string) {
  const supplied = hashCode(challengeId, code);
  const stored = Buffer.from(storedHash, 'hex');
  return supplied.length === stored.length && timingSafeEqual(supplied, stored);
}

export async function createOtpChallenge(input: {
  userId: string;
  channel: OtpChannel;
  destination: string;
  recipientName?: string;
  purpose: OtpDelivery['purpose'];
  rememberMe?: boolean;
  requestedIp?: string;
}) {
  const publicId = `otp_${randomUUID()}`;
  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  await OtpChallengeModel.updateMany(
    { userId: input.userId, purpose: input.purpose, consumedAt: null },
    { $set: { consumedAt: new Date() } },
  );
  const challenge = await OtpChallengeModel.create({
    publicId,
    userId: input.userId,
    purpose: input.purpose,
    channel: input.channel,
    destination: input.destination,
    codeHash: hashCode(publicId, code).toString('hex'),
    maxAttempts: env.OTP_MAX_ATTEMPTS,
    rememberMe: input.rememberMe ?? false,
    expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000),
    requestedIp: input.requestedIp,
  });

  try {
    await otpProvider(input.channel).send({
      destination: input.destination,
      recipientName: input.recipientName,
      code,
      purpose: input.purpose,
      expiresInMinutes: env.OTP_TTL_MINUTES,
    });
  } catch (error) {
    await OtpChallengeModel.deleteOne({ _id: challenge._id });
    throw error;
  }
  return { challengeId: challenge.publicId, expiresInSeconds: env.OTP_TTL_MINUTES * 60 };
}

export async function consumeOtpChallenge(challengeId: string, code: string, purpose: OtpDelivery['purpose'], userId?: string) {
  const challenge = await OtpChallengeModel.findOne({ publicId: challengeId, purpose, ...(userId ? { userId } : {}) })
    .select('+codeHash +destination');
  if (!challenge || challenge.consumedAt || challenge.expiresAt.getTime() <= Date.now()) {
    throw new AppError(400, 'INVALID_OR_EXPIRED_OTP', 'This security code is invalid or has expired.');
  }
  if (challenge.attempts >= challenge.maxAttempts) {
    throw new AppError(429, 'OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect code attempts. Request a new code.');
  }
  if (!codeMatches(challenge.publicId, code, challenge.codeHash)) {
    const attempted = await OtpChallengeModel.findOneAndUpdate(
      { _id: challenge._id, consumedAt: null, expiresAt: { $gt: new Date() }, attempts: { $lt: challenge.maxAttempts } },
      { $inc: { attempts: 1 } }, { returnDocument: 'after' },
    );
    if (!attempted) throw new AppError(400, 'INVALID_OR_EXPIRED_OTP', 'This security code is invalid or has expired.');
    throw new AppError(400, 'INVALID_OTP', 'The security code is incorrect.');
  }
  const consumed = await OtpChallengeModel.findOneAndUpdate(
    { _id: challenge._id, consumedAt: null, expiresAt: { $gt: new Date() }, attempts: { $lt: challenge.maxAttempts } },
    { $set: { consumedAt: new Date() } }, { returnDocument: 'after' },
  );
  if (!consumed) throw new AppError(400, 'INVALID_OR_EXPIRED_OTP', 'This security code is invalid or has expired.');
  return consumed;
}
