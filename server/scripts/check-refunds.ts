/**
 * Self-check for commission and guest refund tiers (no database needed): npx tsx server/scripts/check-refunds.ts
 */
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, guestRefundPercent, percentOfMinor, platformSettingsSchema } from '../modules/settings/settings.service.js';

// Tier edges: up to 24h full, up to 48h 75%, later 50% (the defaults).
assert.equal(guestRefundPercent(DEFAULT_SETTINGS, 0.5), 100);
assert.equal(guestRefundPercent(DEFAULT_SETTINGS, 24), 100);
assert.equal(guestRefundPercent(DEFAULT_SETTINGS, 24.01), 75);
assert.equal(guestRefundPercent(DEFAULT_SETTINGS, 48), 75);
assert.equal(guestRefundPercent(DEFAULT_SETTINGS, 300), 50);
assert.equal(guestRefundPercent({ refundTiers: [], laterRefundPercent: 0 }, 1), 0, 'no tiers: the later rule applies');

// 2.5% of PKR 12,345.67 is PKR 308.64 (rounded to the paisa).
assert.equal(percentOfMinor(1_234_567, 2.5), 30_864);
assert.equal(percentOfMinor(1_000_000, 0), 0);

// The admin form's rules: tiers must grow, percents stay in range.
assert.ok(platformSettingsSchema.safeParse(DEFAULT_SETTINGS).success);
assert.ok(!platformSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, refundTiers: [{ withinHours: 48, refundPercent: 75 }, { withinHours: 24, refundPercent: 100 }] }).success);
assert.ok(!platformSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, commissionPercent: 60 }).success);
assert.ok(!platformSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, laterRefundPercent: 101 }).success);

console.log('refund checks passed');
