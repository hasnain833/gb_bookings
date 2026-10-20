/**
 * Self-check for the tour booking rules (no database needed): npx tsx server/scripts/check-tours.ts
 * Covers pricing, the shown end date, the seat/party rule and fixed departures.
 */
import assert from 'node:assert/strict';
import { shownEnd, storedEnd } from '../modules/bookings/rental.js';
import { assertSeats, assertTourDate, tourSubtotalMinor, tourTerms } from '../modules/bookings/tour.js';

const daily = { tourSpecs: { durationDays: 3, schedule: 'daily', childPrice: 4_000, meetingPoint: 'Karimabad', startTime: '08:00' } };
const fixed = { tourSpecs: { durationDays: 1, schedule: 'fixed' }, departures: ['2026-11-07', '2026-11-21'] };

// Pricing: adults at the unit price, children at the child price (or the adult price when none is set).
const terms = tourTerms(daily);
assert.deepEqual(terms, { days: 3, childPriceMinor: 400_000, meetingPoint: 'Karimabad', startTime: '08:00' });
assert.equal(tourSubtotalMinor(1_000_000, terms, 2, 1), 2_400_000);
assert.equal(tourSubtotalMinor(1_000_000, tourTerms(fixed), 2, 1), 3_000_000);
assert.equal(tourTerms({ tourSpecs: { childPrice: 0 } }).childPriceMinor, 0, 'a free child price is kept, not dropped');

// Seats are held on the start date only; guests see the last tour day.
assert.equal(storedEnd('tour', '2026-11-07'), '2026-11-08');
assert.equal(shownEnd({ listingSnapshot: { type: 'tour' }, checkIn: '2026-11-07', checkOut: '2026-11-08', tour: { days: 3 } }), '2026-11-09');
assert.equal(shownEnd({ listingSnapshot: { type: 'tour' }, checkIn: '2026-11-07', checkOut: '2026-11-08', tour: { days: 1 } }), '2026-11-07');
assert.equal(shownEnd({ listingSnapshot: { type: 'car' }, checkIn: '2026-11-07', checkOut: '2026-11-10' }), '2026-11-09', 'cars unchanged');

// One seat per traveller.
assertSeats(2, 1, 3);
assert.throws(() => assertSeats(2, 1, 2), /one seat for each traveller/);

// Fixed departures only on listed dates; daily tours any date.
assertTourDate(fixed, '2026-11-21');
assert.throws(() => assertTourDate(fixed, '2026-11-08'), /does not depart/);
assertTourDate(daily, '2026-11-08');

console.log('Tour checks passed.');
