export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable.') {
    super(503, 'SERVICE_UNAVAILABLE', message);
  }
}
