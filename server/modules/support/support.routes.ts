import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorizePermission } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { sessionMetadata } from '../auth/auth.service.js';
import { listCases, listChatReports, readReportedChat, replyToCase, reviewChatReport, setCaseStatus, supportCounts } from './support.service.js';

export const supportBodySchema = z.object({ body: z.string().trim().min(5, 'Tell us a little more.').max(2_000) }).strict();
const caseParams = z.object({ id: z.string().regex(/^sup_[0-9a-f-]{36}$/i, 'Invalid case.') }).strict();
const chatParams = z.object({ id: z.string().regex(/^cnv_[0-9a-f-]{36}$/i, 'Invalid conversation.') }).strict();

export const adminSupportRouter = Router();
adminSupportRouter.use(authenticate, authorizePermission('support:manage'));

adminSupportRouter.get('/counts', asyncHandler(async (_request, response) => {
  response.json({ data: await supportCounts() });
}));

adminSupportRouter.get('/cases', validate('query', z.object({
  status: z.enum(['open', 'resolved']).default('open'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict()), asyncHandler(async (request, response) => {
  response.json(await listCases(request.query as any));
}));

adminSupportRouter.post('/cases/:id/reply', validate('params', caseParams), validate('body', z.object({ body: z.string().trim().min(2).max(2_000), resolve: z.boolean().default(false) }).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await replyToCase(request.auth!.userId, request.params.id, request.body.body, request.body.resolve, sessionMetadata(request)) });
}));

adminSupportRouter.post('/cases/:id/status', validate('params', caseParams), validate('body', z.object({ status: z.enum(['open', 'resolved']) }).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await setCaseStatus(request.auth!.userId, request.params.id, request.body.status, sessionMetadata(request)) });
}));

adminSupportRouter.get('/chat-reports', validate('query', z.object({ status: z.enum(['open', 'reviewed']).default('open') }).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await listChatReports((request.query as any).status) });
}));

adminSupportRouter.get('/chat-reports/:id', validate('params', chatParams), asyncHandler(async (request, response) => {
  response.json({ data: await readReportedChat(request.auth!.userId, request.params.id, sessionMetadata(request)) });
}));

adminSupportRouter.post('/chat-reports/:id/review', validate('params', chatParams), validate('body', z.object({ note: z.string().trim().min(3).max(1_000) }).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await reviewChatReport(request.auth!.userId, request.params.id, request.body.note, sessionMetadata(request)) });
}));
