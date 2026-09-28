import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

const vendorSchema = new Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    default: () => `vnd_${randomUUID()}`,
  },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, maxlength: 30 },
  businessType: {
    type: String,
    enum: ['hotel', 'homestay', 'vehicle', 'tour_operator', 'multi_service'],
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected', 'suspended', 'archived'],
    default: 'draft',
    index: true,
  },
  verificationNotes: { type: String, trim: true, maxlength: 2_000 },
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true, minimize: true });

vendorSchema.index({ ownerId: 1, status: 1 });
vendorSchema.index({ name: 'text', slug: 'text' });

export const VendorModel: Model<any> = (mongoose.models.Vendor as Model<any> | undefined)
  ?? mongoose.model<any>('Vendor', vendorSchema);
