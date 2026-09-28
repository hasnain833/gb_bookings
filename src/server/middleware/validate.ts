import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../shared/app-error.js';

type RequestTarget = 'body' | 'params' | 'query';

export function validate(target: RequestTarget, schema: ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request[target]);
    if (!result.success) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Request validation failed.', result.error.flatten()));
    }

    Object.assign(request[target], result.data);
    next();
  };
}
