import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, finalizeApp } from '../app.js';

function testApp() {
  return finalizeApp(createApp());
}

describe('authentication API', () => {
  it('validates registration before database access', async () => {
    const response = await request(testApp()).post('/api/auth/register').send({
      name: 'A',
      email: 'not-an-email',
      password: 'short',
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('does not allow public callers to assign privileged roles', async () => {
    const response = await request(testApp()).post('/api/auth/register').send({
      name: 'Valid User',
      email: 'user@example.com',
      password: 'Password123',
      roles: ['admin'],
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns service unavailable when registration has no database', async () => {
    const response = await request(testApp()).post('/api/v1/auth/register').send({
      name: 'Valid User',
      email: 'user@example.com',
      password: 'Password123',
    });
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('requires an authenticated session for the current user', async () => {
    const response = await request(testApp()).get('/api/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('rejects refresh requests without a refresh cookie', async () => {
    const response = await request(testApp()).post('/api/auth/refresh');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('clears auth cookies on logout even when the database is offline', async () => {
    const response = await request(testApp()).post('/api/auth/logout');
    expect(response.status).toBe(204);
    expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([
      expect.stringContaining('gb_access_token='),
      expect.stringContaining('gb_refresh_token='),
    ]));
  });

  it('does not claim password recovery email was sent without a provider', async () => {
    const response = await request(testApp()).post('/api/auth/forgot-password').send({
      email: 'user@example.com',
    });
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('EMAIL_PROVIDER_NOT_CONFIGURED');
  });

  it('requires authentication before resending a verification email', async () => {
    const response = await request(testApp()).post('/api/auth/email-verification/request');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('validates password reset tokens before database access', async () => {
    const response = await request(testApp()).post('/api/auth/reset-password').send({
      token: 'too-short',
      newPassword: 'NewPassword123',
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns database unavailability for a well-formed verification token', async () => {
    const response = await request(testApp()).post('/api/auth/email-verification/confirm').send({
      token: 'a'.repeat(64),
    });
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('validates two-factor login codes before database access', async () => {
    const response = await request(testApp()).post('/api/auth/login/verify-otp').send({
      challengeId: 'not-a-challenge',
      code: '12ab',
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('protects session history', async () => {
    const response = await request(testApp()).get('/api/auth/sessions');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('protects two-factor setup', async () => {
    const response = await request(testApp()).post('/api/auth/two-factor/setup').send({ channel: 'email' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});
