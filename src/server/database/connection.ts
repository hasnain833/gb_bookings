import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let connectionPromise: Promise<boolean> | null = null;

export function databaseState() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'] as const;
  return states[mongoose.connection.readyState] ?? 'unknown';
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

export async function connectDatabase(): Promise<boolean> {
  if (isDatabaseReady()) return true;

  if (!env.MONGODB_URI) {
    logger.warn('MONGODB_URI is not configured; database routes will remain unavailable');
    return false;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10,
    })
      .then(() => {
        logger.info({ database: env.MONGODB_DB_NAME }, 'MongoDB connected');
        return true;
      })
      .catch((error) => {
        connectionPromise = null;
        logger.error({ err: error }, 'MongoDB connection failed');
        return false;
      });
  }

  return connectionPromise;
}

export async function disconnectDatabase() {
  connectionPromise = null;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  }
}
