import { AppError } from '../../shared/app-error.js';

/**
 * Car rentals run on the hotel booking engine: one fleet entry is one room type, and a rental day is a night.
 * Guests and partners give the return date (rented days include it); bookings store the day after it as `checkOut`,
 * so inventory, releases, changes and reports count the right days without knowing about cars.
 */
const DAY_MS = 86_400_000;
const shift = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
export const dayAfter = (date: string) => shift(date, 1);
export const dayBefore = (date: string) => shift(date, -1);

/** The stored exclusive end for a stay: cars convert their return date and tours their start date (seats are held on that day only); hotels pass check-out through. */
export const storedEnd = (listingType: string, end: string) => (listingType === 'car' || listingType === 'tour' ? dayAfter(end) : end);
/** The date guests and partners see: the return date for cars, the last tour day for tours, check-out for stays. */
export const shownEnd = (booking: { listingSnapshot?: { type?: string }; checkIn: string; checkOut: string; tour?: { days?: number } }) =>
  booking.listingSnapshot?.type === 'tour' ? shift(booking.checkIn, (booking.tour?.days ?? 1) - 1)
    : booking.listingSnapshot?.type === 'car' ? dayBefore(booking.checkOut) : booking.checkOut;

export type RentalChoice = { driver?: boolean; outsideBaseCity?: boolean; oneWay?: boolean; extras?: string[] };

/** The car's terms for this rental, in minor units; snapshotted on the booking so later edits never re-price it. */
export function rentalTerms(listing: any, choice: RentalChoice = {}) {
  const specs = listing.carSpecs ?? {};
  const mode = specs.driverMode ?? (specs.withDriver === false ? 'self_drive' : 'with_driver');
  const driver = mode === 'both' ? Boolean(choice.driver) : mode === 'with_driver';
  if (choice.driver !== undefined && choice.driver !== driver) {
    throw new AppError(422, 'DRIVER_OPTION_UNAVAILABLE', driver ? 'This car is only rented with a driver.' : 'This car is self-drive only.');
  }
  const oneWay = Boolean(choice.oneWay);
  if (oneWay && (specs.oneWay ?? 'not_offered') === 'not_offered') {
    throw new AppError(422, 'ONE_WAY_UNAVAILABLE', 'This car must be returned where it was picked up.');
  }
  const extras = (choice.extras ?? []).map((name) => {
    const offered = (specs.extras ?? []).find((item: any) => item.name === name);
    if (!offered) throw new AppError(422, 'EXTRA_UNAVAILABLE', `This car does not offer ${name}.`);
    return { name, priceMinor: offered.price * 100, perDay: Boolean(offered.perDay) };
  });
  return {
    driver,
    ...(extras.length ? { extras } : {}),
    ...(specs.kmPerDay ? { kmPerDay: specs.kmPerDay as number, extraPerKmMinor: (specs.extraPerKm ?? 0) * 100 } : {}),
    driverPerDayMinor: driver ? (specs.driverPerDay ?? 0) * 100 : 0,
    outsideBaseCity: Boolean(choice.outsideBaseCity),
    outsidePerDayMinor: choice.outsideBaseCity ? (specs.outsideCityPerDay ?? 0) * 100 : 0,
    oneWay,
    // "On request": the partner quotes the drop-off fee when confirming; nothing is added here.
    oneWayOnRequest: oneWay && specs.oneWay === 'on_request',
    oneWayFeeMinor: oneWay && specs.oneWay === 'flat' ? (specs.oneWayFee ?? 0) * 100 : 0,
    fuelIncluded: Boolean(specs.fuelIncluded),
    depositMinor: driver ? 0 : (specs.deposit ?? 0) * 100,
  };
}
export type RentalTerms = ReturnType<typeof rentalTerms>;

/** Per car: driver, out-of-city and per-day add-ons for each day, plus the one-way fee and one-off add-ons. */
export function rentalExtrasMinor(terms: Pick<RentalTerms, 'driverPerDayMinor' | 'outsidePerDayMinor' | 'oneWayFeeMinor' | 'extras'> | undefined, days: number, cars: number) {
  if (!terms) return 0;
  const addOns = (terms.extras ?? []).reduce((total, item) => total + item.priceMinor * (item.perDay ? days : 1), 0);
  return ((terms.driverPerDayMinor + terms.outsidePerDayMinor) * days + terms.oneWayFeeMinor + addOns) * cars;
}
