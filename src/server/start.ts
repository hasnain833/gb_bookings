import { createServer } from 'node:http';
import path from 'node:path';
import type { Express } from 'express';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { finalizeApp } from './app.js';

export async function startServer(app: Express) {
  await connectDatabase();

  if (env.NODE_ENV === 'development') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_request, response) => response.sendFile(path.join(distPath, 'index.html')));
  }

  finalizeApp(app);
  const server = createServer(app);

  server.listen(env.PORT, '0.0.0.0', () => {
    logger.info({ port: env.PORT, environment: env.NODE_ENV }, 'GBBookings server started');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  return server;
}
