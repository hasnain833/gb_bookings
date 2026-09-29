import { randomBytes, randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

export const bookingStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'] as const;
export type BookingStatus = typeof bookingStatuses[number];
export const paymentMethods = ['pay_at_hotel', 'card', 'jazzcash', 'easypaisa'] as const;

const statusEventSchema = new Schema({
  status: { type: String, enum: bookingStatuses, required: true },
  at: { type: Date, required: true, default: Date.now },
  by: { type: Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, trim: true, maxlength: 1_000 },
}, { _id: false });

const bookingSchema = new Schema({
  publicId: { type: String, required: true, unique: true, immutable: true, default: () => `bkg_${randomUUID()}` },
  reference: {
    type: String, required: true, unique: true, immutable: true,
    default: () => `GB-${randomBytes(4).toString('hex').toUpperCase()}`,
  },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
  roomTypeId: { type: Schema.Types.ObjectId, ref: 'HotelRoomType', required: true },
  // Immutable snapshots so later listing edits never change past bookings.
  listingSnapshot: {
    publicId: String, type: { type: String }, title: String, image: String, location: String,
    checkInTime: String, checkOutTime: String,
  },
  roomSnapshot: { publicId: String, name: String, bedType: String },
  checkIn: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  checkOut: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  nights: { type: Number, required: true, min: 1 },
  rooms: { type: Number, required: true, min: 1 },
  adults: { type: Number, required: true, min: 1 },
  children: { type: Number, required: true, min: 0, default: 0 },
  guest: {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
  },
  specialRequests: { type: String, trim: true, maxlength: 1_000 },
  pricing: {
    currency: { type: String, enum: ['PKR'], default: 'PKR' },
    nightlyRateMinor: { type: Number, required: true, min: 0 },
    subtotalMinor: { type: Number, required: true, min: 0 },
    totalMinor: { type: Number, required: true, min: 0 },
  },
  paymentMethod: { type: String, enum: paymentMethods, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  status: { type: String, enum: bookingStatuses, default: 'pending', index: true },
  statusHistory: { type: [statusEventSchema], default: [] },
  idempotencyKey: { type: String, maxlength: 100 },
}, { timestamps: true });

bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ vendorId: 1, status: 1, checkIn: 1 });
bookingSchema.index(
  { customerId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);

export const BookingModel: Model<any> = (mongoose.models.Booking as Model<any> | undefined)
  ?? mongoose.model<any>('Booking', bookingSchema);
