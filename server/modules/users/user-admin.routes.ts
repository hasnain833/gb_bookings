import { Router } from 'express';
import { authenticate, authorizePermission } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { sessionMetadata } from '../auth/auth.service.js';
import { createStaffSchema, listUsersQuerySchema, userIdParamsSchema, userStatusActionSchema } from './user-admin.schemas.js';
import { changeUserStatus, createStaffAccount, listUsers } from './user-admin.service.js';

export const adminUserRouter = Router();

adminUserRouter.use(authenticate, authorizePermission('user:manage'));

adminUserRouter.post('/', validate('body', createStaffSchema), asyncHandler(async (request, response) => {
  response.status(201).json(await createStaffAccount(
    { userId: request.auth!.userId, roles: request.auth!.roles }, request.body, sessionMetadata(request),
  ));
}));

adminUserRouter.get('/', validate('query', listUsersQuerySchema), asyncHandler(async (request, response) => {
  response.json(await listUsers(request.query as any));
}));

adminUserRouter.post('/:id/status', validate('params', userIdParamsSchema), validate('body', userStatusActionSchema), asyncHandler(async (request, response) => {
  const user = await changeUserStatus(
    { userId: request.auth!.userId, roles: request.auth!.roles },
    request.params.id,
    request.body,
    sessionMetadata(request),
  );
  response.json({ data: user });
}));
