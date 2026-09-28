import { z } from 'zod';

const mediaId = z.string().regex(/^med_[0-9a-f-]{36}$/i, 'Invalid media identifier.');
const cleanList = z.array(z.string().trim().min(1).max(100)).max(100).default([]);

export const createHotelListingSchema = z.object({
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
}).strict();

export const updateHotelListingSchema = createHotelListingSchema.partial().strict().refine(
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

export const updateRoomTypeSchema = roomTypeSchema.partial().strict().refine(
  (input) => Object.keys(input).length > 0,
  { message: 'At least one room field is required.' },
);

export const listingDecisionSchema = z.object({
  decision: z.enum(['published', 'rejected']),
  notes: z.string().trim().min(3).max(2_000),
}).strict();
