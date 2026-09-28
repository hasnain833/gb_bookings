import { describe, expect, it } from 'vitest';
import { hasPermission } from '../modules/auth/rbac.js';

describe('role permissions', () => {
  it('allows vendor owners to manage their own vendor but not approve vendors', () => {
    expect(hasPermission(['vendor_owner'], 'vendor:manage:own')).toBe(true);
    expect(hasPermission(['vendor_owner'], 'vendor:manage')).toBe(false);
  });

  it('allows admins to review vendors and audit events', () => {
    expect(hasPermission(['admin'], 'vendor:manage')).toBe(true);
    expect(hasPermission(['admin'], 'audit:read')).toBe(true);
  });

  it('does not grant customer accounts vendor permissions', () => {
    expect(hasPermission(['customer'], 'vendor:manage:own')).toBe(false);
  });
});
