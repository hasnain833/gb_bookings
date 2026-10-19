import { Router } from 'express';
import mongoose, { type Model } from 'mongoose';
import { z } from 'zod';
import { connectDatabase } from '../../database/connection.js';
import { validate } from '../../middleware/validate.js';
import { ServiceUnavailableError } from '../../shared/app-error.js';
import { asyncHandler } from '../../shared/async-handler.js';

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  source: { type: String, enum: ['footer', 'homestays'], required: true },
  unsubscribedAt: { type: Date, default: null },
}, { timestamps: true });

// ponytail: stored only; no admin export or sending yet. Read the `newslettersubscribers` collection, or sync to a mailing tool when campaigns start.
export const NewsletterSubscriberModel: Model<any> = (mongoose.models.NewsletterSubscriber as Model<any> | undefined)
  ?? mongoose.model<any>('NewsletterSubscriber', subscriberSchema);

export const newsletterRouter = Router();

newsletterRouter.post('/', validate('body', z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.enum(['footer', 'homestays']),
}).strict()), asyncHandler(async (request, response) => {
  if (!await connectDatabase()) throw new ServiceUnavailableError('Subscriptions are unavailable right now.');
  // Idempotent and silent about existing addresses, so the form cannot be used to probe who subscribed.
  await NewsletterSubscriberModel.updateOne(
    { email: request.body.email },
    { $set: { unsubscribedAt: null }, $setOnInsert: { source: request.body.source } },
    { upsert: true },
  );
  response.status(204).end();
}));
