import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

const otpChallengeSchema = new Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    default: () => `otp_${randomUUID()}`,
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  purpose: {
    type: String,
    enum: ['two_factor_login', 'two_factor_setup', 'email_verification', 'phone_verification'],
    required: true,
    index: true,
  },
  channel: { type: String, enum: ['email', 'sms'], required: true },
  destination: { type: String, required: true, select: false },
  codeHash: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0, min: 0 },
  maxAttempts: { type: Number, required: true, min: 1 },
  rememberMe: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date, default: null },
  requestedIp: { type: String, maxlength: 100 },
}, { timestamps: true });

otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpChallengeSchema.index({ userId: 1, purpose: 1, consumedAt: 1, createdAt: -1 });

export const OtpChallengeModel: Model<any> = (mongoose.models.OtpChallenge as Model<any> | undefined)
  ?? mongoose.model<any>('OtpChallenge', otpChallengeSchema);
