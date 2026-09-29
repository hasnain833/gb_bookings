import { connectDatabase } from '../../database/connection.js';
import { UserModel, type UserRole } from '../../models/user.model.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { escapeRegex } from '../../shared/escape-regex.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import { revokeAllSessions, type SessionMetadata } from '../auth/auth.service.js';

const privilegedRoles: UserRole[] = ['admin', 'super_admin'];

async function requireDatabase() {
  if (!await connectDatabase()) throw new ServiceUnavailableError('User administration is unavailable while the database is disconnected.');
}

function serializeAdminUser(user: any) {
  return {
    id: user.publicId,
    email: user.email,
    name: user.name,
    phone: user.phone,
    roles: user.roles,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
    createdAt: user.createdAt,
  };
}

export async function listUsers(query: { status?: string; role?: string; search?: string; page: number; limit: number }) {
  await requireDatabase();
  const filter: Record<string, unknown> = { deletedAt: null };
  if (query.status) filter.status = query.status;
  if (query.role) filter.roles = query.role;
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ email: pattern }, { name: pattern }];
  }
  const [users, total] = await Promise.all([
    UserModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    UserModel.countDocuments(filter),
  ]);
  return { data: users.map(serializeAdminUser), pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
}

export async function changeUserStatus(
  actor: { userId: string; roles: UserRole[] },
  targetPublicId: string,
  input: { action: 'activate' | 'suspend' | 'archive' | 'verify_email'; reason: string },
  metadata: SessionMetadata,
) {
  await requireDatabase();
  const user = await UserModel.findOne({ publicId: targetPublicId, deletedAt: null });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User was not found.');
  if (String(user._id) === actor.userId) throw new AppError(409, 'CANNOT_MODIFY_SELF', 'You cannot change the status of your own account.');
  if (user.roles.some((role: UserRole) => privilegedRoles.includes(role)) && !actor.roles.includes('super_admin')) {
    throw new AppError(403, 'PERMISSION_DENIED', 'Only a super admin can change another administrator.');
  }

  if (input.action === 'verify_email') {
    user.emailVerifiedAt ??= new Date();
  } else if (input.action === 'activate') {
    user.status = 'active';
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
  } else {
    user.status = input.action === 'suspend' ? 'suspended' : 'archived';
  }
  await user.save();
  if (input.action === 'suspend' || input.action === 'archive') await revokeAllSessions(String(user._id));

  await recordAuditEvent({
    actorId: actor.userId, actorType: 'user', action: `user.${input.action}`,
    resourceType: 'user', resourceId: user.publicId, ...metadata,
    metadata: { reason: input.reason },
  });
  return serializeAdminUser(user);
}
