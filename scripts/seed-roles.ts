import { connectDatabase, disconnectDatabase } from '../src/server/database/connection.js';
import { PermissionModel, type PermissionKey } from '../src/server/models/permission.model.js';
import { RoleModel } from '../src/server/models/role.model.js';

const permissionDescriptions: Record<PermissionKey, string> = {
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
};

const rolePermissions: Record<string, PermissionKey[]> = {
  customer: ['profile:read', 'profile:update', 'booking:read:own', 'booking:manage:own', 'listing:read'],
  vendor_owner: ['profile:read', 'profile:update', 'booking:read:own', 'booking:manage:own', 'listing:read', 'listing:manage:own', 'vendor:manage:own'],
  vendor_staff: ['profile:read', 'profile:update', 'booking:read:own', 'booking:manage:own', 'listing:read', 'listing:manage:own'],
  support_agent: ['profile:read', 'profile:update', 'booking:manage', 'support:manage'],
  admin: ['profile:read', 'profile:update', 'user:manage', 'vendor:manage', 'listing:moderate', 'booking:manage', 'finance:manage', 'support:manage', 'audit:read'],
  super_admin: Object.keys(permissionDescriptions) as PermissionKey[],
};

async function main() {
  if (!await connectDatabase()) throw new Error('MongoDB is required to seed roles and permissions.');

  for (const [key, description] of Object.entries(permissionDescriptions)) {
    await PermissionModel.updateOne({ key }, { $set: { description } }, { upsert: true });
  }

  for (const [key, permissions] of Object.entries(rolePermissions)) {
    const name = key.split('_').map((word) => `${word[0].toUpperCase()}${word.slice(1)}`).join(' ');
    await RoleModel.updateOne({ key }, { $set: { name, permissions, system: true } }, { upsert: true });
  }
}

main()
  .then(() => disconnectDatabase())
  .catch(async (error) => {
    console.error(error);
    await disconnectDatabase();
    process.exitCode = 1;
  });
