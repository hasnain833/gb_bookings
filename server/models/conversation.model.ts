import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

// One thread per guest per listing: questions before booking and every booking after share it.
const conversationSchema = new Schema({
  publicId: { type: String, required: true, unique: true, immutable: true, default: () => `cnv_${randomUUID()}` },
  guestId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  // `type` must be spelled { type: String }: a bare `type: String` makes Mongoose read the whole object as a string.
  listingSnapshot: { publicId: String, title: String, image: String, type: { type: String }, partnerName: String },
  guestName: String,
  lastMessage: { body: String, sender: { type: String, enum: ['guest', 'partner'] }, at: Date },
  guestUnread: { type: Number, default: 0, min: 0 },
  partnerUnread: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

conversationSchema.index({ guestId: 1, listingId: 1 }, { unique: true });
conversationSchema.index({ guestId: 1, 'lastMessage.at': -1 });
conversationSchema.index({ vendorId: 1, 'lastMessage.at': -1 });

export const ConversationModel: Model<any> = (mongoose.models.Conversation as Model<any> | undefined)
  ?? mongoose.model<any>('Conversation', conversationSchema);
