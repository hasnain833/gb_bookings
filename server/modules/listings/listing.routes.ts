import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { getPublishedListing, listPublishedListings } from './listing.service.js';
import { listingIdParamsSchema, listListingsQuerySchema } from './listing.schemas.js';

export function createListingRouter() {
  const router = Router();

  router.get(
    '/',
    validate('query', listListingsQuerySchema),
    asyncHandler(async (request, response) => {
      const result = await listPublishedListings(request.query as any);
      response.json(result);
    }),
  );

  router.get(
    '/:id',
    validate('params', listingIdParamsSchema),
    asyncHandler(async (request, response) => {
      const listing = await getPublishedListing(request.params.id);
      response.json({ data: listing });
    }),
  );

  return router;
}
