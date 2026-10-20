import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

// Partner-made promo codes. Guests pay at the property, so the partner gives (and absorbs) the discount.
const couponSchema = new Schema({
  publicId: { type: String, required: true, unique: true, immutable: true, default: () => `cpn_${randomUUID()}` },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  code: { type: String, required: true, uppercase: true, trim: true, match: /^[A-Z0-9-]{3,20}$/, immutable: true },
  kind: { type: String, enum: ['percent', 'amount'], required: true, immutable: true },
  // Percent 1–90, or PKR off the stay total (minor units).
  value: { type: Number, required: true, min: 1, immutable: true },
  // Last day the code can be used to book (Pakistan date); none = no end.
  validUntil: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
  maxUses: { type: Number, min: 1 },
  // Live bookings using the code; a cancellation gives its use back.
  uses: { type: Number, required: true, min: 0, default: 0 },
  active: { type: Boolean, required: true, default: true },
}, { timestamps: true });

couponSchema.index({ vendorId: 1, code: 1 }, { unique: true });

export const CouponModel: Model<any> = (mongoose.models.Coupon as Model<any> | undefined)
  ?? mongoose.model<any>('Coupon', couponSchema);
