import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

export const permissionKeys = [
  'profile:read',
  'profile:update',
  'booking:read:own',
  'booking:manage:own',
  'listing:read',
  'listing:manage:own',
  'vendor:manage:own',
  'support:manage',
  'user:manage',
  'vendor:manage',
  'listing:moderate',
  'booking:manage',
  'finance:manage',
  'audit:read',
] as const;

export type PermissionKey = typeof permissionKeys[number];

const permissionSchema = new Schema({
  key: { type: String, required: true, unique: true, enum: permissionKeys, immutable: true },
  description: { type: String, required: true, trim: true, maxlength: 240 },
}, { timestamps: true });

export const PermissionModel: Model<any> = (mongoose.models.Permission as Model<any> | undefined)
  ?? mongoose.model<any>('Permission', permissionSchema);
