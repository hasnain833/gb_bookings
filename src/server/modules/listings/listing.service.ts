import { isValidObjectId } from 'mongoose';
import type { Listing } from '../../../types.js';
import { connectDatabase } from '../../database/connection.js';
import { ListingModel } from '../../models/listing.model.js';
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
