import type { UserRole } from '../../models/user.model.js';

// Single source of truth for permissions; roles map to these in code, not in the database.
export const permissionDescriptions = {
  'profile:read': 'Read the current user profile.',
  'profile:update': 'Update the current user profile.',
  'booking:read:own': 'Read bookings owned by the current user or vendor.',
  'booking:manage:own': 'Manage bookings owned by the current user or vendor.',
  'listing:read': 'Read marketplace listings.',
  'listing:manage:own': 'Manage listings owned by the current vendor.',
  'vendor:manage:own': 'Manage the current vendor organization.',
  'support:manage': 'Manage assigned support operations.',
  'user:manage': 'Manage marketplace users.',
  'vendor:manage': 'Review and manage all vendors.',
  'listing:moderate': 'Approve, reject, or suspend marketplace listings.',
  'booking:manage': 'Manage all marketplace bookings.',
  'finance:manage': 'Manage financial operations, refunds, and payouts.',
  'audit:read': 'Read security and operational audit records.',
} satisfies Record<string, string>;

export type PermissionKey = keyof typeof permissionDescriptions;

export const rolePermissions: Record<UserRole, readonly PermissionKey[]> = {
  customer: ['profile:read', 'profile:update', 'booking:read:own', 'booking:manage:own', 'listing:read'],
  vendor_owner: ['profile:read', 'profile:update', 'booking:read:own', 'booking:manage:own', 'listing:read', 'listing:manage:own', 'vendor:manage:own'],
  vendor_staff: ['profile:read', 'profile:update', 'booking:read:own', 'booking:manage:own', 'listing:read', 'listing:manage:own'],
  support_agent: ['profile:read', 'profile:update', 'booking:manage', 'support:manage'],
  admin: ['profile:read', 'profile:update', 'user:manage', 'vendor:manage', 'listing:moderate', 'booking:manage', 'finance:manage', 'support:manage', 'audit:read'],
  super_admin: Object.keys(permissionDescriptions) as PermissionKey[],
};

export function hasPermission(roles: UserRole[], permission: PermissionKey) {
  return roles.some((role) => rolePermissions[role]?.includes(permission));
}
