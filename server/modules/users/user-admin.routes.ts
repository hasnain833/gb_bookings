import { Router } from 'express';
import { authenticate, authorizePermission } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { sessionMetadata } from '../auth/auth.service.js';
import { listUsersQuerySchema, userIdParamsSchema, userStatusActionSchema } from './user-admin.schemas.js';
import { changeUserStatus, listUsers } from './user-admin.service.js';

export const adminUserRouter = Router();

adminUserRouter.use(authenticate, authorizePermission('user:manage'));

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
