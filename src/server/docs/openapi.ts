export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'GBBookings API',
    version: '1.0.0',
    description: 'Backend API for the GBBookings multi-vendor travel marketplace.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Health' },
    { name: 'Authentication' },
    { name: 'Listings' },
    { name: 'AI' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a customer account',
        responses: {
          '201': { description: 'Account created and authentication cookies issued.' },
          '409': { description: 'Email address is already registered.' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in and create a session',
        responses: {
          '200': { description: 'Authentication cookies issued.' },
          '401': { description: 'Credentials are invalid.' },
          '429': { description: 'Account or IP is temporarily rate limited.' },
        },
      },
    },
    '/auth/login/verify-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Complete a two-factor login challenge',
        responses: {
          '200': { description: 'Authentication cookies issued.' },
          '400': { description: 'OTP is invalid or expired.' },
          '429': { description: 'OTP attempt limit reached.' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Rotate the refresh token and issue a new access token',
        responses: {
          '200': { description: 'Session refreshed.' },
          '401': { description: 'Refresh token is missing, expired, or invalid.' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Revoke the current refresh session',
        responses: { '204': { description: 'Signed out.' } },
      },
    },
    '/auth/email-verification/request': {
      post: {
        tags: ['Authentication'],
        summary: 'Send or resend an email verification link',
        responses: {
          '200': { description: 'Verification state returned and email sent when needed.' },
          '401': { description: 'Authentication is required.' },
          '503': { description: 'Brevo transactional email is not configured.' },
        },
      },
    },
    '/auth/email-verification/confirm': {
      post: {
        tags: ['Authentication'],
        summary: 'Consume a one-time email verification token',
        responses: {
          '204': { description: 'Email address verified.' },
          '400': { description: 'Token is invalid or expired.' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Request a password reset email',
        responses: {
          '202': { description: 'Generic response returned regardless of account existence.' },
          '503': { description: 'Brevo transactional email is not configured.' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset a password with a one-time token',
        responses: {
          '204': { description: 'Password changed and all sessions revoked.' },
          '400': { description: 'Token is invalid or expired.' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get the authenticated user profile',
        responses: {
          '200': { description: 'Current user profile.' },
          '401': { description: 'Authentication is required.' },
        },
      },
      patch: {
        tags: ['Authentication'],
        summary: 'Update the authenticated user profile',
        responses: {
          '200': { description: 'Updated user profile.' },
          '401': { description: 'Authentication is required.' },
        },
      },
    },
    '/auth/sessions': {
      get: {
        tags: ['Authentication'],
        summary: 'List the current user active sessions',
        responses: { '200': { description: 'Active sessions and current-session marker.' } },
      },
    },
    '/auth/sessions/{id}': {
      delete: {
        tags: ['Authentication'],
        summary: 'Revoke an owned session',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Session revoked.' }, '404': { description: 'Session not found.' } },
      },
    },
    '/auth/two-factor/setup': {
      post: {
        tags: ['Authentication'],
        summary: 'Send a two-factor setup OTP to a verified destination',
        responses: { '200': { description: 'OTP challenge created.' }, '409': { description: 'Destination is not verified.' } },
      },
    },
    '/auth/two-factor/enable': {
      post: {
        tags: ['Authentication'],
        summary: 'Confirm setup OTP and enable two-factor authentication',
        responses: { '200': { description: 'Two-factor authentication enabled.' } },
      },
    },
    '/auth/two-factor/disable': {
      post: {
        tags: ['Authentication'],
        summary: 'Disable two-factor authentication and revoke all sessions',
        responses: { '204': { description: 'Two-factor authentication disabled.' } },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness check',
        responses: { '200': { description: 'API process is alive.' } },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Database readiness check',
        responses: {
          '200': { description: 'API and database are ready.' },
          '503': { description: 'Database is unavailable.' },
        },
      },
    },
    '/listings': {
      get: {
        tags: ['Listings'],
        summary: 'List published marketplace inventory',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['hotel', 'homestay', 'car', 'tour', 'destination', 'offer', 'all'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 24 } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['recommended', 'price-asc', 'price-desc', 'rating', 'newest'] } },
        ],
        responses: {
          '200': { description: 'Paginated listings.' },
          '503': { description: 'Catalog database unavailable.' },
        },
      },
    },
    '/listings/{id}': {
      get: {
        tags: ['Listings'],
        summary: 'Get one published listing',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Listing details.' },
          '404': { description: 'Listing not found.' },
          '503': { description: 'Catalog database unavailable.' },
        },
      },
    },
    '/ai/planner': {
      post: {
        tags: ['AI'],
        summary: 'Generate a travel itinerary',
        responses: {
          '200': { description: 'Generated itinerary.' },
          '503': { description: 'AI provider is not configured.' },
        },
      },
    },
  },
};
