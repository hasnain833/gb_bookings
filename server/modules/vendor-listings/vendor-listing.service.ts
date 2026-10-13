import { connectDatabase } from '../../database/connection.js';
import { inTransaction } from '../../database/transaction.js';
import { HotelRoomTypeModel } from '../../models/hotel-room-type.model.js';
import { ListingModel } from '../../models/listing.model.js';
import { MediaModel } from '../../models/media.model.js';
import { VendorMemberModel } from '../../models/vendor-member.model.js';
import { VendorModel } from '../../models/vendor.model.js';
import { RoomNightModel } from '../../models/room-night.model.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import type { SessionMetadata } from '../auth/auth.service.js';
import { inventoryExceeds, prepareRoomNights } from '../bookings/availability.service.js';
import { todayInPakistan } from '../bookings/stay-dates.js';

async function requireDatabase() {
  if (!await connectDatabase()) throw new ServiceUnavailableError('Listing management is unavailable while the database is disconnected.');
}

function listingView(listing: any) {
  return {
    id: listing.publicId, type: listing.type, title: listing.title, location: listing.location,
    description: listing.description, price: listing.price, currency: listing.currency,
    image: listing.image, images: listing.images ?? [], hotelSpecs: listing.hotelSpecs, homestaySpecs: listing.homestaySpecs,
    status: listing.status, rejectionReason: listing.rejectionReason,
    createdAt: listing.createdAt, updatedAt: listing.updatedAt,
  };
}

/** Homestay pages read amenities and house rules from homestaySpecs; derive them from the shared hotelSpecs input. */
function homestaySpecsFor(listing: any, input: any) {
  const specs = listing.hotelSpecs ?? {};
  return {
    hostName: input?.hostName ?? listing.homestaySpecs?.hostName,
    experienceType: input?.experienceType ?? listing.homestaySpecs?.experienceType,
    amenities: specs.amenities ?? [],
    houseRules: specs.policies ?? [],
  };
}

function roomView(room: any) {
  return {
    id: room.publicId, name: room.name, description: room.description, bedType: room.bedType,
    maxAdults: room.maxAdults, maxChildren: room.maxChildren, totalRooms: room.totalRooms,
    basePrice: room.basePriceMinor / 100, amenities: room.amenities ?? [], status: room.status,
  };
}

async function approvedVendor(userId: string) {
  await requireDatabase();
  const membership = await VendorMemberModel.findOne({ userId, status: 'active', deletedAt: null });
  if (!membership || !['owner', 'manager', 'listings'].includes(membership.role)) {
    throw new AppError(403, 'VENDOR_ACCESS_REQUIRED', 'An active vendor listing role is required.');
  }
  const vendor = await VendorModel.findOne({ _id: membership.vendorId, status: 'approved', deletedAt: null });
  if (!vendor) throw new AppError(403, 'VENDOR_APPROVAL_REQUIRED', 'The vendor must be approved before managing listings.');
  return vendor;
}

async function ownedListing(userId: string, listingId: string) {
  const vendor = await approvedVendor(userId);
  const listing = await ListingModel.findOne({ publicId: listingId, ownerId: vendor._id, deletedAt: null });
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Owned listing was not found.');
  return { vendor, listing };
}

async function ownedImages(userId: string, imageIds: string[]) {
  const records = await MediaModel.find({ publicId: { $in: imageIds }, ownerId: userId, resourceType: 'image', status: 'ready', deletedAt: null });
  if (records.length !== new Set(imageIds).size) throw new AppError(400, 'INVALID_LISTING_MEDIA', 'Every listing image must be a ready image owned by this user.');
  const byId = new Map(records.map((record: any) => [record.publicId, record]));
  return imageIds.map((id) => byId.get(id));
}

export async function listOwnListings(userId: string) {
  const vendor = await approvedVendor(userId);
  const records = await ListingModel.find({ ownerId: vendor._id, deletedAt: null }).sort({ updatedAt: -1 }).lean();
  return records.map(listingView);
}

export async function createHotelListing(userId: string, input: any, metadata: SessionMetadata) {
  const vendor = await approvedVendor(userId);
  const images = await ownedImages(userId, input.imageIds);
  const listing = await ListingModel.create({
    ownerId: vendor._id, type: input.type, title: input.title, location: input.location,
    description: input.description, price: input.price, priceMinor: input.price * 100,
    image: images[0].url, images: images.map((image: any) => image.url),
    imageMediaIds: images.map((image: any) => image._id), hotelSpecs: input.hotelSpecs,
    status: 'draft', featured: false,
  });
  if (listing.type === 'homestay') {
    listing.homestaySpecs = homestaySpecsFor(listing, input.homestaySpecs);
    await listing.save();
  }
  await recordAuditEvent({ actorId: userId, actorType: 'user', action: 'listing.created', resourceType: 'listing', resourceId: listing.publicId, ...metadata });
  return listingView(listing);
}

export async function updateHotelListing(userId: string, listingId: string, input: any, metadata: SessionMetadata) {
  const { listing } = await ownedListing(userId, listingId);
  if (!['draft', 'rejected', 'published', 'paused'].includes(listing.status)) throw new AppError(409, 'LISTING_LOCKED', 'Listings cannot be edited while under review.');
  const update = { ...input };
  if (input.imageIds) {
    const images = await ownedImages(userId, input.imageIds);
    update.image = images[0].url;
    update.images = images.map((image: any) => image.url);
    update.imageMediaIds = images.map((image: any) => image._id);
    delete update.imageIds;
  }
  if (input.price !== undefined) update.priceMinor = input.price * 100;
  delete update.homestaySpecs;
  Object.assign(listing, update, { status: 'draft', rejectionReason: null });
  if (listing.type === 'homestay') listing.homestaySpecs = homestaySpecsFor(listing, input.homestaySpecs);
  await listing.save();
  await recordAuditEvent({ actorId: userId, actorType: 'user', action: 'listing.updated', resourceType: 'listing', resourceId: listing.publicId, ...metadata });
  return listingView(listing);
}

export async function addRoomType(userId: string, listingId: string, input: any, metadata: SessionMetadata) {
  const { listing } = await ownedListing(userId, listingId);
  if (!['draft', 'rejected'].includes(listing.status)) throw new AppError(409, 'LISTING_LOCKED', 'Room types can only change while a listing is editable.');
  const { basePrice, ...fields } = input;
  const room = await HotelRoomTypeModel.create({ listingId: listing._id, ...fields, basePriceMinor: basePrice * 100 });
  await syncListingPrice(listing);
  await recordAuditEvent({ actorId: userId, actorType: 'user', action: 'listing.room_created', resourceType: 'listing', resourceId: listing.publicId, ...metadata, metadata: { roomId: room.publicId } });
  return roomView(room);
}

export async function listRoomTypes(userId: string, listingId: string) {
  const { listing } = await ownedListing(userId, listingId);
  const rooms = await HotelRoomTypeModel.find({ listingId: listing._id, deletedAt: null }).sort({ createdAt: 1 }).lean();
  return rooms.map(roomView);
}

/** Keeps the listing's "from" price, used by search, equal to its cheapest bookable room. */
async function syncListingPrice(listing: any) {
  const cheapest = await HotelRoomTypeModel.findOne({ listingId: listing._id, status: 'active', deletedAt: null })
    .sort({ basePriceMinor: 1 }).select('basePriceMinor').lean() as any;
  if (!cheapest || cheapest.basePriceMinor === listing.priceMinor) return;
  listing.priceMinor = cheapest.basePriceMinor;
  listing.price = cheapest.basePriceMinor / 100;
  await listing.save();
}

// Price, inventory and pausing are day-to-day operations; everything guests read needs re-moderation.
const LIVE_ROOM_FIELDS = ['basePrice', 'totalRooms', 'status'];

export async function updateRoomType(userId: string, listingId: string, roomId: string, input: any, metadata: SessionMetadata) {
  const { listing } = await ownedListing(userId, listingId);
  const editable = ['draft', 'rejected'].includes(listing.status);
  const live = ['published', 'paused'].includes(listing.status);
  if (!editable && !(live && Object.keys(input).every((field) => LIVE_ROOM_FIELDS.includes(field)))) {
    throw new AppError(409, 'LISTING_LOCKED', 'Live listings can only change room price, room count and availability.');
  }
  const update = { ...input };
  if (input.basePrice !== undefined) { update.basePriceMinor = input.basePrice * 100; delete update.basePrice; }
  const room = await inTransaction(async (session) => {
    const room = await HotelRoomTypeModel.findOneAndUpdate(
      { publicId: roomId, listingId: listing._id, deletedAt: null },
      { $set: update, $inc: { inventoryVersion: 1 } }, { session, returnDocument: 'after', runValidators: true },
    );
    if (!room) throw new AppError(404, 'ROOM_TYPE_NOT_FOUND', 'Room type was not found.');
    if (input.totalRooms !== undefined && await inventoryExceeds(room._id, input.totalRooms, todayInPakistan(), session)) {
      throw new AppError(409, 'INVENTORY_BELOW_BOOKINGS', 'Room count cannot be lower than existing reservations plus closed rooms on any upcoming night.');
    }
    return room;
  });
  await syncListingPrice(listing);
  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'listing.room_updated', resourceType: 'listing', resourceId: listing.publicId, ...metadata,
    metadata: { roomId: room.publicId, ...input },
  });
  return roomView(room);
}

const DAY_MS = 86_400_000;
const MAX_CALENDAR_DAYS = 120;

function dateRange(from: string, to: string) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const days = Math.round((Date.parse(`${to}T00:00:00Z`) - start) / DAY_MS) + 1;
  if (!Number.isFinite(days) || days < 1) throw new AppError(400, 'INVALID_DATE_RANGE', 'The end date must be on or after the start date.');
  if (days > MAX_CALENDAR_DAYS) throw new AppError(400, 'INVALID_DATE_RANGE', `Choose at most ${MAX_CALENDAR_DAYS} days at a time.`);
  return Array.from({ length: days }, (_, index) => new Date(start + index * DAY_MS).toISOString().slice(0, 10));
}

async function ownedRoom(userId: string, listingId: string, roomId: string) {
  const { listing } = await ownedListing(userId, listingId);
  const room = await HotelRoomTypeModel.findOne({ publicId: roomId, listingId: listing._id, deletedAt: null });
  if (!room) throw new AppError(404, 'ROOM_TYPE_NOT_FOUND', 'Room type was not found.');
  return { listing, room };
}

/** Per-night inventory for one room category: booked, closed by the property, and still available. */
export async function getRoomCalendar(userId: string, listingId: string, roomId: string, from: string, to: string) {
  const { room } = await ownedRoom(userId, listingId, roomId);
  const dates = dateRange(from, to);
  const counters = await RoomNightModel.find({ roomTypeId: room._id, date: { $in: dates } }).select('date booked closed').lean() as any[];
  const byDate = new Map(counters.map((counter) => [counter.date, counter]));
  return {
    roomId: room.publicId, totalRooms: room.totalRooms,
    days: dates.map((date) => {
      const booked = byDate.get(date)?.booked ?? 0;
      const closed = byDate.get(date)?.closed ?? 0;
      return { date, booked, closed, available: Math.max(0, room.totalRooms - booked - closed) };
    }),
  };
}

/** Takes `closed` rooms out of sale for every night from..to (0 reopens them). Never closes rooms guests already hold. */
export async function setRoomClosures(userId: string, listingId: string, roomId: string, input: { from: string; to: string; closed: number }, metadata: SessionMetadata) {
  const { listing, room } = await ownedRoom(userId, listingId, roomId);
  if (input.from < todayInPakistan()) throw new AppError(400, 'INVALID_DATE_RANGE', 'Past dates cannot be changed.');
  if (input.closed > room.totalRooms) throw new AppError(400, 'INVALID_CLOSURE', `This category only has ${room.totalRooms} room(s).`);
  const dates = dateRange(input.from, input.to);
  await prepareRoomNights(room._id, dates);
  await inTransaction(async (session) => {
    // Writing the room document serializes closures with concurrent reservations of this category.
    await HotelRoomTypeModel.updateOne({ _id: room._id }, { $inc: { inventoryVersion: 1 } }, { session });
    const conflicts: string[] = [];
    for (const date of dates) {
      const result = await RoomNightModel.updateOne(
        { roomTypeId: room._id, date, booked: { $lte: room.totalRooms - input.closed } },
        { $set: { closed: input.closed } }, { session },
      );
      if (result.matchedCount !== 1) conflicts.push(date);
    }
    if (conflicts.length) {
      throw new AppError(409, 'CLOSURE_CONFLICTS_WITH_BOOKINGS',
        `Guests already hold rooms on ${conflicts.slice(0, 5).join(', ')}${conflicts.length > 5 ? ` and ${conflicts.length - 5} more night(s)` : ''}. Close fewer rooms on those nights.`,
        { dates: conflicts });
    }
  });
  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'listing.room_closures_set', resourceType: 'listing', resourceId: listing.publicId, ...metadata,
    metadata: { roomId: room.publicId, ...input },
  });
  return getRoomCalendar(userId, listingId, roomId, input.from, input.to);
}

export async function archiveRoomType(userId: string, listingId: string, roomId: string) {
  const { listing } = await ownedListing(userId, listingId);
  if (!['draft', 'rejected'].includes(listing.status)) throw new AppError(409, 'LISTING_LOCKED', 'Room types can only change while a listing is editable.');
  const room = await HotelRoomTypeModel.findOneAndUpdate(
    { publicId: roomId, listingId: listing._id, deletedAt: null }, { $set: { status: 'archived', deletedAt: new Date() } },
  );
  if (!room) throw new AppError(404, 'ROOM_TYPE_NOT_FOUND', 'Room type was not found.');
  await syncListingPrice(listing);
}

export async function submitListing(userId: string, listingId: string, metadata: SessionMetadata) {
  const { listing } = await ownedListing(userId, listingId);
  if (!['draft', 'rejected'].includes(listing.status)) throw new AppError(409, 'INVALID_LISTING_STATUS', 'This listing cannot be submitted.');
  const rooms = await HotelRoomTypeModel.countDocuments({ listingId: listing._id, status: 'active', deletedAt: null });
  if (!listing.imageMediaIds.length || rooms === 0) throw new AppError(400, 'LISTING_INCOMPLETE', 'Add at least one owned image and one active room type before submission.');
  listing.status = 'submitted'; listing.rejectionReason = null;
  await listing.save();
  await recordAuditEvent({ actorId: userId, actorType: 'user', action: 'listing.submitted', resourceType: 'listing', resourceId: listing.publicId, ...metadata });
  return listingView(listing);
}

/** Pausing hides a live listing from search and new bookings; existing reservations are unaffected. */
export async function setListingAvailability(userId: string, listingId: string, status: 'paused' | 'published', metadata: SessionMetadata) {
  const { listing } = await ownedListing(userId, listingId);
  const from = status === 'paused' ? 'published' : 'paused';
  if (listing.status !== from) throw new AppError(409, 'INVALID_LISTING_STATUS', status === 'paused' ? 'Only live listings can be paused.' : 'Only paused listings can be resumed.');
  listing.status = status;
  await listing.save();
  await recordAuditEvent({ actorId: userId, actorType: 'user', action: status === 'paused' ? 'listing.paused' : 'listing.resumed', resourceType: 'listing', resourceId: listing.publicId, ...metadata });
  return listingView(listing);
}

export async function archiveListing(userId: string, listingId: string, metadata: SessionMetadata) {
  const { listing } = await ownedListing(userId, listingId);
  listing.status = 'archived'; listing.deletedAt = new Date();
  await listing.save();
  await recordAuditEvent({ actorId: userId, actorType: 'user', action: 'listing.archived', resourceType: 'listing', resourceId: listing.publicId, ...metadata });
}

export async function duplicateListing(userId: string, listingId: string, metadata: SessionMetadata) {
  const { vendor, listing } = await ownedListing(userId, listingId);
  const source = listing.toObject();
  delete source._id; delete source.publicId; delete source.createdAt; delete source.updatedAt;
  const duplicate = await ListingModel.create({
    ...source, ownerId: vendor._id, title: `${listing.title} Copy`, status: 'draft',
    featured: false, rejectionReason: null, deletedAt: null,
  });
  const rooms = await HotelRoomTypeModel.find({ listingId: listing._id, deletedAt: null }).lean();
  if (rooms.length) {
    await HotelRoomTypeModel.insertMany(rooms.map((room: any) => {
      const { _id, publicId, createdAt, updatedAt, ...fields } = room;
      return { ...fields, listingId: duplicate._id, status: 'active', deletedAt: null };
    }));
  }
  await recordAuditEvent({ actorId: userId, actorType: 'user', action: 'listing.duplicated', resourceType: 'listing', resourceId: duplicate.publicId, ...metadata, metadata: { sourceListingId: listing.publicId } });
  return listingView(duplicate);
}

/** Admin view of vendor hotels and homestays in any state; the review queue is status=submitted (oldest first). */
export async function listListingsForModeration(query: { status: string; q?: string; page: number; limit: number }) {
  await requireDatabase();
  const term = query.q && new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const filter: Record<string, unknown> = {
    type: { $in: ['hotel', 'homestay'] }, ownerId: { $ne: null },
    // Archiving also sets deletedAt, so archived listings are only shown when asked for.
    ...(query.status === 'archived' ? { status: 'archived' } : { deletedAt: null, ...(query.status === 'all' ? {} : { status: query.status }) }),
    ...(term ? { $or: [{ title: term }, { location: term }] } : {}),
  };
  const [records, total] = await Promise.all([
    ListingModel.find(filter).sort(query.status === 'submitted' ? { updatedAt: 1 } : { updatedAt: -1 })
      .skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    ListingModel.countDocuments(filter),
  ]);
  const vendors = await VendorModel.find({ _id: { $in: records.map((record: any) => record.ownerId) } }).select('name').lean() as any[];
  const vendorNames = new Map(vendors.map((vendor) => [String(vendor._id), vendor.name]));
  return {
    data: records.map((record: any) => ({ ...listingView(record), vendorName: vendorNames.get(String(record.ownerId)) })),
    pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
  };
}

export async function listRoomsForModeration(listingId: string) {
  await requireDatabase();
  const listing = await ListingModel.findOne({ publicId: listingId, deletedAt: null });
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing was not found.');
  const rooms = await HotelRoomTypeModel.find({ listingId: listing._id, deletedAt: null }).sort({ createdAt: 1 }).lean();
  return rooms.map(roomView);
}

export async function moderateListing(adminId: string, listingId: string, input: { decision: string; notes: string }, metadata: SessionMetadata) {
  await requireDatabase();
  // Publishing needs a submitted listing; rejecting also takes down a live or paused one, returning it to the vendor.
  const from = input.decision === 'published' ? ['submitted'] : ['submitted', 'published', 'paused'];
  const listing = await ListingModel.findOne({ publicId: listingId, status: { $in: from }, deletedAt: null });
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', input.decision === 'published' ? 'Submitted listing was not found.' : 'This listing cannot be rejected in its current state.');
  if (input.decision === 'published') {
    if (!await VendorModel.exists({ _id: listing.ownerId, status: 'approved', deletedAt: null })) {
      throw new AppError(409, 'VENDOR_APPROVAL_REQUIRED', 'Approve the property business before publishing its hotel.');
    }
    if (!listing.imageMediaIds.length || !await HotelRoomTypeModel.exists({ listingId: listing._id, status: 'active', deletedAt: null })) {
      throw new AppError(400, 'LISTING_INCOMPLETE', 'The hotel needs a property photo and an active room category before publication.');
    }
  }
  listing.status = input.decision;
  listing.rejectionReason = input.decision === 'rejected' ? input.notes : null;
  await listing.save();
  await recordAuditEvent({ actorId: adminId, actorType: 'user', action: `listing.${input.decision}`, resourceType: 'listing', resourceId: listing.publicId, ...metadata, metadata: { notes: input.notes } });
  return listingView(listing);
}
