import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

const vendorMemberSchema = new Schema({
  publicId: { type: String, required: true, unique: true, immutable: true, default: () => `vmb_${randomUUID()}` },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['owner', 'manager', 'listings', 'reservations', 'finance'], required: true },
  status: { type: String, enum: ['invited', 'active', 'suspended'], default: 'active', index: true },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

vendorMemberSchema.index({ vendorId: 1, userId: 1 }, { unique: true });

export const VendorMemberModel: Model<any> = (mongoose.models.VendorMember as Model<any> | undefined)
  ?? mongoose.model<any>('VendorMember', vendorMemberSchema);
