/**
 * Smoke test for the Safepay keys in .env (sandbox): npx tsx server/scripts/check-safepay.ts
 * Opens a PKR 100 test payment, prints the checkout link, and checks its tracker reads as unpaid.
 * Pay on the printed page with a sandbox test card, then run again with the tracker to see it read as paid:
 *   npx tsx server/scripts/check-safepay.ts track_...
 */
import 'dotenv/config';
import assert from 'node:assert/strict';
import { env } from '../config/env.js';
import { onlinePaymentsEnabled, startSafepayCheckout, trackerPaid, trackersIn } from '../modules/payments/safepay.js';

assert.deepEqual(trackersIn({ data: { tracker: { token: 'track_ab-12' } }, again: 'track_ab-12' }), ['track_ab-12']);
assert.deepEqual(trackersIn({ nothing: 'here' }), []);

const tracker = process.argv[2];
if (tracker) {
  console.log(`${tracker} paid: ${await trackerPaid(tracker)}`);
} else {
  assert.ok(onlinePaymentsEnabled(), 'Set SAFEPAY_API_KEY and SAFEPAY_SECRET_KEY in .env first.');
  const base = env.APP_URL ?? 'http://localhost:3000';
  const started = await startSafepayCheckout({ amountMinor: 10_000, reference: 'GB-TEST0001', redirectUrl: `${base}/user-dashboard`, cancelUrl: `${base}/user-dashboard` });
  console.log(`Environment: ${env.SAFEPAY_ENV}\nTracker: ${started.tracker}\nCheckout page: ${started.url}`);
  assert.equal(await trackerPaid(started.tracker), false, 'a fresh tracker must not read as paid');
  console.log('Safepay keys work: a payment opened and reads as unpaid.');
}
