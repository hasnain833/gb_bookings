/**
 * End-to-end check of partner onboarding, listing review, booking and payment, through the real HTTP API.
 * Uses a throwaway database on MONGODB_URI (dropped at the end) and sends no email. Safepay is called for real to
 * open a sandbox checkout; only its "was this tracker paid?" answer is stubbed, since paying needs a browser.
 * Run: npm run test:e2e
 */
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';

process.env.MONGODB_DB_NAME = `gbbookings_e2e_${Date.now()}`;
process.env.RESEND_API_KEY = '';
process.env.NODE_ENV = 'test';

const mongoose = (await import('mongoose')).default;
const bcrypt = (await import('bcryptjs')).default;
const { createApp, finalizeApp } = await import('../app.js');
const { connectDatabase } = await import('../database/connection.js');
const { UserModel } = await import('../models/user.model.js');
const { MediaModel } = await import('../models/media.model.js');
const { BookingModel } = await import('../models/booking.model.js');
const { expireStalePendingBookings } = await import('../modules/bookings/booking.service.js');

assert.ok(await connectDatabase(), 'MongoDB is not reachable (MONGODB_URI).');
const app = createApp();
finalizeApp(app);
const server = app.listen(0);
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;

// Safepay "paid?" answers per tracker; every other Safepay call goes through to the sandbox.
const realFetch = globalThis.fetch;
const paidTrackers = new Set<string>();
globalThis.fetch = (async (url: any, init?: any) => {
  const match = String(url).match(/\/reporter\/api\/v1\/payments\/([^/?]+)/);
  if (match) return new Response(JSON.stringify({ data: { tracker: { state: paidTrackers.has(decodeURIComponent(match[1])) ? 'TRACKER_ENDED' : 'TRACKER_STARTED' } } }), { status: 200 });
  return realFetch(url, init);
}) as typeof fetch;

let sweepClock = Date.now();
// The sweep runs at most once a minute (bookings also trigger it), so each call moves its clock past that.
const sweep = () => expireStalePendingBookings(new Date(sweepClock = Math.max(sweepClock, Date.now()) + 61_000));

type Client = { cookie: string; call: (method: string, path: string, body?: unknown, headers?: Record<string, string>) => Promise<{ status: number; body: any }> };
function client(): Client {
  const self: Client = {
    cookie: '',
    async call(method, path, body, headers = {}) {
      const response = await realFetch(base + path, {
        method, headers: { 'Content-Type': 'application/json', Cookie: self.cookie, ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const cookies = response.headers.getSetCookie().map((line) => line.split(';')[0]).filter((pair) => !pair.endsWith('='));
      if (cookies.length) self.cookie = cookies.join('; ');
      return { status: response.status, body: await response.json().catch(() => null) };
    },
  };
  return self;
}
const ok = async (promise: ReturnType<Client['call']>, status?: number) => {
  const result = await promise;
  if (status) assert.equal(result.status, status, JSON.stringify(result.body));
  else assert.ok(result.status >= 200 && result.status < 300, `${result.status} ${JSON.stringify(result.body)}`);
  return result.body;
};
const fails = async (promise: ReturnType<Client['call']>, status: number, code?: string) => {
  const result = await promise;
  assert.equal(result.status, status, JSON.stringify(result.body));
  if (code) assert.equal(result.body?.error?.code, code);
};

const password = 'E2e-Passw0rd!';
async function user(name: string, roles: string[] = ['customer']) {
  const email = `${name}-${randomUUID().slice(0, 8)}@e2e.test`;
  const record = await UserModel.create({ email, name, passwordHash: await bcrypt.hash(password, 10), roles, emailVerifiedAt: new Date(), termsAcceptedAt: new Date() });
  const c = client();
  await ok(c.call('POST', '/auth/login', { email, password }));
  return Object.assign(c, { record, email, login: () => ok(c.call('POST', '/auth/login', { email, password })) });
}
// Uploads go to Cloudinary; seed ready media records instead.
const media = (ownerId: unknown, resourceType: 'image' | 'document') => MediaModel.create({
  ownerId, provider: 'cloudinary', providerAssetId: `e2e/${randomUUID()}`, providerResourceType: resourceType === 'image' ? 'image' : 'raw',
  url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', resourceType, mimeType: resourceType === 'image' ? 'image/jpeg' : 'application/pdf', bytes: 1000, status: 'ready',
});
const day = (offset: number) => new Date(Date.now() + offset * 86_400_000 + 5 * 3_600_000).toISOString().slice(0, 10);
const step = (label: string) => console.log(`✓ ${label}`);

try {
  const admin = await user('admin', ['admin']);
  const partner = await user('partner');
  const guest = await user('guest');

  // 1. Partner onboarding
  await fails(partner.call('POST', '/vendor/listings', {}), 403);
  const vendor = (await ok(partner.call('POST', '/vendors', {
    name: 'E2E Mountain Hotel', email: partner.email, phone: '03001234567', businessType: 'hotel', registrationNumber: 'REG-12345', cnicNumber: '7110112345671',
    address: { line1: 'Main Bazaar Road', city: 'Karimabad', region: 'Gilgit-Baltistan' },
  }), 201)).data;
  await fails(partner.call('POST', '/vendors/me/submit'), 400, 'VENDOR_PROFILE_INCOMPLETE');
  for (const type of ['business_registration', 'identity']) {
    await ok(partner.call('POST', '/vendors/me/documents', { type, mediaId: (await media(partner.record._id, 'document')).publicId }));
  }
  await ok(partner.call('POST', '/vendors/me/submit'));
  const queue = (await ok(admin.call('GET', '/admin/vendors?status=submitted'))).data;
  const queued = queue.find((item: any) => item.id === vendor.id);
  assert.ok(queued, 'submitted partner is in the admin queue');
  assert.equal(queued.cnicNumber, '71101-1234567-1', 'CNIC stored in the standard format');
  assert.ok(queued.identityCheck.findings.some((finding: any) => finding.level === 'ok' && /not used by any other/.test(finding.text)), JSON.stringify(queued.identityCheck));
  assert.ok((await ok(admin.call('POST', `/admin/vendors/${vendor.id}/identity-check`))).data.findings.length > 0);
  await fails(partner.call('POST', `/admin/vendors/${vendor.id}/identity-check`), 403);
  const document = await admin.call('GET', `/admin/vendors/${vendor.id}/documents/identity`);
  assert.notEqual(document.status, 404, 'admin can open the identity document');
  await fails(guest.call('POST', `/admin/vendors/${vendor.id}/decision`, { decision: 'approved', notes: 'Looks good' }), 403);
  await ok(admin.call('POST', `/admin/vendors/${vendor.id}/decision`, { decision: 'approved', notes: 'Documents checked' }));
  await partner.login();
  step('partner registers with CNIC, uploads documents, CNIC pre-check runs, admin approves');

  // 2. Listing creation and review
  const listing = (await ok(partner.call('POST', '/vendor/listings', {
    type: 'hotel', title: 'E2E Hunza View Hotel', location: 'Karimabad, Hunza', description: 'A quiet hotel with views of Rakaposhi and Ultar.',
    price: 10_000, imageIds: [(await media(partner.record._id, 'image')).publicId],
    hotelSpecs: { hotelType: 'Hotel', amenities: ['WiFi'], facilities: [], policies: [], checkInTime: '14:00', checkOutTime: '12:00' },
  }), 201)).data;
  const room = (await ok(partner.call('POST', `/vendor/listings/${listing.id}/rooms`, {
    name: 'Deluxe Double', bedType: 'Double', maxAdults: 2, maxChildren: 1, totalRooms: 1, basePrice: 10_000, amenities: [],
  }), 201)).data;
  await fails(partner.call('POST', `/vendor/listings/${listing.id}/submit`), 400, 'LISTING_INCOMPLETE');
  await ok(partner.call('PATCH', `/vendor/listings/${listing.id}`, { stayInfo: {
    childrenAllowed: true, petsAllowed: false, smokingAllowed: false, paymentMethods: ['cash'], hotWater: 'always', roadAccess: 'car', openMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  } }));
  await ok(partner.call('POST', `/vendor/listings/${listing.id}/submit`));
  await fails(guest.call('GET', `/listings/${listing.id}`), 404);
  await ok(admin.call('POST', `/admin/listings/${listing.id}/decision`, { decision: 'published', notes: 'Approved' }));
  await ok(guest.call('GET', `/listings/${listing.id}`));
  const found = (await ok(guest.call('GET', `/listings?type=hotel&search=${encodeURIComponent('E2E Hunza')}&checkIn=${day(30)}&checkOut=${day(32)}`))).data;
  assert.ok(found.some((item: any) => item.id === listing.id), 'published hotel appears in search');
  step('listing created, blocked until policies are filled, published by admin, found in search');

  await ok(partner.call('PATCH', `/vendor/listings/${listing.id}`, { description: 'A quiet hotel with views of Rakaposhi, Ultar and Lady Finger.' }));
  await ok(guest.call('GET', `/listings/${listing.id}`));
  const revisions = (await ok(admin.call('GET', '/admin/listings?status=revisions'))).data;
  assert.ok(revisions.some((item: any) => item.id === listing.id), 'edit waits as a revision');
  await ok(admin.call('POST', `/admin/listings/${listing.id}/revision/decision`, { decision: 'approved', notes: 'Fine' }));
  step('live listing edit waits for review while the listing stays bookable');

  // 3. Pay on arrival: quote, book, replay, sold out, confirm, mark paid, admin cancel
  const quote = await ok(guest.call('GET', `/listings/${listing.id}/availability?checkIn=${day(30)}&checkOut=${day(32)}&adults=2`));
  const stay = { listingId: listing.id, roomTypeId: room.id, checkIn: day(30), checkOut: day(32), rooms: 1, adults: 2, guest: { name: 'E2E Guest', email: guest.email, phone: '03007654321' } };
  await fails(guest.call('POST', '/bookings', { ...stay, expectedTotalMinor: 1 }), 409, 'PRICE_CHANGED');
  const key = { 'Idempotency-Key': `e2e-${randomUUID()}` };
  const booking = (await ok(guest.call('POST', '/bookings', stay, key), 201)).data;
  assert.equal(booking.totalPrice, 20_000);
  assert.equal(booking.status, 'pending');
  assert.equal(booking.platformFee, 500, '2.5% commission');
  assert.equal((await ok(guest.call('POST', '/bookings', stay, key))).data.id, booking.id, 'same checkout key replays the booking');
  await fails(guest.call('POST', '/bookings', stay), 409);
  assert.ok(JSON.stringify(quote).length > 2);
  step('pay on arrival booking priced with commission; replay is idempotent; last room cannot be sold twice');

  await fails(guest.call('POST', `/vendor/bookings/${booking.id}/actions`, { action: 'confirm' }), 404);
  const confirmed = (await ok(partner.call('POST', `/vendor/bookings/${booking.id}/actions`, { action: 'confirm' }))).data;
  assert.equal(confirmed.status, 'confirmed');
  await fails(partner.call('POST', `/vendor/bookings/${booking.id}/actions`, { action: 'check_in' }), 409);
  const paid = (await ok(partner.call('POST', `/vendor/bookings/${booking.id}/actions`, { action: 'mark_paid' }))).data;
  assert.equal(paid.paymentStatus, 'paid');
  const lookup = (await ok(admin.call('GET', `/admin/bookings/lookup?reference=${booking.reference}`))).data;
  assert.equal(lookup.id ?? lookup.booking?.id, booking.id);
  const adminCancelled = (await ok(admin.call('POST', `/admin/bookings/${booking.id}/cancel`, { reason: 'Dispute test' }))).data;
  assert.equal(adminCancelled.status, 'cancelled');
  assert.deepEqual(adminCancelled.refund, { percent: 100, amount: 20_000 }, 'admin cancel of a paid booking refunds in full');
  assert.equal(adminCancelled.platformFee, 0);
  step('partner confirms and marks paid; admin cancel records a full refund and no commission');

  // 4. Unanswered request expires after 24h and frees the room
  const request = (await ok(guest.call('POST', '/bookings', stay), 201)).data;
  await BookingModel.collection.updateOne({ publicId: request.id }, { $set: { createdAt: new Date(Date.now() - 25 * 3_600_000) } });
  await sweep();
  const expired = (await ok(guest.call('GET', `/bookings/${request.id}`))).data;
  assert.equal(expired.status, 'cancelled');
  assert.equal(expired.platformFee, 0);
  step('unanswered request expires after 24h with no commission');

  // 5. Pay now: hidden from the partner until paid, confirmed on payment, guest cancel uses the refund tiers
  const online = (await ok(guest.call('POST', '/bookings', { ...stay, paymentMethod: 'online' }), 201)).data;
  assert.equal(online.status, 'pending');
  const partnerView = (await ok(partner.call('GET', '/vendor/bookings'))).data;
  assert.ok(!partnerView.some((item: any) => item.id === online.id), 'unpaid hold is hidden from the partner');
  const checkout = (await ok(guest.call('POST', `/bookings/${online.id}/pay`))).data;
  assert.match(checkout.url, /getsafepay\.com\/embedded\/.*tracker=track_/);
  const tracker = new URL(checkout.url).searchParams.get('tracker')!;
  assert.equal((await ok(guest.call('POST', `/bookings/${online.id}/payment/verify`))).data.status, 'pending');
  await ok(client().call('POST', '/payments/safepay/webhook', { data: { tracker: 'track_forged-123' } }));
  paidTrackers.add(tracker);
  await ok(client().call('POST', '/payments/safepay/webhook', { data: { tracker: { token: tracker } } }));
  const settled = (await ok(guest.call('GET', `/bookings/${online.id}`))).data;
  assert.equal(settled.status, 'confirmed');
  assert.equal(settled.paymentStatus, 'paid');
  assert.ok((await ok(partner.call('GET', '/vendor/bookings'))).data.some((item: any) => item.id === online.id), 'paid booking reaches the partner');
  await fails(guest.call('POST', `/bookings/${online.id}/pay`), 409, 'NOT_AWAITING_PAYMENT');
  step('pay now opens a real Safepay sandbox checkout; webhook confirms once Safepay says paid');

  await BookingModel.collection.updateOne({ publicId: online.id }, { $set: { createdAt: new Date(Date.now() - 30 * 3_600_000) } });
  const guestCancelled = (await ok(guest.call('POST', `/bookings/${online.id}/cancel`, { reason: 'Plans changed' }))).data;
  assert.deepEqual(guestCancelled.refund, { percent: 75, amount: 15_000 }, 'cancelled 30h after booking: 75% tier');
  assert.equal(guestCancelled.platformFee, 125, 'commission only on the 5,000 the partner keeps');
  step('guest cancels a paid booking after 30h: 75% refund, commission on the kept part');

  // 6. Payment that lands after the hold was released is recorded as owed back in full
  const late = (await ok(guest.call('POST', '/bookings', { ...stay, paymentMethod: 'online' }), 201)).data;
  const lateTracker = new URL((await ok(guest.call('POST', `/bookings/${late.id}/pay`))).data.url).searchParams.get('tracker')!;
  await BookingModel.collection.updateOne({ publicId: late.id }, { $set: { createdAt: new Date(Date.now() - 2 * 3_600_000) } });
  await sweep();
  assert.equal((await ok(guest.call('GET', `/bookings/${late.id}`))).data.status, 'cancelled');
  paidTrackers.add(lateTracker);
  await ok(client().call('POST', '/payments/safepay/webhook', { tracker: lateTracker }));
  const lateView = (await ok(guest.call('GET', `/bookings/${late.id}`))).data;
  assert.equal(lateView.paymentStatus, 'paid');
  assert.equal(lateView.status, 'cancelled');
  assert.deepEqual(lateView.refund, { percent: 100, amount: 20_000 });
  step('unpaid hold released after 60 min; a late payment is recorded as a full refund owed');

  // 7. Partner cancels a paid booking: full refund
  const another = (await ok(guest.call('POST', '/bookings', { ...stay, checkIn: day(40), checkOut: day(41), paymentMethod: 'online' }), 201)).data;
  paidTrackers.add(new URL((await ok(guest.call('POST', `/bookings/${another.id}/pay`))).data.url).searchParams.get('tracker')!);
  assert.equal((await ok(guest.call('POST', `/bookings/${another.id}/payment/verify`))).data.status, 'confirmed');
  const partnerCancelled = (await ok(partner.call('POST', `/vendor/bookings/${another.id}/actions`, { action: 'cancel', reason: 'Road closed' }))).data;
  assert.deepEqual(partnerCancelled.refund, { percent: 100, amount: 10_000 });
  step('guest return page confirms payment; partner cancel refunds in full');

  console.log('\nEnd-to-end checks passed.');
} finally {
  await mongoose.connection.db?.dropDatabase().catch(() => undefined);
  await mongoose.disconnect();
  server.close();
}
