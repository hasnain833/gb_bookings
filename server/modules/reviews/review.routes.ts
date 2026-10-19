import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorizePermission } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { REVIEW_CATEGORIES } from '../../models/review.model.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { sessionMetadata } from '../auth/auth.service.js';
import { createReview, listListingReviews, listPartnerReviews, listReviewsForModeration, moderateReview, replyToReview, reportReview } from './review.service.js';

const star = z.number().int().min(1).max(5);
const page = { page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(10) };
const reviewIdParams = z.object({ id: z.string().regex(/^rev_[0-9a-f-]{36}$/i, 'Invalid review identifier.') }).strict();

export const createReviewSchema = z.object({
  overall: star,
  scores: z.object(Object.fromEntries(REVIEW_CATEGORIES.map((key) => [key, key === 'wifi' ? star.optional() : star])) as Record<typeof REVIEW_CATEGORIES[number], typeof star>).strict(),
  liked: z.string().trim().max(2_000).optional(),
  disliked: z.string().trim().max(2_000).optional(),
}).strict();

/** GET /listings/:id/reviews (public). */
export const listingReviewHandlers = [
  validate('query', z.object(page).strict()),
  asyncHandler(async (request, response) => {
    const query = request.query as any;
    response.json(await listListingReviews(request.params.id, query.page, query.limit));
  }),
];

/** POST /bookings/:id/review (the guest who made the booking). */
export const createReviewHandlers = [
  validate('body', createReviewSchema),
  asyncHandler(async (request, response) => {
    response.status(201).json({ data: await createReview(request.auth!.userId, request.params.id, request.body, sessionMetadata(request)) });
  }),
];

export const partnerReviewRouter = Router();
partnerReviewRouter.use(authenticate);

partnerReviewRouter.get('/', validate('query', z.object({ ...page, listingId: z.string().regex(/^lst_[0-9a-f-]{36}$/i).optional() }).strict()), asyncHandler(async (request, response) => {
  response.json(await listPartnerReviews(request.auth!.userId, request.query as any));
}));

partnerReviewRouter.post('/:id/reply', validate('params', reviewIdParams), validate('body', z.object({ text: z.string().trim().min(2).max(2_000) }).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await replyToReview(request.auth!.userId, request.params.id, request.body.text, sessionMetadata(request)) });
}));

partnerReviewRouter.post('/:id/report', validate('params', reviewIdParams), validate('body', z.object({ reason: z.string().trim().min(5).max(1_000) }).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await reportReview(request.auth!.userId, request.params.id, request.body.reason, sessionMetadata(request)) });
}));

export const adminReviewRouter = Router();
adminReviewRouter.use(authenticate, authorizePermission('listing:moderate'));

adminReviewRouter.get('/', validate('query', z.object({ ...page, status: z.enum(['reported', 'hidden', 'all']).default('reported') }).strict()), asyncHandler(async (request, response) => {
  response.json(await listReviewsForModeration(request.query as any));
}));

adminReviewRouter.post('/:id/moderate', validate('params', reviewIdParams), validate('body', z.object({ action: z.enum(['hide', 'restore', 'dismiss']), reason: z.string().trim().min(3).max(1_000) }).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await moderateReview(request.auth!.userId, request.params.id, request.body, sessionMetadata(request)) });
}));
