import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

// Booking.com-style categories on the site's 5-star scale. WiFi is optional (not every stay has it).
export const REVIEW_CATEGORIES = ['staff', 'cleanliness', 'comfort', 'value', 'location', 'wifi'] as const;
export type ReviewCategory = typeof REVIEW_CATEGORIES[number];

const star = { type: Number, min: 1, max: 5 };

const reviewSchema = new Schema({
  publicId: { type: String, required: true, unique: true, immutable: true, default: () => `rev_${randomUUID()}` },
  // One review per stay; only the guest who booked it can write it.
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  bookingPublicId: { type: String, required: true, index: true },
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // Shown publicly, e.g. "Ayesha K."; snapshots so later profile edits don't change old reviews.
  authorName: { type: String, required: true, trim: true, maxlength: 80 },
  stayMonth: { type: String, match: /^\d{4}-\d{2}$/ },
  roomName: { type: String, trim: true, maxlength: 120 },
  overall: { ...star, required: true },
  scores: Object.fromEntries(REVIEW_CATEGORIES.map((key) => [key, key === 'wifi' ? star : { ...star, required: true }])),
  liked: { type: String, trim: true, maxlength: 2_000 },
  disliked: { type: String, trim: true, maxlength: 2_000 },
  reply: {
    text: { type: String, trim: true, maxlength: 2_000 },
    at: Date,
    by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  // Reviews publish at once; the admin can hide one (abuse, fake, personal data) and restore it.
  status: { type: String, enum: ['published', 'hidden'], default: 'published' },
  hiddenReason: { type: String, trim: true, maxlength: 1_000 },
  report: {
    reason: { type: String, trim: true, maxlength: 1_000 },
    at: Date,
    by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
}, { timestamps: true });

reviewSchema.index({ listingId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ 'report.at': -1 });

export const ReviewModel: Model<any> = (mongoose.models.Review as Model<any> | undefined)
  ?? mongoose.model<any>('Review', reviewSchema);
