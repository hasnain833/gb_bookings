import { createHash } from 'node:crypto';
import type { ClientSession } from 'mongoose';
import { env } from '../../config/env.js';
import { connectDatabase } from '../../database/connection.js';
import { inTransaction } from '../../database/transaction.js';
import { BookingModel, type BookingStatus } from '../../models/booking.model.js';
import { HotelRoomTypeModel } from '../../models/hotel-room-type.model.js';
import { ListingModel } from '../../models/listing.model.js';
import type { UserRole } from '../../models/user.model.js';
import { VendorMemberModel } from '../../models/vendor-member.model.js';
import { VendorModel } from '../../models/vendor.model.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import type { SessionMetadata } from '../auth/auth.service.js';
import { hasPermission } from '../auth/rbac.js';
import { notifyBooking } from './booking-notifications.js';
import { availableRoomCounts, prepareRoomNights, releaseRooms, reserveRooms } from './availability.service.js';
import type { CreateBookingInput, ListBookingsQuery } from './booking.schemas.js';
import { stayNights, todayInPakistan } from './stay-dates.js';

export const BOOKABLE_LISTING_TYPES = ['hotel', 'homestay'];
const RESERVATION_ROLES = ['owner', 'manager', 'reservations'];

type Actor = { userId: string; roles: UserRole[] };

async function requireDatabase() {
  if (!await connectDatabase()) throw new ServiceUnavailableError('Bookings are unavailable while the database is disconnected.');
  await expireStalePendingBookings();
}

const PENDING_TTL_MS = env.PENDING_BOOKING_HOURS * 3_600_000;
const EXPIRY_REASON = `The property did not respond within ${env.PENDING_BOOKING_HOURS} hours, so the request expired and the rooms were released. No payment was taken.`;
let lastSweepAt = 0;

/**
 * Cancels pending requests the property did not answer in time (or whose check-in date has passed), releasing their rooms.
 * ponytail: runs lazily from booking requests (at most once a minute per instance) and on a timer on long-running servers;
 * add a Vercel cron hitting a booking endpoint if guests must be emailed promptly during quiet periods.
 */
export async function expireStalePendingBookings(now = new Date()) {
  if (now.getTime() - lastSweepAt < 60_000) return 0;
  lastSweepAt = now.getTime();
  let expired = 0;
  try {
    const stale = await BookingModel.find({
      status: 'pending',
      $or: [{ createdAt: { $lt: new Date(now.getTime() - PENDING_TTL_MS) } }, { checkIn: { $lt: todayInPakistan(now) } }],
    }).limit(100);
    for (const booking of stale) {
      try {
        await applyTransition({}, booking, 'cancel', EXPIRY_REASON, {});
        expired += 1;
      } catch (error) {
        // 409: the property answered between the query and the update.
        if (!(error instanceof AppError && error.status === 409)) console.error(`Expiring booking ${booking.reference} failed:`, error);
      }
    }
  } catch (error) {
    console.error('Pending booking sweep failed:', error);
  }
  return expired;
}

/** Response shape matches the frontend `Booking` type. */
export function serializeBooking(booking: any) {
  return {
    id: booking.publicId,
    reference: booking.reference,
    listingId: booking.listingSnapshot.publicId,
    listingType: booking.listingSnapshot.type,
    listingTitle: booking.listingSnapshot.title,
    listingImage: booking.listingSnapshot.image,
    listingLocation: booking.listingSnapshot.location,
    roomTypeId: booking.roomSnapshot.publicId,
    roomName: booking.roomSnapshot.name,
    customerName: booking.guest.name,
    customerEmail: booking.guest.email,
    customerPhone: booking.guest.phone,
    startDate: booking.checkIn,
    endDate: booking.checkOut,
    duration: booking.nights,
    rooms: booking.rooms,
    adults: booking.adults,
    children: booking.children,
    guests: booking.adults + booking.children,
    currency: booking.pricing.currency,
    nightlyRate: booking.pricing.nightlyRateMinor / 100,
    totalPrice: booking.pricing.totalMinor / 100,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    paidAt: booking.paidAt,
    checkedInAt: booking.checkedInAt,
    respondBy: booking.status === 'pending' && booking.createdAt ? new Date(new Date(booking.createdAt).getTime() + PENDING_TTL_MS) : undefined,
    specialRequests: booking.specialRequests,
    checkInTime: booking.listingSnapshot.checkInTime,
    checkOutTime: booking.listingSnapshot.checkOutTime,
    history: (booking.statusHistory ?? []).map(({ status, at, reason }: any) => ({ status, at, reason })),
    createdAt: booking.createdAt,
  };
}

async function findBookableListing(listingId: string, session?: ClientSession) {
  const listing = await ListingModel.findOne({ publicId: listingId, status: 'published', deletedAt: null }).session(session ?? null);
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  if (!BOOKABLE_LISTING_TYPES.includes(listing.type)) {
    throw new AppError(422, 'BOOKING_NOT_SUPPORTED', 'Online booking is not available for this listing yet.');
  }
  if (listing.ownerId && !await VendorModel.exists({ _id: listing.ownerId, status: 'approved', deletedAt: null }).session(session ?? null)) {
    throw new AppError(409, 'PROPERTY_UNAVAILABLE', 'This property is not accepting new bookings.');
  }
  return listing;
}

export function partyFits(room: { maxAdults: number; maxChildren: number }, adults: number, children: number, rooms: number) {
  return adults <= room.maxAdults * rooms && children <= room.maxChildren * rooms;
}

export async function getListingAvailability(
  listingId: string,
  query: { checkIn: string; checkOut: string; adults: number; children: number; rooms: number },
) {
  await requireDatabase();
  const nights = stayNights(query.checkIn, query.checkOut);
  const listing = await findBookableListing(listingId);
  const roomTypes = await HotelRoomTypeModel.find({ listingId: listing._id, status: 'active', deletedAt: null })
    .sort({ basePriceMinor: 1 })
    .lean() as any[];
  const available = await availableRoomCounts(roomTypes, nights);

  return {
    listingId: listing.publicId,
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    nights: nights.length,
    currency: 'PKR',
    rooms: roomTypes.map((room) => {
      const free = available.get(String(room._id)) ?? 0;
      return {
        id: room.publicId,
        name: room.name,
        description: room.description,
        bedType: room.bedType,
        maxAdults: room.maxAdults,
        maxChildren: room.maxChildren,
        amenities: room.amenities ?? [],
        photos: (room.photos ?? []).map((photo: any) => ({ url: photo.url, ...(photo.caption ? { caption: photo.caption } : {}) })),
        available: free,
        bookable: free >= query.rooms && partyFits(room, query.adults, query.children, query.rooms),
        nightlyRate: room.basePriceMinor / 100,
        totalPrice: (room.basePriceMinor * nights.length * query.rooms) / 100,
      };
    }),
  };
}

export async function createBooking(
  customerId: string,
  input: CreateBookingInput,
  idempotencyKey: string | undefined,
  metadata: SessionMetadata,
) {
  await requireDatabase();
  const requestHash = createHash('sha256').update(JSON.stringify({
    listingId: input.listingId, roomTypeId: input.roomTypeId, checkIn: input.checkIn, checkOut: input.checkOut,
    rooms: input.rooms, adults: input.adults, children: input.children,
    guest: { name: input.guest.name, email: input.guest.email.toLowerCase(), phone: input.guest.phone },
    specialRequests: input.specialRequests ?? '', paymentMethod: input.paymentMethod,
    expectedTotalMinor: input.expectedTotalMinor,
  })).digest('hex');
  const replay = (booking: any) => {
    if (booking.requestHash && booking.requestHash !== requestHash) {
      throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'This checkout key was already used for different booking details. Start a new checkout.');
    }
    return { booking: serializeBooking(booking), replayed: true };
  };
  if (idempotencyKey) {
    const existing = await BookingModel.findOne({ customerId, idempotencyKey });
    if (existing) return replay(existing);
  }

  const nights = stayNights(input.checkIn, input.checkOut);
  const listing = await findBookableListing(input.listingId);
  const roomRef = await HotelRoomTypeModel.findOne({
    publicId: input.roomTypeId, listingId: listing._id, status: 'active', deletedAt: null,
  });
  if (!roomRef) throw new AppError(404, 'ROOM_NOT_FOUND', 'The selected room is not available for this listing.');
  await prepareRoomNights(roomRef._id, nights);

  try {
    const result = await inTransaction(async (session) => {
      if (idempotencyKey) {
        const existing = await BookingModel.findOne({ customerId, idempotencyKey }).session(session);
        if (existing) return { record: existing, replayed: true };
      }
      const listing = await findBookableListing(input.listingId, session);
      // Write to the room document so reservations serialize with price/inventory edits.
      const room = await HotelRoomTypeModel.findOneAndUpdate(
        { _id: roomRef._id, listingId: listing._id, status: 'active', deletedAt: null },
        { $inc: { inventoryVersion: 1 } }, { session, returnDocument: 'after' },
      );
      if (!room) throw new AppError(409, 'ROOM_UNAVAILABLE', 'The selected room is no longer available.');
      if (!partyFits(room, input.adults, input.children, input.rooms)) {
        throw new AppError(422, 'OCCUPANCY_EXCEEDED', 'The selected rooms cannot accommodate this many guests.');
      }
      const subtotalMinor = room.basePriceMinor * nights.length * input.rooms;
      if (input.expectedTotalMinor !== undefined && input.expectedTotalMinor !== subtotalMinor) {
        throw new AppError(409, 'PRICE_CHANGED', 'The room price changed. Edit traveler details and review the latest price before reserving.');
      }
      await reserveRooms(room, nights, input.rooms, session);
      const [booking] = await BookingModel.create([{
      customerId,
      vendorId: listing.ownerId,
      listingId: listing._id,
      roomTypeId: room._id,
      listingSnapshot: {
        publicId: listing.publicId,
        type: listing.type,
        title: listing.title,
        image: listing.image,
        location: listing.location,
        checkInTime: listing.hotelSpecs?.checkInTime,
        checkOutTime: listing.hotelSpecs?.checkOutTime,
      },
      roomSnapshot: { publicId: room.publicId, name: room.name, bedType: room.bedType },
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: nights.length,
      rooms: input.rooms,
      adults: input.adults,
      children: input.children,
      guest: input.guest,
      specialRequests: input.specialRequests,
      pricing: { currency: 'PKR', nightlyRateMinor: room.basePriceMinor, subtotalMinor, totalMinor: subtotalMinor },
      paymentMethod: input.paymentMethod,
      statusHistory: [{ status: 'pending', by: customerId }],
      idempotencyKey,
      requestHash,
      }], { session });
      return { record: booking, replayed: false };
    });
    if (result.replayed) return replay(result.record);
    const booking = result.record;
    await recordAuditEvent({
      actorId: customerId, actorType: 'user', action: 'booking.created',
      resourceType: 'booking', resourceId: booking.publicId, ...metadata,
      metadata: { listingId: listing.publicId, checkIn: input.checkIn, checkOut: input.checkOut, rooms: input.rooms },
    });
    await notifyBooking(booking, 'created');
    return { booking: serializeBooking(booking), replayed: false };
  } catch (error) {
    // A concurrent retry with the same key won the insert; return its booking.
    if ((error as { code?: number })?.code === 11000 && idempotencyKey) {
      const existing = await BookingModel.findOne({ customerId, idempotencyKey });
      if (existing) return replay(existing);
    }
    throw error;
  }
}

function bookingFilter(query: ListBookingsQuery) {
  const checkIn = {
    ...(query.from ? { $gte: query.from } : {}),
    ...(query.to ? { $lte: query.to } : {}),
  };
  // ponytail: unindexed regex scan, fine at per-vendor volumes; add a text index if admin search slows down.
  const term = query.q && new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return {
    ...(query.status ? { status: query.status } : {}),
    ...(Object.keys(checkIn).length ? { checkIn } : {}),
    ...(query.listingId ? { 'listingSnapshot.publicId': query.listingId } : {}),
    ...(term ? { $or: [{ reference: term }, { 'guest.name': term }, { 'guest.email': term }, { 'guest.phone': term }] } : {}),
  };
}

async function listWithFilter(filter: Record<string, unknown>, query: ListBookingsQuery, sort: Record<string, 1 | -1>) {
  const [records, total] = await Promise.all([
    BookingModel.find(filter).sort(sort).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    BookingModel.countDocuments(filter),
  ]);
  return {
    data: records.map(serializeBooking),
    pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
  };
}

export async function listCustomerBookings(customerId: string, query: ListBookingsQuery) {
  await requireDatabase();
  return listWithFilter({ customerId, ...bookingFilter(query) }, query, { createdAt: -1 });
}

async function reservationVendorIds(userId: string) {
  const memberships = await VendorMemberModel.find({
    userId, status: 'active', deletedAt: null, role: { $in: RESERVATION_ROLES },
  }).select('vendorId').lean() as any[];
  return memberships.map((membership) => membership.vendorId);
}

export async function listVendorBookings(userId: string, query: ListBookingsQuery) {
  await requireDatabase();
  const vendorIds = await reservationVendorIds(userId);
  if (!vendorIds.length) throw new AppError(403, 'VENDOR_ACCESS_REQUIRED', 'An active vendor reservations role is required.');
  return listWithFilter({ vendorId: { $in: vendorIds }, ...bookingFilter(query) }, query, { checkIn: 1 });
}

/** Loads a booking only if the actor is its customer, a reservations member of its vendor, or a booking manager. */
async function accessibleBooking(actor: Actor, bookingId: string) {
  const booking = await BookingModel.findOne({ publicId: bookingId });
  if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  const isCustomer = String(booking.customerId) === actor.userId;
  const isManager = hasPermission(actor.roles, 'booking:manage');
  const isVendor = !isCustomer && !isManager && Boolean(booking.vendorId)
    && (await reservationVendorIds(actor.userId)).some((id) => String(id) === String(booking.vendorId));
  // 404 rather than 403 so booking IDs cannot be probed.
  if (!isCustomer && !isManager && !isVendor) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  return { booking, isCustomer, isVendor, isManager };
}

export async function getBooking(actor: Actor, bookingId: string) {
  await requireDatabase();
  return serializeBooking((await accessibleBooking(actor, bookingId)).booking);
}

const transitions = {
  confirm: { from: ['pending'], to: 'confirmed', releases: false, notBeforeCheckIn: false },
  cancel: { from: ['pending', 'confirmed'], to: 'cancelled', releases: true, notBeforeCheckIn: false },
  complete: { from: ['confirmed'], to: 'completed', releases: false, notBeforeCheckIn: true },
  no_show: { from: ['confirmed'], to: 'no_show', releases: false, notBeforeCheckIn: true },
} as const satisfies Record<string, { from: readonly BookingStatus[]; to: BookingStatus; releases: boolean; notBeforeCheckIn: boolean }>;

export type BookingAction = keyof typeof transitions;

async function applyTransition(actor: { userId?: string }, booking: any, action: BookingAction, reason: string | undefined, metadata: SessionMetadata) {
  const rule = transitions[action];
  if (rule.notBeforeCheckIn && todayInPakistan() < booking.checkIn) {
    throw new AppError(409, 'INVALID_BOOKING_STATUS', 'This action is only available from the check-in date.');
  }
  // Conditional update so two concurrent actions cannot both succeed (e.g. a double inventory release).
  const updated = await inTransaction(async (session) => {
    const updated = await BookingModel.findOneAndUpdate(
    { _id: booking._id, status: { $in: rule.from } },
    {
      $set: { status: rule.to },
      $push: { statusHistory: { status: rule.to, by: actor.userId, reason, at: new Date() } },
    },
    { returnDocument: 'after', session },
  );
  if (!updated) throw new AppError(409, 'INVALID_BOOKING_STATUS', `A ${booking.status} booking cannot be moved to ${rule.to}.`);

  if (rule.releases) {
    // The stay was validated at creation, so rebuild its nights without the "not in the past" check.
    const nights = stayNights(booking.checkIn, booking.checkOut, booking.checkIn);
    await releaseRooms(booking.roomTypeId, nights, booking.rooms, session);
  }
    return updated;
  });
  await recordAuditEvent({
    actorId: actor.userId, actorType: actor.userId ? 'user' : 'system', action: `booking.${rule.to}`,
    resourceType: 'booking', resourceId: booking.publicId, ...metadata,
    metadata: reason ? { reason } : undefined,
  });
  if (rule.to === 'confirmed' || rule.to === 'cancelled') await notifyBooking(updated, rule.to, reason);
  return serializeBooking(updated);
}

export async function cancelOwnBooking(actor: Actor, bookingId: string, reason: string, metadata: SessionMetadata) {
  await requireDatabase();
  const { booking, isCustomer } = await accessibleBooking(actor, bookingId);
  if (!isCustomer) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  if (todayInPakistan() >= booking.checkIn) {
    throw new AppError(409, 'CANCELLATION_WINDOW_CLOSED', 'Bookings can only be cancelled before the check-in date. Please contact the property.');
  }
  return applyTransition(actor, booking, 'cancel', reason, metadata);
}

export async function actOnVendorBooking(actor: Actor, bookingId: string, action: BookingAction | 'mark_paid' | 'check_in', reason: string | undefined, metadata: SessionMetadata) {
  await requireDatabase();
  // Hotel operations belong to the hotel's own team; the platform admin can only cancel (see adminCancelBooking).
  const { booking, isVendor } = await accessibleBooking(actor, bookingId);
  if (!isVendor) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  if (action === 'mark_paid') return markPaidAtProperty(actor, booking, metadata);
  if (action === 'check_in') return checkInGuest(actor, booking, metadata);
  if (action === 'no_show' && booking.checkedInAt) throw new AppError(409, 'GUEST_CHECKED_IN', 'This guest has checked in, so the booking cannot be a no-show.');
  return applyTransition(actor, booking, action, reason, metadata);
}

/** Marks a confirmed guest as arrived. Conditional, so a double click records one arrival. */
async function checkInGuest(actor: Actor, booking: any, metadata: SessionMetadata) {
  if (todayInPakistan() < booking.checkIn) throw new AppError(409, 'INVALID_BOOKING_STATUS', 'Guests can be checked in from the check-in date.');
  const updated = await BookingModel.findOneAndUpdate(
    { _id: booking._id, status: 'confirmed', checkedInAt: null },
    { $set: { checkedInAt: new Date(), checkedInBy: actor.userId } },
    { returnDocument: 'after' },
  );
  if (!updated) {
    throw new AppError(409, 'INVALID_BOOKING_STATUS', booking.checkedInAt ? 'This guest is already checked in.' : 'Only confirmed bookings can be checked in.');
  }
  await recordAuditEvent({ actorId: actor.userId, actorType: 'user', action: 'booking.checked_in', resourceType: 'booking', resourceId: booking.publicId, ...metadata });
  return serializeBooking(updated);
}

const pkr = (minor: number) => `PKR ${(minor / 100).toLocaleString('en-PK')}`;

/**
 * Moves an upcoming booking to new dates, room category or room count in one transaction:
 * the old nights are released, the new ones reserved, and the price re-quoted at the room's current rate.
 */
export async function changeVendorBooking(actor: Actor, bookingId: string, input: { checkIn: string; checkOut: string; roomTypeId: string; rooms: number }, metadata: SessionMetadata) {
  await requireDatabase();
  const { booking, isVendor } = await accessibleBooking(actor, bookingId);
  if (!isVendor) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  if (!['pending', 'confirmed'].includes(booking.status) || booking.checkedInAt) {
    throw new AppError(409, 'INVALID_BOOKING_STATUS', 'Only pending or confirmed bookings whose guest has not checked in can be changed.');
  }
  // ponytail: no refund rules yet (Phase 2), so a re-quote must not leave recorded money out of step with the total.
  if (booking.paymentStatus === 'paid') throw new AppError(409, 'BOOKING_ALREADY_PAID', 'Payment is already recorded for this booking. Cancel it and make a new one instead.');
  const nights = stayNights(input.checkIn, input.checkOut);
  const roomRef = await HotelRoomTypeModel.findOne({ publicId: input.roomTypeId, listingId: booking.listingId, status: 'active', deletedAt: null });
  if (!roomRef) throw new AppError(404, 'ROOM_NOT_FOUND', 'That room category is not bookable at this property.');
  if (!partyFits(roomRef, booking.adults, booking.children, input.rooms)) {
    throw new AppError(422, 'OCCUPANCY_EXCEEDED', `${input.rooms} × ${roomRef.name} cannot hold ${booking.adults} adult(s) and ${booking.children} child(ren).`);
  }
  if (input.checkIn === booking.checkIn && input.checkOut === booking.checkOut && String(roomRef._id) === String(booking.roomTypeId) && input.rooms === booking.rooms) {
    throw new AppError(400, 'NO_CHANGE', 'Nothing was changed.');
  }
  await prepareRoomNights(roomRef._id, nights);
  const oldNights = stayNights(booking.checkIn, booking.checkOut, booking.checkIn);
  const before = `${booking.checkIn} → ${booking.checkOut}, ${booking.rooms} × ${booking.roomSnapshot.name}, ${pkr(booking.pricing.totalMinor)}`;

  const updated = await inTransaction(async (session) => {
    const room = await HotelRoomTypeModel.findOneAndUpdate(
      { _id: roomRef._id, status: 'active', deletedAt: null }, { $inc: { inventoryVersion: 1 } }, { session, returnDocument: 'after' },
    );
    if (!room) throw new AppError(409, 'ROOM_UNAVAILABLE', 'The selected room is no longer available.');
    const totalMinor = room.basePriceMinor * nights.length * input.rooms;
    // Matching the loaded stay makes a concurrent change or cancellation fail instead of double-moving inventory.
    const changed = await BookingModel.findOneAndUpdate(
      { _id: booking._id, status: booking.status, checkedInAt: null, paymentStatus: { $ne: 'paid' }, checkIn: booking.checkIn, checkOut: booking.checkOut, roomTypeId: booking.roomTypeId, rooms: booking.rooms },
      {
        $set: {
          checkIn: input.checkIn, checkOut: input.checkOut, nights: nights.length, rooms: input.rooms, roomTypeId: room._id,
          roomSnapshot: { publicId: room.publicId, name: room.name, bedType: room.bedType },
          pricing: { currency: 'PKR', nightlyRateMinor: room.basePriceMinor, subtotalMinor: totalMinor, totalMinor },
        },
        $push: { statusHistory: { status: booking.status, by: actor.userId, at: new Date(), reason: `Changed from ${before} to ${input.checkIn} → ${input.checkOut}, ${input.rooms} × ${room.name}, ${pkr(totalMinor)}.` } },
      },
      { session, returnDocument: 'after' },
    );
    if (!changed) throw new AppError(409, 'BOOKING_CHANGED', 'This booking was updated meanwhile. Reload it and try again.');
    await releaseRooms(booking.roomTypeId, oldNights, booking.rooms, session);
    await reserveRooms(room, nights, input.rooms, session);
    return changed;
  });
  await recordAuditEvent({
    actorId: actor.userId, actorType: 'user', action: 'booking.changed', resourceType: 'booking', resourceId: booking.publicId, ...metadata,
    metadata: { ...input, previous: { checkIn: booking.checkIn, checkOut: booking.checkOut, roomTypeId: booking.roomSnapshot.publicId, rooms: booking.rooms, totalMinor: booking.pricing.totalMinor } },
  });
  await notifyBooking(updated, 'changed');
  return serializeBooking(updated);
}

/** Admin lookup of one booking by the reference a guest or hotel quotes; there is no admin booking list. */
export async function findBookingForAdmin(reference: string) {
  await requireDatabase();
  const booking = await BookingModel.findOne({ reference }).lean() as any;
  if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', `No booking found with reference ${reference}.`);
  const vendor = booking.vendorId ? await VendorModel.findById(booking.vendorId).select('name email phone').lean() as any : null;
  return { ...serializeBooking(booking), vendor: vendor ? { name: vendor.name, email: vendor.email, phone: vendor.phone } : undefined };
}

/** Exceptional platform cancellation (dispute, fraud) on the guest's behalf. Releases rooms and emails guest and hotel. */
export async function adminCancelBooking(actor: Actor, bookingId: string, reason: string, metadata: SessionMetadata) {
  await requireDatabase();
  const { booking, isManager } = await accessibleBooking(actor, bookingId);
  if (!isManager) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  return applyTransition(actor, booking, 'cancel', `Cancelled by GBBookings: ${reason}`, metadata);
}

/** Records pay-at-hotel money as collected. Conditional, so a retried click cannot record it twice. */
async function markPaidAtProperty(actor: Actor, booking: any, metadata: SessionMetadata) {
  const updated = await BookingModel.findOneAndUpdate(
    { _id: booking._id, paymentMethod: 'pay_at_hotel', paymentStatus: 'pending', status: { $in: ['confirmed', 'completed'] } },
    { $set: { paymentStatus: 'paid', paidAt: new Date(), paymentCollectedBy: actor.userId } },
    { returnDocument: 'after' },
  );
  if (!updated) {
    throw new AppError(409, 'INVALID_PAYMENT_STATUS', booking.paymentStatus === 'paid'
      ? 'Payment for this booking is already recorded.'
      : 'Payment can only be recorded for confirmed or completed pay-at-hotel bookings.');
  }
  await recordAuditEvent({
    actorId: actor.userId, actorType: 'user', action: 'booking.payment_collected', resourceType: 'booking', resourceId: booking.publicId, ...metadata,
    metadata: { amountMinor: booking.pricing.totalMinor },
  });
  return serializeBooking(updated);
}
