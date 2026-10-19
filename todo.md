# Hotels — remaining work

All 12 Phase 1 (Hotels) items are built. These are the open tasks.

## Before handing Phase 1 to the client

- [x] **End-to-end test on a real database** — click through as customer, vendor and admin: partner registration and approval, hotel creation and approval, search, booking, confirm/decline, pending-request expiry (24h), availability calendar closures, mark paid, admin take-down, admin cancel by reference, business change requests. Done 2026-10-14 through the API (all checks passed); the screens themselves still need a manual click-through.
- [x] **Keep live hotels bookable while edits are reviewed** — today any text/photo edit sends a live hotel back to draft (hidden from guests) until re-approved. Keep the published version live and review the edit as a pending revision. Done: edits to a live hotel or its rooms wait as a pending revision (admin filter "Changes to review"); price, room count and pausing still apply at once.
- [x] **Email vendors about admin decisions** — business approved/rejected/suspended, hotel published/rejected/taken down, business change request approved/rejected.
- [x] **Clean up old applicant accounts** — users who applied before "role on approval" still have `vendor_owner` without an approved business. One-time database fix (needs owner's OK before running). Script ready: `npx tsx server/scripts/fix-applicant-roles.ts` (dry run), add `--apply` to write. Done 2026-10-14: removed from admin@gmail.com and demo@gmail.com.
- [x] **Fake newsletter forms** — the Homestays page and footer forms say "Subscribed" but save nothing. Connect them to something real or remove them. Done: both save to the `newslettersubscribers` collection (`POST /api/v1/newsletter`). There is no admin export or sending yet.
- [ ] **Paid bookings cancelled by admin stay "paid"** — found in the end-to-end test: there is no refund flag or warning yet. Settle with the Phase 2 refund rules.
- [ ] **Click through the new dashboards in a browser** — admin Review inbox, vendor hotel workspace (Rooms tab), Add hotel wizard, reservation Check in / Change. All type-check and the APIs behind them are tested, but no one has clicked through the screens yet.

## Found in the 2026-10-14 audit

- [ ] **Support page is fake** — the Support Centre shows a ticket inbox, but `/api/support/tickets` is a stub: the list is always empty and sending a request fails with "not implemented". Build tickets, or replace the page with contact details (email, phone, WhatsApp).
- [x] **Promo codes that cannot be used** — the Offers page lets guests copy promo codes, but checkout has no code field and coupons don't exist yet (Phase 2). Hide the codes until coupons work, or mark them "coming soon". Done: shown as "promo codes coming soon", no copy button.
- [x] **Reviews section is always empty** — the listing page has a reviews block and star ratings, but no reviews can be written yet (Phase 2). It shows "New" for every hotel; fine for now, but don't advertise "verified reviews" until they exist. Done: the label now says "reviews" (English and Urdu).
- [ ] **Guests cannot change their own booking** — only the hotel can change dates or rooms. Guests must cancel (before check-in) and rebook, or contact the hotel. Decide whether guests should get "Request a change".
- [ ] **Changing a paid booking is blocked** — a booking marked paid cannot be changed (no refund/top-up rules yet). The hotel must cancel and rebook. Revisit with the Phase 2 payment rules.
- [x] **No arrivals/in-house view** — Check in exists per booking, but there is no "Arriving today / In house" list for reception. Filter by check-in date works as a stopgap. Done: "Arriving today" and "In house" tabs in Reservations (`stay=arriving|in_house`).
- [ ] **API docs are stale** — `server/docs/openapi.ts` (served at `/api/docs`) describes almost none of the `/api/v1` routes. Generate it from the zod schemas, or delete it and the `swagger-ui-express` dependency.
- [ ] **Two API prefixes** — most routes are mounted at both `/api/...` and `/api/v1/...`, and the frontend mixes them. Move the frontend to `/api/v1` and drop the duplicates (check the auth cookie path, which is `/api`, before doing so).
- [ ] **No automated tests** — there is no test script. The end-to-end API checks used during development live outside the repo; add them under `server/scripts` (or a `test` script) so they can be rerun before each release.
- [ ] **AI planner model name** — `server/modules/ai/ai.routes.ts` calls `gemini-3.5-flash`; confirm that model exists for the configured key before enabling the planner.

## Useful for hotels, can wait

- [x] **Photo management** — reorder photos, choose the cover photo, captions, photos per room category (today the whole set can only be replaced). Done: reorder, cover, captions, and photos per room category.
- [x] **Check-in tracking and booking changes** — mark guests as checked in; change dates or rooms on an existing booking (inventory moved in one transaction, price re-quoted). Done: Check in on confirmed bookings from the arrival date (no-show is then blocked); Change on pending/confirmed, unpaid, not-checked-in bookings, which releases the old nights, reserves the new ones, re-quotes at today's rate and emails the guest.
- [x] **Vendor reports** — occupancy and money collected per hotel. Done: Reports tab (owner/manager) with occupancy, booked revenue, collected, arrivals, cancellations and no-shows per hotel for any dates (`GET /api/v1/vendor/bookings/report`).
- [x] **Hotel staff accounts** — hotel owner invites their own reception staff (`vendor_staff`) with limited access. Done: Team tab (owner only). Managers get hotels, rooms, reservations and reports; Reception gets reservations only. New people get a password setup email. Add/remove has not been run against a real inbox yet.
- [x] **Checkout survives refresh** — selected room, dates and guests are lost on page refresh. Done: kept in sessionStorage for the browser tab; a refreshed `/listing/:id/checkout` reopens checkout.

## Planned for later phases

- [x] Reviews and ratings (Phase 2) — see Homestays section.
- [ ] Online payments and refunds — JazzCash, Easypaisa, card (Phase 2)
- [ ] Coupons and promotional offers (Phase 2)
- [ ] Downloadable PDF vouchers and invoices (Phase 2)
- [ ] Per-hotel cancellation policies, seasonal/weekend pricing, taxes and fees — depend on the Phase 2 payment rules

# Homestays (Phase 2) — status

Payments are deferred: guests pay at check-in, as for hotels.

## Built (2026-10-19)
- [x] **Host registration** — "Become a partner" → Homestays. Hosts register with CNIC + proof of property (no business registration number). One account is one partner type; a homestay host cannot list hotels and vice versa.
- [x] **Add homestay wizard** — basics, experience, private rooms or entire home, location + map pin, house rules, host profile (photo, bio, languages, family on site), meals, photos, rooms.
- [x] **Entire home** — one booking unit; the server rejects a second unit or a count above 1.
- [x] **Meals** — host sets breakfast/lunch/dinner as included or extra (per guest per night). Guests add extra meals when booking; the server prices them, and they are paid at check-in. Host booking changes keep the meals and re-price them for the new nights.
- [x] **Maps (Google, no key or billing)** — map pin by pasting a Google Maps link or "use my location"; embedded map and "Get directions" on hotel and homestay pages. The keyless embed is not an official Google API; switch to the Maps Embed API (free, needs a key) if it stops working.
- [x] **Search** — experience and "type of stay" filters work (the experience cards on the Homestays page used to show everything).
- [x] **Wording** — emails and the partner dashboard say "property"/"homestay" instead of always "hotel".

- [x] **Policies (Booking.com-style)** — children, minimum check-in age, extra beds, pets, smoking, and how guests can pay at the property (cash, card, JazzCash, Easypaisa, bank transfer). Required before a property can be submitted.
- [x] **Mountain essentials** — power backup, heating, hot water, mobile signal (SCOM/Zong/Jazz/Telenor/Ufone), road access (car / jeep / on foot) with a note, and the months the property is open. Shown as "Good to know before you go"; guests are warned when their dates fall outside the open months.
- [x] **Room tags and breakfast filter** — each bookable room shows "Free cancellation until …", "Pay at the property (…)" and "Breakfast included"; search has a "Breakfast included" filter (homestay meals, or a hotel amenity named Breakfast).
- [x] **Property contact** — the business phone is shown with tel: and WhatsApp links on the voucher and in the confirmation email once the property confirms (hidden while pending). It is a snapshot taken at booking time.
- [ ] Existing published hotels have no policies/essentials yet; their owners should fill them in (edit property → saved as a change for review).

## Still to do in Phase 2
- [ ] Click through the homestay screens in a browser (registration, wizard, listing page, booking with meals, admin review).
- [x] **Reviews and ratings (hotels and homestays)** — guests review a finished stay once, up to 30 days after check-out (completed, or confirmed and past check-out): overall 1–5 stars plus staff, cleanliness, comfort, value, location and optional WiFi, with "liked / could be better" text. Listing rating, review count and category averages update automatically. Partners reply publicly (Reviews tab, owner/manager) and can report a review; the admin hides or restores reviews and dismisses reports (Guest reviews tab). Reviews cannot be edited after posting.
- [ ] PDF vouchers and invoices
- [ ] Coupons and promotional offers
- [ ] Online payments, wallet and refunds — deferred by the owner; pay at check-in for now
- [ ] Distance (e.g. "12 km from Karimabad") — not built; the map and directions link cover finding the place
