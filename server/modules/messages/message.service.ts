import mongoose from 'mongoose';
import { connectDatabase } from '../../database/connection.js';
import { BookingModel } from '../../models/booking.model.js';
import { ConversationModel } from '../../models/conversation.model.js';
import { ListingModel } from '../../models/listing.model.js';
import { MessageModel } from '../../models/message.model.js';
import { UserModel } from '../../models/user.model.js';
import { VendorModel } from '../../models/vendor.model.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { reservationVendorIds } from '../bookings/booking.service.js';
import { hideContacts } from './contact-filter.js';
import { env } from '../../config/env.js';
import { escapeHtml } from '../email/auth-email.templates.js';
import { isEmailConfigured, sendTransactionalEmail } from '../email/resend.service.js';
import { publishToUser, publishToVendorTeam } from './realtime.js';

export type Side = 'guest' | 'partner';

async function requireDatabase() {
  if (!await connectDatabase()) throw new ServiceUnavailableError('Messages are unavailable while the database is disconnected.');
}

function serializeConversation(conversation: any, side: Side) {
  return {
    id: conversation.publicId,
    side,
    listing: conversation.listingSnapshot,
    partnerName: conversation.listingSnapshot?.partnerName,
    guestName: conversation.guestName,
    lastMessage: conversation.lastMessage?.at ? conversation.lastMessage : undefined,
    unread: side === 'guest' ? conversation.guestUnread : conversation.partnerUnread,
    updatedAt: conversation.lastMessage?.at ?? conversation.createdAt,
  };
}

const serializeMessage = (message: any, side: Side) => ({
  id: String(message._id), sender: message.sender, body: message.body, contactsHidden: message.contactsHidden,
  at: message.createdAt, mine: message.sender === side,
});

/** Which side of the thread this user is on; 404 when neither, so thread ids cannot be probed. */
async function sideOf(userId: string, conversation: any): Promise<Side> {
  if (conversation && String(conversation.guestId) === userId) return 'guest';
  if (conversation && (await reservationVendorIds(userId)).some((id) => String(id) === String(conversation.vendorId))) return 'partner';
  throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
}

export async function listConversations(userId: string, side: Side) {
  await requireDatabase();
  const filter = side === 'guest' ? { guestId: userId } : { vendorId: { $in: await reservationVendorIds(userId) } };
  const conversations = await ConversationModel.find({ ...filter, 'lastMessage.at': { $ne: null } }).sort({ 'lastMessage.at': -1 }).limit(100).lean();
  return conversations.map((conversation) => serializeConversation(conversation, side));
}

export async function unreadCounts(userId: string) {
  await requireDatabase();
  const vendorIds = await reservationVendorIds(userId);
  const [guest, partner] = await Promise.all([
    ConversationModel.aggregate([{ $match: { guestId: new mongoose.Types.ObjectId(userId) } }, { $group: { _id: null, total: { $sum: '$guestUnread' } } }]),
    vendorIds.length ? ConversationModel.aggregate([{ $match: { vendorId: { $in: vendorIds } } }, { $group: { _id: null, total: { $sum: '$partnerUnread' } } }]) : [],
  ]);
  return { guest: guest[0]?.total ?? 0, partner: partner[0]?.total ?? 0, isPartner: vendorIds.length > 0 };
}

/** The thread, newest 100 messages oldest-first, the guest's bookings at this listing; marks it read for the viewer. */
export async function getConversation(userId: string, conversationId: string) {
  await requireDatabase();
  const conversation = await ConversationModel.findOne({ publicId: conversationId });
  const side = await sideOf(userId, conversation);
  const [messages, bookings] = await Promise.all([
    MessageModel.find({ conversationId: conversation._id }).sort({ createdAt: -1 }).limit(100).lean(),
    BookingModel.find({ customerId: conversation.guestId, listingId: conversation.listingId }).sort({ checkIn: -1 }).limit(3)
      .select('reference checkIn checkOut status').lean(),
  ]);
  await ConversationModel.updateOne({ _id: conversation._id }, { $set: { [side === 'guest' ? 'guestUnread' : 'partnerUnread']: 0 } });
  conversation[side === 'guest' ? 'guestUnread' : 'partnerUnread'] = 0;
  return {
    conversation: serializeConversation(conversation, side),
    messages: messages.reverse().map((message) => serializeMessage(message, side)),
    bookings: bookings.map((booking: any) => ({ reference: booking.reference, checkIn: booking.checkIn, checkOut: booking.checkOut, status: booking.status })),
  };
}

/** A guest's question to a listing's partner; reuses their existing thread for that listing. */
export async function startConversation(userId: string, listingPublicId: string, body: string) {
  await requireDatabase();
  const listing = await ListingModel.findOne({ publicId: listingPublicId, status: 'published', deletedAt: null }).lean() as any;
  if (!listing?.ownerId) throw new AppError(404, 'LISTING_NOT_FOUND', 'This listing cannot receive messages.');
  if ((await reservationVendorIds(userId)).some((id) => String(id) === String(listing.ownerId))) {
    throw new AppError(422, 'OWN_LISTING', 'You cannot message your own listing.');
  }
  const [guest, vendor] = await Promise.all([
    UserModel.findById(userId).select('name').lean() as any,
    VendorModel.findById(listing.ownerId).select('name').lean() as any,
  ]);
  const conversation = await ConversationModel.findOneAndUpdate(
    { guestId: userId, listingId: listing._id },
    { $setOnInsert: {
      guestId: userId, vendorId: listing.ownerId, listingId: listing._id, guestName: guest?.name,
      listingSnapshot: { publicId: listing.publicId, title: listing.title, image: listing.image, type: listing.type, partnerName: vendor?.name },
    } },
    { upsert: true, returnDocument: 'after' },
  );
  return sendInConversation(userId, conversation, 'guest', body);
}

export async function sendMessage(userId: string, conversationId: string, body: string) {
  await requireDatabase();
  const conversation = await ConversationModel.findOne({ publicId: conversationId });
  return sendInConversation(userId, conversation, await sideOf(userId, conversation), body);
}

async function sendInConversation(userId: string, conversation: any, side: Side, rawBody: string) {
  const { text, hidden } = hideContacts(rawBody.trim());
  const message = await MessageModel.create({ conversationId: conversation._id, sender: side, senderId: userId, body: text, contactsHidden: hidden });
  const other = side === 'guest' ? 'partnerUnread' : 'guestUnread';
  const updated = await ConversationModel.findOneAndUpdate(
    { _id: conversation._id },
    { $set: { lastMessage: { body: text.slice(0, 160), sender: side, at: message.createdAt }, alertPending: true }, $inc: { [other]: 1 } },
    { returnDocument: 'after' },
  );
  // Push to both sides; each client works out which side it is on from the conversation it has open.
  await Promise.all([
    publishToUser(String(conversation.guestId), { conversation: serializeConversation(updated, 'guest'), message: serializeMessage(message, 'guest') }),
    publishToVendorTeam(conversation.vendorId, { conversation: serializeConversation(updated, 'partner'), message: serializeMessage(message, 'partner') }),
  ]);
  return { conversation: serializeConversation(updated, side), message: serializeMessage(message, side) };
}

const ALERT_AFTER_MS = 10 * 60_000;

/**
 * Emails whoever has not read a message after ten minutes: "offline" here means they did not open it, which also covers
 * a tab left open. One email per quiet spell; the text passed the contact filter when it was sent.
 */
export async function sendOfflineMessageAlerts(now = new Date()) {
  if (!isEmailConfigured()) return 0;
  const due = await ConversationModel.find({ alertPending: true, 'lastMessage.at': { $lt: new Date(now.getTime() - ALERT_AFTER_MS) } }).limit(50).select('_id').lean();
  let sent = 0;
  for (const { _id } of due) {
    const conversation = await ConversationModel.findOneAndUpdate({ _id, alertPending: true }, { $set: { alertPending: false } }, { returnDocument: 'after' });
    if (!conversation?.lastMessage?.at) continue;
    const toPartner = conversation.lastMessage.sender === 'guest';
    if (!(toPartner ? conversation.partnerUnread : conversation.guestUnread)) continue;
    const recipient = toPartner
      ? await VendorModel.findById(conversation.vendorId).select('name email').lean() as any
      : await UserModel.findById(conversation.guestId).select('name email').lean() as any;
    if (!recipient?.email) continue;
    const from = toPartner ? conversation.guestName ?? 'A guest' : conversation.listingSnapshot?.partnerName ?? 'The partner';
    const title = conversation.listingSnapshot?.title ?? 'your booking';
    await sendTransactionalEmail({
      to: { email: recipient.email, name: recipient.name }, subject: `New message about ${title}`, tag: 'message-alert',
      htmlContent: `<p>Hello ${escapeHtml(recipient.name ?? '')},</p><p><strong>${escapeHtml(from)}</strong> sent you a message about ${escapeHtml(title)}:</p><blockquote style="border-left:3px solid #dce5df;margin:0;padding:4px 12px">${escapeHtml(conversation.lastMessage.body ?? '')}</blockquote><p><a href="${escapeHtml(env.APP_URL ?? '')}/inbox">Open your inbox to reply</a></p>`,
    }).then(() => { sent += 1; }).catch((error) => console.error('Message alert email failed:', error));
  }
  return sent;
}
