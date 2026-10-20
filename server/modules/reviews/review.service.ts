import mongoose from 'mongoose';
import { connectDatabase } from '../../database/connection.js';
import { BookingModel } from '../../models/booking.model.js';
import { ListingModel } from '../../models/listing.model.js';
import { REVIEW_CATEGORIES, ReviewModel } from '../../models/review.model.js';
import { VendorMemberModel } from '../../models/vendor-member.model.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import type { SessionMetadata } from '../auth/auth.service.js';
import { todayInPakistan } from '../bookings/stay-dates.js';
import { shownEnd } from '../bookings/rental.js';
import { MEMBER_ACCESS } from '../vendors/member-access.js';

export const REVIEW_WINDOW_DAYS = 30;

async function requireDatabase() {
  if (!await connectDatabase()) throw new ServiceUnavailableError('Reviews are unavailable while the database is disconnected.');
}

const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/**
 * A stay can be reviewed once it has ended (checked out, or confirmed and past its check-out date, in case the
 * property forgot to check the guest out) and for REVIEW_WINDOW_DAYS afterwards. Cancelled and no-show stays cannot.
 */
export function reviewableUntil(booking: { status: string; endDate: string }, today = todayInPakistan()) {
  if (!['completed', 'confirmed'].includes(booking.status) || booking.endDate > today) return null;
  const until = addDays(booking.endDate, REVIEW_WINDOW_DAYS);
  return today <= until ? until : null;
}

const authorName = (name: string) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0].toUpperCase()}.` : first;
};

function serializeReview(review: any, audience: 'public' | 'partner' | 'admin' = 'public') {
  return {
    id: review.publicId,
    authorName: review.authorName,
    stayMonth: review.stayMonth,
    roomName: review.roomName,
    overall: review.overall,
    scores: review.scores,
    liked: review.liked || undefined,
    disliked: review.disliked || undefined,
    reply: review.reply?.text ? { text: review.reply.text, at: review.reply.at } : undefined,
    createdAt: review.createdAt,
    ...(audience !== 'public' ? {
      status: review.status, hiddenReason: review.hiddenReason || undefined,
      report: review.report?.at ? { reason: review.report.reason, at: review.report.at } : undefined,
    } : {}),
  };
}

const round1 = (value: number | null | undefined) => value == null ? undefined : Math.round(value * 10) / 10;

/** Recomputes a listing's rating (average overall), review count and category averages from its published reviews. */
export async function refreshListingRating(listingId: mongoose.Types.ObjectId) {
  const [stats] = await ReviewModel.aggregate([
    { $match: { listingId, status: 'published' } },
    { $group: { _id: null, count: { $sum: 1 }, overall: { $avg: '$overall' }, ...Object.fromEntries(REVIEW_CATEGORIES.map((key) => [key, { $avg: `$scores.${key}` }])) } },
  ]);
  await ListingModel.updateOne({ _id: listingId }, {
    $set: {
      rating: round1(stats?.overall) ?? 0,
      reviewsCount: stats?.count ?? 0,
      reviewScores: stats ? Object.fromEntries(REVIEW_CATEGORIES.map((key) => [key, round1(stats[key])])) : undefined,
    },
  });
}

export async function createReview(
  customerId: string,
  bookingId: string,
  input: { overall: number; scores: Record<string, number>; liked?: string; disliked?: string },
  metadata: SessionMetadata,
) {
  await requireDatabase();
  const booking = await BookingModel.findOne({ publicId: bookingId, customerId });
  if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  if (!reviewableUntil({ status: booking.status, endDate: shownEnd(booking) })) {
    throw new AppError(409, 'REVIEW_NOT_ALLOWED', `You can review a stay after check-out, for ${REVIEW_WINDOW_DAYS} days. Cancelled and no-show bookings cannot be reviewed.`);
  }
  let review;
  try {
    review = await ReviewModel.create({
      bookingId: booking._id, bookingPublicId: booking.publicId, listingId: booking.listingId, vendorId: booking.vendorId, customerId,
      authorName: authorName(booking.guest.name), stayMonth: booking.checkIn.slice(0, 7), roomName: booking.roomSnapshot?.name,
      overall: input.overall, scores: input.scores, liked: input.liked, disliked: input.disliked,
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw new AppError(409, 'ALREADY_REVIEWED', 'You have already reviewed this stay.');
    throw error;
  }
  await refreshListingRating(booking.listingId);
  await recordAuditEvent({ actorId: customerId, actorType: 'user', action: 'review.created', resourceType: 'review', resourceId: review.publicId, ...metadata, metadata: { bookingId, overall: input.overall } });
  return serializeReview(review);
}

/** The guest's reviews for the given bookings, keyed by booking id (for "Write a review" / "Your review" on My Bookings). */
export async function reviewsForBookings(customerId: string, bookingIds: string[]) {
  if (!bookingIds.length) return new Map<string, any>();
  const reviews = await ReviewModel.find({ customerId, bookingPublicId: { $in: bookingIds } }).lean() as any[];
  return new Map(reviews.map((review) => [review.bookingPublicId, serializeReview(review)]));
}

export async function listListingReviews(listingPublicId: string, page: number, limit: number) {
  await requireDatabase();
  const listing = await ListingModel.findOne({ publicId: listingPublicId, status: 'published', deletedAt: null }).select('_id').lean() as any;
  if (!listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  const filter = { listingId: listing._id, status: 'published' };
  const [records, total] = await Promise.all([
    ReviewModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ReviewModel.countDocuments(filter),
  ]);
  return { data: records.map((record) => serializeReview(record)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function partnerVendorIds(userId: string) {
  const memberships = await VendorMemberModel.find({ userId, status: 'active', deletedAt: null, role: { $in: MEMBER_ACCESS.listings } }).select('vendorId').lean() as any[];
  if (!memberships.length) throw new AppError(403, 'VENDOR_ACCESS_REQUIRED', 'Only the owner and managers can manage reviews.');
  return memberships.map((membership) => membership.vendorId);
}

/** Reviews of the partner's properties, newest first, including hidden ones (so they know what was removed). */
export async function listPartnerReviews(userId: string, query: { listingId?: string; page: number; limit: number }) {
  await requireDatabase();
  const vendorIds = await partnerVendorIds(userId);
  const listing = query.listingId ? await ListingModel.findOne({ publicId: query.listingId, ownerId: { $in: vendorIds } }).select('_id').lean() as any : null;
  if (query.listingId && !listing) throw new AppError(404, 'LISTING_NOT_FOUND', 'Listing not found.');
  const filter = { vendorId: { $in: vendorIds }, ...(listing ? { listingId: listing._id } : {}) };
  const [records, total] = await Promise.all([
    ReviewModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    ReviewModel.countDocuments(filter),
  ]);
  const titles = new Map((await ListingModel.find({ _id: { $in: records.map((record: any) => record.listingId) } }).select('title').lean() as any[]).map((item) => [String(item._id), item.title]));
  return {
    data: records.map((record: any) => ({ ...serializeReview(record, 'partner'), listingTitle: titles.get(String(record.listingId)) })),
    pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
  };
}

async function partnerReview(userId: string, reviewId: string) {
  const vendorIds = await partnerVendorIds(userId);
  const review = await ReviewModel.findOne({ publicId: reviewId, vendorId: { $in: vendorIds } });
  if (!review) throw new AppError(404, 'REVIEW_NOT_FOUND', 'Review not found.');
  return review;
}

/** One public reply per review; saving again replaces it. */
export async function replyToReview(userId: string, reviewId: string, text: string, metadata: SessionMetadata) {
  await requireDatabase();
  const review = await partnerReview(userId, reviewId);
  review.reply = { text, at: new Date(), by: userId };
  await review.save();
  await recordAuditEvent({ actorId: userId, actorType: 'user', action: 'review.replied', resourceType: 'review', resourceId: review.publicId, ...metadata });
  return serializeReview(review, 'partner');
}

/** Sends a review to the admin (abusive, fake, wrong property, personal data). It stays public until the admin decides. */
export async function reportReview(userId: string, reviewId: string, reason: string, metadata: SessionMetadata) {
  await requireDatabase();
  const review = await partnerReview(userId, reviewId);
  review.report = { reason, at: new Date(), by: userId };
  await review.save();
  await recordAuditEvent({ actorId: userId, actorType: 'user', action: 'review.reported', resourceType: 'review', resourceId: review.publicId, ...metadata, metadata: { reason } });
  return serializeReview(review, 'partner');
}

export async function listReviewsForModeration(query: { status: 'reported' | 'hidden' | 'all'; page: number; limit: number }) {
  await requireDatabase();
  const filter = query.status === 'reported' ? { 'report.at': { $ne: null } } : query.status === 'hidden' ? { status: 'hidden' } : {};
  const [records, total] = await Promise.all([
    ReviewModel.find(filter).sort(query.status === 'reported' ? { 'report.at': 1 } : { createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    ReviewModel.countDocuments(filter),
  ]);
  const titles = new Map((await ListingModel.find({ _id: { $in: records.map((record: any) => record.listingId) } }).select('title').lean() as any[]).map((item) => [String(item._id), item.title]));
  return {
    data: records.map((record: any) => ({ ...serializeReview(record, 'admin'), listingTitle: titles.get(String(record.listingId)) })),
    pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
  };
}

/** Hide or restore a review, or dismiss a partner's report. Hiding and restoring update the listing's rating. */
export async function moderateReview(adminId: string, reviewId: string, input: { action: 'hide' | 'restore' | 'dismiss'; reason: string }, metadata: SessionMetadata) {
  await requireDatabase();
  const review = await ReviewModel.findOne({ publicId: reviewId });
  if (!review) throw new AppError(404, 'REVIEW_NOT_FOUND', 'Review not found.');
  if (input.action === 'hide') { review.status = 'hidden'; review.hiddenReason = input.reason; }
  if (input.action === 'restore') { review.status = 'published'; review.hiddenReason = undefined; }
  // Any decision closes the report.
  review.report = undefined;
  await review.save();
  if (input.action !== 'dismiss') await refreshListingRating(review.listingId);
  await recordAuditEvent({ actorId: adminId, actorType: 'user', action: `review.${input.action}`, resourceType: 'review', resourceId: review.publicId, ...metadata, metadata: { reason: input.reason } });
  return serializeReview(review, 'admin');
}
