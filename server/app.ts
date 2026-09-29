import { randomUUID } from 'node:crypto';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openApiDocument } from './docs/openapi.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { aiRouter, legacyAiRouter } from './modules/ai/ai.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { mediaRouter } from './modules/media/media.routes.js';
import { createListingRouter } from './modules/listings/listing.routes.js';
import { adminVendorRouter, vendorRouter } from './modules/vendors/vendor.routes.js';
import { adminListingRouter, vendorListingRouter } from './modules/vendor-listings/vendor-listing.routes.js';
import { adminBookingRouter, availabilityHandlers, bookingRouter, vendorBookingRouter } from './modules/bookings/booking.routes.js';
import { adminUserRouter } from './modules/users/user-admin.routes.js';
import { compatibilityRouter } from './routes/compatibility.routes.js';
import { AppError } from './shared/app-error.js';

const allowedCorsOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(env.APP_URL ? [new URL(env.APP_URL).origin] : []),
]);

function isAllowedOrigin(origin: string, host?: string) {
  if (allowedCorsOrigins.has(origin)) return true;
  // Browsers send Origin on same-origin POSTs, so the deployed domain must always pass.
  try { return new URL(origin).host === host; } catch { return false; }
}

export function createApp(): Express {
  const app = express();

  if (env.TRUST_PROXY) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Vite injects an inline React Refresh preamble in development.
    contentSecurityPolicy: env.NODE_ENV === 'development' ? false : {
      directives: {
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
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
    skip: (request) => request.path.startsWith('/health'),
  }));

  app.get('/api/docs/openapi.json', (_request, response) => response.json(openApiDocument));
  if (env.NODE_ENV !== 'production') {
    app.use('/api/docs', (_request, response, next) => {
      response.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'");
      next();
    }, swaggerUi.serve, swaggerUi.setup(openApiDocument));
  }

  app.use('/api/v1/health', healthRouter);
  app.use('/api/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/auth', authRouter);
  app.get(['/api/v1/listings/:id/availability', '/api/listings/:id/availability'], ...availabilityHandlers);
  app.use('/api/v1/listings', createListingRouter());
  app.use('/api/listings', createListingRouter({ legacy: true }));
  app.use('/api/v1/vendors', vendorRouter);
  app.use('/api/vendors', vendorRouter);
  app.use('/api/v1/admin/vendors', adminVendorRouter);
  app.use('/api/v1/vendor/listings', vendorListingRouter);
  app.use('/api/v1/admin/listings', adminListingRouter);
  app.use('/api/v1/admin/users', adminUserRouter);
  app.use('/api/v1/bookings', bookingRouter);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/v1/vendor/bookings', vendorBookingRouter);
  app.use('/api/v1/admin/bookings', adminBookingRouter);
  app.use('/api/v1/media', mediaRouter);
  app.use('/api/media', mediaRouter);
  app.use('/api/v1/ai', aiRouter);
  app.use('/api/ai-planner', legacyAiRouter);
  app.use('/api', compatibilityRouter);

  return app;
}

export function finalizeApp(app: Express) {
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
