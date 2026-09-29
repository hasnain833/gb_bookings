import { createServer } from 'node:http';
import path from 'node:path';
import express, { type Express } from 'express';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { finalizeApp } from './app.js';

export async function startServer(app: Express) {
  const server = createServer(app);

  if (env.NODE_ENV === 'production') {
    // Single-process deploys serve the built frontend; in development Vite serves it on port 3000.
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get(/^(?!\/api\/).*/, (_request, response) => response.sendFile(path.join(distPath, 'index.html')));
  }

  finalizeApp(app);
  if (env.NODE_ENV === 'production') {
    await connectDatabase();
  } else {
    void connectDatabase();
  }

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

  console.log(`GBBookings API ready at http://localhost:${env.PORT}`);

  server.on('error', (error) => {
    console.error('HTTP server error:', error);
  });

  const shutdown = async (signal: string) => {
    console.log(`Shutting down (${signal})...`);
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
