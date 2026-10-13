import { Router } from 'express';
import { authenticate, authorizePermission } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { sessionMetadata } from '../auth/auth.service.js';
import {
  addRoomType,
  archiveListing,
  archiveRoomType,
  createHotelListing,
  getRoomCalendar,
  setRoomClosures,
  duplicateListing,
  listListingsForModeration,
  listRoomsForModeration,
  listOwnListings,
  listRoomTypes,
  moderateListing,
  setListingAvailability,
  submitListing,
  updateHotelListing,
  updateRoomType,
} from './vendor-listing.service.js';
import {
  adminListingsQuerySchema,
  createHotelListingSchema,
  listingDecisionSchema,
  listingParamsSchema,
  listingStatusSchema,
  roomCalendarQuerySchema,
  roomClosureSchema,
  roomParamsSchema,
  roomTypeSchema,
  updateHotelListingSchema,
  updateRoomTypeSchema,
} from './vendor-listing.schemas.js';

export const vendorListingRouter = Router();
export const adminListingRouter = Router();

vendorListingRouter.use(authenticate, authorizePermission('listing:manage:own'));

vendorListingRouter.get('/', asyncHandler(async (request, response) => {
  response.json({ data: await listOwnListings(request.auth!.userId) });
}));

vendorListingRouter.post('/', validate('body', createHotelListingSchema), asyncHandler(async (request, response) => {
  const listing = await createHotelListing(request.auth!.userId, request.body, sessionMetadata(request));
  response.status(201).json({ data: listing });
}));

vendorListingRouter.patch('/:id', validate('params', listingParamsSchema), validate('body', updateHotelListingSchema), asyncHandler(async (request, response) => {
  const listing = await updateHotelListing(request.auth!.userId, request.params.id, request.body, sessionMetadata(request));
  response.json({ data: listing });
}));

vendorListingRouter.delete('/:id', validate('params', listingParamsSchema), asyncHandler(async (request, response) => {
  await archiveListing(request.auth!.userId, request.params.id, sessionMetadata(request));
  response.status(204).send();
}));

vendorListingRouter.post('/:id/submit', validate('params', listingParamsSchema), asyncHandler(async (request, response) => {
  const listing = await submitListing(request.auth!.userId, request.params.id, sessionMetadata(request));
  response.json({ data: listing });
}));

vendorListingRouter.post('/:id/status', validate('params', listingParamsSchema), validate('body', listingStatusSchema), asyncHandler(async (request, response) => {
  const listing = await setListingAvailability(request.auth!.userId, request.params.id, request.body.status, sessionMetadata(request));
  response.json({ data: listing });
}));

vendorListingRouter.post('/:id/duplicate', validate('params', listingParamsSchema), asyncHandler(async (request, response) => {
  const listing = await duplicateListing(request.auth!.userId, request.params.id, sessionMetadata(request));
  response.status(201).json({ data: listing });
}));

vendorListingRouter.get('/:id/rooms', validate('params', listingParamsSchema), asyncHandler(async (request, response) => {
  response.json({ data: await listRoomTypes(request.auth!.userId, request.params.id) });
}));

vendorListingRouter.post('/:id/rooms', validate('params', listingParamsSchema), validate('body', roomTypeSchema), asyncHandler(async (request, response) => {
  const room = await addRoomType(request.auth!.userId, request.params.id, request.body, sessionMetadata(request));
  response.status(201).json({ data: room });
}));

vendorListingRouter.patch('/:id/rooms/:roomId', validate('params', roomParamsSchema), validate('body', updateRoomTypeSchema), asyncHandler(async (request, response) => {
  const room = await updateRoomType(request.auth!.userId, request.params.id, request.params.roomId, request.body, sessionMetadata(request));
  response.json({ data: room });
}));

vendorListingRouter.get('/:id/rooms/:roomId/calendar', validate('params', roomParamsSchema), validate('query', roomCalendarQuerySchema), asyncHandler(async (request, response) => {
  const { from, to } = request.query as { from: string; to: string };
  response.json({ data: await getRoomCalendar(request.auth!.userId, request.params.id, request.params.roomId, from, to) });
}));

vendorListingRouter.put('/:id/rooms/:roomId/calendar', validate('params', roomParamsSchema), validate('body', roomClosureSchema), asyncHandler(async (request, response) => {
  response.json({ data: await setRoomClosures(request.auth!.userId, request.params.id, request.params.roomId, request.body, sessionMetadata(request)) });
}));

vendorListingRouter.delete('/:id/rooms/:roomId', validate('params', roomParamsSchema), asyncHandler(async (request, response) => {
  await archiveRoomType(request.auth!.userId, request.params.id, request.params.roomId);
  response.status(204).send();
}));

adminListingRouter.use(authenticate, authorizePermission('listing:moderate'));
adminListingRouter.get('/', validate('query', adminListingsQuerySchema), asyncHandler(async (request, response) => {
  response.json(await listListingsForModeration(request.query as any));
}));

adminListingRouter.get('/:id/rooms', validate('params', listingParamsSchema), asyncHandler(async (request, response) => {
  response.json({ data: await listRoomsForModeration(request.params.id) });
}));
adminListingRouter.post('/:id/decision', validate('params', listingParamsSchema), validate('body', listingDecisionSchema), asyncHandler(async (request, response) => {
  const listing = await moderateListing(request.auth!.userId, request.params.id, request.body, sessionMetadata(request));
  response.json({ data: listing });
}));
