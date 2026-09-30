import { connectDatabase } from '../../database/connection.js';
import { BookingModel, type BookingStatus } from '../../models/booking.model.js';
import { HotelRoomTypeModel } from '../../models/hotel-room-type.model.js';
import { ListingModel } from '../../models/listing.model.js';
import type { UserRole } from '../../models/user.model.js';
import { VendorMemberModel } from '../../models/vendor-member.model.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import type { SessionMetadata } from '../auth/auth.service.js';
import { hasPermission } from '../auth/rbac.js';
import { notifyBooking } from './booking-notifications.js';
import { availableRoomCounts, releaseRooms, reserveRooms } from './availability.service.js';
import type { CreateBookingInput, ListBookingsQuery } from './booking.schemas.js';
import { stayNights, todayInPakistan } from './stay-dates.js';

export const BOOKABLE_LISTING_TYPES = ['hotel', 'homestay'];
const RESERVATION_ROLES = ['owner', 'manager', 'reservations'];

type Actor = { userId: string; roles: UserRole[] };

async function requireDatabase() {
  if (!await connectDatabase()) throw new ServiceUnavailableError('Bookings are unavailable while the database is disconnected.');
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
    specialRequests: booking.specialRequests,
    createdAt: booking.createdAt,
  };
}

async function findBookableListing(listingId: string) {
  const listing = await ListingModel.findOne({ publicId: listingId, status: 'published', deletedAt: null });
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  if (!BOOKABLE_LISTING_TYPES.includes(listing.type)) {
    throw new AppError(422, 'BOOKING_NOT_SUPPORTED', 'Online booking is not available for this listing yet.');
  }
  return listing;
}

export function partyFits(room: { maxAdults: number; maxChildren: number }, adults: number, children: number, rooms: number) {
  return adults <= room.maxAdults * rooms && adults + children <= (room.maxAdults + room.maxChildren) * rooms;
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
  if (idempotencyKey) {
    const existing = await BookingModel.findOne({ customerId, idempotencyKey });
    if (existing) return { booking: serializeBooking(existing), replayed: true };
  }

  const nights = stayNights(input.checkIn, input.checkOut);
  const listing = await findBookableListing(input.listingId);
  const room = await HotelRoomTypeModel.findOne({
    publicId: input.roomTypeId, listingId: listing._id, status: 'active', deletedAt: null,
  });
  if (!room) throw new AppError(404, 'ROOM_NOT_FOUND', 'The selected room is not available for this listing.');
  if (!partyFits(room, input.adults, input.children, input.rooms)) {
    throw new AppError(422, 'OCCUPANCY_EXCEEDED', 'The selected rooms cannot accommodate this many guests.');
  }

  // The server is the price authority; nothing price-related is read from the request.
  const subtotalMinor = room.basePriceMinor * nights.length * input.rooms;
  await reserveRooms(room, nights, input.rooms);

  try {
    const booking = await BookingModel.create({
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
    });
    await recordAuditEvent({
      actorId: customerId, actorType: 'user', action: 'booking.created',
      resourceType: 'booking', resourceId: booking.publicId, ...metadata,
      metadata: { listingId: listing.publicId, checkIn: input.checkIn, checkOut: input.checkOut, rooms: input.rooms },
    });
    await notifyBooking(booking, 'created');
    return { booking: serializeBooking(booking), replayed: false };
  } catch (error) {
    await releaseRooms(room._id, nights, input.rooms);
    // A concurrent retry with the same key won the insert; return its booking.
    if ((error as { code?: number })?.code === 11000 && idempotencyKey) {
      const existing = await BookingModel.findOne({ customerId, idempotencyKey });
      if (existing) return { booking: serializeBooking(existing), replayed: true };
    }
    throw error;
  }
}

function bookingFilter(query: ListBookingsQuery) {
  const checkIn = {
    ...(query.from ? { $gte: query.from } : {}),
    ...(query.to ? { $lte: query.to } : {}),
  };
  return {
    ...(query.status ? { status: query.status } : {}),
    ...(Object.keys(checkIn).length ? { checkIn } : {}),
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

export async function listAllBookings(query: ListBookingsQuery) {
  await requireDatabase();
  return listWithFilter(bookingFilter(query), query, { createdAt: -1 });
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

async function applyTransition(actor: Actor, booking: any, action: BookingAction, reason: string | undefined, metadata: SessionMetadata) {
  const rule = transitions[action];
  if (rule.notBeforeCheckIn && todayInPakistan() < booking.checkIn) {
    throw new AppError(409, 'INVALID_BOOKING_STATUS', 'This action is only available from the check-in date.');
  }
  // Conditional update so two concurrent actions cannot both succeed (e.g. a double inventory release).
  const updated = await BookingModel.findOneAndUpdate(
    { _id: booking._id, status: { $in: rule.from } },
    {
      $set: { status: rule.to },
      $push: { statusHistory: { status: rule.to, by: actor.userId, reason, at: new Date() } },
    },
    { returnDocument: 'after' },
  );
  if (!updated) throw new AppError(409, 'INVALID_BOOKING_STATUS', `A ${booking.status} booking cannot be moved to ${rule.to}.`);

  if (rule.releases) {
    // The stay was validated at creation, so rebuild its nights without the "not in the past" check.
    const nights = stayNights(booking.checkIn, booking.checkOut, booking.checkIn);
    await releaseRooms(booking.roomTypeId, nights, booking.rooms);
  }
  await recordAuditEvent({
    actorId: actor.userId, actorType: 'user', action: `booking.${rule.to}`,
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

export async function actOnVendorBooking(actor: Actor, bookingId: string, action: BookingAction, reason: string | undefined, metadata: SessionMetadata) {
  await requireDatabase();
  const { booking, isVendor, isManager } = await accessibleBooking(actor, bookingId);
  if (!isVendor && !isManager) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  return applyTransition(actor, booking, action, reason, metadata);
}
