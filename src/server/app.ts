import { randomUUID } from 'node:crypto';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { openApiDocument } from './docs/openapi.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { aiRouter, legacyAiRouter } from './modules/ai/ai.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { mediaRouter } from './modules/media/media.routes.js';
import { createListingRouter } from './modules/listings/listing.routes.js';
import { adminVendorRouter, vendorRouter } from './modules/vendors/vendor.routes.js';
import { adminListingRouter, vendorListingRouter } from './modules/vendor-listings/vendor-listing.routes.js';
import { compatibilityRouter } from './routes/compatibility.routes.js';
import { AppError } from './shared/app-error.js';

export function createApp(): Express {
  const app = express();

  if (env.TRUST_PROXY) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      callback(new AppError(403, 'CORS_ORIGIN_DENIED', 'Origin is not allowed by CORS.'));
    },
  }));
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(pinoHttp({
    logger,
    genReqId(request, response) {
      const incoming = request.headers['x-request-id'];
      const id = typeof incoming === 'string' && incoming.length <= 100 ? incoming : randomUUID();
      response.setHeader('x-request-id', id);
      return id;
    },
  }));

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
  app.use('/api/v1/listings', createListingRouter());
  app.use('/api/listings', createListingRouter({ legacy: true }));
  app.use('/api/v1/vendors', vendorRouter);
  app.use('/api/vendors', vendorRouter);
  app.use('/api/v1/admin/vendors', adminVendorRouter);
  app.use('/api/v1/vendor/listings', vendorListingRouter);
  app.use('/api/v1/admin/listings', adminListingRouter);
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
