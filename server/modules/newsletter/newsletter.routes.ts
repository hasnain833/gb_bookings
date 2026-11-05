import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import mongoose, { type Model } from 'mongoose';
import { z } from 'zod';
import { connectDatabase } from '../../database/connection.js';
import { validate } from '../../middleware/validate.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { emailAddressProblem } from '../../shared/email-domain.js';
import { MongoRateLimitStore } from '../../shared/rate-limit-store.js';
import { isEmailConfigured, sendTransactionalEmail } from '../email/resend.service.js';

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  source: { type: String, enum: ['footer', 'homestays'], required: true },
  unsubscribedAt: { type: Date, default: null },
}, { timestamps: true });

// ponytail: stored only; no admin export or sending yet. Read the `newslettersubscribers` collection, or sync to a mailing tool when campaigns start.
export const NewsletterSubscriberModel: Model<any> = (mongoose.models.NewsletterSubscriber as Model<any> | undefined)
  ?? mongoose.model<any>('NewsletterSubscriber', subscriberSchema);

// Subscribing past this still saves the address; it just skips the welcome email, so the site cannot be used to email strangers.
const MAX_WELCOMES_PER_DAY = 50;

export const newsletterRouter = Router();

newsletterRouter.use(rateLimit({
  windowMs: 60 * 60_000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, store: new MongoRateLimitStore('newsletter:'), passOnStoreError: false,
  message: { error: { code: 'NEWSLETTER_RATE_LIMITED', message: 'Too many sign-ups from here. Please try again in an hour.' } },
}));

newsletterRouter.post('/', validate('body', z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.enum(['footer', 'homestays']),
}).strict()), asyncHandler(async (request, response) => {
  const problem = await emailAddressProblem(request.body.email);
  if (problem) throw new AppError(422, 'EMAIL_ADDRESS_INVALID', problem);
  if (!await connectDatabase()) throw new ServiceUnavailableError('Subscriptions are unavailable right now.');
  // Idempotent and silent about existing addresses, so the form cannot be used to probe who subscribed.
  const saved = await NewsletterSubscriberModel.updateOne(
    { email: request.body.email },
    { $set: { unsubscribedAt: null }, $setOnInsert: { source: request.body.source } },
    { upsert: true },
  );
  // Only a new address gets the welcome, and its failure never fails the sign-up.
  if (saved.upsertedCount) {
    console.info(`Newsletter: new subscriber from ${request.body.source}`);
    const welcomesToday = await NewsletterSubscriberModel.countDocuments({ createdAt: { $gte: new Date(Date.now() - 86_400_000) } });
    if (isEmailConfigured() && welcomesToday <= MAX_WELCOMES_PER_DAY) {
      await sendTransactionalEmail({
        to: { email: request.body.email }, subject: 'You are subscribed to GBBookings', tag: 'newsletter-welcome',
        htmlContent: '<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;color:#17211c"><div style="max-width:560px;margin:0 auto;padding:32px 16px"><h1 style="font-size:22px">Thanks for subscribing</h1><p>We will send you the best travel deals and tips for Gilgit-Baltistan. If this wasn\'t you, just ignore this email.</p></div></body></html>',
      }).catch((error) => console.warn(`Newsletter welcome email failed: ${error.message}`));
    }
  }
  response.status(204).end();
}));
