import { AppError } from '../../shared/app-error.js';

/**
 * Tours run on the hotel booking engine: one tour has one booking unit whose count is the seats per departure
 * and whose price is the adult price per person. A booking takes one seat per traveller on the start date only
 * (stored `checkOut` is the day after it, see rental.ts `storedEnd`), so a three-day tour can depart again tomorrow.
 */

/** The tour's terms for this booking, snapshotted so later edits never re-price it. */
export function tourTerms(listing: any) {
  const specs = listing.tourSpecs ?? {};
  return {
    days: specs.durationDays ?? 1,
    ...(specs.childPrice !== undefined && specs.childPrice !== null ? { childPriceMinor: specs.childPrice * 100 } : {}),
    meetingPoint: specs.meetingPoint,
    startTime: specs.startTime,
  };
}
export type TourTerms = ReturnType<typeof tourTerms>;

/** Fixed-departure tours only start on the partner's dates; daily tours start any day that has free seats. */
export function assertTourDate(listing: any, date: string) {
  if (listing.tourSpecs?.schedule === 'fixed' && !(listing.departures ?? []).includes(date)) {
    throw new AppError(422, 'NO_DEPARTURE', 'This tour does not depart on that date. Choose one of its departure dates.');
  }
}

/** Every traveller takes one seat; a booking's seats must match its party. */
export function assertSeats(adults: number, children: number, seats: number) {
  if (adults + children !== seats) throw new AppError(422, 'SEATS_MISMATCH', 'Book one seat for each traveller.');
}

/** Adults pay the unit price, children the child price (or the adult price when none is set). */
export const tourSubtotalMinor = (adultMinor: number, terms: Pick<TourTerms, 'childPriceMinor'>, adults: number, children: number) =>
  adultMinor * adults + (terms.childPriceMinor ?? adultMinor) * children;
