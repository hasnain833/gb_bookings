import { isValidObjectId } from 'mongoose';
import type { Listing } from '../../../src/types.js';
import { connectDatabase } from '../../database/connection.js';
import { HotelRoomTypeModel } from '../../models/hotel-room-type.model.js';
import { VendorModel } from '../../models/vendor.model.js';
import { ListingModel, latLng } from '../../models/listing.model.js';
import { escapeRegex } from '../../shared/escape-regex.js';
import { availableRoomCounts } from '../bookings/availability.service.js';
import { stayNights } from '../bookings/stay-dates.js';
import { storedEnd } from '../bookings/rental.js';
import { NotFoundError, ServiceUnavailableError } from '../../shared/app-error.js';
import type { ListListingsQuery } from './listing.schemas.js';

type ListingRecord = Record<string, any>;

// Hotels mark breakfast through their amenity chips ("Breakfast", "Breakfast included").
export const BREAKFAST_AMENITY = /^(free )?breakfast( included)?$/i;

function toPublicListing(record: ListingRecord): Listing {
  return {
    id: record.publicId,
    type: record.type,
    title: record.title,
    location: record.location,
    price: record.price,
    rating: record.rating,
    reviewsCount: record.reviewsCount,
    ...(record.reviewsCount ? { reviewScores: record.reviewScores } : {}),
    image: record.image,
    images: record.images ?? [],
    ...(record.photos?.some((photo: any) => photo.caption) ? { photos: record.photos.map((photo: any) => ({ url: photo.url, ...(photo.caption ? { caption: photo.caption } : {}) })) } : {}),
    description: record.description,
    featured: record.featured,
    ...(latLng(record.coordinates) ? { coordinates: latLng(record.coordinates) } : {}),
    ...(record.stayInfo?.paymentMethods?.length ? { stayInfo: record.stayInfo } : {}),
    breakfastIncluded: (record.homestaySpecs?.meals ?? []).some((meal: any) => meal.type === 'breakfast' && meal.included)
      || (record.hotelSpecs?.amenities ?? []).some((item: string) => BREAKFAST_AMENITY.test(item)),
    ...(record.hotelSpecs ? { hotelSpecs: record.hotelSpecs } : {}),
    ...(record.homestaySpecs ? { homestaySpecs: record.homestaySpecs } : {}),
    ...(record.carSpecs ? { carSpecs: record.carSpecs } : {}),
    ...(record.tourSpecs ? { tourSpecs: record.tourSpecs } : {}),
    ...(record.offerSpecs ? {
      offerSpecs: {
        ...record.offerSpecs,
        ...(record.offerSpecs.expiresAt ? { expiresAt: new Date(record.offerSpecs.expiresAt).toISOString() } : {}),
      },
    } : {}),
  };
}

async function requireDatabase() {
  if (!await connectDatabase()) {
    throw new ServiceUnavailableError('The catalog database is not configured or currently unavailable.');
  }
}

const sortOptions: Record<ListListingsQuery['sort'], Record<string, 1 | -1>> = {
  recommended: { featured: -1, rating: -1, createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { rating: -1, reviewsCount: -1 },
  newest: { createdAt: -1 },
};

/** Guests only see published listings of approved partners (or platform-owned ones). */
async function visibleFilter(type?: string) {
  const approvedVendors = await VendorModel.find({ status: 'approved', deletedAt: null }).distinct('_id');
  return {
    status: 'published', deletedAt: null,
    $and: [{ $or: [{ ownerId: null }, { ownerId: { $in: approvedVendors } }] }] as unknown[],
    ...(type && type !== 'all' ? { type } : {}),
  } as Record<string, unknown>;
}

const CATEGORY_FIELD: Record<string, string> = { hotel: 'hotelSpecs.hotelType', car: 'carSpecs.category' };

export async function listPublishedListings(query: ListListingsQuery) {
  await requireDatabase();
  const filter = await visibleFilter(query.type);
  if (query.featured !== undefined) filter.featured = query.featured;
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i');
    (filter.$and as unknown[]).push({ $or: ['title', 'location', 'description'].map((field) => ({ [field]: pattern })) });
  }
  if (query.location) filter.location = new RegExp(escapeRegex(query.location), 'i');
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    };
  }
  if (query.minRating !== undefined) filter.rating = { $gte: query.minRating };
  if (query.experience) filter['homestaySpecs.experienceType'] = query.experience;
  if (query.transmission) filter['carSpecs.transmission'] = query.transmission;
  // Cars listed before driver modes existed only say withDriver.
  if (query.driver === 'with_driver') (filter.$and as unknown[]).push({ $or: [{ 'carSpecs.driverMode': { $in: ['with_driver', 'both'] } }, { 'carSpecs.driverMode': null, 'carSpecs.withDriver': true }] });
  if (query.driver === 'self_drive') (filter.$and as unknown[]).push({ $or: [{ 'carSpecs.driverMode': { $in: ['self_drive', 'both'] } }, { 'carSpecs.driverMode': null, 'carSpecs.withDriver': false }] });
  if (query.fuelIncluded) filter['carSpecs.fuelIncluded'] = true;
  const categoryField = query.type && CATEGORY_FIELD[query.type];
  if (query.category && categoryField) {
    // Listings without a type/category still show, as on the landing pages before.
    (filter.$and as unknown[]).push({ $or: [{ [categoryField]: new RegExp(escapeRegex(query.category), 'i') }, { [categoryField]: { $in: [null, ''] } }] });
  }
  if (query.breakfast) {
    (filter.$and as unknown[]).push({ $or: [
      { 'homestaySpecs.meals': { $elemMatch: { type: 'breakfast', included: true } } },
      { 'hotelSpecs.amenities': BREAKFAST_AMENITY },
    ] });
  }
  // Homestays created before stay types existed rent rooms.
  if (query.stayType) filter['homestaySpecs.stayType'] = query.stayType === 'entire_home' ? 'entire_home' : { $ne: 'entire_home' };
  if (query.amenities?.length) {
    const wanted = query.amenities.map((amenity) => new RegExp(`^${escapeRegex(amenity)}$`, 'i'));
    (filter.$and as unknown[]).push(...wanted.map((pattern) => ({
      $or: ['hotelSpecs.amenities', 'hotelSpecs.facilities', 'homestaySpecs.amenities']
        .map((field) => ({ [field]: pattern })),
    })));
  }
  if (query.checkIn && query.checkOut) {
    filter._id = { $in: await listingsWithAvailability(query.checkIn, storedEnd(query.type ?? '', query.checkOut), query.guests ?? 1, query.rooms ?? 1) };
  }

  const skip = (query.page - 1) * query.limit;
  const [records, total] = await Promise.all([
    ListingModel.find(filter)
      .sort(sortOptions[query.sort])
      .skip(skip)
      .limit(query.limit)
      .lean(),
    ListingModel.countDocuments(filter),
  ]);

  return {
    data: records.map((record) => toPublicListing(record)),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
}

/** Most-listed towns (the part of the location before the first comma), with a cover image, for "Top destinations". */
export async function topPlaces(type: string, limit: number) {
  await requireDatabase();
  const rows = await ListingModel.aggregate([
    { $match: await visibleFilter(type) },
    { $sort: { featured: -1, rating: -1 } },
    { $group: { _id: { $trim: { input: { $arrayElemAt: [{ $split: ['$location', ','] }, 0] } } }, count: { $sum: 1 }, image: { $first: '$image' } } },
    { $match: { _id: { $ne: '' } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit },
  ]);
  return rows.map((row) => ({ name: row._id as string, count: row.count as number, image: row.image as string }));
}

/** How many listings mention each place in their location (e.g. "Hunza" matches "Altit, Hunza"). */
export async function placeCounts(type: string, places: string[]) {
  await requireDatabase();
  const base = await visibleFilter(type);
  const counts = await Promise.all(places.map((place) => ListingModel.countDocuments({ ...base, location: new RegExp(escapeRegex(place), 'i') })));
  return Object.fromEntries(places.map((place, index) => [place, counts[index]]));
}

/**
 * Listing _ids with at least one active room type that fits the party and is free every night.
 * ponytail: scans all active room types per dated search; add a per-date availability index once the catalog is large.
 */
async function listingsWithAvailability(checkIn: string, checkOut: string, guests: number, rooms: number) {
  const nights = stayNights(checkIn, checkOut);
  const guestsPerRoom = Math.ceil(guests / rooms);
  const roomTypes = await HotelRoomTypeModel.find({
    status: 'active',
    deletedAt: null,
    totalRooms: { $gte: rooms },
    maxAdults: { $gte: guestsPerRoom },
  }).select('listingId totalRooms').lean() as any[];
  const available = await availableRoomCounts(roomTypes, nights);
  return roomTypes
    .filter((room) => (available.get(String(room._id)) ?? 0) >= rooms)
    .map((room) => room.listingId);
}

/** Published listings among the given public IDs, in the given order; unpublished or deleted ones drop out. */
export async function listPublishedListingsByIds(ids: string[]) {
  if (!ids.length) return [];
  await requireDatabase();
  const records = await ListingModel.find({ publicId: { $in: ids }, status: 'published', deletedAt: null }).lean();
  const vendors = new Set((await VendorModel.find({ status: 'approved', deletedAt: null }).distinct('_id')).map(String));
  const byId = new Map(records.filter((record) => !record.ownerId || vendors.has(String(record.ownerId))).map((record) => [record.publicId, toPublicListing(record)]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

export async function getPublishedListing(id: string) {
  await requireDatabase();

  const identity = isValidObjectId(id)
    ? { $or: [{ publicId: id }, { _id: id }] }
    : { publicId: id };
  const record = await ListingModel.findOne({
    ...identity,
    status: 'published',
    deletedAt: null,
  }).lean();

  if (!record) throw new NotFoundError('Listing not found.');
  if (record.ownerId && !await VendorModel.exists({ _id: record.ownerId, status: 'approved', deletedAt: null })) throw new NotFoundError('Listing not found.');
  return toPublicListing(record);
}
