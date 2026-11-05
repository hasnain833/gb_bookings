import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

// One case per booking: a guest writing again reopens it, so the whole story stays in one place.
const supportCaseSchema = new Schema({
  publicId: { type: String, required: true, unique: true, immutable: true, default: () => `sup_${randomUUID()}` },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  messages: {
    type: [new Schema({
      from: { type: String, enum: ['guest', 'admin'], required: true },
      senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      body: { type: String, required: true, trim: true, maxlength: 2_000 },
      at: { type: Date, default: Date.now },
    }, { _id: false })],
    default: [],
  },
  lastMessageAt: { type: Date, required: true },
}, { timestamps: true });

supportCaseSchema.index({ status: 1, lastMessageAt: -1 });

export const SupportCaseModel: Model<any> = (mongoose.models.SupportCase as Model<any> | undefined)
  ?? mongoose.model<any>('SupportCase', supportCaseSchema);
