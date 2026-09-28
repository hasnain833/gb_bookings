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
  const server = createServer(app);

  if (env.NODE_ENV === 'development') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_request, response) => response.sendFile(path.join(distPath, 'index.html')));
  }

  finalizeApp(app);
  await connectDatabase();

  await new Promise<void>((resolve, reject) => {
    const handleStartupError = (error: NodeJS.ErrnoException) => {
      server.off('listening', handleListening);
      reject(error);
    };
    const handleListening = () => {
      server.off('error', handleStartupError);
      resolve();
    };

    server.once('error', handleStartupError);
    server.once('listening', handleListening);
    server.listen(env.PORT, '0.0.0.0');
  });

  logger.info({ port: env.PORT, environment: env.NODE_ENV }, 'GBBookings server started');

  server.on('error', (error) => {
    logger.error({ err: error }, 'HTTP server error');
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
