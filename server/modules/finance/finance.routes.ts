import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { connectDatabase } from '../../database/connection.js';
import { authenticate, authorizePermission } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { ServiceUnavailableError } from '../../shared/app-error.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { sessionMetadata } from '../auth/auth.service.js';
import { adminPayout, createPayout, listAllPayouts, listBalances, partnerFinance, partnerPayout, reconciliation, settlePayout } from './payouts.service.js';
import { autoRefundsEnabled, listRefunds, markRefundSent, retryRefund } from './refunds.service.js';

const requireDatabase: RequestHandler = asyncHandler(async (_request, _response, next) => {
  if (!await connectDatabase()) throw new ServiceUnavailableError('Finance is unavailable while the database is disconnected.');
  next();
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD date format.');
const refundParams = z.object({ bookingId: z.string().regex(/^bkg_[0-9a-f-]{36}$/i), refundId: z.string().regex(/^[0-9a-f]{24}$/i) }).strict();
const payoutParams = z.object({ id: z.string().regex(/^pyt_[0-9a-f-]{36}$/i, 'Invalid statement.') }).strict();

export const adminFinanceRouter = Router();
adminFinanceRouter.use(authenticate, authorizePermission('finance:manage'), requireDatabase);

adminFinanceRouter.get('/refunds', validate('query', z.object({ filter: z.enum(['open', 'sent']).default('open') }).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await listRefunds((request.query as any).filter ?? 'open'), autoRefunds: autoRefundsEnabled() });
}));

adminFinanceRouter.post('/refunds/:bookingId/:refundId/retry', validate('params', refundParams), asyncHandler(async (request, response) => {
  response.json({ data: await retryRefund(request.auth!.userId, request.params.bookingId, request.params.refundId) });
}));

adminFinanceRouter.post('/refunds/:bookingId/:refundId/mark-sent', validate('params', refundParams), validate('body', z.object({ note: z.string().trim().min(3).max(500) }).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await markRefundSent(request.auth!.userId, request.params.bookingId, request.params.refundId, request.body.note, sessionMetadata(request)) });
}));

adminFinanceRouter.get('/balances', asyncHandler(async (_request, response) => {
  response.json({ data: await listBalances() });
}));

adminFinanceRouter.get('/payouts', asyncHandler(async (_request, response) => {
  response.json({ data: await listAllPayouts() });
}));

adminFinanceRouter.post('/payouts', validate('body', z.object({ vendorId: z.string().regex(/^vnd_[0-9a-f-]{36}$/i) }).strict()), asyncHandler(async (request, response) => {
  response.status(201).json({ data: await createPayout(request.auth!.userId, request.body.vendorId, sessionMetadata(request)) });
}));

adminFinanceRouter.get('/payouts/:id', validate('params', payoutParams), asyncHandler(async (request, response) => {
  response.json({ data: await adminPayout(request.params.id) });
}));

adminFinanceRouter.post('/payouts/:id/settle', validate('params', payoutParams), validate('body', z.object({ bankReference: z.string().trim().min(3).max(120) }).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await settlePayout(request.auth!.userId, request.params.id, request.body.bankReference, sessionMetadata(request)) });
}));

adminFinanceRouter.get('/reconciliation', validate('query', z.object({ from: isoDate, to: isoDate }).strict()), asyncHandler(async (request, response) => {
  response.json({ data: await reconciliation(request.query as any) });
}));

export const partnerFinanceRouter = Router();
partnerFinanceRouter.use(authenticate, requireDatabase);

partnerFinanceRouter.get('/', asyncHandler(async (request, response) => {
  response.json({ data: await partnerFinance(request.auth!.userId) });
}));

partnerFinanceRouter.get('/payouts/:id', validate('params', payoutParams), asyncHandler(async (request, response) => {
  response.json({ data: await partnerPayout(request.auth!.userId, request.params.id) });
}));
