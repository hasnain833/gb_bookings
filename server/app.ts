import { randomUUID } from 'node:crypto';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { mediaRouter } from './modules/media/media.routes.js';
import { createListingRouter } from './modules/listings/listing.routes.js';
import { adminVendorRouter, vendorRouter } from './modules/vendors/vendor.routes.js';
import { adminListingRouter, listingDraftRouter, vendorListingRouter } from './modules/vendor-listings/vendor-listing.routes.js';
import { adminBookingRouter, availabilityHandlers, unavailableDatesHandlers, bookingRouter, paymentWebhookRouter, vendorBookingRouter } from './modules/bookings/booking.routes.js';
import { adminUserRouter } from './modules/users/user-admin.routes.js';
import { wishlistRouter } from './modules/wishlist/wishlist.routes.js';
import { adminSettingsRouter, publicSettingsRouter } from './modules/settings/settings.routes.js';
import { messageRouter } from './modules/messages/message.routes.js';
import { newsletterRouter } from './modules/newsletter/newsletter.routes.js';
import { adminReviewRouter, listingReviewHandlers, partnerReviewRouter } from './modules/reviews/review.routes.js';
import { partnerCouponRouter } from './modules/coupons/coupon.routes.js';
import { adminFinanceRouter, partnerFinanceRouter } from './modules/finance/finance.routes.js';
import { inngest, inngestEnabled, inngestFunctions } from './modules/jobs/inngest.js';
import { seoRouter } from './modules/seo/seo.routes.js';
import { serve } from 'inngest/express';
import { AppError } from './shared/app-error.js';
import { isAllowedOrigin } from './shared/origin.js';
import { MongoRateLimitStore } from './shared/rate-limit-store.js';


export function createApp(): Express {
  const app = express();

  if (env.VERCEL) {
    app.use((request, _response, next) => {
      delete request.query.path;
      next();
    });
  }

  if (env.TRUST_PROXY || env.VERCEL) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: env.NODE_ENV === 'development' ? false : {
      directives: {
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com/gsi/style'],
        'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
        'script-src': ["'self'", 'https://accounts.google.com/gsi/client'],
        'connect-src': ["'self'", 'https://accounts.google.com/gsi/', 'https://photon.komoot.io', 'https://*.inngest.com', 'wss://*.inngest.com'],
        'frame-src': ["'self'", 'https://www.google.com', 'https://maps.google.com', 'https://accounts.google.com/gsi/'],
      },
    },
  }));
  app.use(cors((request, callback) => {
    const origin = request.headers.origin;
    if (!origin || isAllowedOrigin(origin, request.headers.host)) return callback(null, { credentials: true, origin: true });
    callback(new AppError(403, 'CORS_ORIGIN_DENIED', 'Origin is not allowed by CORS.'));
  }));
  if (env.NODE_ENV === 'production') app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use((request, response, next) => {
    const incoming = request.headers['x-request-id'];
    request.id = typeof incoming === 'string' && incoming.length <= 100 ? incoming : randomUUID();
    response.setHeader('x-request-id', request.id);
    next();
  });

  app.use('/api', rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    store: new MongoRateLimitStore('api:'),
    passOnStoreError: true,
    skip: (request) => request.path.startsWith('/health') || request.path.startsWith('/inngest'),
  }));

  // Inngest signs its calls; the SDK rejects anything else. Off without keys.
  if (inngestEnabled()) {
    const inngestHandler = inngestFunctions().then((functions) => serve({ client: inngest, functions }));
    app.use('/api/inngest', (request, response, next) => { void inngestHandler.then((handler) => handler(request, response, next)).catch(next); });
  }

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.get(['/api/v1/listings/:id/availability', '/api/listings/:id/availability'], ...availabilityHandlers);
  app.get('/api/v1/listings/:id/unavailable-dates', ...unavailableDatesHandlers);
  app.get('/api/v1/listings/:id/reviews', ...listingReviewHandlers);
  app.use('/api/v1/listings', createListingRouter());
  app.use('/api/v1/vendors', vendorRouter);
  app.use('/api/v1/admin/vendors', adminVendorRouter);
  app.use('/api/v1/vendor/listing-drafts', listingDraftRouter);
  app.use('/api/v1/vendor/listings', vendorListingRouter);
  app.use('/api/v1/admin/listings', adminListingRouter);
  app.use('/api/v1/admin/users', adminUserRouter);
  app.use('/api/v1/bookings', bookingRouter);
  app.use('/api/v1/payments', paymentWebhookRouter);
  app.use('/api/v1/messages', messageRouter);
  app.use('/api/v1/vendor/bookings', vendorBookingRouter);
  app.use('/api/v1/admin/bookings', adminBookingRouter);
  app.use('/api/v1/admin/settings', adminSettingsRouter);
  app.use('/api/v1/admin/finance', adminFinanceRouter);
  app.use('/api/v1/vendor/finance', partnerFinanceRouter);
  app.use('/api/v1/settings', publicSettingsRouter);
  app.use('/api/v1/vendor/reviews', partnerReviewRouter);
  app.use('/api/v1/admin/reviews', adminReviewRouter);
  app.use('/api/v1/vendor/coupons', partnerCouponRouter);
  app.use('/api/v1/media', mediaRouter);
  app.use('/api/v1/wishlist', wishlistRouter);
  app.use('/api/v1/newsletter', newsletterRouter);
  app.use('/api/v1/ai', aiRouter);
  if (env.VERCEL) app.use(seoRouter);

  return app;
}

export function finalizeApp(app: Express) {
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
