import { CANCELLATION_POLICY_KEYS } from '../../src/shared/utils/cancellation.js';
import { randomBytes, randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

export const bookingStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'] as const;
export type BookingStatus = typeof bookingStatuses[number];
// 'online' is Pay now through Safepay; 'pay_at_hotel' is Pay on arrival. Card/wallet values are unused leftovers.
export const paymentMethods = ['pay_at_hotel', 'online', 'card', 'jazzcash', 'easypaisa'] as const;

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
    // Business phone at booking time; shown to the guest once the stay is confirmed.
    phone: String,
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
  arrivalTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  childAges: { type: [Number], default: undefined },
  // Confirmed with nothing paid and nobody at the partner having looked: counts towards the guest's open bookings.
  instantConfirmed: { type: Boolean },
  // Homestay meals chosen at booking; price per guest per night, snapshotted.
  meals: {
    type: [new Schema({ type: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true }, priceMinor: { type: Number, required: true, min: 0 } }, { _id: false })],
    default: undefined,
  },
  pricing: {
    currency: { type: String, enum: ['PKR'], default: 'PKR' },
    nightlyRateMinor: { type: Number, required: true, min: 0 },
    subtotalMinor: { type: Number, required: true, min: 0 },
    mealsMinor: { type: Number, min: 0, default: 0 },
    // Partner promo code discount, taken off room + meals.
    discountMinor: { type: Number, min: 0, default: 0 },
    // Car rentals: driver, out-of-city and one-way charges.
    extrasMinor: { type: Number, min: 0, default: 0 },
    totalMinor: { type: Number, required: true, min: 0 },
    // Partner fees and admin-set taxes, with their rates, so a change re-quotes this booking at the terms it was made under.
    charges: {
      type: [new Schema({ name: String, type: { type: String, enum: ['fee', 'tax'] }, kind: { type: String, enum: ['percent', 'amount'] }, rate: Number, amountMinor: Number }, { _id: false })],
      default: undefined,
    },
    feesMinor: { type: Number, min: 0, default: 0 },
    taxesMinor: { type: Number, min: 0, default: 0 },
    // A paid booking changed to cost more: the part the partner collects on arrival. Never reached GBBookings.
    balanceDueMinor: { type: Number, min: 0, default: 0 },
    // GBBookings' commission: the admin-set percent at booking time, and the amount (re-worked on a change or cancellation).
    commissionPercent: { type: Number, min: 0, default: 0 },
    commissionMinor: { type: Number, min: 0, default: 0 },
  },
  // Set when a paid booking is cancelled: what the guest gets back (see bookings refund rules in modules/settings).
  refund: { type: new Schema({ percent: Number, amountMinor: Number }, { _id: false }), default: undefined },
  // Each sum owed back to the guest. 'safepay' goes back through the gateway; 'partner' is money the partner collected and returns.
  // 'sending' stays in place if the result was never heard, so nobody can pay it twice by retrying blindly.
  refunds: {
    type: [new Schema({
      kind: { type: String, enum: ['cancellation', 'change', 'late_payment', 'duplicate_payment'], required: true },
      // Only on a duplicate payment: the extra payment this refund returns.
      tracker: String,
      channel: { type: String, enum: ['safepay', 'partner'], required: true },
      amountMinor: { type: Number, required: true, min: 1 },
      status: { type: String, enum: ['pending', 'sending', 'sent', 'failed'], default: 'pending' },
      lastError: { type: String, maxlength: 500 },
      note: { type: String, maxlength: 500 },
      sentAt: Date,
      sentBy: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
    })],
    default: undefined,
  },
  // The policy at booking time. Absent on older bookings, which keep the refund tiers they were sold under.
  cancellationPolicy: { type: String, enum: CANCELLATION_POLICY_KEYS },
  // A guest's request to move the booking; the partner accepts or declines.
  changeRequest: {
    type: new Schema({
      checkIn: String, checkOut: String, roomTypeId: String, roomName: String, rooms: Number, note: { type: String, maxlength: 500 },
      status: { type: String, enum: ['pending', 'declined'], default: 'pending' },
      // Set when the partner proposes the change and the guest has to answer.
      proposedBy: { type: String, enum: ['partner'] }, reason: { type: String, maxlength: 300 }, newTotalMinor: Number,
      declineReason: { type: String, maxlength: 500 },
      requestedAt: Date,
    }, { _id: false }),
    default: undefined,
  },
  // The latest change made to the booking, so the guest can see what happened and why.
  lastChange: {
    type: new Schema({
      at: Date, askedByGuest: Boolean, reason: { type: String, maxlength: 300 },
      from: new Schema({ checkIn: String, checkOut: String, roomName: String, rooms: Number, totalMinor: Number }, { _id: false }),
    }, { _id: false }),
    default: undefined,
  },
  // Set when the partner marks a no-show. The partner is not settled until the guest's time to dispute has passed.
  noShow: {
    type: new Schema({
      at: Date, disputeUntil: Date,
      dispute: new Schema({
        status: { type: String, enum: ['open', 'no_show_stands', 'guest_stayed', 'refund_guest'] },
        note: { type: String, maxlength: 1000 }, at: Date,
        decidedAt: Date, decidedBy: { type: Schema.Types.ObjectId, ref: 'User' }, decisionNote: { type: String, maxlength: 1000 },
      }, { _id: false }),
    }, { _id: false }),
    default: undefined,
  },
  balanceCollectedAt: { type: Date },
  // The partner statement this booking was settled on.
  payoutId: { type: Schema.Types.ObjectId, ref: 'Payout', index: true },
  reminderSentAt: { type: Date },
  reviewInviteSentAt: { type: Date },
  // Car rentals: where and when the guest takes the car, and the car's terms at booking time (minor units).
  // `checkOut` is the day after the return date, so rented days count like hotel nights (see bookings/rental.ts).
  rental: {
    type: new Schema({
      pickupPlace: { type: String, trim: true, maxlength: 200 },
      pickupTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
      dropoffPlace: { type: String, trim: true, maxlength: 200 },
      licenceNumber: { type: String, trim: true, maxlength: 30 },
      driver: Boolean,
      driverPerDayMinor: Number,
      outsideBaseCity: Boolean,
      outsidePerDayMinor: Number,
      oneWay: Boolean,
      oneWayOnRequest: Boolean,
      oneWayFeeMinor: Number,
      fuelIncluded: Boolean,
      depositMinor: Number,
      driverAge: Number,
      kmPerDay: Number,
      extraPerKmMinor: Number,
      extras: { type: [new Schema({ name: String, priceMinor: Number, perDay: Boolean }, { _id: false })], default: undefined },
    }, { _id: false }),
    default: undefined,
  },
  // Tours: the tour's terms at booking time. Seats are reserved on the start date only (`checkOut` is the day after it);
  // `days` gives the end date guests see (see bookings/tour.ts).
  tour: {
    type: new Schema({
      days: Number,
      childPriceMinor: Number,
      meetingPoint: { type: String, trim: true, maxlength: 300 },
      startTime: String,
    }, { _id: false }),
    default: undefined,
  },
  // Promo code terms at booking time, so a re-quote applies the same deal.
  coupon: { type: new Schema({ code: String, kind: { type: String, enum: ['percent', 'amount'] }, value: Number }, { _id: false }), default: undefined },
  paymentMethod: { type: String, enum: paymentMethods, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paidAt: { type: Date },
  paymentCollectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  // Pay now: every Safepay tracker opened for this booking (a retry opens a new one) and the one that was paid.
  onlinePayment: { type: new Schema({ trackers: [String], paidTracker: String, duplicateTrackers: [String] }, { _id: false }), default: undefined },
  // Arrival is a fact about a confirmed stay, not a status: the booking stays "confirmed" until completed.
  checkedInAt: { type: Date },
  checkedInBy: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: bookingStatuses, default: 'pending', index: true },
  statusHistory: { type: [statusEventSchema], default: [] },
  idempotencyKey: { type: String, maxlength: 100 },
  requestHash: { type: String },
}, { timestamps: true });

bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ 'refunds.status': 1 }, { sparse: true });
bookingSchema.index({ 'onlinePayment.trackers': 1 }, { sparse: true });
bookingSchema.index({ status: 1, checkOut: 1 });
bookingSchema.index({ 'noShow.dispute.status': 1 }, { sparse: true });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ vendorId: 1, status: 1, checkIn: 1 });
bookingSchema.index(
  { customerId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);

export const BookingModel: Model<any> = (mongoose.models.Booking as Model<any> | undefined)
  ?? mongoose.model<any>('Booking', bookingSchema);
