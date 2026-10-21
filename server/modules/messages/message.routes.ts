import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { getConversation, listConversations, sendMessage, startConversation, unreadCounts } from './message.service.js';

const body = z.string().trim().min(1, 'Write a message first.').max(2_000);
const conversationParams = z.object({ id: z.string().regex(/^cnv_[0-9a-f-]{36}$/i, 'Invalid conversation.') }).strict();

export const messageRouter = Router();
messageRouter.use(authenticate);

messageRouter.get('/unread', asyncHandler(async (request, response) => {
  response.json({ data: await unreadCounts(request.auth!.userId) });
}));

messageRouter.get('/conversations', validate('query', z.object({ side: z.enum(['guest', 'partner']).default('guest') }).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await listConversations(request.auth!.userId, (request.query as any).side ?? 'guest') });
}));

messageRouter.post('/conversations', validate('body', z.object({ listingId: z.string().regex(/^lst_[0-9a-f-]{36}$/i), body }).strict()), asyncHandler(async (request, response) => {
  response.status(201).json({ data: await startConversation(request.auth!.userId, request.body.listingId, request.body.body) });
}));

messageRouter.get('/conversations/:id', validate('params', conversationParams), asyncHandler(async (request, response) => {
  response.json({ data: await getConversation(request.auth!.userId, request.params.id) });
}));

messageRouter.post('/conversations/:id/messages', validate('params', conversationParams), validate('body', z.object({ body }).strict()), asyncHandler(async (request, response) => {
  response.status(201).json({ data: await sendMessage(request.auth!.userId, request.params.id, request.body.body) });
}));
