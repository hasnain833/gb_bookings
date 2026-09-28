import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let connectionPromise: Promise<boolean> | null = null;

export function databaseConnectionHint(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (/authentication failed|bad auth|auth failed/i.test(message)) {
    return 'Check the Atlas database username/password and URL-encode special characters in MONGODB_URI.';
  }
  if (/querySrv|ENOTFOUND|ETIMEOUT|getaddrinfo/i.test(message)) {
    return 'MongoDB DNS lookup failed. Check the Atlas connection string and your DNS/network connection.';
  }
  if (/tls|ssl|alert internal error/i.test(message)) {
    return 'Atlas TLS negotiation failed. Add this machine IP to Atlas Network Access and check VPN/firewall access to TCP 27017.';
  }
  if (/ReplicaSetNoPrimary|server selection|ECONNREFUSED|ETIMEDOUT/i.test(message)) {
    return 'MongoDB is unreachable. For Atlas, confirm the cluster is active and this machine IP is in Network Access.';
  }

  return 'Check MONGODB_URI, database credentials, and network access.';
}

export function databaseState() {
  switch (mongoose.connection.readyState) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

export async function connectDatabase(): Promise<boolean> {
  if (isDatabaseReady()) return true;

  if (connectionPromise && mongoose.connection.readyState !== 2) {
    connectionPromise = null;
  }

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
        logger.error({
          error: error instanceof Error ? error.message : String(error),
          hint: databaseConnectionHint(error),
        }, 'MongoDB connection failed; database routes will return 503');
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
