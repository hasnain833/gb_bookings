import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

const itineraryItemSchema = new Schema({
  day: { type: Number, required: true, min: 1 },
  title: { type: String, required: true, trim: true },
  desc: { type: String, required: true, trim: true },
}, { _id: false });

const listingSchema = new Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    default: () => `lst_${randomUUID()}`,
  },
  ownerId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
  type: {
    type: String,
    enum: ['hotel', 'car', 'tour', 'homestay', 'destination', 'offer'],
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, trim: true, lowercase: true },
  location: { type: String, required: true, trim: true, maxlength: 240 },
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined },
  },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ['PKR'], default: 'PKR' },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewsCount: { type: Number, min: 0, default: 0 },
  image: { type: String, required: true, trim: true },
  images: { type: [String], default: [] },
  description: { type: String, required: true, trim: true, maxlength: 10_000 },
  featured: { type: Boolean, default: false, index: true },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'published', 'rejected', 'paused', 'archived'],
    default: 'draft',
    index: true,
  },
  hotelSpecs: {
    roomsAvailable: { type: Number, min: 0 },
    amenities: { type: [String], default: undefined },
    hotelType: String,
  },
  homestaySpecs: {
    roomsAvailable: { type: Number, min: 0 },
    amenities: { type: [String], default: undefined },
    houseRules: { type: [String], default: undefined },
    hostName: String,
    hostImage: String,
    experienceType: String,
  },
  carSpecs: {
    category: String,
    transmission: { type: String, enum: ['Automatic', 'Manual'] },
    seats: { type: Number, min: 1 },
    fuelType: String,
    withDriver: Boolean,
  },
  tourSpecs: {
    durationDays: { type: Number, min: 1 },
    maxGroupSize: { type: Number, min: 1 },
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'] },
    included: { type: [String], default: undefined },
    itinerary: { type: [itineraryItemSchema], default: undefined },
  },
  offerSpecs: {
    category: String,
    discountLabel: String,
    promoCode: String,
    originalPrice: { type: Number, min: 0 },
    perks: { type: [String], default: undefined },
    expiresAt: Date,
  },
  deletedAt: { type: Date, default: null, index: true },
}, {
  timestamps: true,
  minimize: true,
});

listingSchema.index({ title: 'text', location: 'text', description: 'text' });
listingSchema.index({ type: 1, status: 1, featured: -1, createdAt: -1 });
listingSchema.index({ coordinates: '2dsphere' }, { sparse: true });

export const ListingModel: Model<any> = (mongoose.models.Listing as Model<any> | undefined)
  ?? mongoose.model<any>('Listing', listingSchema);
