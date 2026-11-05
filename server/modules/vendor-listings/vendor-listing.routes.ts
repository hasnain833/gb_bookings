import { Router, type Request } from 'express';
import { AppError } from '../../shared/app-error.js';
import { addCalendarFeed, calendarSyncStatus, removeCalendarFeed, resetCalendarLink, syncCalendarsNow } from '../calendar/calendar.service.js';
import { authenticate, authorizePermission } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { sessionMetadata } from '../auth/auth.service.js';
import { z } from 'zod';
import {
  addRoomType,
  assertListingAccess,
  archiveListing,
  archiveRoomType,
  createHotelListing,
  deleteListingDraft,
  getListingDraft,
  saveListingDraft,
  getRoomCalendar,
  setRoomClosures,
  duplicateListing,
  listListingsForModeration,
  listRoomsForModeration,
  listOwnListings,
  listRoomTypes,
  decideListingRevision,
  moderateListing,
  ownedRoom,
  setListingAvailability,
  submitListing,
  updateHotelListing,
  updateRoomType,
} from './vendor-listing.service.js';
import {
  adminListingsQuerySchema,
  createHotelListingSchema,
  listingDecisionSchema,
  revisionDecisionSchema,
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

vendorListingRouter.use(authenticate, asyncHandler(async (request, _response, next) => {
  await assertListingAccess(request.auth!.userId);
  next();
}));

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

const calendarFeedSchema = z.object({ name: z.string().trim().min(2).max(60), url: z.string().trim().min(10).max(2000) }).strict();
const calendarFeedParams = roomParamsSchema.extend({ feedId: z.string().regex(/^fed_[0-9a-f-]{36}$/i, 'Invalid calendar.') });
const ownedCalendarRoom = async (request: Request) => {
  const { listing, room } = await ownedRoom(request.auth!.userId, request.params.id, request.params.roomId);
  if (listing.type === 'tour') throw new AppError(422, 'CALENDAR_SYNC_NOT_SUPPORTED', 'Calendar sync is for rooms and cars. Tours sell seats.');
  return room;
};

vendorListingRouter.get('/:id/rooms/:roomId/calendar-sync', validate('params', roomParamsSchema), asyncHandler(async (request, response) => {
  response.json({ data: await calendarSyncStatus(await ownedCalendarRoom(request)) });
}));

vendorListingRouter.post('/:id/rooms/:roomId/calendar-sync/feeds', validate('params', roomParamsSchema), validate('body', calendarFeedSchema), asyncHandler(async (request, response) => {
  response.status(201).json({ data: await addCalendarFeed(await ownedCalendarRoom(request), request.body) });
}));

vendorListingRouter.delete('/:id/rooms/:roomId/calendar-sync/feeds/:feedId', validate('params', calendarFeedParams), asyncHandler(async (request, response) => {
  response.json({ data: await removeCalendarFeed(await ownedCalendarRoom(request), request.params.feedId) });
}));

vendorListingRouter.post('/:id/rooms/:roomId/calendar-sync/run', validate('params', roomParamsSchema), asyncHandler(async (request, response) => {
  response.json({ data: await syncCalendarsNow(await ownedCalendarRoom(request)) });
}));

vendorListingRouter.post('/:id/rooms/:roomId/calendar-sync/link', validate('params', roomParamsSchema), asyncHandler(async (request, response) => {
  response.json({ data: await resetCalendarLink(await ownedCalendarRoom(request)) });
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

adminListingRouter.post('/:id/revision/decision', validate('params', listingParamsSchema), validate('body', revisionDecisionSchema), asyncHandler(async (request, response) => {
  const listing = await decideListingRevision(request.auth!.userId, request.params.id, request.body, sessionMetadata(request));
  response.json({ data: listing });
}));

/** "Add a property" wizard progress. Not behind listing:manage:own: applicants (still customers) may draft too. */
export const listingDraftRouter = Router();
const draftKindParams = z.object({ kind: z.enum(['hotel', 'homestay', 'car', 'tour']) }).strict();

listingDraftRouter.use(authenticate);

listingDraftRouter.get('/:kind', validate('params', draftKindParams), asyncHandler(async (request, response) => {
  response.json({ data: await getListingDraft(request.auth!.userId, request.params.kind) });
}));

listingDraftRouter.put('/:kind', validate('params', draftKindParams), validate('body', z.object({
  step: z.number().int().min(0).max(20),
  data: z.record(z.string(), z.unknown()),
}).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await saveListingDraft(request.auth!.userId, request.params.kind, request.body) });
}));

listingDraftRouter.delete('/:kind', validate('params', draftKindParams), asyncHandler(async (request, response) => {
  await deleteListingDraft(request.auth!.userId, request.params.kind);
  response.status(204).send();
}));
