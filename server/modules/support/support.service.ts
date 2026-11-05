import { connectDatabase } from '../../database/connection.js';
import { BookingModel } from '../../models/booking.model.js';
import { ConversationModel } from '../../models/conversation.model.js';
import { MessageModel } from '../../models/message.model.js';
import { SupportCaseModel } from '../../models/support-case.model.js';
import { UserModel } from '../../models/user.model.js';
import { VendorModel } from '../../models/vendor.model.js';
import { env } from '../../config/env.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import type { SessionMetadata } from '../auth/auth.service.js';
import { serializeBooking } from '../bookings/booking.service.js';
import { escapeHtml } from '../email/auth-email.templates.js';
import { isEmailConfigured, sendTransactionalEmail } from '../email/resend.service.js';

const MAX_CASE_MESSAGES = 200;

async function requireDatabase() {
  if (!await connectDatabase()) throw new ServiceUnavailableError('Support is unavailable while the database is disconnected.');
}

/** Never throws: a failed email must not undo a reply or a decision. */
async function tell(to: { email?: string; name?: string } | null | undefined, subject: string, paragraphs: string[], tag: string) {
  if (!to?.email || !isEmailConfigured()) return;
  const htmlContent = `<p>Hello ${escapeHtml(to.name ?? '')},</p>${paragraphs.map((text) => `<p style="white-space:pre-wrap">${escapeHtml(text)}</p>`).join('')}`;
  await sendTransactionalEmail({ to: { email: to.email, name: to.name ?? '' }, subject, htmlContent, tag }).catch((error) => console.error(`${tag} email failed:`, error));
}

const caseView = (record: any) => ({
  id: record.publicId,
  status: record.status,
  messages: (record.messages ?? []).map((message: any) => ({ from: message.from, body: message.body, at: message.at })),
  updatedAt: record.lastMessageAt,
});

const ownBooking = async (customerId: string, bookingId: string) => {
  const booking = await BookingModel.findOne({ publicId: bookingId, customerId }).select('_id reference').lean() as any;
  if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  return booking;
};

/** The guest's case on their booking, or null if they have not written yet. */
export async function getBookingCase(customerId: string, bookingId: string) {
  await requireDatabase();
  const booking = await ownBooking(customerId, bookingId);
  const record = await SupportCaseModel.findOne({ bookingId: booking._id }).lean();
  return record ? caseView(record) : null;
}

export async function writeToSupport(customerId: string, bookingId: string, body: string, metadata: SessionMetadata) {
  await requireDatabase();
  const booking = await ownBooking(customerId, bookingId);
  const existing = await SupportCaseModel.findOne({ bookingId: booking._id }).select('messages').lean() as any;
  if ((existing?.messages?.length ?? 0) >= MAX_CASE_MESSAGES) throw new AppError(409, 'CASE_TOO_LONG', 'This case is very long. Please email support instead.');
  const at = new Date();
  const write = () => SupportCaseModel.findOneAndUpdate(
    { bookingId: booking._id },
    { $setOnInsert: { customerId }, $set: { status: 'open', lastMessageAt: at }, $push: { messages: { from: 'guest', senderId: customerId, body, at } } },
    { upsert: true, returnDocument: 'after' },
  );
  // Two first messages at once: the loser of the unique index simply writes to the winner's case.
  const record = await write().catch((error) => { if (error?.code === 11000) return write(); throw error; });
  if (!existing) await recordAuditEvent({ actorId: customerId, actorType: 'user', action: 'support.case_opened', resourceType: 'booking', resourceId: bookingId, ...metadata });
  return caseView(record);
}

/** Admin: cases with the booking they are about. */
export async function listCases(query: { status: 'open' | 'resolved'; page: number; limit: number }) {
  await requireDatabase();
  const filter = { status: query.status };
  const [records, total] = await Promise.all([
    SupportCaseModel.find(filter).sort({ lastMessageAt: query.status === 'open' ? 1 : -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean() as Promise<any[]>,
    SupportCaseModel.countDocuments(filter),
  ]);
  const bookings = await BookingModel.find({ _id: { $in: records.map((record) => record.bookingId) } }).lean() as any[];
  const vendors = await VendorModel.find({ _id: { $in: bookings.map((booking) => booking.vendorId).filter(Boolean) } }).select('name').lean() as any[];
  const bookingOf = new Map(bookings.map((booking) => [String(booking._id), booking]));
  const vendorOf = new Map(vendors.map((vendor) => [String(vendor._id), vendor.name as string]));
  return {
    data: records.map((record) => {
      const booking = bookingOf.get(String(record.bookingId));
      return { ...caseView(record), booking: booking ? { ...serializeBooking(booking), vendorName: vendorOf.get(String(booking.vendorId)) } : null };
    }),
    pagination: { page: query.page, limit: query.limit, total, pages: Math.max(1, Math.ceil(total / query.limit)) },
  };
}

export async function replyToCase(adminId: string, caseId: string, body: string, resolve: boolean, metadata: SessionMetadata) {
  await requireDatabase();
  const at = new Date();
  const record = await SupportCaseModel.findOneAndUpdate(
    { publicId: caseId, [`messages.${MAX_CASE_MESSAGES - 1}`]: { $exists: false } },
    { $set: { lastMessageAt: at, status: resolve ? 'resolved' : 'open' }, $push: { messages: { from: 'admin', senderId: adminId, body, at } } },
    { returnDocument: 'after' },
  ) as any;
  if (!record) throw new AppError(404, 'CASE_NOT_FOUND', 'This case was not found, or is too long to add to.');
  await recordAuditEvent({ actorId: adminId, actorType: 'user', action: 'support.case_replied', resourceType: 'support_case', resourceId: caseId, ...metadata, metadata: { resolved: resolve } });
  const [booking, guest] = await Promise.all([
    BookingModel.findById(record.bookingId).select('reference').lean() as any,
    UserModel.findById(record.customerId).select('name email').lean() as any,
  ]);
  await tell(guest, `GBBookings support replied · ${booking?.reference ?? 'your booking'}`, [body, `Reply from My Bookings, under Get help: ${env.APP_URL ?? ''}/bookings`], 'support-reply');
  return caseView(record);
}

export async function setCaseStatus(adminId: string, caseId: string, status: 'open' | 'resolved', metadata: SessionMetadata) {
  await requireDatabase();
  const record = await SupportCaseModel.findOneAndUpdate({ publicId: caseId }, { $set: { status } }, { returnDocument: 'after' });
  if (!record) throw new AppError(404, 'CASE_NOT_FOUND', 'This case was not found.');
  await recordAuditEvent({ actorId: adminId, actorType: 'user', action: `support.case_${status}`, resourceType: 'support_case', resourceId: caseId, ...metadata });
  return caseView(record);
}

const reportView = (conversation: any) => ({
  id: conversation.publicId,
  listingTitle: conversation.listingSnapshot?.title,
  partnerName: conversation.listingSnapshot?.partnerName,
  guestName: conversation.guestName,
  report: { status: conversation.report.status, by: conversation.report.by, reason: conversation.report.reason, at: conversation.report.at, note: conversation.report.note, reviewedAt: conversation.report.reviewedAt },
});

export async function listChatReports(status: 'open' | 'reviewed') {
  await requireDatabase();
  const conversations = await ConversationModel.find({ 'report.status': status }).sort({ 'report.at': -1 }).limit(100).lean();
  return conversations.map(reportView);
}

/** A reported chat, and only a reported one. Every reading is on the record, since these are private messages. */
export async function readReportedChat(adminId: string, conversationId: string, metadata: SessionMetadata) {
  await requireDatabase();
  const conversation = await ConversationModel.findOne({ publicId: conversationId, 'report.status': { $exists: true } }).lean() as any;
  if (!conversation) throw new AppError(404, 'REPORT_NOT_FOUND', 'This chat has not been reported.');
  const messages = await MessageModel.find({ conversationId: conversation._id }).sort({ createdAt: -1 }).limit(200).lean() as any[];
  await recordAuditEvent({ actorId: adminId, actorType: 'user', action: 'conversation.report_read', resourceType: 'conversation', resourceId: conversationId, ...metadata });
  return { ...reportView(conversation), messages: messages.reverse().map((message) => ({ sender: message.sender, body: message.body, at: message.createdAt, contactsHidden: message.contactsHidden })) };
}

export async function reviewChatReport(adminId: string, conversationId: string, note: string, metadata: SessionMetadata) {
  await requireDatabase();
  const conversation = await ConversationModel.findOneAndUpdate(
    { publicId: conversationId, 'report.status': 'open' },
    { $set: { 'report.status': 'reviewed', 'report.note': note, 'report.reviewedAt': new Date(), 'report.reviewedBy': adminId } },
    { returnDocument: 'after' },
  ) as any;
  if (!conversation) throw new AppError(409, 'REPORT_NOT_OPEN', 'This report has already been reviewed.');
  await recordAuditEvent({ actorId: adminId, actorType: 'user', action: 'conversation.report_reviewed', resourceType: 'conversation', resourceId: conversationId, ...metadata });
  const reporter = conversation.report.by === 'guest'
    ? await UserModel.findById(conversation.guestId).select('name email').lean() as any
    : await VendorModel.findById(conversation.vendorId).select('name email').lean() as any;
  await tell(reporter, `We looked at the chat you reported · ${conversation.listingSnapshot?.title ?? 'GBBookings'}`, ['GBBookings has looked at the chat you reported.', note], 'chat-report-reviewed');
  return reportView(conversation);
}

export async function supportCounts() {
  await requireDatabase();
  const [cases, reports] = await Promise.all([SupportCaseModel.countDocuments({ status: 'open' }), ConversationModel.countDocuments({ 'report.status': 'open' })]);
  return { cases, reports };
}
