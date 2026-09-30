import { connectDatabase } from '../../database/connection.js';
import { HotelRoomTypeModel } from '../../models/hotel-room-type.model.js';
import { ListingModel } from '../../models/listing.model.js';
import { MediaModel } from '../../models/media.model.js';
import { VendorMemberModel } from '../../models/vendor-member.model.js';
import { VendorModel } from '../../models/vendor.model.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import type { SessionMetadata } from '../auth/auth.service.js';

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
  if (!['draft', 'rejected'].includes(listing.status)) throw new AppError(409, 'LISTING_LOCKED', 'Only draft or rejected listings can be edited.');
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
  Object.assign(listing, update, listing.status === 'rejected' ? { status: 'draft', rejectionReason: null } : {});
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
  const room = await HotelRoomTypeModel.findOneAndUpdate(
    { publicId: roomId, listingId: listing._id, deletedAt: null }, { $set: update }, { returnDocument: 'after', runValidators: true },
  );
  if (!room) throw new AppError(404, 'ROOM_TYPE_NOT_FOUND', 'Room type was not found.');
  await syncListingPrice(listing);
  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'listing.room_updated', resourceType: 'listing', resourceId: listing.publicId, ...metadata,
    metadata: { roomId: room.publicId, ...input },
  });
  return roomView(room);
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

export async function listListingsForModeration() {
  await requireDatabase();
  const records = await ListingModel.find({ status: 'submitted', deletedAt: null }).sort({ updatedAt: 1 }).lean();
  return records.map(listingView);
}

export async function moderateListing(adminId: string, listingId: string, input: { decision: string; notes: string }, metadata: SessionMetadata) {
  await requireDatabase();
  const listing = await ListingModel.findOne({ publicId: listingId, status: 'submitted', deletedAt: null });
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Submitted listing was not found.');
  listing.status = input.decision;
  listing.rejectionReason = input.decision === 'rejected' ? input.notes : null;
  await listing.save();
  await recordAuditEvent({ actorId: adminId, actorType: 'user', action: `listing.${input.decision}`, resourceType: 'listing', resourceId: listing.publicId, ...metadata, metadata: { notes: input.notes } });
  return listingView(listing);
}
