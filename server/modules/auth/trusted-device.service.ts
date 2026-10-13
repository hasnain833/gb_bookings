import { TrustedDeviceModel } from '../../models/trusted-device.model.js';
import { createRefreshToken, hashToken } from './auth.tokens.js';

export const REMEMBER_DAYS = 7;
export const TRUSTED_DEVICE_COOKIE = 'gb_trusted_device';

export async function isTrustedDevice(userId: string, token: string | undefined, userAgent: string | undefined) {
  if (!token || !userAgent) return false;
  return Boolean(await TrustedDeviceModel.exists({
    userId, tokenHash: hashToken(token), userAgentHash: hashToken(userAgent), expiresAt: { $gt: new Date() },
  }));
}

export async function rememberDevice(userId: string, sessionId: string, userAgent?: string) {
  if (!userAgent) return undefined;
  const token = createRefreshToken();
  const expiresAt = new Date(Date.now() + REMEMBER_DAYS * 86_400_000);
  await TrustedDeviceModel.create({ userId, sessionId, tokenHash: hashToken(token), userAgentHash: hashToken(userAgent), expiresAt });
  return { token, expiresAt };
}
