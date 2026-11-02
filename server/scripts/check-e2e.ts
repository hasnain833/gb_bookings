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
process.env.GOOGLE_CLIENT_ID = 'e2e-google-client';

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
// Google tokeninfo: a fake credential "e2e-google|<sub>|<email>|<aud>" stands for a signed ID token.
// Resend: the last emailed security code is kept in `lastEmailedCode` (email is only switched on for the account checks).
let lastEmailedCode = '';
globalThis.fetch = (async (url: any, init?: any) => {
  const match = String(url).match(/\/reporter\/api\/v1\/payments\/([^/?]+)/);
  if (match) return new Response(JSON.stringify({ data: { tracker: { state: paidTrackers.has(decodeURIComponent(match[1])) ? 'TRACKER_ENDED' : 'TRACKER_STARTED' } } }), { status: 200 });
  if (String(url).startsWith('https://oauth2.googleapis.com/tokeninfo')) {
    const [tag, sub, email, aud] = (new URL(String(url)).searchParams.get('id_token') ?? '').split('|');
    if (tag !== 'e2e-google') return new Response('{"error":"invalid_token"}', { status: 400 });
    return new Response(JSON.stringify({ iss: 'https://accounts.google.com', aud, sub, email, email_verified: 'true', name: 'Google Guest' }), { status: 200 });
  }
  if (String(url).startsWith('https://api.resend.com/')) {
    lastEmailedCode = JSON.parse(init.body).html.match(/>(\d{6})</)?.[1] ?? '';
    return new Response(JSON.stringify({ id: randomUUID() }), { status: 200 });
  }
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
  // While the application is reviewed, the applicant can save "Add a property" progress but not create the listing.
  const savedDraft = (await ok(partner.call('PUT', '/vendor/listing-drafts/hotel', { step: 3, data: { hotel: { title: 'Draft hotel' } } }))).data;
  assert.deepEqual([savedDraft.step, savedDraft.data.hotel.title], [3, 'Draft hotel']);
  await fails(partner.call('PUT', '/vendor/listing-drafts/homestay', { step: 0, data: {} }), 403, 'LISTING_TYPE_NOT_ALLOWED');
  // Listing comes first: anyone signed in may start a draft before applying.
  assert.equal((await ok(guest.call('GET', '/vendor/listing-drafts/hotel'))).data, null);
  // With the application submitted, the listing is created and submitted too; publishing waits for the partner's approval.
  const earlyInput = {
    type: 'hotel', title: 'E2E Passu Lodge', location: 'Karakoram Highway, Passu, Gojal', description: 'A lodge listed together with the partner application.',
    address: { line1: 'Karakoram Highway', area: 'Passu', city: 'Gojal', region: 'Gilgit-Baltistan' },
    price: 8_000, imageIds: [(await media(partner.record._id, 'image')).publicId],
    hotelSpecs: {
      hotelType: 'Lodge', amenities: ['WiFi', 'Parking'], facilities: [], policies: [], checkInTime: '14:00', checkOutTime: '12:00',
      breakfast: { offered: true, included: false, price: 600, kinds: ['Desi'] }, parking: { available: 'paid', price: 200, onSite: true, reservation: false }, licenceNumber: 'GBTD-123',
    },
    stayInfo: { childrenAllowed: true, petsAllowed: false, smokingAllowed: false, paymentMethods: ['cash'], hotWater: 'always', roadAccess: 'car', openMonths: [5, 6, 7, 8, 9] },
  };
  await fails(partner.call('POST', '/vendor/listings', { ...earlyInput, hotelSpecs: { ...earlyInput.hotelSpecs, parking: { available: 'paid' } } }), 400);
  const early = (await ok(partner.call('POST', '/vendor/listings', earlyInput), 201)).data;
  assert.deepEqual([early.address.area, early.hotelSpecs.parking.price, early.hotelSpecs.breakfast.price, early.hotelSpecs.licenceNumber], ['Passu', 200, 600, 'GBTD-123'], 'address parts, parking, breakfast and licence are stored');
  assert.equal((await ok(partner.call('GET', '/vendor/listing-drafts/hotel'))).data, null, 'creating the listing clears the saved draft');
  await ok(partner.call('POST', `/vendor/listings/${early.id}/rooms`, {
    name: 'Standard Double Room', roomType: 'double', beds: [{ kind: 'double', count: 1 }], bathroom: 'private', maxAdults: 2, maxChildren: 0, totalRooms: 1, basePrice: 8_000, amenities: [],
  }), 201);
  await ok(partner.call('POST', `/vendor/listings/${early.id}/submit`));
  await fails(admin.call('POST', `/admin/listings/${early.id}/decision`, { decision: 'published', notes: 'Looks good' }), 409, 'VENDOR_APPROVAL_REQUIRED');
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
  await ok(admin.call('POST', `/admin/listings/${early.id}/decision`, { decision: 'published', notes: 'Looks good' }));
  await partner.login();
  step('partner drafts, submits a listing with the application, CNIC pre-check runs, admin approves the partner and then the listing');

  // 2. Listing creation and review
  const listing = (await ok(partner.call('POST', '/vendor/listings', {
    type: 'hotel', title: 'E2E Hunza View Hotel', location: 'Karimabad, Hunza', description: 'A quiet hotel with views of Rakaposhi and Ultar.',
    price: 10_000, imageIds: [(await media(partner.record._id, 'image')).publicId],
    hotelSpecs: { hotelType: 'Hotel', amenities: ['WiFi'], facilities: [], policies: [], checkInTime: '14:00', checkOutTime: '12:00' },
  }), 201)).data;
  const room = (await ok(partner.call('POST', `/vendor/listings/${listing.id}/rooms`, {
    name: 'Deluxe Double', bedType: 'Double', maxAdults: 2, maxChildren: 1, totalRooms: 1, basePrice: 10_000, amenities: [],
  }), 201)).data;
  // Property types come from a fixed list per kind; rooms describe beds and bathroom, and the bed line is built from them.
  const hotelSpecs = { hotelType: 'Apartment', amenities: ['WiFi'], facilities: [], policies: [], checkInTime: '14:00', checkOutTime: '12:00' };
  await fails(partner.call('PATCH', `/vendor/listings/${listing.id}`, { hotelSpecs }), 422, 'PROPERTY_TYPE_INVALID');
  await ok(partner.call('PATCH', `/vendor/listings/${listing.id}`, { hotelSpecs: { ...hotelSpecs, hotelType: 'Guest House' } }));
  await fails(partner.call('POST', `/vendor/listings/${listing.id}/rooms`, { name: 'No beds', maxAdults: 2, maxChildren: 0, totalRooms: 1, basePrice: 12_000, amenities: [] }), 422, 'BEDS_REQUIRED');
  const twin = (await ok(partner.call('POST', `/vendor/listings/${listing.id}/rooms`, {
    name: 'Standard Twin Room', roomType: 'twin', beds: [{ kind: 'single', count: 2 }], bathroom: 'shared', bathroomItems: ['Toilet', 'Shower'], sizeSqm: 16,
    maxAdults: 2, maxChildren: 0, totalRooms: 2, basePrice: 12_000, amenities: [],
  }), 201)).data;
  assert.deepEqual([twin.bedType, twin.bathroom, twin.sizeSqm], ['2 single beds', 'shared', 16]);
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
  const reBedded = (await ok(partner.call('PATCH', `/vendor/listings/${listing.id}/rooms/${twin.id}`, { beds: [{ kind: 'double', count: 1 }] }))).data;
  assert.deepEqual([reBedded.bedType, reBedded.pendingRevision.changes.bedType], ['2 single beds', '1 double bed'], 'new beds wait for review with their bed line');
  await ok(admin.call('POST', `/admin/listings/${listing.id}/revision/decision`, { decision: 'approved', notes: 'Fine' }));
  step('live listing edit waits for review while the listing stays bookable');

  // 3. Pay on arrival: quote, book, replay, sold out, confirm, mark paid, admin cancel
  const quote = await ok(guest.call('GET', `/listings/${listing.id}/availability?checkIn=${day(30)}&checkOut=${day(32)}&adults=2`));
  const twinQuote = quote.rooms.find((item: any) => item.id === twin.id);
  assert.deepEqual([twinQuote.bedType, twinQuote.beds, twinQuote.bathroom, twinQuote.sizeSqm], ['1 double bed', [{ kind: 'double', count: 1 }], 'shared', 16], 'guests see the approved beds and bathroom');
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

  // 8. Sign in with Google, then delete the account
  const googleToken = (sub: string, email: string, aud = 'e2e-google-client') => ['e2e-google', sub, email, aud, ''.padEnd(100, '.')].join('|');
  const googleEmail = `google-${randomUUID().slice(0, 8)}@e2e.test`;
  await fails(client().call('POST', '/auth/google', { credential: googleToken('g-1', googleEmail, 'someone-elses-client') }), 401, 'GOOGLE_TOKEN_INVALID');
  const googler = client();
  const googleUser = (await ok(googler.call('POST', '/auth/google', { credential: googleToken('g-1', googleEmail) }))).user;
  assert.deepEqual([googleUser.email, googleUser.roles, googleUser.emailVerified], [googleEmail, ['customer'], true]);
  const again = client();
  assert.equal((await ok(again.call('POST', '/auth/google', { credential: googleToken('g-1', googleEmail) }))).user.id, googleUser.id, 'same Google account signs in to the same user');
  assert.equal((await ok(client().call('POST', '/auth/google', { credential: googleToken('g-guest', guest.email) }))).user.id, (await ok(guest.call('GET', '/auth/me'))).user.id, 'Google links to the existing account with that email');
  await fails(client().call('POST', '/auth/google', { credential: googleToken('g-other', guest.email) }), 409, 'GOOGLE_ACCOUNT_MISMATCH');
  step('Google sign-in creates, re-uses and links accounts; wrong audience and a second Google account are refused');

  const { env } = await import('../config/env.js');
  Object.assign(env, { RESEND_API_KEY: 'e2e', RESEND_SENDER_EMAIL: 'e2e@e2e.test' });
  try {
    await fails(partner.call('POST', '/auth/me/delete/request'), 409, 'ACCOUNT_DELETION_BLOCKED');
    const upcoming = (await ok(googler.call('POST', '/bookings', { ...stay, checkIn: day(50), checkOut: day(51), guest: { ...stay.guest, email: googleEmail } }), 201)).data;
    await fails(googler.call('POST', '/auth/me/delete/request'), 409, 'ACCOUNT_DELETION_BLOCKED');
    await ok(googler.call('POST', `/bookings/${upcoming.id}/cancel`, { reason: 'Changed plans' }));
    const { challengeId } = await ok(googler.call('POST', '/auth/me/delete/request'));
    assert.match(lastEmailedCode, /^\d{6}$/);
    await fails(googler.call('POST', '/auth/me/delete', { challengeId, code: lastEmailedCode === '000000' ? '111111' : '000000' }), 400, 'INVALID_OTP');
    await ok(googler.call('POST', '/auth/me/delete', { challengeId, code: lastEmailedCode }), 204);
  } finally {
    Object.assign(env, { RESEND_API_KEY: undefined, RESEND_SENDER_EMAIL: undefined });
  }
  await fails(again.call('GET', '/auth/me'), 401);
  const deleted = await UserModel.findOne({ publicId: googleUser.id }).lean() as any;
  assert.deepEqual([deleted.status, deleted.name, deleted.googleId, deleted.email.endsWith('@deleted.invalid')], ['archived', 'Deleted user', undefined, true]);
  assert.equal((await BookingModel.findOne({ customerId: deleted._id }).lean() as any).guest.email, googleEmail, 'booking keeps its guest snapshot');
  assert.notEqual((await ok(client().call('POST', '/auth/google', { credential: googleToken('g-1', googleEmail) }))).user.id, googleUser.id, 'the email can sign up again as a new account');
  step('account deletion: blocked for partners and upcoming stays, needs the emailed code, anonymises and signs out everywhere');

  // 9. Rate limits are counted in the database, shared by every server instance
  const { MongoRateLimitStore } = await import('../shared/rate-limit-store.js');
  const [serverA, serverB] = [new MongoRateLimitStore('e2e:'), new MongoRateLimitStore('e2e:')];
  for (const store of [serverA, serverB]) store.init({ windowMs: 1_000 } as any);
  assert.equal((await serverA.increment('ip')).totalHits, 1);
  assert.equal((await serverB.increment('ip')).totalHits, 2, 'two servers share one count');
  await Promise.all(Array.from({ length: 5 }, () => serverA.increment('race')));
  assert.equal((await serverB.increment('race')).totalHits, 6, 'simultaneous first hits are all counted');
  await new Promise((resolve) => setTimeout(resolve, 1_100));
  assert.equal((await serverA.increment('ip')).totalHits, 1, 'a new window starts again at 1');
  const counters = mongoose.connection.collection('ratelimits');
  assert.ok(await counters.findOne({ _id: /^api:/ as any }) && await counters.findOne({ _id: /^auth:/ as any }), 'API and sign-in limiters use the shared store');
  step('rate limits: one count across server instances, safe under concurrent hits, windows reset');

  console.log('\nEnd-to-end checks passed.');
} finally {
  await mongoose.connection.db?.dropDatabase().catch(() => undefined);
  await mongoose.disconnect();
  server.close();
}
