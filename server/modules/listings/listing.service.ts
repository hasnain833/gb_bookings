import { isValidObjectId } from 'mongoose';
import type { Listing } from '../../../src/types.js';
import { connectDatabase } from '../../database/connection.js';
import { HotelRoomTypeModel } from '../../models/hotel-room-type.model.js';
import { ListingModel } from '../../models/listing.model.js';
import { escapeRegex } from '../../shared/escape-regex.js';
import { availableRoomCounts } from '../bookings/availability.service.js';
import { stayNights } from '../bookings/stay-dates.js';
import { NotFoundError, ServiceUnavailableError } from '../../shared/app-error.js';
import type { ListListingsQuery } from './listing.schemas.js';

type ListingRecord = Record<string, any>;

function toPublicListing(record: ListingRecord): Listing {
  return {
    id: record.publicId,
    type: record.type,
    title: record.title,
    location: record.location,
    price: record.price,
    rating: record.rating,
    reviewsCount: record.reviewsCount,
    image: record.image,
    images: record.images ?? [],
    description: record.description,
    featured: record.featured,
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

export async function listPublishedListings(query: ListListingsQuery) {
  await requireDatabase();

  const filter: Record<string, unknown> = {
    status: 'published',
    deletedAt: null,
  };

  if (query.type && query.type !== 'all') filter.type = query.type;
  if (query.featured !== undefined) filter.featured = query.featured;
  if (query.search) filter.$text = { $search: query.search };
  if (query.location) filter.location = new RegExp(escapeRegex(query.location), 'i');
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    };
  }
  if (query.minRating !== undefined) filter.rating = { $gte: query.minRating };
  if (query.amenities?.length) {
    const wanted = query.amenities.map((amenity) => new RegExp(`^${escapeRegex(amenity)}$`, 'i'));
    filter.$or = ['hotelSpecs.amenities', 'hotelSpecs.facilities', 'homestaySpecs.amenities']
      .map((field) => ({ [field]: { $all: wanted } }));
  }
  if (query.checkIn && query.checkOut) {
    filter._id = { $in: await listingsWithAvailability(query.checkIn, query.checkOut, query.guests ?? 1, query.rooms ?? 1) };
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
    $expr: { $gte: [{ $add: ['$maxAdults', '$maxChildren'] }, guestsPerRoom] },
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
  const byId = new Map(records.map((record) => [record.publicId, toPublicListing(record)]));
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
  return toPublicListing(record);
}
