import { createApp, finalizeApp } from './src/server/app.js';
import { env } from './src/server/config/env.js';
import { logger } from './src/server/config/logger.js';
import { connectDatabase } from './src/server/database/connection.js';
import { startServer } from './src/server/start.js';

const app = createApp();

if (env.VERCEL) {
  finalizeApp(app);
  void connectDatabase();
} else {
  void startServer(app).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.fatal(
        { port: env.PORT },
        `Port ${env.PORT} is already in use. Stop the existing dev server or choose another PORT in .env.`,
      );
    } else {
      logger.fatal({ err: error }, 'Server startup failed');
    }
    process.exitCode = 1;
  });
}

export default app;
