import { z } from 'zod';

const mediaId = z.string().regex(/^med_[0-9a-f-]{36}$/i, 'Invalid media identifier.');
const cleanList = z.array(z.string().trim().min(1).max(100)).max(100).default([]);
// A photo is either a new upload (mediaId) or one the listing/room already has (url). Order matters: first is the cover.
const photo = z.object({
  mediaId: mediaId.optional(),
  url: z.string().trim().url().max(2_000).optional(),
  caption: z.string().trim().max(200).optional(),
}).strict().refine((value) => Boolean(value.mediaId) !== Boolean(value.url), { message: 'Give either mediaId or url for each photo.' });

export const experienceTypes = ['Mountain View', 'Family Friendly', 'Lakeside Stays', 'Local Culture', 'Budget Friendly'] as const;

export const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;

const homestaySpecs = z.object({
  hostName: z.string().trim().min(2).max(120),
  experienceType: z.enum(experienceTypes),
  stayType: z.enum(['rooms', 'entire_home']).default('rooms'),
  hostBio: z.string().trim().max(1_000).optional(),
  hostPhoto: photo.optional(),
  languages: cleanList,
  familyOnSite: z.boolean().default(false),
  meals: z.array(z.object({
    type: z.enum(mealTypes),
    included: z.boolean(),
    price: z.number().int().min(0).max(100_000),
  }).strict()).max(3).default([])
    .refine((meals) => new Set(meals.map((meal) => meal.type)).size === meals.length, 'List each meal once.'),
}).strict();

export const carCategories = ['Sedan', 'Hatchback', 'SUV', '4x4 Jeep', 'Van', 'Coaster'] as const;
const pkr = z.number().int().min(0).max(1_000_000);

// What a car is and its rental terms (PKR). The daily rate and fleet count live on the car's single booking unit.
export const carSpecsSchema = z.object({
  make: z.string().trim().min(2).max(60),
  model: z.string().trim().min(1).max(60),
  year: z.number().int().min(1980).max(2100),
  category: z.enum(carCategories),
  transmission: z.enum(['Automatic', 'Manual']),
  fuelType: z.enum(['Petrol', 'Diesel', 'Hybrid', 'Electric']),
  seats: z.number().int().min(1).max(40),
  luggage: z.number().int().min(0).max(40).optional(),
  features: cleanList,
  driverMode: z.enum(['with_driver', 'self_drive', 'both']),
  // Added per day when the guest rents with a driver; 0 when the daily rate already includes one.
  driverPerDay: pkr.default(0),
  fuelIncluded: z.boolean(),
  // Added per day when the trip leaves the base city (the listing location); absent = same price everywhere.
  outsideCityPerDay: pkr.optional(),
  oneWay: z.enum(['not_offered', 'flat', 'on_request']),
  oneWayFee: pkr.optional(),
  // Self-drive only: refundable deposit paid at pickup, and the youngest driver accepted.
  deposit: pkr.optional(),
  minDriverAge: z.number().int().min(18).max(30).optional(),
  pickupNote: z.string().trim().max(500).optional(),
}).strict()
  .refine((specs) => specs.oneWay !== 'flat' || specs.oneWayFee !== undefined, { message: 'Set the one-way drop-off fee.', path: ['oneWayFee'] })
  .refine((specs) => specs.driverMode === 'with_driver' || specs.minDriverAge !== undefined, { message: 'Set the minimum age for self-drive renters.', path: ['minDriverAge'] });

export const stayInfoSchema = z.object({
  childrenAllowed: z.boolean(),
  minCheckInAge: z.number().int().min(0).max(30).optional(),
  extraBedPrice: z.number().int().min(0).max(100_000).optional(),
  petsAllowed: z.boolean(),
  smokingAllowed: z.boolean(),
  paymentMethods: z.array(z.enum(['cash', 'card', 'jazzcash', 'easypaisa', 'bank_transfer'])).min(1, 'Choose at least one way guests can pay.').max(5),
  powerBackup: z.array(z.enum(['generator', 'solar', 'ups'])).max(3).default([]),
  heating: z.array(z.enum(['electric', 'gas', 'wood', 'central'])).max(4).default([]),
  hotWater: z.enum(['always', 'scheduled', 'on_request', 'none']),
  mobileNetworks: z.array(z.enum(['scom', 'zong', 'jazz', 'telenor', 'ufone'])).max(5).default([]),
  roadAccess: z.enum(['car', 'jeep', 'walk']),
  roadNote: z.string().trim().max(300).optional(),
  openMonths: z.array(z.number().int().min(1).max(12)).min(1, 'Choose the months you receive guests.').max(12)
    .refine((months) => new Set(months).size === months.length, 'List each month once.'),
}).strict();

const listingFields = z.object({
  type: z.enum(['hotel', 'homestay', 'car']).default('hotel'),
  title: z.string().trim().min(2).max(160),
  location: z.string().trim().min(2).max(240),
  description: z.string().trim().min(20).max(10_000),
  price: z.number().int().nonnegative(),
  imageIds: z.array(mediaId).min(1).max(20),
  photos: z.array(photo).min(1).max(20).optional(),
  hotelSpecs: z.object({
    hotelType: z.string().trim().min(2).max(80),
    amenities: cleanList,
    facilities: cleanList,
    policies: cleanList,
    checkInTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    checkOutTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  }).strict().optional(),
  carSpecs: carSpecsSchema.optional(),
  homestaySpecs: homestaySpecs.optional(),
  // Cars only say how guests can pay at pickup; hotels and homestays fill in the full policies.
  stayInfo: z.union([stayInfoSchema, stayInfoSchema.pick({ paymentMethods: true }).strict()]).optional(),
  // Map pin, e.g. from a pasted Google Maps link. Pakistan sits well inside these bounds.
  coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).strict().optional(),
}).strict();

export const createHotelListingSchema = listingFields.refine(
  (input) => input.type !== 'homestay' || input.homestaySpecs,
  { message: 'Homestays need a host name and experience type.', path: ['homestaySpecs'] },
).refine((input) => input.type === 'car' || input.hotelSpecs, { message: 'Add the property details.', path: ['hotelSpecs'] })
  .refine((input) => input.type !== 'car' || input.carSpecs, { message: 'Add the car details.', path: ['carSpecs'] });

// The listing type and a homestay's stay type are fixed at creation; omitting type also stops its default from applying to partial updates.
export const updateHotelListingSchema = listingFields.omit({ type: true }).extend({ homestaySpecs: homestaySpecs.omit({ stayType: true }).optional() }).partial().strict().refine(
  (input) => Object.keys(input).length > 0,
  { message: 'At least one listing field is required.' },
);

export const listingParamsSchema = z.object({ id: z.string().regex(/^lst_[0-9a-f-]{36}$/i, 'Invalid listing identifier.') }).strict();
export const roomParamsSchema = listingParamsSchema.extend({ roomId: z.string().regex(/^rom_[0-9a-f-]{36}$/i, 'Invalid room identifier.') });

export const roomTypeSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2_000).optional(),
  bedType: z.string().trim().min(2).max(80),
  maxAdults: z.number().int().min(1).max(40),
  maxChildren: z.number().int().min(0).max(20),
  totalRooms: z.number().int().min(1).max(10_000),
  basePrice: z.number().int().nonnegative(),
  amenities: cleanList,
  photos: z.array(photo).max(10).optional(),
}).strict();

// Re-declare amenities without its default, or every partial update would reset them to [].
export const updateRoomTypeSchema = roomTypeSchema.partial().extend({
  amenities: cleanList.unwrap().optional(),
  status: z.enum(['active', 'paused']).optional(),
}).strict().refine(
  (input) => Object.keys(input).length > 0,
  { message: 'At least one room field is required.' },
);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD dates.');
export const roomCalendarQuerySchema = z.object({ from: isoDate, to: isoDate }).strict();
export const roomClosureSchema = z.object({ from: isoDate, to: isoDate, closed: z.number().int().min(0).max(10_000) }).strict();

export const listingStatusSchema = z.object({ status: z.enum(['paused', 'published']) }).strict();

export const adminListingsQuerySchema = z.object({
  status: z.enum(['all', 'draft', 'submitted', 'published', 'paused', 'rejected', 'archived', 'revisions']).default('submitted'),
  q: z.string().trim().min(2).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

export const listingDecisionSchema = z.object({
  decision: z.enum(['published', 'rejected']),
  notes: z.string().trim().min(3).max(2_000),
}).strict();

export const revisionDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().trim().min(3).max(2_000),
}).strict();
