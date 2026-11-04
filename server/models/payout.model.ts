import { randomBytes, randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

/**
 * One statement between GBBookings and a partner: the bookings it settles, frozen when it was created.
 * netMinor > 0: GBBookings pays the partner. netMinor < 0: the partner pays GBBookings the commission.
 */
const payoutSchema = new Schema({
  publicId: { type: String, required: true, unique: true, immutable: true, default: () => `pyt_${randomUUID()}` },
  // Also the commission invoice number.
  reference: { type: String, required: true, unique: true, immutable: true, default: () => `GBP-${randomBytes(4).toString('hex').toUpperCase()}` },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  lines: [{
    _id: false,
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    reference: String, listingTitle: String, checkIn: String, status: String, paymentMethod: String,
    totalMinor: Number, collectedOnlineMinor: Number, refundedMinor: Number, commissionMinor: Number, netMinor: Number,
  }],
  collectedOnlineMinor: { type: Number, required: true },
  refundedMinor: { type: Number, required: true },
  commissionMinor: { type: Number, required: true },
  netMinor: { type: Number, required: true },
  // The account the money was due to at the time.
  bank: { accountTitle: String, bankName: String, iban: String },
  status: { type: String, enum: ['open', 'settled'], default: 'open', index: true },
  settledAt: Date,
  settledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  // The bank transfer reference, either way.
  bankReference: { type: String, trim: true, maxlength: 120 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const PayoutModel: Model<any> = (mongoose.models.Payout as Model<any> | undefined)
  ?? mongoose.model<any>('Payout', payoutSchema);
