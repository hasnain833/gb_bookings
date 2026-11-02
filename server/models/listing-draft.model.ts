import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

/**
 * An unfinished "Add a property" wizard, saved on every step so the partner can resume on any device.
 * `data` is the wizard's own state; it is only read back by its author and fully validated when the listing is created.
 * One per user and kind; drafts untouched for 90 days are removed.
 */
const listingDraftSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  kind: { type: String, enum: ['hotel', 'homestay', 'car', 'tour'], required: true },
  step: { type: Number, min: 0, max: 20, default: 0 },
  data: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true, minimize: false });

listingDraftSchema.index({ userId: 1, kind: 1 }, { unique: true });
listingDraftSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

export const ListingDraftModel: Model<any> = (mongoose.models.ListingDraft as Model<any> | undefined)
  ?? mongoose.model<any>('ListingDraft', listingDraftSchema);
