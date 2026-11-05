import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';
import { photoSchema } from './listing.model.js';

const { Schema } = mongoose;

const bedSchema = new Schema({ kind: { type: String, required: true }, count: { type: Number, required: true, min: 1, max: 20 } }, { _id: false });

const hotelRoomTypeSchema = new Schema({
  publicId: { type: String, required: true, unique: true, immutable: true, default: () => `rom_${randomUUID()}` },
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2_000 },
  // Short bed line shown to guests; built from `beds` / `bedrooms` when those are given (see src/shared/utils/rooms.ts).
  bedType: { type: String, required: true, trim: true, maxlength: 80 },
  // Hotels and homestays: what the unit is, its beds and bathroom. Entire places use bedrooms / bathrooms / cots.
  roomType: { type: String },
  beds: { type: [bedSchema], default: undefined },
  bedrooms: { type: [new Schema({ beds: { type: [bedSchema], default: [] } }, { _id: false })], default: undefined },
  bathroom: { type: String, enum: ['private', 'shared'] },
  bathroomItems: { type: [String], default: undefined },
  bathrooms: { type: Number, min: 0, max: 20 },
  sizeSqm: { type: Number, min: 1, max: 5_000 },
  cots: Boolean,
  maxAdults: { type: Number, required: true, min: 1, max: 40 },
  maxChildren: { type: Number, required: true, min: 0, max: 20 },
  totalRooms: { type: Number, required: true, min: 1, max: 10_000 },
  inventoryVersion: { type: Number, default: 0 },
  basePriceMinor: { type: Number, required: true, min: 0 },
  // Optional price for Friday and Saturday nights, and date ranges with their own price (see bookings/room-price.ts).
  weekendPriceMinor: { type: Number, min: 0, default: undefined },
  seasons: {
    type: [new Schema({ name: { type: String, trim: true, maxlength: 60 }, from: String, to: String, priceMinor: { type: Number, min: 0 } }, { _id: false })],
    default: [],
  },
  // Stay rules and automatic discounts (see src/shared/utils/roomPricing.ts). They apply at once, like prices.
  minNights: { type: Number, min: 1, max: 365 },
  maxNights: { type: Number, min: 1, max: 365 },
  noArrivalDays: { type: [Number], default: undefined },
  deals: {
    type: new Schema({
      longStay: { type: new Schema({ nights: Number, percent: Number }, { _id: false }) },
      earlyBird: { type: new Schema({ days: Number, percent: Number }, { _id: false }) },
      lastMinute: { type: new Schema({ days: Number, percent: Number }, { _id: false }) },
    }, { _id: false }),
    default: undefined,
  },
  amenities: { type: [String], default: [] },
  photos: { type: [photoSchema], default: [] },
  // Guest-facing edits on a live listing ({ changes, isNew? }); reviewed together with the listing's revision.
  pendingRevision: { type: Schema.Types.Mixed, default: undefined },
  // Calendar sync. The token is the secret in the public feed link.
  icalToken: { type: String, select: false, index: { unique: true, sparse: true } },
  icalFeeds: { type: [new Schema({ id: String, name: { type: String, maxlength: 60 }, url: { type: String, maxlength: 2000 }, dates: [String], lastSyncAt: Date, lastError: String }, { _id: false })], default: undefined },
  icalConflicts: { type: [String], default: undefined },
  icalSyncedAt: { type: Date, default: null },
  status: { type: String, enum: ['active', 'paused', 'archived'], default: 'active', index: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

hotelRoomTypeSchema.index({ listingId: 1, status: 1, deletedAt: 1 });

export const HotelRoomTypeModel: Model<any> = (mongoose.models.HotelRoomType as Model<any> | undefined)
  ?? mongoose.model<any>('HotelRoomType', hotelRoomTypeSchema);
