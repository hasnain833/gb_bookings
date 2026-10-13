import mongoose, { type Model } from 'mongoose';

const trustedDeviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  userAgentHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });
trustedDeviceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const TrustedDeviceModel: Model<any> = (mongoose.models.TrustedDevice as Model<any> | undefined)
  ?? mongoose.model<any>('TrustedDevice', trustedDeviceSchema);
