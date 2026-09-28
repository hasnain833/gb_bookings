import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, finalizeApp } from '../app.js';

function testApp() {
  return finalizeApp(createApp());
}

describe('listings API', () => {
  it('validates listing query parameters before database access', async () => {
    const response = await request(testApp()).get('/api/v1/listings?limit=101');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.requestId).toBeTypeOf('string');
  });

  it('returns a stable service unavailable error without MongoDB', async () => {
    const response = await request(testApp()).get('/api/v1/listings');
    expect(response.status).toBe(503);
    expect(response.body.error).toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      message: 'The catalog database is not configured or currently unavailable.',
    });
  });

  it('keeps unfinished writes explicit', async () => {
    const response = await request(testApp()).post('/api/bookings').send({});
    expect(response.status).toBe(501);
    expect(response.body.error.code).toBe('NOT_IMPLEMENTED');
  });
});
