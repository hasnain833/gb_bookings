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
- [x] **API docs are stale** — Done 2026-10-20: deleted `server/docs/openapi.ts`, the `/api/docs` explorer and `swagger-ui-express`.
- [x] **Two API prefixes** — Done 2026-10-20: the frontend calls `/api/v1` only and the duplicate `/api/...` mounts are gone (the auth cookie path `/api` still covers `/api/v1`). Health is now `/api/v1/health`; update any uptime monitor that pinged `/api/health`. The Support page stub still answers at `/api/support/tickets`.
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
- [x] Coupons (Phase 2) — partner promo codes, see Homestays section
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
- [x] Existing published hotels have no policies/essentials yet — the partner Home page now shows a "Fill them in" banner for each such property.

## Still to do in Phase 2
- [ ] Click through the homestay screens in a browser (registration, wizard, listing page, booking with meals, admin review).
- [x] **Reviews and ratings (hotels and homestays)** — guests review a finished stay once, up to 30 days after check-out (completed, or confirmed and past check-out): overall 1–5 stars plus staff, cleanliness, comfort, value, location and optional WiFi, with "liked / could be better" text. Listing rating, review count and category averages update automatically. Partners reply publicly (Reviews tab, owner/manager) and can report a review; the admin hides or restores reviews and dismisses reports (Guest reviews tab). Reviews cannot be edited after posting.
- [x] **PDF vouchers and receipts** — My Bookings → View reservation → "Print or save as PDF" (browser print; the file is named after the booking reference). Once marked paid it reads as a payment receipt. No server-generated PDF or tax invoice; the property issues its own invoice since guests pay there.
- [x] **Promo codes (partner-made)** — Partner dashboard → Promo codes (owner/manager/listings): % off (max 90) or PKR off, optional "book by" date and max uses; codes cover all the partner's properties and can be switched off, not edited. Guests enter the code on the checkout review step; the server prices it (room + meals), takes a use inside the booking transaction, gives it back on cancellation, and keeps the same terms when the property changes the booking. Shown on the voucher, the emails and the partner's reservation details. Not run against a real database yet.
- [ ] Offers page promo codes are old listing data, not real coupons, and still say "coming soon". Link offers to partner codes, or remove them.
- [ ] Platform-wide (admin) coupons — not built; the owner chose partner codes because guests pay the property.
- [ ] Online payments, wallet and refunds — deferred by the owner; pay at check-in for now
- [ ] Distance (e.g. "12 km from Karimabad") — not built; the map and directions link cover finding the place

# Cars (Phase 4, started before Tours at the owner's request) — status

Same engine as hotels: one car listing is one car model with one fleet entry (a room type: count = number of identical cars, price = per day, seats = capacity). Rented days include pickup and return; bookings store the day after return as `checkOut`, so inventory, changes, cancellations and reports work unchanged (see `server/modules/bookings/rental.ts`). Payments: at pickup.

## Built (2026-10-19)
- [x] **Car partners** — "Become a partner" → Cars: rental company (registration number) or owner-driver (CNIC + driving licence). Both upload vehicle registration. One account is one partner type.
- [x] **Add car wizard** — car (make, model, year, type, gearbox, fuel, seats, bags, features) → base city, map, description → price per day, number of cars, driver (with / self-drive / guest chooses), driver charge per day, fuel included or not, extra per day outside the base city, one-way drop-off (flat fee or on request), self-drive deposit and minimum age, pickup notes, payment at pickup → photos → review.
- [x] **Partner workspace** — "Cars & fleet": Price & fleet tab (price/count/on-off, 14-day strip, calendar closures for maintenance), car Details editor (live edits wait for review; seats and type follow onto the fleet entry), Rentals tab. Reservations say "Car handed over" / "Car returned" and show pickup, drop-off, driver, licence and deposit.
- [x] **Guests** — Cars landing categories filter by car type; search has pickup/return dates (only free cars), passengers, driver and transmission filters; car page shows specs and terms and a booking panel (pickup/return/time, passengers, cars, driver choice, pickup place, outside-city, one-way + drop-off place) with a server-priced breakdown; checkout asks self-drive renters for a licence number; voucher, emails and My Bookings use car wording. Promo codes work on cars.
- [x] **Admin** — car partners and cars go through the existing review screens with car details shown.

## Still to do for Cars
- [ ] Click through the car screens in a browser (registration, wizard, workspace, search, booking, admin review). The server flow was checked end to end on a throwaway database (quote, booking, promo code, sold out, self-drive licence, search, change, cancel, hotel regression).
- [ ] Handover photos, fuel and odometer records at pickup/return — add if damage disputes come up.
- [ ] Route fare tables (e.g. Gilgit → Skardu) — the one-way fee and outside-city charge cover it for now.
- [ ] Old platform-owned car listings (no partner, no price unit) still show "coming soon" on their page.
- [ ] Reviews use hotel categories (staff, cleanliness, comfort, value, location); cars may want driver/vehicle-condition categories.

# Tours (Phase 3) — status

Same engine as hotels and cars: one tour listing has one booking unit (count = seats per departure, price = adult price per person). A booking takes one seat per traveller on the start date only (stored `checkOut` is the day after it), so the same tour can depart again the next day; guests see the last tour day as the end date (`server/modules/bookings/tour.ts`). Payments: at the start of the tour.

## Built (2026-10-20)
- [x] **Tour partners** — "Become a partner" → Tours: tour company (registration number, optional business registration document) or independent guide (CNIC + guide licence or proof of guiding). Stored as business type `tour_operator`. One account is one partner type.
- [x] **Add tour wizard** — type, duration, difficulty, minimum age, meeting point, start time, guide languages → name, area, map, description → included / not included, day-by-day itinerary → price per adult, seats per departure, any-day or fixed departures (+ dates), optional child price, payment at the start → photos → review.
- [x] **Partner workspace** — "My tours": Price & seats tab, Details editor (live edits wait for review), Dates & seats (fixed departures, apply at once) or Closed days (calendar closures), Bookings tab. Reservations say "Starting today" / "On tour", "Tour started" / "Tour finished"; a change moves only the start date.
- [x] **Guests** — tour page shows type, length, difficulty, languages, meeting point, included / not included, itinerary, map and a booking panel (departure picker or date, adults, children, server-priced total, seats left). Checkout, voucher, My Bookings and emails use tour words. Search has a start date, travellers and tour type. Promo codes work on tours.
- [x] **Admin** — Tours page in the sidebar; tour partners and tours go through the review inbox with tour details shown.
- [x] Self-check for the pricing and date rules: `npx tsx server/scripts/check-tours.ts`.

## Still to do for Tours
- [ ] Click through the tour screens in a browser and run a booking end to end on a database (only type-checked, built and the pure rules checked so far).
- [ ] Seats per departure are one number per tour; a smaller group on one date is set by closing seats on the calendar.
- [ ] Reports count every day as available for fixed-departure tours, so their occupancy reads low.
- [ ] Old platform-owned tours (no partner, no schedule) still show "coming soon" on their page.
- [ ] Private-group pricing — not built (owner chose per person + child price).
