import { percentOfMinor } from '../settings/settings.service.js';

/** A fee the partner adds or a tax the admin sets. `rate` is a percent, or paisa for an 'amount' fee. */
export type ChargeRule = { name: string; type: 'fee' | 'tax'; kind: 'percent' | 'amount'; rate: number };
export type ChargeLine = ChargeRule & { amountMinor: number };

/** Partner fees are worked out on the discounted price; taxes apply to that price plus the fees. */
export function applyCharges(baseMinor: number, rules: ChargeRule[]) {
  const fees = rules.filter((rule) => rule.type === 'fee').map((rule) => ({ name: rule.name, type: rule.type, kind: rule.kind, rate: rule.rate, amountMinor: rule.kind === 'amount' ? rule.rate : percentOfMinor(baseMinor, rule.rate) }));
  const feesMinor = fees.reduce((total, line) => total + line.amountMinor, 0);
  const taxes = rules.filter((rule) => rule.type === 'tax').map((rule) => ({ name: rule.name, type: rule.type, kind: rule.kind, rate: rule.rate, amountMinor: percentOfMinor(baseMinor + feesMinor, rule.rate) }));
  const taxesMinor = taxes.reduce((total, line) => total + line.amountMinor, 0);
  return { lines: [...fees, ...taxes] as ChargeLine[], feesMinor, taxesMinor, totalMinor: baseMinor + feesMinor + taxesMinor };
}

/** The charges a new booking on this listing pays. */
export function chargeRulesFor(listing: { fees?: Array<{ name?: string | null; kind?: string | null; value?: number | null }> | null }, taxes: Array<{ name: string; percent: number }>): ChargeRule[] {
  return [
    ...(listing.fees ?? []).map((fee) => ({ name: fee.name ?? 'Fee', type: 'fee' as const, kind: fee.kind === 'amount' ? 'amount' as const : 'percent' as const, rate: fee.kind === 'amount' ? (fee.value ?? 0) * 100 : fee.value ?? 0 })),
    ...taxes.map((tax) => ({ name: tax.name, type: 'tax' as const, kind: 'percent' as const, rate: tax.percent })),
  ];
}

/** Commission on the money the partner keeps. Taxes pass through to the government, so they carry none. */
export function commissionOn(pricing: { totalMinor: number; taxesMinor?: number; commissionPercent?: number }, keptMinor = pricing.totalMinor) {
  if (pricing.totalMinor <= 0) return 0;
  const commissionable = keptMinor * (pricing.totalMinor - (pricing.taxesMinor ?? 0)) / pricing.totalMinor;
  return percentOfMinor(commissionable, pricing.commissionPercent ?? 0);
}
