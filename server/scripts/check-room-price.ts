/**
 * Self-check for weekend and season prices (no database needed): npx tsx server/scripts/check-room-price.ts
 */
import assert from 'node:assert/strict';
import { nightPriceMinor, nightsPriceMinor } from '../modules/bookings/room-price.js';

const room = {
  basePriceMinor: 1_000_000,
  weekendPriceMinor: 1_200_000,
  seasons: [{ from: '2026-06-01', to: '2026-08-31', priceMinor: 1_500_000 }],
};

// 2026-11-05 is a Thursday: base. Friday and Saturday nights: weekend. Sunday: base again.
assert.equal(nightPriceMinor(room, '2026-11-05'), 1_000_000);
assert.equal(nightPriceMinor(room, '2026-11-06'), 1_200_000);
assert.equal(nightPriceMinor(room, '2026-11-07'), 1_200_000);
assert.equal(nightPriceMinor(room, '2026-11-08'), 1_000_000);
// A season wins over the weekend price, on both of its edge days.
assert.equal(nightPriceMinor(room, '2026-06-01'), 1_500_000);
assert.equal(nightPriceMinor(room, '2026-08-31'), 1_500_000);
assert.equal(nightPriceMinor(room, '2026-09-04'), 1_200_000, 'Friday after the season');
// No rules (or a cleared weekend price) means the base price every night.
assert.equal(nightPriceMinor({ basePriceMinor: 500_000, weekendPriceMinor: null }, '2026-11-06'), 500_000);
assert.equal(nightPriceMinor({ basePriceMinor: 500_000 }, '2026-11-06'), 500_000);
// A free weekend price is kept, not ignored.
assert.equal(nightPriceMinor({ basePriceMinor: 500_000, weekendPriceMinor: 0 }, '2026-11-06'), 0);
// Thu, Fri, Sat nights.
assert.equal(nightsPriceMinor(room, ['2026-11-05', '2026-11-06', '2026-11-07']), 3_400_000);

console.log('room price checks passed');
