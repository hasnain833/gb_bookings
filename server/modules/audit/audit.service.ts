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
    console.error(`Failed to record audit event ${event.action} [${event.requestId ?? 'no-request-id'}]:`, error);
  }
}
