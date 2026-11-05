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
  // Set by each new message, cleared when its email alert goes out (see sendOfflineMessageAlerts).
  alertPending: { type: Boolean, default: false },
  // Either side can report the chat. Only then can GBBookings read it.
  report: {
    type: new Schema({
      status: { type: String, enum: ['open', 'reviewed'], required: true },
      by: { type: String, enum: ['guest', 'partner'], required: true },
      reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String, maxlength: 1_000 },
      at: Date,
      note: { type: String, maxlength: 1_000 },
      reviewedAt: Date,
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    }, { _id: false }),
    default: undefined,
  },
}, { timestamps: true });

conversationSchema.index({ guestId: 1, listingId: 1 }, { unique: true });
conversationSchema.index({ 'report.status': 1, 'report.at': -1 }, { sparse: true });
conversationSchema.index({ alertPending: 1, 'lastMessage.at': 1 }, { partialFilterExpression: { alertPending: true } });
conversationSchema.index({ guestId: 1, 'lastMessage.at': -1 });
conversationSchema.index({ vendorId: 1, 'lastMessage.at': -1 });

export const ConversationModel: Model<any> = (mongoose.models.Conversation as Model<any> | undefined)
  ?? mongoose.model<any>('Conversation', conversationSchema);
