import { createApp, finalizeApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './database/connection.js';
import { startServer } from './start.js';

const app = createApp();

if (env.VERCEL) {
  finalizeApp(app);
  void connectDatabase();
} else {
  void startServer(app).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${env.PORT} is already in use. Stop the existing dev server or choose another PORT in .env.`);
    } else {
      console.error('Server startup failed:', error);
    }
    process.exitCode = 1;
  });
}

export default app;
