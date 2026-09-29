import { AppError } from '../../shared/app-error.js';

export const MAX_STAY_NIGHTS = 30;
export const MAX_ADVANCE_DAYS = 365;
const DAY_MS = 86_400_000;

// Hotel dates are calendar days in Pakistan, independent of the server's time zone.
export function todayInPakistan(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(now);
}

function toUtcMs(date: string) {
  const ms = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== date) {
    throw new AppError(400, 'INVALID_DATE', `"${date}" is not a valid calendar date.`);
  }
  return ms;
}

/** Returns each night of the stay (check-in inclusive, check-out exclusive) as YYYY-MM-DD. */
export function stayNights(checkIn: string, checkOut: string, today = todayInPakistan()) {
  const start = toUtcMs(checkIn);
  const end = toUtcMs(checkOut);
  const nights = Math.round((end - start) / DAY_MS);
  if (nights < 1) throw new AppError(400, 'INVALID_STAY', 'Check-out must be after check-in.');
  if (nights > MAX_STAY_NIGHTS) throw new AppError(400, 'INVALID_STAY', `Stays are limited to ${MAX_STAY_NIGHTS} nights.`);
  if (checkIn < today) throw new AppError(400, 'INVALID_STAY', 'Check-in cannot be in the past.');
  if (start - toUtcMs(today) > MAX_ADVANCE_DAYS * DAY_MS) {
    throw new AppError(400, 'INVALID_STAY', `Bookings open ${MAX_ADVANCE_DAYS} days in advance.`);
  }
  return Array.from({ length: nights }, (_, index) => new Date(start + index * DAY_MS).toISOString().slice(0, 10));
}
