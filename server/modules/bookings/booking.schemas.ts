import { z } from 'zod';
import { bookingStatuses, paymentMethods } from '../../models/booking.model.js';
import { couponCodeSchema } from '../coupons/coupon.routes.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD date format.');
const boolFlag = z.enum(['true', 'false']).transform((value) => value === 'true').optional();
const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a HH:MM time.');

/** Car rental details at checkout. Self-drive renters give their driving licence number. */
export const rentalInputSchema = z.object({
  driver: z.boolean(),
  pickupPlace: z.string().trim().min(2).max(200),
  pickupTime: clockTime,
  dropoffPlace: z.string().trim().min(2).max(200).optional(),
  outsideBaseCity: z.boolean().default(false),
  oneWay: z.boolean().default(false),
  licenceNumber: z.string().trim().min(5).max(30).optional(),
}).strict();

export const availabilityQuerySchema = z.object({
  checkIn: isoDate,
  checkOut: isoDate,
  adults: z.coerce.number().int().min(1).max(40).default(2),
  children: z.coerce.number().int().min(0).max(40).default(0),
  rooms: z.coerce.number().int().min(1).max(20).default(1),
  // Comma-separated extra meals to include in the quote, e.g. "dinner" or "lunch,dinner".
  meals: z.string().trim().max(40).transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
    .pipe(z.array(z.enum(['breakfast', 'lunch', 'dinner'])).max(3)).optional(),
  coupon: couponCodeSchema.optional(),
  // Car rentals: checkOut is the return date (included), adults are passengers, rooms are cars.
  driver: boolFlag,
  outsideBaseCity: boolFlag,
  oneWay: boolFlag,
}).strict();

export const createBookingSchema = z.object({
  listingId: z.string().trim().min(1).max(120),
  roomTypeId: z.string().regex(/^rom_[0-9a-f-]{36}$/i, 'Invalid room identifier.'),
  checkIn: isoDate,
  checkOut: isoDate,
  rooms: z.number().int().min(1).max(20).default(1),
  adults: z.number().int().min(1).max(40),
  children: z.number().int().min(0).max(40).default(0),
  guest: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email(),
    phone: z.string().trim().min(7).max(30),
  }).strict(),
  // Online payment providers arrive in a later phase; Phase 1 settles at the property.
  paymentMethod: z.enum(paymentMethods)
    .refine((method) => method === 'pay_at_hotel', 'Only pay-at-hotel is available right now.')
    .default('pay_at_hotel'),
  specialRequests: z.string().trim().max(1_000).optional(),
  meals: z.array(z.enum(['breakfast', 'lunch', 'dinner'])).max(3).default([])
    .refine((meals) => new Set(meals).size === meals.length, 'Choose each meal once.'),
  couponCode: couponCodeSchema.optional(),
  rental: rentalInputSchema.optional(),
  expectedTotalMinor: z.number().int().nonnegative().optional(),
}).strict();

export const bookingIdParamsSchema = z.object({
  id: z.string().regex(/^bkg_[0-9a-f-]{36}$/i, 'Invalid booking identifier.'),
}).strict();

export const cancelBookingSchema = z.object({
  reason: z.string().trim().min(3).max(1_000),
}).strict();

export const vendorBookingActionSchema = z.object({
  action: z.enum(['confirm', 'cancel', 'complete', 'no_show', 'mark_paid', 'check_in']),
  reason: z.string().trim().max(1_000).optional(),
}).strict().refine((input) => input.action !== 'cancel' || (input.reason?.length ?? 0) >= 3, {
  message: 'A reason is required to cancel a booking.',
  path: ['reason'],
});

export const listBookingsQuerySchema = z.object({
  status: z.enum(bookingStatuses).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  q: z.string().trim().min(2).max(100).optional(),
  listingId: z.string().regex(/^lst_[0-9a-f-]{36}$/i).optional(),
  // Reception views: guests due today (not yet checked in) and guests currently checked in.
  stay: z.enum(['arriving', 'in_house']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
}).strict();

export const vendorReportQuerySchema = z.object({ from: isoDate, to: isoDate }).strict()
  .refine((input) => input.from <= input.to, { message: 'The start date must be on or before the end date.', path: ['to'] })
  .refine((input) => Date.parse(input.to) - Date.parse(input.from) <= 366 * 86_400_000, { message: 'Reports cover at most one year.', path: ['to'] });

// Dates, room category and room count of an upcoming booking; the price is re-quoted at today's rate.
export const changeBookingSchema = z.object({
  checkIn: isoDate,
  checkOut: isoDate,
  roomTypeId: z.string().regex(/^rom_[0-9a-f-]{36}$/i, 'Invalid room identifier.'),
  rooms: z.number().int().min(1).max(20),
}).strict();

export const bookingReferenceQuerySchema = z.object({
  reference: z.string().trim().toUpperCase().regex(/^GB-[0-9A-F]{8}$/, 'Enter a reference like GB-1A2B3C4D.'),
}).strict();

export const adminCancelBookingSchema = z.object({ reason: z.string().trim().min(3).max(900) }).strict();

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
