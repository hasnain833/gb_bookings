import { z } from 'zod';

const mediaId = z.string().regex(/^med_[0-9a-f-]{36}$/i, 'Invalid media identifier.');
const cleanList = z.array(z.string().trim().min(1).max(100)).max(100).default([]);

export const experienceTypes = ['Mountain View', 'Family Friendly', 'Lakeside Stays', 'Local Culture', 'Budget Friendly'] as const;

const listingFields = z.object({
  type: z.enum(['hotel', 'homestay']).default('hotel'),
  title: z.string().trim().min(2).max(160),
  location: z.string().trim().min(2).max(240),
  description: z.string().trim().min(20).max(10_000),
  price: z.number().int().nonnegative(),
  imageIds: z.array(mediaId).min(1).max(20),
  hotelSpecs: z.object({
    hotelType: z.string().trim().min(2).max(80),
    amenities: cleanList,
    facilities: cleanList,
    policies: cleanList,
    checkInTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    checkOutTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  }).strict(),
  homestaySpecs: z.object({
    hostName: z.string().trim().min(2).max(120),
    experienceType: z.enum(experienceTypes),
  }).strict().optional(),
}).strict();

export const createHotelListingSchema = listingFields.refine(
  (input) => input.type !== 'homestay' || input.homestaySpecs,
  { message: 'Homestays need a host name and experience type.', path: ['homestaySpecs'] },
);

// The listing type is fixed at creation; omitting it also stops its default from applying to partial updates.
export const updateHotelListingSchema = listingFields.omit({ type: true }).partial().strict().refine(
  (input) => Object.keys(input).length > 0,
  { message: 'At least one listing field is required.' },
);

export const listingParamsSchema = z.object({ id: z.string().regex(/^lst_[0-9a-f-]{36}$/i, 'Invalid listing identifier.') }).strict();
export const roomParamsSchema = listingParamsSchema.extend({ roomId: z.string().regex(/^rom_[0-9a-f-]{36}$/i, 'Invalid room identifier.') });

export const roomTypeSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2_000).optional(),
  bedType: z.string().trim().min(2).max(80),
  maxAdults: z.number().int().min(1).max(20),
  maxChildren: z.number().int().min(0).max(20),
  totalRooms: z.number().int().min(1).max(10_000),
  basePrice: z.number().int().nonnegative(),
  amenities: cleanList,
}).strict();

// Re-declare amenities without its default, or every partial update would reset them to [].
export const updateRoomTypeSchema = roomTypeSchema.partial().extend({
  amenities: cleanList.unwrap().optional(),
  status: z.enum(['active', 'paused']).optional(),
}).strict().refine(
  (input) => Object.keys(input).length > 0,
  { message: 'At least one room field is required.' },
);

export const listingDecisionSchema = z.object({
  decision: z.enum(['published', 'rejected']),
  notes: z.string().trim().min(3).max(2_000),
}).strict();
