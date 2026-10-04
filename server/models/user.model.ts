import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

export const userRoles = [
  'customer',
  'vendor_owner',
  'vendor_staff',
  'support_agent',
  'admin',
  'super_admin',
] as const;

export type UserRole = typeof userRoles[number];

const userSchema = new Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    default: () => `usr_${randomUUID()}`,
  },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, trim: true, maxlength: 30 },
  roles: { type: [String], enum: userRoles, default: ['customer'], required: true },
  // Saved listing public IDs, newest last.
  wishlist: { type: [String], default: [], select: false },
  status: {
    type: String,
    enum: ['active', 'suspended', 'archived'],
    default: 'active',
    index: true,
  },
  emailVerifiedAt: { type: Date, default: null },
  phoneVerifiedAt: { type: Date, default: null },
  twoFactor: {
    enabled: { type: Boolean, default: false },
    channel: { type: String, enum: ['email', 'sms'], default: 'email' },
    enabledAt: { type: Date, default: null },
  },
  passwordChangedAt: { type: Date, default: null },
  failedLoginAttempts: { type: Number, default: 0, min: 0, select: false },
  lockedUntil: { type: Date, default: null, select: false },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true, minimize: true });

userSchema.index({ roles: 1, status: 1 });

export const UserModel: Model<any> = (mongoose.models.User as Model<any> | undefined)
  ?? mongoose.model<any>('User', userSchema);
