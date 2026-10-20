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

/** The stored exclusive end for a stay: cars convert their return date, hotels pass check-out through. */
export const storedEnd = (listingType: string, end: string) => (listingType === 'car' ? dayAfter(end) : end);
/** The date guests and partners see: the return date for cars, check-out for stays. */
export const shownEnd = (booking: { listingSnapshot?: { type?: string }; checkOut: string }) =>
  booking.listingSnapshot?.type === 'car' ? dayBefore(booking.checkOut) : booking.checkOut;

export type RentalChoice = { driver?: boolean; outsideBaseCity?: boolean; oneWay?: boolean };

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
  return {
    driver,
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

/** Driver and out-of-city charges per car per day, plus the one-way fee per car. */
export const rentalExtrasMinor = (terms: Pick<RentalTerms, 'driverPerDayMinor' | 'outsidePerDayMinor' | 'oneWayFeeMinor'> | undefined, days: number, cars: number) =>
  terms ? ((terms.driverPerDayMinor + terms.outsidePerDayMinor) * days + terms.oneWayFeeMinor) * cars : 0;
