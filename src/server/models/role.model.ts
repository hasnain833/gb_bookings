import mongoose, { type Model } from 'mongoose';
import { permissionKeys } from './permission.model.js';
import { userRoles } from './user.model.js';

const { Schema } = mongoose;

const roleSchema = new Schema({
  key: { type: String, required: true, unique: true, enum: userRoles, immutable: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  permissions: { type: [String], enum: permissionKeys, default: [] },
  system: { type: Boolean, default: true, immutable: true },
}, { timestamps: true });

export const RoleModel: Model<any> = (mongoose.models.Role as Model<any> | undefined)
  ?? mongoose.model<any>('Role', roleSchema);
