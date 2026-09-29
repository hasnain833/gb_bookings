import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

const mediaSchema = new Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    default: () => `med_${randomUUID()}`,
  },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
  provider: { type: String, enum: ['cloudinary', 's3'], required: true },
  providerAssetId: { type: String, required: true, trim: true },
  providerResourceType: { type: String, enum: ['image', 'raw', 'video'], required: true },
  deliveryType: { type: String, enum: ['upload', 'authenticated'], default: 'upload' },
  url: { type: String, required: true, trim: true },
  resourceType: { type: String, enum: ['image', 'video', 'document'], required: true },
  mimeType: { type: String, required: true, trim: true },
  bytes: { type: Number, required: true, min: 0 },
  width: { type: Number, min: 1 },
  height: { type: Number, min: 1 },
  alt: { type: String, trim: true, maxlength: 300 },
  status: { type: String, enum: ['pending', 'ready', 'rejected'], default: 'pending', index: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true, minimize: true });

mediaSchema.index({ provider: 1, providerAssetId: 1 }, { unique: true });
mediaSchema.index({ vendorId: 1, status: 1, createdAt: -1 });

export const MediaModel: Model<any> = (mongoose.models.Media as Model<any> | undefined)
  ?? mongoose.model<any>('Media', mediaSchema);
