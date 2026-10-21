import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

// One document (key "platform") holding the admin-set money rules. See modules/settings/settings.service.ts.
const platformSettingSchema = new Schema({
  key: { type: String, required: true, unique: true, immutable: true },
  // GBBookings' cut of every booking, in percent.
  commissionPercent: { type: Number, required: true, min: 0, max: 50 },
  // When a guest cancels a paid booking: the refund for cancelling within N hours of booking, first match wins.
  refundTiers: {
    type: [new Schema({ withinHours: { type: Number, min: 1 }, refundPercent: { type: Number, min: 0, max: 100 } }, { _id: false })],
    default: [],
  },
  // Refund for cancelling later than every tier.
  laterRefundPercent: { type: Number, required: true, min: 0, max: 100 },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const PlatformSettingModel: Model<any> = (mongoose.models.PlatformSetting as Model<any> | undefined)
  ?? mongoose.model<any>('PlatformSetting', platformSettingSchema);
