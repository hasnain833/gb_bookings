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
    { name: 'Vendors' },
    { name: 'Media' },
    { name: 'Listings' },
    { name: 'Bookings' },
    { name: 'Admin' },
    { name: 'AI' },
  ],
  paths: {
    '/media/images': {
      post: { tags: ['Media'], summary: 'Upload an owned listing image', responses: { '201': { description: 'Cloudinary image stored.' }, '415': { description: 'Unsupported image type.' } } },
    },
    '/media/documents': {
      post: { tags: ['Media'], summary: 'Upload an authenticated vendor PDF', responses: { '201': { description: 'Private document stored.' }, '415': { description: 'Only PDF is accepted.' } } },
    },
    '/vendor/listings': {
      get: { tags: ['Vendors'], summary: 'List owned vendor listings', responses: { '200': { description: 'Owned listings.' } } },
      post: { tags: ['Vendors'], summary: 'Create an owned hotel draft', responses: { '201': { description: 'Hotel draft created.' }, '403': { description: 'Approved vendor required.' } } },
    },
    '/vendor/listings/{id}/rooms': {
      get: { tags: ['Vendors'], summary: 'List owned hotel room categories', responses: { '200': { description: 'Room categories.' } } },
      post: { tags: ['Vendors'], summary: 'Add a room category', responses: { '201': { description: 'Room category created.' } } },
    },
    '/vendor/listings/{id}/submit': {
      post: { tags: ['Vendors'], summary: 'Submit a complete hotel for moderation', responses: { '200': { description: 'Listing submitted.' }, '400': { description: 'Image or room inventory is missing.' } } },
    },
    '/vendor/listings/{id}': {
      patch: { tags: ['Vendors'], summary: 'Edit an owned listing (returns it to draft)', responses: { '200': { description: 'Listing saved as draft.' } } },
      delete: { tags: ['Vendors'], summary: 'Archive an owned listing; existing reservations are kept', responses: { '204': { description: 'Archived.' } } },
    },
    '/vendor/listings/{id}/status': {
      post: { tags: ['Vendors'], summary: 'Pause a live listing or resume a paused one ({ status: paused | published })', responses: { '200': { description: 'Listing updated.' }, '409': { description: 'Listing is not live or paused.' } } },
    },
    '/vendor/listings/{id}/rooms/{roomId}/calendar': {
      get: { tags: ['Vendors'], summary: 'Per-night booked/closed/available counts (from, to; max 120 days)', responses: { '200': { description: 'Room calendar.' } } },
      put: { tags: ['Vendors'], summary: 'Close rooms for a date range ({ from, to, closed }; 0 reopens)', responses: { '200': { description: 'Updated calendar.' }, '409': { description: 'Guests already hold rooms on some nights.' } } },
    },
    '/vendor/listings/{id}/duplicate': {
      post: { tags: ['Vendors'], summary: 'Copy a listing and its rooms into a new draft', responses: { '201': { description: 'Draft copy created.' } } },
    },
    '/admin/listings': {
      get: { tags: ['Vendors'], summary: 'List vendor hotels/homestays (status=submitted|published|paused|draft|rejected|archived|all, q, page)', responses: { '200': { description: 'Paginated listings with vendor names.' } } },
    },
    '/admin/listings/{id}/rooms': {
      get: { tags: ['Admin'], summary: 'Inspect hotel room categories before publication', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Room categories, prices and inventory.' }, '403': { description: 'Listing moderation permission required.' }, '404': { description: 'Listing not found.' } } },
    },
    '/vendors': {
      post: {
        tags: ['Vendors'],
        summary: 'Create a vendor application for the authenticated user',
        responses: { '201': { description: 'Draft vendor organization created.' }, '409': { description: 'User already belongs to a vendor.' } },
      },
    },
    '/vendors/me': {
      get: {
        tags: ['Vendors'], summary: 'Get the current vendor organization',
        responses: { '200': { description: 'Vendor profile and membership.' }, '404': { description: 'No vendor membership.' } },
      },
      patch: {
        tags: ['Vendors'], summary: 'Update a draft or rejected vendor application',
        responses: { '200': { description: 'Vendor profile updated.' } },
      },
    },
    '/vendors/me/documents': {
      post: {
        tags: ['Vendors'], summary: 'Attach an owned uploaded document to vendor verification',
        responses: { '201': { description: 'Verification document attached.' } },
      },
    },
    '/vendors/me/submit': {
      post: {
        tags: ['Vendors'], summary: 'Submit a complete vendor application for review',
        responses: { '200': { description: 'Application submitted.' }, '400': { description: 'Required profile data is missing.' } },
      },
    },
    '/admin/vendors': {
      get: {
        tags: ['Vendors'], summary: 'List vendor applications for authorized admins',
        responses: { '200': { description: 'Paginated vendor applications.' }, '403': { description: 'Vendor-management permission required.' } },
      },
    },
    '/admin/vendors/{id}/decision': {
      post: {
        tags: ['Vendors'], summary: 'Approve, reject, or suspend a vendor',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Review decision applied and audited.' } },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Send a signup verification code without creating a user account',
        responses: {
          '202': { description: 'Verification challenge sent to the signup email. No account/session created.' },
          '409': { description: 'Email address is already registered.' },
        },
      },
    },
    '/auth/register/verify-otp': {
      post: { tags: ['Authentication'], summary: 'Verify signup OTP and create the account', responses: { '201': { description: 'Verified customer account created and authentication cookies issued.' }, '400': { description: 'OTP invalid, expired or already used.' }, '429': { description: 'Attempt limit exceeded.' } } },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in and create a session',
        responses: {
          '200': { description: 'Authentication cookies issued.' },
          '202': { description: 'OTP required; valid remembered devices skip the challenge for seven days.' },
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
          '503': { description: 'Resend transactional email is not configured.' },
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
          '503': { description: 'Resend transactional email is not configured.' },
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
          { name: 'location', in: 'query', schema: { type: 'string' }, description: 'Case-insensitive partial match on location.' },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'minRating', in: 'query', schema: { type: 'number', minimum: 0, maximum: 5 } },
          { name: 'amenities', in: 'query', schema: { type: 'string' }, description: 'Comma-separated; all must match.' },
          { name: 'checkIn', in: 'query', schema: { type: 'string', format: 'date' }, description: 'With checkOut, returns only listings with a free room.' },
          { name: 'checkOut', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'guests', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'rooms', in: 'query', schema: { type: 'integer', minimum: 1 } },
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
    '/listings/{id}/availability': {
      get: {
        tags: ['Bookings'], summary: 'Room availability and server-computed quote for a stay',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'checkIn', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'checkOut', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'adults', in: 'query', schema: { type: 'integer', default: 2 } },
          { name: 'children', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'rooms', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: { '200': { description: 'Room types with free count, fit and total price.' }, '400': { description: 'Invalid stay dates.' }, '422': { description: 'Listing type is not bookable.' } },
      },
    },
    '/bookings': {
      get: { tags: ['Bookings'], summary: "List the signed-in customer's bookings", responses: { '200': { description: 'Paginated bookings.' }, '401': { description: 'Sign-in required.' } } },
      post: {
        tags: ['Bookings'], summary: 'Create a pay-at-hotel booking (price computed on the server)',
        parameters: [{ name: 'Idempotency-Key', in: 'header', schema: { type: 'string', minLength: 8, maxLength: 100 }, description: 'Retries with the same key return the original booking.' }],
        responses: {
          '201': { description: 'Booking created with status pending.' },
          '200': { description: 'Idempotent replay of an existing booking.' },
          '409': { description: 'Not enough rooms for the dates (ROOM_UNAVAILABLE).' },
          '422': { description: 'Occupancy exceeded or listing not bookable.' },
        },
      },
    },
    '/bookings/{id}': {
      get: { tags: ['Bookings'], summary: 'Booking details (customer, property staff or admin)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Booking.' }, '404': { description: 'Not found or not accessible.' } } },
    },
    '/bookings/{id}/cancel': {
      post: { tags: ['Bookings'], summary: 'Cancel an own booking before the check-in date; releases the rooms', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Cancelled.' }, '409': { description: 'Status or cancellation window does not allow it.' } } },
    },
    '/vendor/bookings': {
      get: { tags: ['Bookings'], summary: "List reservations for the vendor's properties", description: 'Filters: status, from/to (check-in date), listingId, q (reference, guest name, email or phone).', responses: { '200': { description: 'Paginated reservations.' }, '403': { description: 'Vendor reservations role required.' } } },
    },
    '/vendor/bookings/{id}/actions': {
      post: { tags: ['Bookings'], summary: 'Confirm, cancel, complete or mark a reservation as no-show', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated booking.' }, '409': { description: 'Transition not allowed.' } } },
    },
    '/admin/bookings/lookup': {
      get: { tags: ['Admin'], summary: 'Find one booking by reference (no admin booking list)', parameters: [{ name: 'reference', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Booking with its hotel business.' }, '404': { description: 'No booking with that reference.' } } },
    },
    '/admin/bookings/{id}/cancel': {
      post: { tags: ['Admin'], summary: 'Cancel a booking on the guest’s behalf (disputes, fraud); requires a reason', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Cancelled; rooms released.' }, '409': { description: 'Booking cannot be cancelled.' } } },
    },
    '/admin/users': {
      get: { tags: ['Admin'], summary: 'Search users by status, role, name or email', responses: { '200': { description: 'Paginated users.' } } },
      post: { tags: ['Admin'], summary: 'Invite a platform administrator with a Resend password setup link', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'role'], properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', enum: ['admin'] } } } } } }, responses: { '201': { description: 'Account created; invitationSent reports delivery.' }, '403': { description: 'Only platform admins can create staff accounts.' }, '409': { description: 'Email already registered.' } } },
    },
    '/admin/users/{id}/status': {
      post: { tags: ['Admin'], summary: 'Activate, suspend, archive or verify a user (suspend/archive revoke sessions)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated user.' }, '403': { description: 'Only platform admins can change administrators.' }, '409': { description: 'Cannot change own account.' } } },
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
