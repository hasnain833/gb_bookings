import mongoose from 'mongoose';
import type { IncrementResponse, Options, Store } from 'express-rate-limit';
import { connectDatabase } from '../database/connection.js';

type Counter = { _id: string; hits: number; resetAt: Date };
let ttlIndex: Promise<unknown> | undefined;

/**
 * express-rate-limit store kept in MongoDB, so every server instance (each Vercel function) shares one count per IP.
 * ponytail: one database write per limited request; move to Redis (e.g. Upstash) if API traffic makes that a bottleneck.
 */
export class MongoRateLimitStore implements Store {
  localKeys = false;
  private windowMs = 60_000;

  /** `prefix` keeps each limiter's counters apart. */
  constructor(readonly prefix: string) {}

  init(options: Options) {
    this.windowMs = options.windowMs;
  }

  private async counters() {
    if (!await connectDatabase()) throw new Error('Rate limit store: the database is unavailable.');
    const collection = mongoose.connection.collection<Counter>('ratelimits');
    // Expired windows are removed by MongoDB itself.
    ttlIndex ??= collection.createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 }).catch(() => { ttlIndex = undefined; });
    return collection;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const collection = await this.counters();
    const now = new Date();
    // One atomic update: count on in the current window, or start a new one at 1.
    const live = { $gt: ['$resetAt', now] };
    const update = [{ $set: {
      hits: { $cond: [live, { $add: ['$hits', 1] }, 1] },
      resetAt: { $cond: [live, '$resetAt', new Date(now.getTime() + this.windowMs)] },
    } }];
    const run = () => collection.findOneAndUpdate({ _id: this.prefix + key }, update, { upsert: true, returnDocument: 'after' });
    // The first two hits of a new key can race on the insert; the loser retries as a plain update.
    const counter = await run().catch((error) => (error?.code === 11000 ? run() : Promise.reject(error)));
    return { totalHits: counter!.hits, resetTime: counter!.resetAt };
  }

  async decrement(key: string) {
    await (await this.counters()).updateOne({ _id: this.prefix + key, hits: { $gt: 0 } }, { $inc: { hits: -1 } });
  }

  async resetKey(key: string) {
    await (await this.counters()).deleteOne({ _id: this.prefix + key });
  }
}
