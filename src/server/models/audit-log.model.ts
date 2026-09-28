import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

const auditLogSchema = new Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    default: () => `aud_${randomUUID()}`,
  },
  actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  actorType: { type: String, enum: ['user', 'system'], required: true },
  action: { type: String, required: true, trim: true, maxlength: 120, index: true },
  resourceType: { type: String, required: true, trim: true, maxlength: 80 },
  resourceId: { type: String, trim: true, maxlength: 120 },
  requestId: { type: String, trim: true, maxlength: 100 },
  ipAddress: { type: String, trim: true, maxlength: 100 },
  userAgent: { type: String, trim: true, maxlength: 500 },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false }, minimize: true });

auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

export const AuditLogModel: Model<any> = (mongoose.models.AuditLog as Model<any> | undefined)
  ?? mongoose.model<any>('AuditLog', auditLogSchema);
