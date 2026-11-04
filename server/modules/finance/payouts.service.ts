import { inTransaction } from '../../database/transaction.js';
import { BookingModel } from '../../models/booking.model.js';
import { PayoutModel } from '../../models/payout.model.js';
import { VendorMemberModel } from '../../models/vendor-member.model.js';
import { VendorModel } from '../../models/vendor.model.js';
import { AppError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import type { SessionMetadata } from '../auth/auth.service.js';
import { escapeHtml } from '../email/auth-email.templates.js';
import { isEmailConfigured, sendTransactionalEmail } from '../email/resend.service.js';
import { MEMBER_ACCESS } from '../vendors/member-access.js';
import { settlement, settlementDue } from './settlement.js';

const UNSETTLED = { vendorId: { $ne: null }, payoutId: null, status: { $in: ['completed', 'no_show', 'cancelled'] } };

const sums = (lines: Array<{ collectedOnlineMinor: number; refundedMinor: number; commissionMinor: number; netMinor: number }>) => lines.reduce(
  (total, line) => ({
    collectedOnlineMinor: total.collectedOnlineMinor + line.collectedOnlineMinor,
    refundedMinor: total.refundedMinor + line.refundedMinor,
    commissionMinor: total.commissionMinor + line.commissionMinor,
    netMinor: total.netMinor + line.netMinor,
  }),
  { collectedOnlineMinor: 0, refundedMinor: 0, commissionMinor: 0, netMinor: 0 },
);

const lineFor = (booking: any) => ({
  bookingId: booking._id, reference: booking.reference, listingTitle: booking.listingSnapshot.title, checkIn: booking.checkIn,
  status: booking.status, paymentMethod: booking.paymentMethod, totalMinor: booking.pricing.totalMinor, ...settlement(booking),
});

const major = (minor: number) => minor / 100;
const moneyView = (row: { collectedOnlineMinor: number; refundedMinor: number; commissionMinor: number; netMinor: number }) => ({
  collectedOnline: major(row.collectedOnlineMinor), refunded: major(row.refundedMinor), commission: major(row.commissionMinor), net: major(row.netMinor),
});

function serializeLine(line: any) {
  return { reference: line.reference, listingTitle: line.listingTitle, checkIn: line.checkIn, status: line.status, paymentMethod: line.paymentMethod, total: major(line.totalMinor), ...moneyView(line) };
}

function serializePayout(payout: any, full = false) {
  return {
    id: payout.publicId, reference: payout.reference, status: payout.status, ...moneyView(payout), bookings: payout.lines.length,
    createdAt: payout.createdAt, settledAt: payout.settledAt, bankReference: payout.bankReference,
    ...(full ? { lines: payout.lines.map(serializeLine), bank: payout.bank?.iban ? payout.bank : undefined } : {}),
  };
}

const unsettledFor = async (vendorId: unknown, session?: any) =>
  ((await BookingModel.find({ ...UNSETTLED, vendorId }).session(session ?? null).lean()) as any[]).filter(settlementDue);

/** Admin: what each partner is owed or owes right now. ponytail: loads every unsettled booking; aggregate if volumes grow. */
export async function listBalances() {
  const bookings = ((await BookingModel.find(UNSETTLED).select('vendorId status paymentMethod paymentStatus pricing refunds').lean()) as any[]).filter(settlementDue);
  const byVendor = new Map<string, any[]>();
  for (const booking of bookings) byVendor.set(String(booking.vendorId), [...(byVendor.get(String(booking.vendorId)) ?? []), settlement(booking)]);
  const vendors = await VendorModel.find({ _id: { $in: [...byVendor.keys()] } }).select('publicId name email payoutProfile').lean() as any[];
  return vendors.map((vendor) => {
    const lines = byVendor.get(String(vendor._id))!;
    return { vendorId: vendor.publicId, name: vendor.name, email: vendor.email, bookings: lines.length, hasBankDetails: Boolean(vendor.payoutProfile?.iban), ...moneyView(sums(lines)) };
  }).sort((a, b) => b.net - a.net);
}

/** Freezes a partner's unsettled bookings into one statement. In a transaction, so no booking lands on two. */
export async function createPayout(adminId: string, vendorPublicId: string, metadata: SessionMetadata) {
  const vendor = await VendorModel.findOne({ publicId: vendorPublicId, deletedAt: null });
  if (!vendor) throw new AppError(404, 'VENDOR_NOT_FOUND', 'Partner not found.');
  const payout = await inTransaction(async (session) => {
    const bookings = await unsettledFor(vendor._id, session);
    if (!bookings.length) throw new AppError(409, 'NOTHING_TO_SETTLE', 'This partner has no bookings waiting to be settled.');
    const lines = bookings.map(lineFor);
    const total = sums(lines);
    if (total.netMinor > 0 && !vendor.payoutProfile?.iban) throw new AppError(409, 'BANK_DETAILS_MISSING', 'This partner has no bank details yet. Ask them to add an account in their business profile.');
    const [created] = await PayoutModel.create([{ vendorId: vendor._id, lines, ...total, bank: vendor.payoutProfile?.iban ? vendor.payoutProfile : undefined, createdBy: adminId }], { session });
    const claimed = await BookingModel.updateMany({ _id: { $in: bookings.map((booking) => booking._id) }, payoutId: null }, { $set: { payoutId: created._id } }, { session });
    if (claimed.modifiedCount !== bookings.length) throw new AppError(409, 'BOOKINGS_CHANGED', 'These bookings were updated meanwhile. Try again.');
    return created;
  });
  await recordAuditEvent({ actorId: adminId, actorType: 'user', action: 'payout.created', resourceType: 'payout', resourceId: payout.publicId, ...metadata, metadata: { netMinor: payout.netMinor, bookings: payout.lines.length } });
  return serializePayout(payout, true);
}

/** Records the bank transfer that settled a statement and tells the partner. */
export async function settlePayout(adminId: string, payoutId: string, bankReference: string, metadata: SessionMetadata) {
  const payout = await PayoutModel.findOneAndUpdate(
    { publicId: payoutId, status: 'open' },
    { $set: { status: 'settled', settledAt: new Date(), settledBy: adminId, bankReference } },
    { returnDocument: 'after' },
  );
  if (!payout) throw new AppError(409, 'PAYOUT_NOT_OPEN', 'This statement is already settled, or does not exist.');
  await recordAuditEvent({ actorId: adminId, actorType: 'user', action: 'payout.settled', resourceType: 'payout', resourceId: payout.publicId, ...metadata, metadata: { bankReference, netMinor: payout.netMinor } });
  const vendor = await VendorModel.findById(payout.vendorId).select('name email').lean() as any;
  if (vendor && isEmailConfigured()) {
    const amount = `PKR ${Math.abs(major(payout.netMinor)).toLocaleString('en-PK')}`;
    await sendTransactionalEmail({
      to: { email: vendor.email, name: vendor.name }, subject: `Statement ${payout.reference} settled`, tag: 'payout-settled',
      htmlContent: `<p>Hello ${escapeHtml(vendor.name)},</p><p>Statement <strong>${escapeHtml(payout.reference)}</strong> is settled: ${payout.netMinor >= 0 ? `we sent you ${amount}` : `we received your ${amount} commission payment`}. Bank reference: ${escapeHtml(bankReference)}.</p><p>The full statement is under Payouts in your partner dashboard.</p>`,
    }).catch((error) => console.error(`Payout ${payout.reference} email failed:`, error));
  }
  return serializePayout(payout);
}

export async function listAllPayouts() {
  const payouts = await PayoutModel.find().sort({ createdAt: -1 }).limit(100).lean() as any[];
  const vendors = await VendorModel.find({ _id: { $in: payouts.map((payout) => payout.vendorId) } }).select('name').lean() as any[];
  const names = new Map(vendors.map((vendor) => [String(vendor._id), vendor.name]));
  return payouts.map((payout) => ({ ...serializePayout(payout), vendorName: names.get(String(payout.vendorId)) }));
}

export async function adminPayout(payoutId: string) {
  const payout = await PayoutModel.findOne({ publicId: payoutId }).lean() as any;
  if (!payout) throw new AppError(404, 'PAYOUT_NOT_FOUND', 'Statement not found.');
  const vendor = await VendorModel.findById(payout.vendorId).select('name taxNumber address').lean() as any;
  return { ...serializePayout(payout, true), vendor: vendor && { name: vendor.name, taxNumber: vendor.taxNumber, address: vendor.address } };
}

/** Money in and out over a period (Pakistan dates, inclusive), to check against the Safepay and bank statements. */
export async function reconciliation(range: { from: string; to: string }) {
  const start = new Date(`${range.from}T00:00:00+05:00`);
  const end = new Date(Date.parse(`${range.to}T00:00:00+05:00`) + 86_400_000);
  const [paid, refundRows, payouts] = await Promise.all([
    BookingModel.find({ paymentMethod: 'online', paymentStatus: 'paid', paidAt: { $gte: start, $lt: end } }).select('pricing').lean(),
    BookingModel.find({ refunds: { $elemMatch: { channel: 'safepay' } } }).select('refunds').lean(),
    PayoutModel.find({ status: 'settled', settledAt: { $gte: start, $lt: end } }).select('netMinor commissionMinor').lean(),
  ]) as any[][];
  const refunds = refundRows.flatMap((booking) => booking.refunds).filter((refund: any) => refund.channel === 'safepay');
  const add = (rows: any[], pick: (row: any) => number) => rows.reduce((total, row) => total + pick(row), 0);
  const collectedOnline = add(paid, (booking) => booking.pricing.totalMinor - (booking.pricing.balanceDueMinor ?? 0));
  const refundsSent = add(refunds.filter((refund: any) => refund.status === 'sent' && refund.sentAt >= start && refund.sentAt < end), (refund) => refund.amountMinor);
  const refundsOutstanding = add(refunds.filter((refund: any) => refund.status !== 'sent'), (refund) => refund.amountMinor);
  return {
    from: range.from, to: range.to,
    collectedOnline: major(collectedOnline), refundsSent: major(refundsSent), refundsOutstanding: major(refundsOutstanding),
    paidToPartners: major(add(payouts.filter((payout) => payout.netMinor > 0), (payout) => payout.netMinor)),
    receivedFromPartners: major(add(payouts.filter((payout) => payout.netMinor < 0), (payout) => -payout.netMinor)),
    commissionSettled: major(add(payouts, (payout) => payout.commissionMinor)),
    // Should match the Safepay balance plus the bank account's movements over the period.
    expectedHeld: major(collectedOnline - refundsSent - add(payouts.filter((payout) => payout.netMinor > 0), (payout) => payout.netMinor)),
  };
}

/** Partner: running balance, the bookings behind it, and past statements. Owner, manager and finance only. */
async function partnerVendorId(userId: string) {
  const membership = await VendorMemberModel.findOne({ userId, status: 'active', deletedAt: null, role: { $in: MEMBER_ACCESS.reports } }).select('vendorId').lean() as any;
  if (!membership) throw new AppError(403, 'VENDOR_ACCESS_REQUIRED', 'Payouts are available to the owner, managers and finance.');
  return membership.vendorId;
}

export async function partnerFinance(userId: string) {
  const vendorId = await partnerVendorId(userId);
  const [bookings, payouts] = await Promise.all([unsettledFor(vendorId), PayoutModel.find({ vendorId }).sort({ createdAt: -1 }).limit(50).lean()]);
  const lines = bookings.map(lineFor);
  return { balance: moneyView(sums(lines)), unsettled: lines.map(serializeLine), payouts: (payouts as any[]).map((payout) => serializePayout(payout)) };
}

export async function partnerPayout(userId: string, payoutId: string) {
  const vendorId = await partnerVendorId(userId);
  const payout = await PayoutModel.findOne({ publicId: payoutId, vendorId }).lean() as any;
  if (!payout) throw new AppError(404, 'PAYOUT_NOT_FOUND', 'Statement not found.');
  const vendor = await VendorModel.findById(vendorId).select('name taxNumber address').lean() as any;
  return { ...serializePayout(payout, true), vendor: vendor && { name: vendor.name, taxNumber: vendor.taxNumber, address: vendor.address } };
}
