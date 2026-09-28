import { logger } from '../../config/logger.js';
import { AuditLogModel } from '../../models/audit-log.model.js';

export interface AuditEventInput {
  actorId?: string;
  actorType: 'user' | 'system';
  action: string;
  resourceType: string;
  resourceId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function recordAuditEvent(event: AuditEventInput) {
  try {
    await AuditLogModel.create(event);
  } catch (error) {
    logger.error({ err: error, action: event.action, requestId: event.requestId }, 'Failed to record audit event');
  }
}
