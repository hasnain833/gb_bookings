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
  registrationNumber: { type: String, trim: true, maxlength: 100 },
  taxNumber: { type: String, trim: true, maxlength: 100 },
  address: {
    line1: { type: String, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 100 },
    region: { type: String, trim: true, maxlength: 100 },
    postalCode: { type: String, trim: true, maxlength: 30 },
    country: { type: String, trim: true, maxlength: 2, default: 'PK' },
  },
  payoutProfile: {
    accountTitle: { type: String, trim: true, maxlength: 160 },
    bankName: { type: String, trim: true, maxlength: 120 },
    iban: { type: String, trim: true, maxlength: 34 },
  },
  verificationDocuments: [{
    _id: false,
    type: { type: String, enum: ['identity', 'business_registration', 'tax', 'bank', 'property_authorization'], required: true },
    mediaId: { type: Schema.Types.ObjectId, ref: 'Media', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    notes: { type: String, trim: true, maxlength: 500 },
  }],
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
  rejectionReason: { type: String, trim: true, maxlength: 2_000 },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true, minimize: true });

vendorSchema.index({ ownerId: 1, status: 1 });
vendorSchema.index({ name: 'text', slug: 'text' });

export const VendorModel: Model<any> = (mongoose.models.Vendor as Model<any> | undefined)
  ?? mongoose.model<any>('Vendor', vendorSchema);
