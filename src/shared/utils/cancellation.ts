/**
 * Cancellation policies a partner picks per listing; each booking keeps the policy it was made under.
 * Refunds count whole days before the start date. Guests cannot cancel on or after the start date.
 */
type Tier = { daysBefore: number; refundPercent: number };

export const CANCELLATION_POLICIES: Record<'flexible' | 'moderate' | 'strict' | 'non_refundable', { label: string; tiers: Tier[] }> = {
  flexible: { label: 'Flexible', tiers: [{ daysBefore: 1, refundPercent: 100 }] },
  moderate: { label: 'Moderate', tiers: [{ daysBefore: 5, refundPercent: 100 }, { daysBefore: 1, refundPercent: 50 }] },
  strict: { label: 'Strict', tiers: [{ daysBefore: 14, refundPercent: 100 }, { daysBefore: 7, refundPercent: 50 }] },
  non_refundable: { label: 'Non-refundable', tiers: [] },
};

export type CancellationPolicy = keyof typeof CANCELLATION_POLICIES;
export const CANCELLATION_POLICY_KEYS = Object.keys(CANCELLATION_POLICIES) as [CancellationPolicy, ...CancellationPolicy[]];
export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = 'moderate';

const policyOf = (policy?: string) => CANCELLATION_POLICIES[(policy ?? DEFAULT_CANCELLATION_POLICY) as CancellationPolicy] ?? CANCELLATION_POLICIES[DEFAULT_CANCELLATION_POLICY];

export const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export const refundPercentFor = (policy: string | undefined, daysBefore: number) =>
  policyOf(policy).tiers.find((tier) => daysBefore >= tier.daysBefore)?.refundPercent ?? 0;

/** The last date a Pay now guest gets everything back; undefined when that has passed or never applies. */
export function fullRefundUntil(policy: string | undefined, startDate: string, today: string) {
  const full = policyOf(policy).tiers.find((tier) => tier.refundPercent === 100);
  if (!full || daysBetween(today, startDate) < full.daysBefore) return undefined;
  return new Date(Date.parse(`${startDate}T00:00:00Z`) - full.daysBefore * 86_400_000).toISOString().slice(0, 10);
}

/** One line per step, e.g. "Full refund up to 5 days before the start date". */
export function policyLines(policy: string | undefined) {
  const { tiers } = policyOf(policy);
  if (!tiers.length) return ['No refund if you cancel a paid booking.'];
  const days = (count: number) => `${count} day${count === 1 ? '' : 's'}`;
  return [
    ...tiers.map((tier) => `${tier.refundPercent === 100 ? 'Full refund' : `${tier.refundPercent}% refund`} up to ${days(tier.daysBefore)} before the start date`),
    ...(tiers.at(-1)!.daysBefore > 1 ? ['No refund after that'] : []),
  ];
}
