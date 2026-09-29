import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

const hotelRoomTypeSchema = new Schema({
  publicId: { type: String, required: true, unique: true, immutable: true, default: () => `rom_${randomUUID()}` },
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2_000 },
  bedType: { type: String, required: true, trim: true, maxlength: 80 },
  maxAdults: { type: Number, required: true, min: 1, max: 20 },
  maxChildren: { type: Number, required: true, min: 0, max: 20 },
  totalRooms: { type: Number, required: true, min: 1, max: 10_000 },
  basePriceMinor: { type: Number, required: true, min: 0 },
  amenities: { type: [String], default: [] },
  status: { type: String, enum: ['active', 'paused', 'archived'], default: 'active', index: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

hotelRoomTypeSchema.index({ listingId: 1, status: 1, deletedAt: 1 });

export const HotelRoomTypeModel: Model<any> = (mongoose.models.HotelRoomType as Model<any> | undefined)
  ?? mongoose.model<any>('HotelRoomType', hotelRoomTypeSchema);
