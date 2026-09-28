import { createApp, finalizeApp } from './src/server/app.js';
import { env } from './src/server/config/env.js';
import { connectDatabase } from './src/server/database/connection.js';
import { startServer } from './src/server/start.js';

const app = createApp();

if (env.VERCEL) {
  finalizeApp(app);
  void connectDatabase();
} else {
  void startServer(app);
}

export default app;
