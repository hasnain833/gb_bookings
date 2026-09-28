import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

const authTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['email_verification', 'password_reset'], required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date, default: null },
  requestedIp: { type: String, maxlength: 100 },
}, { timestamps: true });

authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
authTokenSchema.index({ userId: 1, type: 1, consumedAt: 1, createdAt: -1 });

export const AuthTokenModel: Model<any> = (mongoose.models.AuthToken as Model<any> | undefined)
  ?? mongoose.model<any>('AuthToken', authTokenSchema);
