# Phase 1 — core hotel booking platform

The application uses MongoDB/Mongoose, custom JWT authentication with HttpOnly cookies, Resend API email, and Cloudinary media storage. Firebase is not required. Employee accounts use the internal role `support_agent` and the reservations workspace.

## Implemented scope

| Requirement | Backend | Frontend |
| --- | --- | --- |
| Authentication | Customer/vendor registration; shared login, password recovery, email verification, password changes, session revocation, rotating refresh tokens, optional email OTP for every role | Customer/vendor account selector; sign-in and OTP dialog; reset/verification dialogs; security settings in customer, vendor and staff workspaces |
| Roles and permissions | Database-backed RBAC; resource ownership; admin status controls; protected staff creation | Role-specific home dashboard; restricted admin tabs; employee/admin invitation form |
| Hotel listing management | Approved vendors create/edit properties and rooms; owned Cloudinary images; prices, policies and facilities; moderation | Multiple photos; property detail editor; room creation, editing, price/inventory changes and pause/resume; submission for review |
| Search and filters | Search/location, price, rating, amenities/facilities and dated room availability applied before pagination | Search, date/price/rating/facility filters and page controls |
| Room availability | Per-night inventory; transactional reservation/release; conditional capacity checks; inventory edits serialize with reservations | Live room availability and quotes; room-count controls; availability errors |
| Booking system | Server prices; pay-at-hotel requests; idempotency; vendor confirmation/decline, cancellation, completion/no-show; customer/vendor/admin history | Traveler details, current quote review, price-change protection, receipt, customer cancellation, vendor/admin actions and paginated history |
| Vendor verification | Verified owner email; transactional business/membership creation; owned private PDFs; admin approval/rejection/suspension | Business registration/editing; document upload; submission/status; admin document links and review actions |

Editing a published property's descriptive details returns it to draft for another review. Existing reservations remain available through their saved snapshots. Day-to-day room price, count and pause/resume changes do not require another review. Suspended vendors' properties are hidden and reject new bookings.

## Required configuration

- `MONGODB_URI`: MongoDB Atlas or a local replica set. A standalone MongoDB server does not support the required transactions.
- `MONGODB_DB_NAME`: database name, default `gbbookings`.
- `JWT_ACCESS_SECRET`: a unique random secret of at least 32 characters. Example/development placeholders are rejected in production.
- `APP_URL`: the browser-facing URL used in verification/password links and CORS.
- `RESEND_API_KEY`: Resend API key with email sending access.
- `RESEND_SENDER_EMAIL`, `RESEND_SENDER_NAME`: sender address on a verified Resend domain and display name.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: image/private document storage.
- `NODE_ENV=production` for production secure cookies. Set `TRUST_PROXY=true` only when behind a trusted single proxy.

Keep provider credentials in `.env` or deployment environment settings, never in frontend variables. All provider calls are made by the backend.

## Administration roles

Phase 1 uses one administrative role: **Platform Admin** (`admin`), with all platform permissions. The complete proposal describes a broader admin hierarchy; the current implementation consolidates it into this single role as requested. Employees keep restricted reservations/support access. Customers and vendors retain their own roles.

## First administrator and staff signup

1. Register the first administrator's account through the normal signup form and verify its email.
2. In a trusted MongoDB administration session, add `admin` to the existing account's `roles` array in the `users` collection. Public signup never grants administrator access.
3. Sign in again and open the admin workspace's Users tab.
4. Invite employees with reservations access or administrators with full admin access. Platform admins can create employee and administrator accounts.
5. The recipient uses the Resend password setup link to choose their password, then signs in normally. Each role can enable email OTP through Account security after email verification.

If invitation email delivery fails, the created account remains visible. Use Resend setup link or the sign-in form's Forgot password. Public registration cannot create employees or administrators.

## Local run and catalog setup

```text
npm install
npm run dev
```

Create properties and room categories through the vendor workspace, then use the admin workspace to approve publication. Seed/demo/role scripts and automated test files have been removed. The development runner is retained.

## Deployment checks

```text
npm run lint
npm run build
npm run start:production
```

Set the production environment variables on the hosting provider, including the public `APP_URL`, MongoDB URI, JWT secret, Resend API settings and Cloudinary credentials. After deployment, check `/api/health/ready` and walk through signup, email verification, vendor approval, property publication, availability, booking and cancellation.

## Phase boundaries

Phase 1 uses PKR and payment at the property. Card/JazzCash/Easypaisa payment collection, wallet/commission/refund/payout systems, reviews, messaging and support-ticket services belong to later phases. Cars and tours are browse-only. Customer cancellation is free before the Pakistan check-in date; this policy can be revised when final business rules are supplied. OTP is email-based through Resend; no SMS provider is configured.
