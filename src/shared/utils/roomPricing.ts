/** Partner discounts on a room or car. The best one that applies is used; they never add up. */
export type StayDeals = {
  longStay?: { nights: number; percent: number };
  earlyBird?: { days: number; percent: number };
  lastMinute?: { days: number; percent: number };
};

export type StayRules = { minNights?: number | null; maxNights?: number | null; noArrivalDays?: number[] | null };

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const pakistanToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());

export function stayDealPercent(deals: StayDeals | null | undefined, nights: number, checkIn: string, today: string) {
  if (!deals) return 0;
  const daysAhead = Math.round((Date.parse(checkIn) - Date.parse(today)) / 86_400_000);
  return Math.max(
    0,
    deals.longStay && nights >= deals.longStay.nights ? deals.longStay.percent : 0,
    deals.earlyBird && daysAhead >= deals.earlyBird.days ? deals.earlyBird.percent : 0,
    deals.lastMinute && daysAhead <= deals.lastMinute.days ? deals.lastMinute.percent : 0,
  );
}

/** Why these dates can't be booked under the partner's stay rules, in words for the guest. */
export function stayRuleProblem(rules: StayRules, nights: number, checkIn: string) {
  if (rules.minNights && nights < rules.minNights) return `Minimum stay is ${rules.minNights} nights`;
  if (rules.maxNights && nights > rules.maxNights) return `Maximum stay is ${rules.maxNights} nights`;
  const weekday = new Date(`${checkIn}T00:00:00Z`).getUTCDay();
  if (rules.noArrivalDays?.includes(weekday)) return `No check-in on ${WEEKDAY_NAMES[weekday]}s`;
  return undefined;
}

type DatedPrices = { basePrice: number; weekendPrice?: number | null; seasons?: Array<{ from: string; to: string; price: number }> };

/** Mirrors server/modules/bookings/room-price.ts: a season wins, then Friday/Saturday, then the base price. */
export function priceOn(room: DatedPrices, date: string) {
  const season = room.seasons?.find((item) => item.from <= date && date <= item.to);
  if (season) return season.price;
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return (weekday === 5 || weekday === 6) && room.weekendPrice != null ? room.weekendPrice : room.basePrice;
}

const shiftDay = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/** Gives a date range its own price: seasons it overlaps are cut around it, so they never overlap. */
export function withRangePrice<T extends { name: string; from: string; to: string; price: number }>(seasons: T[], from: string, to: string, price: number) {
  const kept = seasons.flatMap((season) => {
    if (season.to < from || season.from > to) return [season];
    return [
      ...(season.from < from ? [{ ...season, to: shiftDay(from, -1) }] : []),
      ...(season.to > to ? [{ ...season, from: shiftDay(to, 1) }] : []),
    ];
  });
  return [...kept, { name: 'Calendar price', from, to, price }].sort((a, b) => a.from.localeCompare(b.from));
}
