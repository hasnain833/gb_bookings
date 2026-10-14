import { z } from 'zod';
import { bookingStatuses, paymentMethods } from '../../models/booking.model.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD date format.');

export const availabilityQuerySchema = z.object({
  checkIn: isoDate,
  checkOut: isoDate,
  adults: z.coerce.number().int().min(1).max(40).default(2),
  children: z.coerce.number().int().min(0).max(40).default(0),
  rooms: z.coerce.number().int().min(1).max(20).default(1),
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
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
}).strict();

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
