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
  // Owner's / host's CNIC as 12345-1234567-1; indexed to spot one CNIC on several partner accounts.
  cnicNumber: { type: String, trim: true, maxlength: 15, index: true },
  // Automatic pre-check of the identity document, shown to the admin; never approves anything itself.
  identityCheck: {
    type: new Schema({
      status: { type: String, enum: ['passed', 'flagged'] },
      findings: [{ _id: false, level: { type: String, enum: ['ok', 'warn', 'fail'] }, text: String }],
      read: { name: String, cnicNumber: String, expiryDate: String },
      checkedAt: Date,
    }, { _id: false }),
    default: undefined,
  },
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
    type: { type: String, enum: ['identity', 'business_registration', 'tax', 'bank', 'property_authorization', 'vehicle_registration', 'driving_licence', 'guide_licence'], required: true },
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
  // Approved vendors' business details only change through an admin-approved request.
  pendingChanges: {
    type: new Schema({
      name: String, email: String, phone: String, registrationNumber: String, taxNumber: String,
      address: { line1: String, city: String, region: String },
      requestedAt: { type: Date, required: true },
    }, { _id: false }),
    default: undefined,
  },
  changeRejectionReason: { type: String, trim: true, maxlength: 2_000 },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true, minimize: true });

vendorSchema.index({ ownerId: 1, status: 1 });
vendorSchema.index({ name: 'text', slug: 'text' });

export const VendorModel: Model<any> = (mongoose.models.Vendor as Model<any> | undefined)
  ?? mongoose.model<any>('Vendor', vendorSchema);
