import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, finalizeApp } from '../app.js';

function testApp() {
  return finalizeApp(createApp());
}

describe('health API', () => {
  it('reports liveness without requiring the database', async () => {
    const response = await request(testApp()).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'gbbookings-api' });
  });

  it('reports not ready when MongoDB is not configured', async () => {
    const response = await request(testApp()).get('/api/health/ready');
    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({ status: 'not_ready', database: 'disconnected' });
  });

  it('publishes an OpenAPI document', async () => {
    const response = await request(testApp()).get('/api/docs/openapi.json');
    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.1.0');
    expect(response.body.paths['/listings']).toBeDefined();
  });
});
