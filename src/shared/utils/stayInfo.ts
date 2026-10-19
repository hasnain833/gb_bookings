import type { StayInfo } from '../../types';

export const PAYMENT_LABELS: Record<StayInfo['paymentMethods'][number], string> = { cash: 'Cash', card: 'Debit/credit card', jazzcash: 'JazzCash', easypaisa: 'Easypaisa', bank_transfer: 'Bank transfer' };
export const POWER_LABELS: Record<StayInfo['powerBackup'][number], string> = { generator: 'Generator', solar: 'Solar', ups: 'UPS / inverter' };
export const HEATING_LABELS: Record<StayInfo['heating'][number], string> = { electric: 'Electric heaters', gas: 'Gas heaters', wood: 'Wood stove (bukhari)', central: 'Central heating' };
export const HOT_WATER_LABELS: Record<StayInfo['hotWater'], string> = { always: 'Hot water 24 hours', scheduled: 'Hot water at set times', on_request: 'Hot water on request', none: 'No hot water' };
export const NETWORK_LABELS: Record<StayInfo['mobileNetworks'][number], string> = { scom: 'SCOM', zong: 'Zong', jazz: 'Jazz', telenor: 'Telenor', ufone: 'Ufone' };
export const ROAD_LABELS: Record<StayInfo['roadAccess'], string> = { car: 'Any car can reach the door', jeep: 'Jeep / 4×4 needed for the last stretch', walk: 'Last stretch on foot' };
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Open all year" or e.g. "Open Apr–Oct" for a continuous season; otherwise the months listed. */
export function openSeason(months: number[] = []) {
  const sorted = [...new Set(months)].sort((a, b) => a - b);
  if (sorted.length === 0 || sorted.length === 12) return 'Open all year';
  const continuous = sorted.every((month, index) => index === 0 || month === sorted[index - 1] + 1);
  return continuous ? `Open ${MONTHS[sorted[0] - 1]}–${MONTHS[sorted[sorted.length - 1] - 1]}` : `Open ${sorted.map((month) => MONTHS[month - 1]).join(', ')}`;
}

/** Pakistani numbers (03xx…, +92…, 92…) as wa.me digits; null when it doesn't look like a mobile number. */
export function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const international = digits.startsWith('0') ? `92${digits.slice(1)}` : digits;
  return /^923\d{9}$/.test(international) ? international : null;
}
