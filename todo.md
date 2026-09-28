# GBBookings Backend Development Roadmap

This document is the implementation plan for converting the current frontend and API shell into a production-ready, multi-vendor travel marketplace. It is based on the existing React application, the empty Express API contracts, and the supplied project proposal documents.

## 1. Current State

- [x] React 19, Vite, TypeScript, and Tailwind frontend exists.
- [x] The main customer, vendor, checkout, support, review, and AI planner screens exist.
- [x] Frontend code is organized by feature with shared API, hook, component, and utility layers.
- [x] Marketplace screens consume API data without static listing fallbacks or fabricated success states.
- [x] Legacy mock listings, reviews, bookings, notifications, tickets, and browser-stored fake users have been removed.
- [x] A small Express server preserves empty API contracts until persistent modules replace it.
- [ ] Authentication endpoints and secure cookie sessions are implemented; the frontend is already wired for them.
- [ ] Vendor listing creation is persisted.
- [ ] Availability, pricing, payment, wallet, commission, payout, and refund logic is implemented securely on the server.
- [ ] Admin operations and approval workflows are implemented.
- [ ] Automated tests, API documentation, monitoring, and production deployment are complete.

## 2. Technical Decisions

### Core stack

- Runtime: Node.js with TypeScript.
- API framework: Express, retained to minimize unnecessary frontend and deployment changes.
- API style: versioned REST endpoints under `/api/v1` while temporarily preserving the existing `/api/*` routes during migration.
- Database: MongoDB Atlas with Mongoose.
- Validation: Zod schemas shared by request validation and TypeScript types where practical.
- Authentication: short-lived JWT access tokens plus rotating refresh tokens in secure, HTTP-only cookies.
- Password hashing: Argon2, or bcrypt if the deployment environment cannot support Argon2 reliably.
- Authorization: role-based access control with explicit permissions and resource ownership checks.
- File storage: Cloudinary initially, behind a storage adapter so S3-compatible storage can be added later.
- Background jobs and caching: Redis plus BullMQ, introduced when notifications, expiry jobs, and inventory holds are implemented.
- API documentation: OpenAPI/Swagger generated from maintained route schemas.
- Testing: Vitest and Supertest for unit and API integration tests.
- Logging: Pino structured logs with request IDs.
- Deployment: a persistent Node hosting platform such as Render, Railway, Fly.io, Cloud Run, or AWS. The frontend may remain on Vercel.

### Business rules

- The server is the authority for prices, taxes, discounts, availability, commissions, and booking state.
- Money is stored in integer minor units, never floating-point values.
- Dates are stored in UTC; listing/property time zones are recorded explicitly.
- Bookings use database transactions and inventory holds to prevent double booking.
- Payments are provider-agnostic. Card, JazzCash, Easypaisa, and pay-at-property flows implement a common payment interface.
- Sensitive actions are auditable. Admin, vendor, payout, refund, and booking-state changes produce audit events.
- All vendor-owned resources require both role permission and ownership checks.

## 3. Proposed Backend Structure

```text
src/server/
  app.ts
  start.ts
  config/
  database/
  middleware/
  shared/
  modules/
    auth/
    users/
    vendors/
    listings/
    inventory/
    bookings/
    payments/
    wallets/
    promotions/
    reviews/
    messaging/
    support/
    notifications/
    analytics/
    ai-planner/
    admin/
  jobs/
  docs/
  tests/
```

Each module should contain its model, validation schema, service, controller, routes, permissions, and tests. Controllers handle HTTP concerns; business rules belong in services.

## 4. Phase 0: Confirm Product Rules

- [ ] Confirm launch inventory: hotels only first, or hotels, homestays, cars, and tours together.
- [ ] Confirm supported currencies and whether PKR is the settlement currency.
- [ ] Confirm initial payment providers and obtain sandbox credentials.
- [ ] Define commission rules by product type and vendor.
- [ ] Define cancellation, refund, no-show, and dispute policies.
- [ ] Define vendor verification and listing approval requirements.
- [ ] Define admin and employee permission matrix.
- [ ] Confirm email, SMS, and WhatsApp providers.
- [ ] Confirm deployment provider, domain layout, and production environments.
- [ ] Convert confirmed rules into versioned product/technical decision records.

Deliverable: approved business-rule checklist and environment/provider choices.

## 5. Phase 1: Foundation and Data Layer

### Project foundation

- [ ] Split the current `server.ts` into the modular structure above.
- [ ] Add validated environment configuration and fail-fast startup checks.
- [ ] Add MongoDB connection lifecycle, graceful shutdown, and health/readiness endpoints.
- [ ] Add central error handling with consistent API error codes and response shapes.
- [ ] Add request IDs, structured logging, CORS configuration, Helmet, compression, and rate limiting.
- [ ] Add request validation middleware using Zod.
- [ ] Add API versioning and preserve compatibility adapters for current frontend endpoints.
- [ ] Add OpenAPI documentation and a development-only API explorer.

### Initial data model

- [ ] Create base schemas with IDs, timestamps, status, and soft-delete metadata where required.
- [ ] Create User, Session, Role/Permission, Vendor, Listing, Media, and AuditLog models.
- [ ] Add indexes for emails, slugs, location search, status, ownership, and common filtering fields.
- [ ] Write an idempotent seed command that imports current data from `src/data.ts`.
- [ ] Replace mock listing reads with MongoDB queries without changing the visible frontend behavior.
- [ ] Add pagination, sorting, filtering, and stable error responses to listing APIs.

### Quality gates

- [ ] Add lint, type-check, test, and build scripts suitable for CI.
- [ ] Add initial unit and API tests for health and listings.
- [ ] Create separate `.env.example` sections for local, test, staging, and production requirements.

Deliverable: persistent listings served from MongoDB through documented, tested APIs.

## 6. Phase 2: Authentication, Users, and RBAC

### Authentication

- [ ] Implement customer and vendor registration.
- [ ] Implement login, logout, token refresh, and logout from all devices.
- [ ] Store hashed refresh-token/session records with expiration and device metadata.
- [ ] Implement email verification.
- [ ] Implement forgot-password and reset-password flows with one-time, expiring tokens.
- [ ] Add OTP provider interfaces for later email/SMS verification.
- [ ] Add login throttling, temporary account lockout, and suspicious-login audit events.
- [ ] Add optional two-factor authentication after the core flow is stable.

### Users and permissions

- [ ] Implement profile read/update and password change.
- [ ] Add roles: customer, vendor owner, vendor staff, support agent, admin, and super admin.
- [ ] Define permission constants and route-level authorization middleware.
- [ ] Add ownership checks for bookings, listings, tickets, reviews, and messages.
- [ ] Add admin user status controls: activate, suspend, verify, and archive.

### Frontend integration

- [ ] Replace `gb_registered_users` and `gb_current_user` localStorage authentication.
- [ ] Add an authenticated API client that handles refresh and logout consistently.
- [ ] Protect customer, vendor, employee, and admin routes.
- [ ] Remove email query parameters as a method of identifying the signed-in user.

Deliverable: real server-backed login and permission-protected APIs for every role.

## 7. Phase 3: Vendors and Marketplace Catalog

### Vendor onboarding

- [ ] Implement vendor organization and staff membership models.
- [ ] Add onboarding status, business details, bank/payout profile, and verification documents.
- [ ] Add admin review, approval, rejection, suspension, and resubmission workflows.
- [ ] Record every verification decision in the audit log.

### Product catalog

- [ ] Model shared listing fields and type-specific hotel, homestay, vehicle, driver, tour, and destination data.
- [ ] Implement vendor listing create, read, update, archive, and duplicate APIs.
- [ ] Implement draft, submitted, approved, rejected, paused, and archived listing states.
- [ ] Add rooms/categories, occupancy rules, amenities, facilities, policies, and house rules.
- [ ] Add vehicle details, rental rules, driver assignment, pickup/drop-off, and document verification.
- [ ] Add tour itinerary, inclusions, exclusions, capacity, departure schedule, and package variants.
- [ ] Add media upload, ordering, captions, validation, transformations, and deletion.
- [ ] Add admin moderation APIs and rejection feedback.

### Search and discovery

- [ ] Implement text, destination, date, guest, price, rating, amenity, and product-type filters.
- [ ] Add geospatial coordinates and radius/map-bound search.
- [ ] Implement pagination, sorting, featured items, and destination pages.
- [ ] Add search indexes only after representative query performance is measured.

Deliverable: vendors manage persisted inventory and admins control what becomes public.

## 8. Phase 4: Availability, Pricing, and Booking Engine

### Inventory and availability

- [ ] Define inventory units for rooms, properties, vehicles, tour seats, and drivers.
- [ ] Add calendars, stock counts, closures, minimum/maximum stay, and booking windows.
- [ ] Add date-based rate plans and occupancy-based pricing.
- [ ] Implement temporary inventory holds with automatic expiration.
- [ ] Use atomic updates/transactions to prevent double booking.
- [ ] Add vendor bulk calendar and pricing update APIs.

### Pricing

- [ ] Implement server-side subtotal, taxes, fees, extras, discounts, and final total calculation.
- [ ] Store immutable price snapshots on booking records.
- [ ] Return an expiring quote ID from a quote endpoint before booking creation.
- [ ] Validate coupons and eligibility only on the server.
- [ ] Add currency and rounding rules.

### Booking lifecycle

- [ ] Create Booking, BookingGuest, PriceSnapshot, InventoryHold, and Cancellation records.
- [ ] Implement states: pending, awaiting payment, confirmed, completed, cancelled, expired, no-show, and refunded.
- [ ] Implement quote, create, confirm, cancel, and booking-detail endpoints.
- [ ] Add an idempotency key to booking creation and payment-sensitive operations.
- [ ] Implement cancellation penalties and refund calculations.
- [ ] Add customer, vendor, and admin booking queries with proper data visibility.
- [ ] Replace the current in-memory booking endpoints and client-side price trust.
- [ ] Correct the shared payment-method type to include `pay_at_hotel`.

Deliverable: transaction-safe booking flow with authoritative pricing and availability.

## 9. Phase 5: Payments, Wallets, Commissions, and Payouts

### Payments

- [ ] Define a payment-provider adapter and normalized payment states.
- [ ] Implement card payment intents with the selected provider.
- [ ] Add JazzCash and Easypaisa adapters after merchant sandbox access is available.
- [ ] Support pay-at-property with explicit vendor confirmation and collection status.
- [ ] Verify webhook signatures and process events idempotently.
- [ ] Reconcile booking and payment states through background jobs.
- [ ] Never store raw card data.

### Financial ledger

- [ ] Create Payment, Refund, LedgerEntry, Wallet, CommissionRule, and Payout models.
- [ ] Use an append-only ledger for every balance-changing event.
- [ ] Implement full and partial refunds with approval rules.
- [ ] Calculate platform commission from immutable booking snapshots.
- [ ] Add vendor available, pending, reserved, and paid balances.
- [ ] Add payout requests, review, processing, failure, and completion states.
- [ ] Add customer wallet credits only after ledger invariants and admin controls are tested.

### Promotions

- [ ] Add coupon CRUD, validity periods, limits, audience rules, minimum spend, and product eligibility.
- [ ] Add usage reservation and release to prevent exceeding limits during concurrent checkout.
- [ ] Implement referral and loyalty modules only after core payments are stable.

Deliverable: auditable payment and settlement flow with refunds and vendor payouts.

## 10. Phase 6: Customer, Vendor, Employee, and Admin Operations

### Customer APIs

- [ ] Booking history, details, cancellation, invoices, and vouchers.
- [ ] Profile, saved travelers, wishlist, wallet, notifications, and support history.
- [ ] Replace hardcoded wallet transactions and localStorage wishlist data.

### Vendor APIs

- [ ] Dashboard summaries for reservations, revenue, occupancy, cancellations, and ratings.
- [ ] Booking management and operational notes.
- [ ] Calendar, inventory, pricing, listing, staff, finance, and payout management.
- [ ] Persist listing creation currently held only in component state.

### Employee and admin APIs

- [ ] User, vendor, listing, booking, payment, refund, payout, and ticket administration.
- [ ] Fine-grained employee permissions and scoped queues.
- [ ] Dashboard analytics with explicit date ranges and exportable reports.
- [ ] Audit-log search and sensitive-action confirmation.

Deliverable: all existing dashboards use real scoped data, plus the required admin workspace APIs.

## 11. Phase 7: Reviews, Messaging, Support, and Notifications

### Reviews

- [ ] Allow reviews only for eligible completed bookings.
- [ ] Add ratings, text, media, vendor replies, moderation, and reporting.
- [ ] Recalculate listing rating aggregates safely.
- [ ] Replace mock review storage.

### Messaging and support

- [ ] Add booking-aware customer/vendor conversation threads.
- [ ] Implement message persistence, unread counts, attachments, and moderation metadata.
- [ ] Add support ticket categories, priorities, assignments, status transitions, and internal notes.
- [ ] Enforce ticket ownership and employee queue permissions.
- [ ] Replace polling with WebSocket/SSE updates only if real-time behavior is needed at launch.

### Notifications

- [ ] Create notification templates and user preferences.
- [ ] Add in-app, email, SMS, and optional WhatsApp channel adapters.
- [ ] Queue booking confirmations, reminders, cancellations, payment events, and support updates.
- [ ] Track delivery attempts and failures without blocking user requests.

Deliverable: persistent, permission-safe communication across the marketplace.

## 12. Phase 8: AI Planner, Maps, and Advanced Travel Features

- [ ] Keep Gemini calls server-side and move prompts/configuration into a dedicated module.
- [ ] Validate AI output against a strict schema before returning or storing it.
- [ ] Ground suggestions in approved listings, availability, budget, and destination data.
- [ ] Persist itineraries and allow users to revise, save, and convert them into booking requests.
- [ ] Add abuse controls, quotas, timeouts, fallbacks, and usage/cost logging.
- [ ] Add custom trip request, agent assignment, quote, revision, approval, and payment workflows.
- [ ] Integrate geocoding, map display data, distance matrices, and route estimates through provider adapters.

Deliverable: AI and map features operate on real marketplace data with controlled cost and output.

## 13. Phase 9: Documents, Security, Reliability, and Launch

### Documents

- [ ] Generate booking confirmations, invoices, vouchers, refund receipts, and payout statements.
- [ ] Store immutable document metadata and regenerate only from recorded booking snapshots.
- [ ] Protect document URLs with authorization or short-lived signed links.

### Security

- [ ] Validate upload type, size, and ownership; scan sensitive vendor documents where possible.
- [ ] Add strict security headers, secret rotation procedures, and least-privilege provider credentials.
- [ ] Review injection, broken access control, mass assignment, SSRF, and rate-limit risks.
- [ ] Redact secrets and personal/payment data from logs.
- [ ] Add retention and deletion rules for personal and verification data.
- [ ] Complete a focused security review before production launch.

### Reliability and delivery

- [ ] Add unit, integration, authorization, concurrency, webhook, and critical-flow end-to-end tests.
- [ ] Add CI checks for type-checking, tests, builds, dependency audits, and migrations/seeds.
- [ ] Create development, staging, and production environments.
- [ ] Configure database backups and test restoration.
- [ ] Add uptime, error, latency, queue, payment, and database monitoring with alerts.
- [ ] Run load tests for search, availability, quotes, and booking creation.
- [ ] Write deployment, rollback, incident, support, and provider configuration runbooks.
- [ ] Freeze and document the v1 API contract before mobile/client expansion.

Deliverable: tested, monitored, recoverable production release with operational documentation.

## 14. Suggested Milestones

### Milestone A: Persistent prototype

- [ ] Complete Phase 0 decisions that block engineering.
- [ ] Complete Phase 1.
- [ ] Seed current listings and confirm the frontend still behaves the same.

### Milestone B: Secure customer flow

- [ ] Complete Phase 2.
- [ ] Complete hotel/homestay portions of Phases 3 and 4.
- [ ] Customer can register, search, receive a server quote, and create a real booking.

### Milestone C: Commercial MVP

- [ ] Complete core payments, refunds, commissions, vendor operations, and admin moderation.
- [ ] Complete transactional notifications and invoices.
- [ ] Launch hotels/homestays in staging with end-to-end test data.

### Milestone D: Marketplace expansion

- [ ] Add vehicles, drivers, tours, and custom trips.
- [ ] Add advanced messaging, support operations, maps, analytics, and AI grounding.
- [ ] Complete production hardening and launch readiness review.

## 15. Definition of Done for Every Backend Task

- [ ] Business rules and permissions are explicit.
- [ ] Request and response schemas are validated.
- [ ] Authentication, authorization, and ownership are tested.
- [ ] Success, validation failure, conflict, and not-found paths are tested.
- [ ] Logs contain useful context without exposing secrets or personal data.
- [ ] OpenAPI documentation is updated.
- [ ] Frontend integration is complete; no production feature depends on static or localStorage data.
- [ ] Type-check, tests, and production build pass.
- [ ] Any new environment variable is documented in `.env.example`.
- [ ] Any operational requirement is documented in the relevant runbook.

## 16. Immediate Next Sprint

- [ ] Create the modular Express application shell.
- [ ] Add environment validation and MongoDB connection management.
- [ ] Add common error, logging, request ID, security, and validation middleware.
- [ ] Implement the Listing model and idempotent static-data seed command.
- [ ] Replace `GET /api/listings` and `GET /api/listings/:id` with database-backed services.
- [ ] Add health, listing, and seed tests.
- [ ] Add initial OpenAPI documentation.
- [ ] Verify the existing search and listing-detail screens against the new API.

Sprint completion result: the frontend looks unchanged, but listing data survives restarts and the backend has a maintainable production foundation.
