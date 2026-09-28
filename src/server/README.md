# GBBookings Backend

## Local setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI`.
2. Run `npm install`.
3. Run `npm run dev`.

The application is served at `http://localhost:3000`. In development, the API explorer is available at `http://localhost:3000/api/docs`.

Without `MONGODB_URI`, the development server still starts so frontend work can continue. Liveness remains healthy, while readiness and database-backed routes return `503 Service Unavailable`. Production startup requires a database URI.

## Commands

```text
npm run dev                 Start the frontend and API development server
npm run lint                Type-check the project
npm test                    Run API tests
npm run build               Build the frontend and Node server
npm start                   Run the production build
npm run seed:listings -- path/to/listings.json
npm run seed:roles
```

The seed file must be a JSON array of listing objects. Existing records are updated by `publicId`, making repeat runs idempotent.

## Transactional email

Email verification and password recovery use Brevo's transactional email API. Configure `BREVO_API_KEY`, a verified `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME` in `.env`. `APP_URL` is used to build the verification and reset links.

Verification links expire after 60 minutes by default; password reset links expire after 30 minutes. Tokens are random, stored only as hashes, invalidated when replaced, and consumed once. A successful password reset revokes every existing session.

Email two-factor authentication also uses Brevo. OTP challenges expire after `OTP_TTL_MINUTES`, enforce `OTP_MAX_ATTEMPTS`, and store only an HMAC of the code. The provider interface includes an explicit SMS adapter boundary; SMS remains unavailable until a provider is configured.

## API routes

- `GET /api/health` - liveness check
- `GET /api/health/ready` - database readiness check
- `POST /api/v1/auth/register` - create a customer and session
- `POST /api/v1/auth/login` - sign in
- `POST /api/v1/auth/login/verify-otp` - complete a two-factor login
- `POST /api/v1/auth/refresh` - rotate session credentials
- `POST /api/v1/auth/logout` - revoke the current session
- `GET /api/v1/auth/me` - read the authenticated profile
- `PATCH /api/v1/auth/me` - update the authenticated profile
- `POST /api/v1/auth/change-password` - change password and revoke all sessions
- `GET /api/v1/auth/sessions` - list active sessions
- `DELETE /api/v1/auth/sessions/:id` - revoke an owned session
- `POST /api/v1/auth/two-factor/setup` - send a setup OTP
- `POST /api/v1/auth/two-factor/enable` - confirm and enable two-factor authentication
- `POST /api/v1/auth/two-factor/disable` - disable two-factor authentication and revoke sessions
- `POST /api/v1/auth/email-verification/request` - send a verification email
- `POST /api/v1/auth/email-verification/confirm` - consume a verification token
- `POST /api/v1/auth/forgot-password` - request password recovery
- `POST /api/v1/auth/reset-password` - consume a reset token and change the password
- `GET /api/v1/listings` - paginated listing search
- `GET /api/v1/listings/:id` - listing details
- `POST /api/v1/ai/planner` - AI planner contract
- `GET /api/docs/openapi.json` - OpenAPI document

Legacy `/api/*` routes remain available while the frontend migrates to `/api/v1/*`.
