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
  duplicateListing,
  listListingsForModeration,
  listOwnListings,
  listRoomTypes,
  moderateListing,
  submitListing,
  updateHotelListing,
  updateRoomType,
} from './vendor-listing.service.js';
import {
  createHotelListingSchema,
  listingDecisionSchema,
  listingParamsSchema,
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

vendorListingRouter.delete('/:id/rooms/:roomId', validate('params', roomParamsSchema), asyncHandler(async (request, response) => {
  await archiveRoomType(request.auth!.userId, request.params.id, request.params.roomId);
  response.status(204).send();
}));

adminListingRouter.use(authenticate, authorizePermission('listing:moderate'));
adminListingRouter.get('/', asyncHandler(async (_request, response) => {
  response.json({ data: await listListingsForModeration() });
}));
adminListingRouter.post('/:id/decision', validate('params', listingParamsSchema), validate('body', listingDecisionSchema), asyncHandler(async (request, response) => {
  const listing = await moderateListing(request.auth!.userId, request.params.id, request.body, sessionMetadata(request));
  response.json({ data: listing });
}));
