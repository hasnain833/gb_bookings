import { Router } from 'express';
import { authenticate, authorizePermission } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { sessionMetadata } from '../auth/auth.service.js';
import {
  attachVendorDocument,
  createVendorApplication,
  decideVendorApplication,
  decideVendorChanges,
  requestVendorChanges,
  getOwnVendor,
  listVendorApplications,
  submitOwnVendor,
  updateOwnVendor,
} from './vendor.service.js';
import {
  attachVendorDocumentSchema,
  createVendorSchema,
  listVendorsQuerySchema,
  updateVendorSchema,
  vendorChangeDecisionSchema,
  vendorChangeRequestSchema,
  vendorDecisionSchema,
  vendorIdParamsSchema,
} from './vendor.schemas.js';

export const vendorRouter = Router();
export const adminVendorRouter = Router();

// Applicants are customers until approval; the service only lets the application's owner change it while draft/rejected.
vendorRouter.use(authenticate);

vendorRouter.post('/', validate('body', createVendorSchema), asyncHandler(async (request, response) => {
  const vendor = await createVendorApplication(request.auth!.userId, request.body, sessionMetadata(request));
  response.status(201).json({ data: vendor });
}));

vendorRouter.get('/me', asyncHandler(async (request, response) => {
  const result = await getOwnVendor(request.auth!.userId);
  response.json({ data: result.public, membership: { role: result.membership.role } });
}));

vendorRouter.patch('/me', validate('body', updateVendorSchema), asyncHandler(async (request, response) => {
  const vendor = await updateOwnVendor(request.auth!.userId, request.body, sessionMetadata(request));
  response.json({ data: vendor });
}));

vendorRouter.post('/me/documents', validate('body', attachVendorDocumentSchema), asyncHandler(async (request, response) => {
  const vendor = await attachVendorDocument(request.auth!.userId, request.body, sessionMetadata(request));
  response.status(201).json({ data: vendor });
}));

vendorRouter.post('/me/change-request', validate('body', vendorChangeRequestSchema), asyncHandler(async (request, response) => {
  response.json({ data: await requestVendorChanges(request.auth!.userId, request.body, sessionMetadata(request)) });
}));

vendorRouter.post('/me/submit', asyncHandler(async (request, response) => {
  const vendor = await submitOwnVendor(request.auth!.userId, sessionMetadata(request));
  response.json({ data: vendor });
}));

adminVendorRouter.use(authenticate, authorizePermission('vendor:manage'));

adminVendorRouter.get('/', validate('query', listVendorsQuerySchema), asyncHandler(async (request, response) => {
  response.json(await listVendorApplications(request.query as any));
}));

adminVendorRouter.post('/:id/decision', validate('params', vendorIdParamsSchema), validate('body', vendorDecisionSchema), asyncHandler(async (request, response) => {
  const vendor = await decideVendorApplication(
    request.auth!.userId,
    request.params.id,
    request.body,
    sessionMetadata(request),
  );
  response.json({ data: vendor });
}));

adminVendorRouter.post('/:id/changes/decision', validate('params', vendorIdParamsSchema), validate('body', vendorChangeDecisionSchema), asyncHandler(async (request, response) => {
  response.json({ data: await decideVendorChanges(request.auth!.userId, request.params.id, request.body, sessionMetadata(request)) });
}));
