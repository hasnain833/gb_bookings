import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, finalizeApp } from '../app.js';
import { mediaIdParamsSchema } from '../modules/media/media.schemas.js';

function testApp() { return finalizeApp(createApp()); }

describe('media API', () => {
  it('checks authentication before accepting upload bodies', async () => {
    const response = await request(testApp()).post('/api/v1/media/images');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('protects the owned media collection', async () => {
    const response = await request(testApp()).get('/api/v1/media');
    expect(response.status).toBe(401);
  });

  it('validates public media identifiers', () => {
    expect(mediaIdParamsSchema.safeParse({ id: 'invalid' }).success).toBe(false);
  });
});
