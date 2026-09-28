import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, finalizeApp } from '../app.js';
import { createVendorSchema, vendorDecisionSchema } from '../modules/vendors/vendor.schemas.js';

function testApp() {
  return finalizeApp(createApp());
}

describe('vendor onboarding API', () => {
  it('protects vendor applications', async () => {
    const response = await request(testApp()).post('/api/v1/vendors').send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('protects the admin review queue', async () => {
    const response = await request(testApp()).get('/api/v1/admin/vendors');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('validates complete vendor application input', () => {
    const result = createVendorSchema.safeParse({
      name: 'Northern Stays',
      email: 'vendor@example.com',
      phone: '+923001234567',
      businessType: 'hotel',
      address: { line1: 'Main Road', city: 'Gilgit', region: 'Gilgit-Baltistan', country: 'PK' },
    });
    expect(result.success).toBe(true);
  });

  it('requires review notes for vendor decisions', () => {
    expect(vendorDecisionSchema.safeParse({ decision: 'approved', notes: '' }).success).toBe(false);
  });
});
