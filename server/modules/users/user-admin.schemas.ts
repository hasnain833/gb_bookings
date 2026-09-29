import { z } from 'zod';
import { userRoles } from '../../models/user.model.js';

export const listUsersQuerySchema = z.object({
  status: z.enum(['active', 'suspended', 'archived']).optional(),
  role: z.enum(userRoles).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
}).strict();

export const userIdParamsSchema = z.object({
  id: z.string().regex(/^usr_[0-9a-f-]{36}$/i, 'Invalid user identifier.'),
}).strict();

export const userStatusActionSchema = z.object({
  action: z.enum(['activate', 'suspend', 'archive', 'verify_email']),
  reason: z.string().trim().min(3).max(1_000),
}).strict();
