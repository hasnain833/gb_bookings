import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

const sessionSchema = new Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    default: () => `ses_${randomUUID()}`,
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  refreshTokenHash: { type: String, required: true, unique: true, select: false },
  expiresAt: { type: Date, required: true },
  rememberMe: { type: Boolean, default: false },
  lastUsedAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null, index: true },
  userAgent: { type: String, maxlength: 500 },
  ipAddress: { type: String, maxlength: 100 },
}, { timestamps: true, minimize: true });

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

export const SessionModel: Model<any> = (mongoose.models.Session as Model<any> | undefined)
  ?? mongoose.model<any>('Session', sessionSchema);
