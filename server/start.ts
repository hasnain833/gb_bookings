import { createServer } from 'node:http';
import path from 'node:path';
import express, { type Express } from 'express';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { finalizeApp } from './app.js';
import { expireStalePendingBookings } from './modules/bookings/booking.service.js';
import { attachRealtime } from './modules/messages/realtime.js';

export async function startServer(app: Express) {
  const server = createServer(app);
  attachRealtime(server);

  if (env.NODE_ENV === 'production') {
    // Single-process deploys serve the built frontend; in development Vite serves it on port 3000.
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get(/^(?!\/api\/).*/, (_request, response) => response.sendFile(path.join(distPath, 'index.html')));
  }

  finalizeApp(app);
  if (env.NODE_ENV === 'production') {
    if (!await connectDatabase()) throw new Error('Production startup requires a reachable MongoDB database.');
  } else {
    void connectDatabase();
  }

  const listen = () => new Promise<void>((resolve, reject) => {
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

  // On a watch reload the previous process may still be releasing the port; give it a few seconds in development.
  for (let attempt = 1; ; attempt += 1) {
    try {
      await listen();
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EADDRINUSE' || env.NODE_ENV === 'production' || attempt >= 10) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`GBBookings API ready at http://localhost:${env.PORT}`);
  setInterval(() => void expireStalePendingBookings(), 5 * 60_000).unref();

  server.on('error', (error) => {
    console.error('HTTP server error:', error);
  });

  const shutdown = async (signal: string) => {
    console.log(`Shutting down (${signal})...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    // Idle keep-alive sockets (e.g. the Vite proxy) would otherwise hold the port open until they time out.
    server.closeIdleConnections();
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  return server;
}
