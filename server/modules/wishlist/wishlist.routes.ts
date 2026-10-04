import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { UserModel } from '../../models/user.model.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { getPublishedListing, listPublishedListingsByIds } from '../listings/listing.service.js';
import { listingIdParamsSchema } from '../listings/listing.schemas.js';

export const wishlistRouter = Router();

wishlistRouter.use(authenticate);

wishlistRouter.get('/', asyncHandler(async (request, response) => {
  const user = await UserModel.findById(request.auth!.userId).select('wishlist').lean() as { wishlist?: string[] } | null;
  response.json(await listPublishedListingsByIds(user?.wishlist ?? []));
}));

wishlistRouter.post(
  '/',
  validate('body', z.object({ listingId: z.string().trim().min(1).max(120) })),
  asyncHandler(async (request, response) => {
    // Only published listings can be saved; unknown IDs get a 404 from the lookup.
    const listing = await getPublishedListing(request.body.listingId);
    await UserModel.updateOne({ _id: request.auth!.userId }, { $addToSet: { wishlist: listing.id } });
    response.status(204).end();
  }),
);

wishlistRouter.delete('/:id', validate('params', listingIdParamsSchema), asyncHandler(async (request, response) => {
  await UserModel.updateOne({ _id: request.auth!.userId }, { $pull: { wishlist: request.params.id } });
  response.status(204).end();
}));
