import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/app-error.js';

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `Route ${request.method} ${request.originalUrl} was not found.`));
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const normalized = error instanceof AppError
    ? error
    : error instanceof ZodError
      ? new AppError(400, 'VALIDATION_ERROR', 'Request validation failed.', error.flatten())
      : new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred.');

  if (normalized.status >= 500) {
    console.error(`[${request.id}] ${normalized.message}`, error);
  }

  response.status(normalized.status).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      requestId: request.id,
      ...(normalized.details === undefined ? {} : { details: normalized.details }),
    },
  });
};
