import { Router } from 'express';
import { AppError } from '../shared/app-error.js';

// ponytail: the Support page has no backend yet; these keep it rendering an empty inbox until tickets are built.
export const compatibilityRouter = Router();

compatibilityRouter.get('/support/tickets', (_request, response) => response.json([]));
compatibilityRouter.all(['/support/tickets', '/support/tickets/:id/reply'], (_request, _response, next) => {
  next(new AppError(501, 'NOT_IMPLEMENTED', 'Support tickets are not available yet.'));
});
