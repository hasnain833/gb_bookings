import mongoose, { type ClientSession } from 'mongoose';
import { ServiceUnavailableError } from '../shared/app-error.js';

/** Transactions require Atlas or a local MongoDB replica set. Never fall back to partial writes. */
export async function inTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  try {
    return await mongoose.connection.transaction(work);
  } catch (error) {
    if ((error as { code?: number }).code === 20) {
      throw new ServiceUnavailableError('Booking inventory requires a MongoDB replica set. Use MongoDB Atlas or configure a local replica set.');
    }
    throw error;
  }
}
