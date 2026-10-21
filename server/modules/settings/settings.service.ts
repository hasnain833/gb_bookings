import { z } from 'zod';
import { connectDatabase } from '../../database/connection.js';
import { PlatformSettingModel } from '../../models/platform-setting.model.js';
import { ServiceUnavailableError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import type { SessionMetadata } from '../auth/auth.service.js';

/** Used until the admin saves settings once. The refund tiers are starting values for the admin to change. */
export const DEFAULT_SETTINGS = {
  commissionPercent: 2.5,
  refundTiers: [{ withinHours: 24, refundPercent: 100 }, { withinHours: 48, refundPercent: 75 }],
  laterRefundPercent: 50,
};
export type PlatformSettings = typeof DEFAULT_SETTINGS;

const percent = z.number().min(0).max(100).multipleOf(0.01);
export const platformSettingsSchema = z.object({
  commissionPercent: percent.max(50),
  refundTiers: z.array(z.object({ withinHours: z.number().int().min(1).max(8_760), refundPercent: percent }).strict()).max(10)
    .refine((tiers) => tiers.every((tier, index) => index === 0 || tiers[index - 1].withinHours < tier.withinHours),
      { message: 'List the time limits from shortest to longest, each one longer than the last.' }),
  laterRefundPercent: percent,
}).strict();

export async function requireSettingsDatabase() {
  if (!await connectDatabase()) throw new ServiceUnavailableError('Platform settings are unavailable while the database is disconnected.');
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const saved = await PlatformSettingModel.findOne({ key: 'platform' }).lean() as any;
  if (!saved) return DEFAULT_SETTINGS;
  return {
    commissionPercent: saved.commissionPercent,
    refundTiers: (saved.refundTiers ?? []).map(({ withinHours, refundPercent }: any) => ({ withinHours, refundPercent })),
    laterRefundPercent: saved.laterRefundPercent,
  };
}

export async function updatePlatformSettings(userId: string, input: PlatformSettings, metadata: SessionMetadata) {
  const before = await getPlatformSettings();
  await PlatformSettingModel.updateOne({ key: 'platform' }, { $set: { ...input, updatedBy: userId } }, { upsert: true, runValidators: true });
  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'platform.settings_updated', resourceType: 'platform_settings', resourceId: 'platform',
    ...metadata, metadata: { before, after: input },
  });
  return getPlatformSettings();
}

/** Refund percent for a guest cancelling a paid booking `hoursSinceBooking` after making it. */
export function guestRefundPercent(settings: Pick<PlatformSettings, 'refundTiers' | 'laterRefundPercent'>, hoursSinceBooking: number) {
  return settings.refundTiers.find((tier) => hoursSinceBooking <= tier.withinHours)?.refundPercent ?? settings.laterRefundPercent;
}

/** A percent of an amount in minor units, rounded to the nearest minor unit. */
export const percentOfMinor = (amountMinor: number, percentValue: number) => Math.round((amountMinor * percentValue) / 100);
