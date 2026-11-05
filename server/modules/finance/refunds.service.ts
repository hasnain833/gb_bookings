import { env } from '../../config/env.js';
import { BookingModel } from '../../models/booking.model.js';
import { AppError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import type { SessionMetadata } from '../auth/auth.service.js';
import { notifyBooking } from '../bookings/booking-notifications.js';
import { refundTracker } from '../payments/safepay.js';

export const autoRefundsEnabled = () => env.SAFEPAY_AUTO_REFUNDS;

/**
 * One attempt at one refund, claimed atomically so two callers cannot both send it. A failure is never retried
 * automatically: a timeout may still have moved the money, so a person checks Safepay first (the admin queue).
 */
async function sendOne(booking: any, refund: any, by?: string) {
  const claimed = await BookingModel.findOneAndUpdate(
    { _id: booking._id, refunds: { $elemMatch: { _id: refund._id, status: by ? { $in: ['pending', 'failed'] } : 'pending' } } },
    { $set: { 'refunds.$.status': 'sending' } },
  );
  if (!claimed) return;
  const tracker = refund.tracker ?? booking.onlinePayment?.paidTracker;
  try {
    if (!tracker) throw new Error('This booking has no paid Safepay payment on record.');
    await refundTracker(tracker, refund.amountMinor);
  } catch (error) {
    await BookingModel.updateOne({ _id: booking._id, 'refunds._id': refund._id }, { $set: { 'refunds.$.status': 'failed', 'refunds.$.lastError': String((error as Error)?.message ?? error).slice(0, 500) } });
    console.error(`Refund on ${booking.reference} failed:`, error);
    return;
  }
  await markSent(booking, refund, by);
}

async function markSent(booking: any, refund: any, by?: string, note?: string) {
  const updated = await BookingModel.findOneAndUpdate(
    { _id: booking._id, 'refunds._id': refund._id },
    { $set: { 'refunds.$.status': 'sent', 'refunds.$.sentAt': new Date(), 'refunds.$.sentBy': by, 'refunds.$.note': note }, $unset: { 'refunds.$.lastError': 1 } },
    { returnDocument: 'after' },
  );
  await recordAuditEvent({
    actorId: by, actorType: by ? 'user' : 'system', action: 'booking.refund_sent', resourceType: 'booking', resourceId: booking.publicId,
    metadata: { amountMinor: refund.amountMinor, channel: refund.channel, note },
  });
  if (updated) await notifyBooking(updated, 'refund_sent', `PKR ${(refund.amountMinor / 100).toLocaleString('en-PK')} refunded`);
}

/** Sends this booking's waiting gateway refunds. Never throws: the cancellation that caused it has already happened. */
export async function sendDueRefunds(booking: any) {
  if (!autoRefundsEnabled()) return;
  for (const refund of booking.refunds ?? []) {
    if (refund.channel === 'safepay' && refund.status === 'pending') await sendOne(booking, refund).catch((error) => console.error(`Refund on ${booking.reference} failed:`, error));
  }
}

/** Sweep: refunds a request could not finish, e.g. the server stopped straight after a cancellation. */
export async function sendPendingRefunds() {
  if (!autoRefundsEnabled()) return 0;
  const bookings = await BookingModel.find({ refunds: { $elemMatch: { status: 'pending', channel: 'safepay' } } }).limit(25);
  for (const booking of bookings) await sendDueRefunds(booking);
  return bookings.length;
}

/** Refunds still owed, oldest first, plus the last sent ones so the admin can look one up. */
export async function listRefunds(filter: 'open' | 'sent') {
  const statuses = filter === 'open' ? ['pending', 'sending', 'failed'] : ['sent'];
  const bookings = await BookingModel.find({ 'refunds.status': { $in: statuses } }).select('publicId reference guest listingSnapshot.title refunds paymentMethod').sort({ updatedAt: filter === 'open' ? 1 : -1 }).limit(200).lean() as any[];
  return bookings.flatMap((booking) => (booking.refunds ?? []).filter((refund: any) => statuses.includes(refund.status)).map((refund: any) => ({
    id: String(refund._id), bookingId: booking.publicId, reference: booking.reference, guestName: booking.guest.name, guestEmail: booking.guest.email,
    listingTitle: booking.listingSnapshot.title, kind: refund.kind, channel: refund.channel, amount: refund.amountMinor / 100, status: refund.status,
    lastError: refund.lastError, note: refund.note, sentAt: refund.sentAt, createdAt: refund.createdAt,
  })));
}

async function refundFor(bookingId: string, refundId: string) {
  const booking = await BookingModel.findOne({ publicId: bookingId });
  const refund = booking?.refunds?.id(refundId);
  if (!refund) throw new AppError(404, 'REFUND_NOT_FOUND', 'Refund not found.');
  return { booking, refund };
}

/** Admin retry through Safepay, after checking the Safepay dashboard that the money has not moved. */
export async function retryRefund(adminId: string, bookingId: string, refundId: string) {
  if (!autoRefundsEnabled()) throw new AppError(409, 'AUTO_REFUNDS_OFF', 'Sending through Safepay is switched off. Refund in the Safepay dashboard, then mark it sent.');
  const { booking, refund } = await refundFor(bookingId, refundId);
  if (refund.channel !== 'safepay') throw new AppError(409, 'REFUND_NOT_GATEWAY', 'The partner holds this money, so it cannot be sent through Safepay.');
  if (!['pending', 'failed'].includes(refund.status)) throw new AppError(409, 'REFUND_NOT_RETRYABLE', refund.status === 'sent' ? 'This refund was already sent.' : 'The last attempt has no known result. Check the Safepay dashboard, then mark it sent if the money moved.');
  await sendOne(booking, refund, adminId);
  return (await listRefunds('open')).find((item) => item.id === refundId) ?? { id: refundId, status: 'sent' };
}

/** Admin records a refund done outside this system (Safepay dashboard, or the partner returned the money). */
export async function markRefundSent(adminId: string, bookingId: string, refundId: string, note: string, metadata: SessionMetadata) {
  const { booking, refund } = await refundFor(bookingId, refundId);
  if (refund.status === 'sent') throw new AppError(409, 'REFUND_ALREADY_SENT', 'This refund was already marked as sent.');
  await markSent(booking, refund, adminId, note);
  await recordAuditEvent({ actorId: adminId, actorType: 'user', action: 'booking.refund_marked_sent', resourceType: 'booking', resourceId: booking.publicId, ...metadata, metadata: { note } });
  return { id: refundId, status: 'sent' };
}
