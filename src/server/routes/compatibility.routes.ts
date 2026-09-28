import { Router } from 'express';
import { AppError } from '../shared/app-error.js';

export const compatibilityRouter = Router();

const emptyCollections = [
  '/bookings',
  '/notifications',
  '/support/tickets',
  '/wallet/transactions',
  '/wishlist',
];

for (const path of emptyCollections) {
  compatibilityRouter.get(path, (_request, response) => response.json([]));
}

compatibilityRouter.all(
  [
    '/bookings',
    '/bookings/:id',
    '/reviews',
    '/notifications/:id/read',
    '/support/tickets',
    '/support/tickets/:id/reply',
    '/wallet/*',
    '/wishlist',
    '/wishlist/:id',
    '/coupons/*',
    '/host/message',
  ],
  (_request, _response, next) => {
    next(new AppError(501, 'NOT_IMPLEMENTED', 'This backend module has not been implemented yet.'));
  },
);
