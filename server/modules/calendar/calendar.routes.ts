import { Router } from 'express';
import { z } from 'zod';
import { connectDatabase } from '../../database/connection.js';
import { validate } from '../../middleware/validate.js';
import { ServiceUnavailableError } from '../../shared/app-error.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { calendarFeed } from './calendar.service.js';

export const calendarFeedRouter = Router();

// Public on purpose: other calendars fetch this without signing in. The long random token is the only key.
calendarFeedRouter.get('/:file', validate('params', z.object({ file: z.string().regex(/^[\w-]{40,64}\.ics$/, 'Calendar not found.') }).strict()), asyncHandler(async (request, response) => {
  if (!await connectDatabase()) throw new ServiceUnavailableError('Calendars are unavailable right now.');
  const feed = await calendarFeed(request.params.file.slice(0, -4));
  response.set({ 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'X-Robots-Tag': 'noindex' }).send(feed);
}));
