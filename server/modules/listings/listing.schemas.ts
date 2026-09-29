import { z } from 'zod';

export const listingTypeSchema = z.enum(['hotel', 'car', 'tour', 'homestay', 'destination', 'offer']);

export const listListingsQuerySchema = z.object({
  type: z.union([listingTypeSchema, z.literal('all')]).optional(),
  search: z.string().trim().max(120).optional(),
  featured: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  sort: z.enum(['recommended', 'price-asc', 'price-desc', 'rating', 'newest']).default('recommended'),
  location: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  // Comma-separated, e.g. "WiFi,Parking". Matches hotel/homestay amenities and facilities.
  amenities: z.string().trim().max(500).transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean)).optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  guests: z.coerce.number().int().min(1).max(40).optional(),
  rooms: z.coerce.number().int().min(1).max(20).optional(),
}).refine((query) => Boolean(query.checkIn) === Boolean(query.checkOut), {
  message: 'checkIn and checkOut must be provided together.', path: ['checkOut'],
}).refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
  message: 'minPrice cannot exceed maxPrice.', path: ['minPrice'],
});

export const listingIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(120),
});

const baseListingSchema = z.object({
  id: z.string().trim().min(1).optional(),
  type: listingTypeSchema,
  title: z.string().trim().min(2).max(160),
  location: z.string().trim().min(2).max(240),
  price: z.number().nonnegative(),
  currency: z.literal('PKR').default('PKR'),
  rating: z.number().min(0).max(5).default(0),
  reviewsCount: z.number().int().nonnegative().default(0),
  image: z.string().url(),
  images: z.array(z.string().url()).default([]),
  description: z.string().trim().min(10).max(10_000),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'submitted', 'published', 'rejected', 'paused', 'archived']).default('published'),
  hotelSpecs: z.object({
    roomsAvailable: z.number().int().nonnegative(),
    amenities: z.array(z.string()),
    hotelType: z.string(),
  }).optional(),
  homestaySpecs: z.object({
    roomsAvailable: z.number().int().nonnegative(),
    amenities: z.array(z.string()),
    houseRules: z.array(z.string()),
    hostName: z.string(),
    hostImage: z.string(),
    experienceType: z.string(),
  }).optional(),
  carSpecs: z.object({
    category: z.string(),
    transmission: z.enum(['Automatic', 'Manual']),
    seats: z.number().int().positive(),
    fuelType: z.string(),
    withDriver: z.boolean(),
  }).optional(),
  tourSpecs: z.object({
    durationDays: z.number().int().positive(),
    maxGroupSize: z.number().int().positive(),
    difficulty: z.enum(['Easy', 'Moderate', 'Challenging']),
    included: z.array(z.string()),
    itinerary: z.array(z.object({
      day: z.number().int().positive(),
      title: z.string(),
      desc: z.string(),
    })),
  }).optional(),
  offerSpecs: z.object({
    category: z.string(),
    discountLabel: z.string(),
    promoCode: z.string().optional(),
    originalPrice: z.number().nonnegative().optional(),
    perks: z.array(z.string()).optional(),
    expiresAt: z.string().datetime().optional(),
  }).optional(),
});

export const listingSeedSchema = z.array(baseListingSchema);
export type ListListingsQuery = z.infer<typeof listListingsQuerySchema>;
