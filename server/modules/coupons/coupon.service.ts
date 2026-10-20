import type { ClientSession } from 'mongoose';
import { connectDatabase } from '../../database/connection.js';
import { CouponModel } from '../../models/coupon.model.js';
import { VendorMemberModel } from '../../models/vendor-member.model.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import type { SessionMetadata } from '../auth/auth.service.js';
import { todayInPakistan } from '../bookings/stay-dates.js';
import { MEMBER_ACCESS } from '../vendors/member-access.js';

export type CouponTerms = { code: string; kind: 'percent' | 'amount'; value: number };

/** Discount on a stay total; a fixed amount never takes the total below zero. */
export const discountMinor = (coupon: CouponTerms | undefined, grossMinor: number) => !coupon ? 0
  : coupon.kind === 'percent' ? Math.round((grossMinor * coupon.value) / 100) : Math.min(coupon.value, grossMinor);

export const couponLabel = (coupon: CouponTerms) => coupon.kind === 'percent' ? `${coupon.value}% off` : `PKR ${(coupon.value / 100).toLocaleString('en-PK')} off`;

const usable = (vendorId: unknown, code: string) => ({
  vendorId, code: code.toUpperCase(), active: true,
  $and: [
    { $or: [{ validUntil: null }, { validUntil: { $gte: todayInPakistan() } }] },
    { $or: [{ maxUses: null }, { $expr: { $lt: ['$uses', '$maxUses'] } }] },
  ],
});
const NOT_VALID = () => new AppError(422, 'COUPON_INVALID', 'This promo code is not valid for this property, has expired or has been used up.');

/** Checks a code for a quote without using it up. */
export async function findUsableCoupon(vendorId: unknown, code: string): Promise<CouponTerms> {
  const coupon = vendorId ? await CouponModel.findOne(usable(vendorId, code)).lean() as any : null;
  if (!coupon) throw NOT_VALID();
  return { code: coupon.code, kind: coupon.kind, value: coupon.value };
}

/** Takes one use of the code inside the booking transaction, so the last use cannot be taken twice. */
export async function claimCoupon(vendorId: unknown, code: string, session: ClientSession): Promise<CouponTerms> {
  const coupon = vendorId ? await CouponModel.findOneAndUpdate(usable(vendorId, code), { $inc: { uses: 1 } }, { session, returnDocument: 'after' }) : null;
  if (!coupon) throw NOT_VALID();
  return { code: coupon.code, kind: coupon.kind, value: coupon.value };
}

export async function releaseCoupon(vendorId: unknown, code: string, session: ClientSession) {
  await CouponModel.updateOne({ vendorId, code, uses: { $gt: 0 } }, { $inc: { uses: -1 } }, { session });
}

async function couponVendorId(userId: string) {
  if (!await connectDatabase()) throw new ServiceUnavailableError('Promo codes are unavailable while the database is disconnected.');
  const membership = await VendorMemberModel.findOne({ userId, status: 'active', deletedAt: null, role: { $in: MEMBER_ACCESS.listings } }).select('vendorId').lean() as any;
  if (!membership) throw new AppError(403, 'VENDOR_ACCESS_REQUIRED', 'Only the owner and managers can manage promo codes.');
  return membership.vendorId;
}

const serialize = (coupon: any) => ({
  id: coupon.publicId, code: coupon.code, kind: coupon.kind,
  value: coupon.kind === 'amount' ? coupon.value / 100 : coupon.value,
  validUntil: coupon.validUntil, maxUses: coupon.maxUses, uses: coupon.uses, active: coupon.active, createdAt: coupon.createdAt,
});

export async function listCoupons(userId: string) {
  const vendorId = await couponVendorId(userId);
  return (await CouponModel.find({ vendorId }).sort({ createdAt: -1 }).lean()).map(serialize);
}

export async function createCoupon(userId: string, input: { code: string; kind: 'percent' | 'amount'; value: number; validUntil?: string; maxUses?: number }, metadata: SessionMetadata) {
  const vendorId = await couponVendorId(userId);
  try {
    const coupon = await CouponModel.create({ ...input, vendorId, value: input.kind === 'amount' ? Math.round(input.value * 100) : input.value });
    await recordAuditEvent({ actorId: userId, actorType: 'user', action: 'coupon.created', resourceType: 'coupon', resourceId: coupon.publicId, ...metadata, metadata: { code: coupon.code } });
    return serialize(coupon);
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) throw new AppError(409, 'COUPON_EXISTS', `You already have a code ${input.code.toUpperCase()}.`);
    throw error;
  }
}

/** Codes are switched off rather than deleted, so past bookings still explain their discount. */
export async function setCouponActive(userId: string, couponId: string, active: boolean, metadata: SessionMetadata) {
  const vendorId = await couponVendorId(userId);
  const coupon = await CouponModel.findOneAndUpdate({ publicId: couponId, vendorId }, { $set: { active } }, { returnDocument: 'after' });
  if (!coupon) throw new AppError(404, 'COUPON_NOT_FOUND', 'Promo code not found.');
  await recordAuditEvent({ actorId: userId, actorType: 'user', action: active ? 'coupon.activated' : 'coupon.deactivated', resourceType: 'coupon', resourceId: coupon.publicId, ...metadata });
  return serialize(coupon);
}
