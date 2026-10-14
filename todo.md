# Hotels — remaining work

All 12 Phase 1 (Hotels) items are built. These are the open tasks.

## Before handing Phase 1 to the client

- [x] **End-to-end test on a real database** — click through as customer, vendor and admin: partner registration and approval, hotel creation and approval, search, booking, confirm/decline, pending-request expiry (24h), availability calendar closures, mark paid, admin take-down, admin cancel by reference, business change requests. Done 2026-10-14 through the API (all checks passed); the screens themselves still need a manual click-through.
- [x] **Keep live hotels bookable while edits are reviewed** — today any text/photo edit sends a live hotel back to draft (hidden from guests) until re-approved. Keep the published version live and review the edit as a pending revision. Done: edits to a live hotel or its rooms wait as a pending revision (admin filter "Changes to review"); price, room count and pausing still apply at once.
- [x] **Email vendors about admin decisions** — business approved/rejected/suspended, hotel published/rejected/taken down, business change request approved/rejected.
- [x] **Clean up old applicant accounts** — users who applied before "role on approval" still have `vendor_owner` without an approved business. One-time database fix (needs owner's OK before running). Script ready: `npx tsx server/scripts/fix-applicant-roles.ts` (dry run), add `--apply` to write. Done 2026-10-14: removed from admin@gmail.com and demo@gmail.com.
- [ ] **Fake newsletter forms** — the Homestays page and footer forms say "Subscribed" but save nothing. Connect them to something real or remove them.
- [ ] **Paid bookings cancelled by admin stay "paid"** — found in the end-to-end test: there is no refund flag or warning yet. Settle with the Phase 2 refund rules.
- [ ] **Click through the new dashboards in a browser** — admin Review inbox, vendor hotel workspace (Rooms tab), Add hotel wizard, reservation Check in / Change. All type-check and the APIs behind them are tested, but no one has clicked through the screens yet.

## Found in the 2026-10-14 audit

- [ ] **Support page is fake** — the Support Centre shows a ticket inbox, but `/api/support/tickets` is a stub: the list is always empty and sending a request fails with "not implemented". Build tickets, or replace the page with contact details (email, phone, WhatsApp).
- [ ] **Promo codes that cannot be used** — the Offers page lets guests copy promo codes, but checkout has no code field and coupons don't exist yet (Phase 2). Hide the codes until coupons work, or mark them "coming soon".
- [ ] **Reviews section is always empty** — the listing page has a reviews block and star ratings, but no reviews can be written yet (Phase 2). It shows "New" for every hotel; fine for now, but don't advertise "verified reviews" until they exist.
- [ ] **Guests cannot change their own booking** — only the hotel can change dates or rooms. Guests must cancel (before check-in) and rebook, or contact the hotel. Decide whether guests should get "Request a change".
- [ ] **Changing a paid booking is blocked** — a booking marked paid cannot be changed (no refund/top-up rules yet). The hotel must cancel and rebook. Revisit with the Phase 2 payment rules.
- [ ] **No arrivals/in-house view** — Check in exists per booking, but there is no "Arriving today / In house" list for reception. Filter by check-in date works as a stopgap.
- [ ] **API docs are stale** — `server/docs/openapi.ts` (served at `/api/docs`) describes almost none of the `/api/v1` routes. Generate it from the zod schemas, or delete it and the `swagger-ui-express` dependency.
- [ ] **Two API prefixes** — most routes are mounted at both `/api/...` and `/api/v1/...`, and the frontend mixes them. Move the frontend to `/api/v1` and drop the duplicates (check the auth cookie path, which is `/api`, before doing so).
- [ ] **No automated tests** — there is no test script. The end-to-end API checks used during development live outside the repo; add them under `server/scripts` (or a `test` script) so they can be rerun before each release.
- [ ] **AI planner model name** — `server/modules/ai/ai.routes.ts` calls `gemini-3.5-flash`; confirm that model exists for the configured key before enabling the planner.

## Useful for hotels, can wait

- [x] **Photo management** — reorder photos, choose the cover photo, captions, photos per room category (today the whole set can only be replaced). Done: reorder, cover, captions, and photos per room category.
- [x] **Check-in tracking and booking changes** — mark guests as checked in; change dates or rooms on an existing booking (inventory moved in one transaction, price re-quoted). Done: Check in on confirmed bookings from the arrival date (no-show is then blocked); Change on pending/confirmed, unpaid, not-checked-in bookings, which releases the old nights, reserves the new ones, re-quotes at today's rate and emails the guest.
- [ ] **Vendor reports** — occupancy and money collected per hotel.
- [ ] **Hotel staff accounts** — hotel owner invites their own reception staff (`vendor_staff`) with limited access.
- [x] **Checkout survives refresh** — selected room, dates and guests are lost on page refresh. Done: kept in sessionStorage for the browser tab; a refreshed `/listing/:id/checkout` reopens checkout.

## Planned for later phases

- [ ] Reviews and ratings (Phase 2)
- [ ] Online payments and refunds — JazzCash, Easypaisa, card (Phase 2)
- [ ] Coupons and promotional offers (Phase 2)
- [ ] Downloadable PDF vouchers and invoices (Phase 2)
- [ ] Per-hotel cancellation policies, seasonal/weekend pricing, taxes and fees — depend on the Phase 2 payment rules
