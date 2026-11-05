import { Router, type RequestHandler } from 'express';
import { authenticate, authorizePermission } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { AppError } from '../../shared/app-error.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { sessionMetadata } from '../auth/auth.service.js';
import { createReviewHandlers } from '../reviews/review.routes.js';
import { getBookingCase, writeToSupport } from '../support/support.service.js';
import { supportBodySchema } from '../support/support.routes.js';
import { listingIdParamsSchema } from '../listings/listing.schemas.js';
import {
  adminCancelBookingSchema,
  adminBookingFiltersSchema,
  adminBookingsQuerySchema,
  decideNoShowSchema,
  disputeNoShowSchema,
  availabilityQuerySchema,
  bookingDetailsSchema,
  bookingReferenceQuerySchema,
  bookingIdParamsSchema,
  cancelBookingSchema,
  changeBookingSchema,
  changeDecisionSchema,
  changeRequestSchema,
  vendorChangeSchema,
  proposalAnswerSchema,
  createBookingSchema,
  listBookingsQuerySchema,
  vendorBookingActionSchema,
  vendorReportQuerySchema,
} from './booking.schemas.js';
import {
  actOnVendorBooking,
  adminCancelBooking,
  decideNoShowDispute,
  disputeNoShow,
  exportAdminBookings,
  listAdminBookings,
  findBookingForAdmin,
  cancelOwnBooking,
  createBooking,
  getBooking,
  getListingAvailability,
  getUnavailableDates,
  updateBookingDetails,
  handleSafepayWebhook,
  listCustomerBookings,
  startOnlinePayment,
  verifyOnlinePayment,
  listVendorBookings,
  proposeBookingChange,
  answerBookingProposal,
  decideBookingChange,
  requestBookingChange,
  vendorReport,
  withVendorActions,
} from './booking.service.js';

const actor = (request: Parameters<RequestHandler>[0]) => ({ userId: request.auth!.userId, roles: request.auth!.roles });

export const availabilityHandlers: RequestHandler[] = [
  validate('params', listingIdParamsSchema),
  validate('query', availabilityQuerySchema),
  asyncHandler(async (request, response) => {
    response.json(await getListingAvailability(request.params.id, request.query as any));
  }),
];

export const unavailableDatesHandlers: RequestHandler[] = [
  validate('params', listingIdParamsSchema),
  asyncHandler(async (request, response) => {
    response.json({ dates: await getUnavailableDates(request.params.id) });
  }),
];

export const bookingRouter = Router();
bookingRouter.use(authenticate);

bookingRouter.get('/', validate('query', listBookingsQuerySchema), asyncHandler(async (request, response) => {
  response.json(await listCustomerBookings(request.auth!.userId, request.query as any));
}));

bookingRouter.post('/', authorizePermission('booking:manage:own'), validate('body', createBookingSchema), asyncHandler(async (request, response) => {
  const idempotencyKey = request.header('idempotency-key');
  if (idempotencyKey !== undefined && !/^[\w-]{8,100}$/.test(idempotencyKey)) {
    throw new AppError(400, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key must be 8-100 letters, digits, dashes or underscores.');
  }
  const result = await createBooking(request.auth!.userId, request.body, idempotencyKey, sessionMetadata(request));
  response.status(result.replayed ? 200 : 201).json({ data: result.booking });
}));

bookingRouter.get('/:id', validate('params', bookingIdParamsSchema), asyncHandler(async (request, response) => {
  response.json({ data: await getBooking(actor(request), request.params.id) });
}));

bookingRouter.post('/:id/review', validate('params', bookingIdParamsSchema), ...createReviewHandlers);

bookingRouter.post('/:id/pay', validate('params', bookingIdParamsSchema), asyncHandler(async (request, response) => {
  response.json({ data: await startOnlinePayment(actor(request), request.params.id) });
}));

bookingRouter.post('/:id/payment/verify', validate('params', bookingIdParamsSchema), asyncHandler(async (request, response) => {
  response.json({ data: await verifyOnlinePayment(actor(request), request.params.id) });
}));

/** Safepay calls this after payment events. No sign-in: the payment is always re-checked with Safepay. */
export const paymentWebhookRouter = Router();
paymentWebhookRouter.post('/safepay/webhook', asyncHandler(async (request, response) => {
  await handleSafepayWebhook(request.body);
  response.json({ received: true });
}));

bookingRouter.post('/:id/cancel', validate('params', bookingIdParamsSchema), validate('body', cancelBookingSchema), asyncHandler(async (request, response) => {
  response.json({ data: await cancelOwnBooking(actor(request), request.params.id, request.body.reason, sessionMetadata(request)) });
}));

bookingRouter.get('/:id/support', validate('params', bookingIdParamsSchema), asyncHandler(async (request, response) => {
  response.json({ data: await getBookingCase(request.auth!.userId, request.params.id) });
}));

bookingRouter.post('/:id/support', validate('params', bookingIdParamsSchema), validate('body', supportBodySchema), asyncHandler(async (request, response) => {
  response.json({ data: await writeToSupport(request.auth!.userId, request.params.id, request.body.body, sessionMetadata(request)) });
}));

bookingRouter.post('/:id/details', validate('params', bookingIdParamsSchema), validate('body', bookingDetailsSchema), asyncHandler(async (request, response) => {
  response.json({ data: await updateBookingDetails(actor(request), request.params.id, request.body, sessionMetadata(request)) });
}));

bookingRouter.post('/:id/change-request', validate('params', bookingIdParamsSchema), validate('body', changeRequestSchema), asyncHandler(async (request, response) => {
  response.json({ data: await requestBookingChange(actor(request), request.params.id, request.body, sessionMetadata(request)) });
}));

bookingRouter.post('/:id/no-show-dispute', validate('params', bookingIdParamsSchema), validate('body', disputeNoShowSchema), asyncHandler(async (request, response) => {
  response.json({ data: await disputeNoShow(actor(request), request.params.id, request.body.note, sessionMetadata(request)) });
}));

bookingRouter.post('/:id/change-proposal', validate('params', bookingIdParamsSchema), validate('body', proposalAnswerSchema), asyncHandler(async (request, response) => {
  response.json({ data: await answerBookingProposal(actor(request), request.params.id, request.body.decision, sessionMetadata(request)) });
}));

const bookingActionHandler = asyncHandler(async (request, response) => {
  const booking = await actOnVendorBooking(actor(request), request.params.id, request.body.action, request.body.reason, sessionMetadata(request));
  response.json({ data: withVendorActions(booking) });
});

export const vendorBookingRouter = Router();
vendorBookingRouter.use(authenticate, authorizePermission('booking:read:own'));

vendorBookingRouter.get('/', validate('query', listBookingsQuerySchema), asyncHandler(async (request, response) => {
  response.json(await listVendorBookings(request.auth!.userId, request.query as any));
}));

vendorBookingRouter.get('/report', validate('query', vendorReportQuerySchema), asyncHandler(async (request, response) => {
  response.json({ data: await vendorReport(request.auth!.userId, request.query as any) });
}));

vendorBookingRouter.post('/:id/actions', authorizePermission('booking:manage:own'), validate('params', bookingIdParamsSchema), validate('body', vendorBookingActionSchema), bookingActionHandler);

vendorBookingRouter.post('/:id/change', authorizePermission('booking:manage:own'), validate('params', bookingIdParamsSchema), validate('body', vendorChangeSchema), asyncHandler(async (request, response) => {
  response.json({ data: withVendorActions(await proposeBookingChange(actor(request), request.params.id, request.body, sessionMetadata(request))) });
}));

vendorBookingRouter.post('/:id/change-request', authorizePermission('booking:manage:own'), validate('params', bookingIdParamsSchema), validate('body', changeDecisionSchema), asyncHandler(async (request, response) => {
  response.json({ data: withVendorActions(await decideBookingChange(actor(request), request.params.id, request.body, sessionMetadata(request))) });
}));

export const adminBookingRouter = Router();
adminBookingRouter.use(authenticate, authorizePermission('booking:manage'));

adminBookingRouter.get('/', validate('query', adminBookingsQuerySchema), asyncHandler(async (request, response) => {
  response.json(await listAdminBookings(request.query as any));
}));

adminBookingRouter.get('/export', validate('query', adminBookingFiltersSchema), asyncHandler(async (request, response) => {
  const csv = await exportAdminBookings(actor(request), request.query as any, sessionMetadata(request));
  response.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="gbbookings-bookings-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' }).send(csv);
}));

adminBookingRouter.post('/:id/no-show-dispute', validate('params', bookingIdParamsSchema), validate('body', decideNoShowSchema), asyncHandler(async (request, response) => {
  response.json({ data: await decideNoShowDispute(actor(request), request.params.id, request.body, sessionMetadata(request)) });
}));

adminBookingRouter.get('/lookup', validate('query', bookingReferenceQuerySchema), asyncHandler(async (request, response) => {
  response.json({ data: await findBookingForAdmin((request.query as { reference: string }).reference) });
}));

adminBookingRouter.post('/:id/cancel', validate('params', bookingIdParamsSchema), validate('body', adminCancelBookingSchema), asyncHandler(async (request, response) => {
  response.json({ data: await adminCancelBooking(actor(request), request.params.id, request.body.reason, sessionMetadata(request)) });
}));
