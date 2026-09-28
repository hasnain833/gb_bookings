import { Router } from 'express';
import { databaseState, isDatabaseReady } from '../../database/connection.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'gbbookings-api',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/ready', (_request, response) => {
  const ready = isDatabaseReady();
  response.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    database: databaseState(),
    timestamp: new Date().toISOString(),
  });
});
