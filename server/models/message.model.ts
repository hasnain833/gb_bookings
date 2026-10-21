import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: String, enum: ['guest', 'partner'], required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // Stored after contact details were replaced (see modules/messages/contact-filter.ts).
  body: { type: String, required: true, maxlength: 2_000 },
  contactsHidden: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const MessageModel: Model<any> = (mongoose.models.Message as Model<any> | undefined)
  ?? mongoose.model<any>('Message', messageSchema);
