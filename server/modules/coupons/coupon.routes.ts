import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { sessionMetadata } from '../auth/auth.service.js';
import { createCoupon, listCoupons, setCouponActive } from './coupon.service.js';

export const couponCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,20}$/, 'Codes are 3–20 letters, digits or dashes.');

const createCouponSchema = z.object({
  code: couponCodeSchema,
  kind: z.enum(['percent', 'amount']),
  // Percent, or PKR off the stay total.
  value: z.number().int().min(1).max(1_000_000),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  maxUses: z.number().int().min(1).max(100_000).optional(),
}).strict().refine((input) => input.kind !== 'percent' || input.value <= 90, { message: 'A percentage discount can be at most 90%.', path: ['value'] });

const couponIdParams = z.object({ id: z.string().regex(/^cpn_[0-9a-f-]{36}$/i, 'Invalid promo code identifier.') }).strict();

export const partnerCouponRouter = Router();
partnerCouponRouter.use(authenticate);

partnerCouponRouter.get('/', asyncHandler(async (request, response) => {
  response.json({ data: await listCoupons(request.auth!.userId) });
}));

partnerCouponRouter.post('/', validate('body', createCouponSchema), asyncHandler(async (request, response) => {
  response.status(201).json({ data: await createCoupon(request.auth!.userId, request.body, sessionMetadata(request)) });
}));

partnerCouponRouter.post('/:id/active', validate('params', couponIdParams), validate('body', z.object({ active: z.boolean() }).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await setCouponActive(request.auth!.userId, request.params.id, request.body.active, sessionMetadata(request)) });
}));
