import { Router, type RequestHandler } from 'express';
import { authenticate, authorizePermission } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { AppError } from '../../shared/app-error.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { sessionMetadata } from '../auth/auth.service.js';
import { listingIdParamsSchema } from '../listings/listing.schemas.js';
import {
  availabilityQuerySchema,
  bookingIdParamsSchema,
  cancelBookingSchema,
  createBookingSchema,
  listBookingsQuerySchema,
  vendorBookingActionSchema,
} from './booking.schemas.js';
import {
  actOnVendorBooking,
  cancelOwnBooking,
  createBooking,
  getBooking,
  getListingAvailability,
  listAllBookings,
  listCustomerBookings,
  listVendorBookings,
} from './booking.service.js';

const actor = (request: Parameters<RequestHandler>[0]) => ({ userId: request.auth!.userId, roles: request.auth!.roles });

export const availabilityHandlers: RequestHandler[] = [
  validate('params', listingIdParamsSchema),
  validate('query', availabilityQuerySchema),
  asyncHandler(async (request, response) => {
    response.json(await getListingAvailability(request.params.id, request.query as any));
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

bookingRouter.post('/:id/cancel', validate('params', bookingIdParamsSchema), validate('body', cancelBookingSchema), asyncHandler(async (request, response) => {
  response.json({ data: await cancelOwnBooking(actor(request), request.params.id, request.body.reason, sessionMetadata(request)) });
}));

const bookingActionHandler = asyncHandler(async (request, response) => {
  const booking = await actOnVendorBooking(actor(request), request.params.id, request.body.action, request.body.reason, sessionMetadata(request));
  response.json({ data: booking });
});

export const vendorBookingRouter = Router();
vendorBookingRouter.use(authenticate, authorizePermission('booking:read:own'));

vendorBookingRouter.get('/', validate('query', listBookingsQuerySchema), asyncHandler(async (request, response) => {
  response.json(await listVendorBookings(request.auth!.userId, request.query as any));
}));

vendorBookingRouter.post('/:id/actions', authorizePermission('booking:manage:own'), validate('params', bookingIdParamsSchema), validate('body', vendorBookingActionSchema), bookingActionHandler);

export const adminBookingRouter = Router();
adminBookingRouter.use(authenticate, authorizePermission('booking:manage'));

adminBookingRouter.get('/', validate('query', listBookingsQuerySchema), asyncHandler(async (request, response) => {
  response.json(await listAllBookings(request.query as any));
}));

adminBookingRouter.post('/:id/actions', validate('params', bookingIdParamsSchema), validate('body', vendorBookingActionSchema), bookingActionHandler);

adminBookingRouter.post('/:id/actions', validate('params', bookingIdParamsSchema), validate('body', vendorBookingActionSchema), bookingActionHandler);
