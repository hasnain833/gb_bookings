# GBBookings to-do

This is the one to-do list. It replaces `docs/TODO.md`, which was merged in here on 2026-11-04.

- **Open now**: what to do next.
- **Test sheet round, 2026-11-04**: what the owner's testing changed.
- **Phase notes**: Hotels, Homestays, Cars, Tours and later requests, with their history.
- **GBBookings vs Booking.com**: the full feature gap list.

Test sheet: https://claude.ai/artifact/Mb68jpQo5rsJFxMHYcB9Sk

# Open now

## To retest
Use the To retest button on the test sheet. These need the owner, because they use real emails, partner and admin logins, or a key.

- [ ] Sign-in window, toasts, reset page, Google sign-in (A-01 to A-04).
- [ ] Change password with an email code (A-06).
- [ ] Newsletter welcome email and typo refusal (P-11).
- [ ] Back after paying stays on My Bookings (Y-01).
- [ ] Partner proposes a change; guest accepts or declines (H-04 to H-06, H-08). The server flow passed a check on a throwaway database on 2026-11-04; the screens have not been tried.
- [ ] One combined review for a new partner and their listing (O-02, O-06).
- [ ] Fees & refunds Edit, Cancel and Save (M-01).
- [ ] Live messages with `npm run dev:inngest` running (G-01, G-03).
- [ ] Booked days crossed out, and the same-dates warning (B-14, B-15).
- [ ] Urdu wording read by an Urdu speaker (P-10).
- [ ] Not yet tested at all: all of Cancellations and refunds (C-01 to C-08), H-04, Y-05, M-02 to M-06. Y-05 is now the admin refund queue.

## Needs the owner
- [ ] **Free Gemini key** — set `GEMINI_API_KEY` from Google AI Studio, then test the trip assistant (P-12) and CNIC reading (D-04).
- [ ] **Which details are missing?** — O-04 and O-05 asked for more details from car and tour partners. No fields were added.
- [ ] **Notes with no detail** — E-04, E-05, E-06 and L-13 are marked Improve with no note. L-01 and O-03 ask for general improvements only. Add a line or a screenshot on the next round.
- [ ] **Offers page** — keep it and link it to real partner promo codes, or remove it (SRCH-19). The demo codes still say coming soon.
- [ ] **Support phone and WhatsApp** — confirm the numbers on the live site (SUP-02).
- [ ] **Inngest on Vercel** — create a free account (Free plan: 50,000 executions and 50 realtime connections), set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` on Vercel, and register `<site>/api/inngest`. Until then scheduled jobs do not run on Vercel and the inbox polls.
- [ ] **Lawyer and accountant** — have a lawyer read the Partner Agreement, and an accountant confirm which taxes to set in Admin > Fees & refunds (none set yet).
- [ ] **Check on Vercel** — `/sitemap.xml`, `/robots.txt`, `/listing/<id>` and `/api/inngest` were only run locally.
- [ ] **Refunds recorded before today** have no queue entry; any real ones need paying from the Safepay dashboard.

## Before launch, not built
- [ ] **EXT-12** Calendar sync / channel manager (not in the features requested so far).
- [ ] **ADM-06** All-bookings list with search and export.
- [ ] **NFR-06** Confirm MongoDB Atlas backups and do one restore test.
- [ ] **PAY-01** Live Safepay keys and webhook, after Safepay approves the account.

# Test sheet round, 2026-11-04

The owner tested 89 of the original 104 tests. Built from those results, type-checked and built; each item's browser or server check is noted where it was run.

- [x] **Sign-in window** redesigned, with toasts for welcome, welcome back and sign-out. Checked: not yet in a browser.
- [x] **Our own form errors** replace the browser's bubbles on every form.
- [x] **Our own dropdowns, calendars and time pickers** replace the browser's across the site. Checked on the search and listing pages.
- [x] **Reset password page** on its own, for the holder of the link, showing their account. Bad link checked in a browser.
- [x] **Change password** by emailed code; this device stays signed in, other sessions end. Replaces the current-password form.
- [x] **Login & security** section redesigned, and **Saved stays** moved to its own page. Checked in a browser.
- [x] **Footer links** open filtered results. Checked in a browser.
- [x] **Guest filter** works without dates and counts the whole property. Checked on the server.
- [x] **Demo cars and tours with no partner** hidden; offers link to places to stay. Checked on the server.
- [x] **Booked days** crossed out in hotel, car and tour calendars. Checked on a car.
- [x] **Same-dates warning** at checkout.
- [x] **Back after paying** no longer returns to Safepay.
- [x] **Newsletter** refuses domains that can't receive mail, logs new subscribers and sends a welcome email. Refusal checked on the server.
- [x] **Trip assistant** chat window replaces the planner, which was showing fake plans with a fake ACTIVE GEMINI badge.
- [x] **Realtime** no longer floods the log when Inngest is down, and the inbox checks every 4 s. `npm run dev:inngest` added.
- [x] **Partner changes** are proposals with a required reason; the guest accepts or keeps the booking.
- [x] **New partner and their listing** reviewed as one item in the admin inbox.
- [x] **Fees & refunds** locked until Edit.
- [x] **After applying as a partner**: clear confirmation, and no offer to add the same hotel again.
- [x] **Listing page** quick facts. Checked in a browser.
- [x] **Urdu** on guest pages, through a dictionary in `src/app/urdu.ts`. Checked on home and search.
- [x] **Phone and CNIC checks** on partner forms; phone on checkout.
- [x] **Old "coming soon" text** about online payment updated.
- [x] **Refund decision** — refunds stay in the admin queue; automatic refunds stay off.

Answered, no change needed: the same dates can be booked twice while rooms remain (Deluxe Double has 3); the agreement banner is only for partners approved before it existed; localhost in the sitemap follows `APP_URL`; passwords are hashed with bcrypt.

# Phase notes

# Hotels

All 12 Phase 1 (Hotels) items are built.

## Before handing Phase 1 to the client

- [x] **End-to-end test on a real database** — click through as customer, vendor and admin: partner registration and approval, hotel creation and approval, search, booking, confirm/decline, pending-request expiry (24h), availability calendar closures, mark paid, admin take-down, admin cancel by reference, business change requests. Done 2026-10-14 through the API (all checks passed); the screens themselves still need a manual click-through.
- [x] **Keep live hotels bookable while edits are reviewed** — today any text/photo edit sends a live hotel back to draft (hidden from guests) until re-approved. Keep the published version live and review the edit as a pending revision. Done: edits to a live hotel or its rooms wait as a pending revision (admin filter "Changes to review"); price, room count and pausing still apply at once.
- [x] **Email vendors about admin decisions** — business approved/rejected/suspended, hotel published/rejected/taken down, business change request approved/rejected.
- [x] **Clean up old applicant accounts** — users who applied before "role on approval" still have `vendor_owner` without an approved business. One-time database fix (needs owner's OK before running). Script ready: `npx tsx server/scripts/fix-applicant-roles.ts` (dry run), add `--apply` to write. Done 2026-10-14: removed from admin@gmail.com and demo@gmail.com.
- [x] **Fake newsletter forms** — the Homestays page and footer forms say "Subscribed" but save nothing. Connect them to something real or remove them. Done: both save to the `newslettersubscribers` collection (`POST /api/v1/newsletter`). There is no admin export or sending yet.
- [x] **Paid bookings cancelled by admin stay "paid"** — Done: cancelling records a refund owed, which is paid and marked from Admin > Refunds.
- [x] **Click through the new dashboards in a browser** — Done 2026-11-04 by the owner with the test sheet.

## Found in the 2026-10-14 audit

- [x] **Support page is fake** — Done 2026-10-21: replaced the fake ticket inbox with a Help & contact page (WhatsApp, phone, email, office + FAQs) and removed the `/api/support/tickets` stub. Phone and WhatsApp come from `VITE_SUPPORT_PHONE` / `VITE_SUPPORT_WHATSAPP` (same as the footer) and stay hidden until set; email is `info@gbbookings.com`.
- [x] **Promo codes that cannot be used** — the Offers page lets guests copy promo codes, but checkout has no code field and coupons don't exist yet (Phase 2). Hide the codes until coupons work, or mark them "coming soon". Done: shown as "promo codes coming soon", no copy button.
- [x] **Reviews section is always empty** — the listing page has a reviews block and star ratings, but no reviews can be written yet (Phase 2). It shows "New" for every hotel; fine for now, but don't advertise "verified reviews" until they exist. Done: the label now says "reviews" (English and Urdu).
- [x] **Guests cannot change their own booking** — Done 2026-11-04: Request a change, which the partner accepts or declines.
- [x] **Changing a paid booking is blocked** — Done 2026-11-04: a cheaper booking refunds the difference, a dearer one leaves a balance to pay on arrival.
- [x] **No arrivals/in-house view** — Check in exists per booking, but there is no "Arriving today / In house" list for reception. Filter by check-in date works as a stopgap. Done: "Arriving today" and "In house" tabs in Reservations (`stay=arriving|in_house`).
- [x] **API docs are stale** — Done 2026-10-20: deleted `server/docs/openapi.ts`, the `/api/docs` explorer and `swagger-ui-express`.
- [x] **Two API prefixes** — Done 2026-10-20: the frontend calls `/api/v1` only and the duplicate `/api/...` mounts are gone (the auth cookie path `/api` still covers `/api/v1`). Health is now `/api/v1/health`; update any uptime monitor that pinged `/api/health`.
- [x] **No automated tests** — Decided 2026-11-04: testing is by hand with the test sheet. `server/scripts/` and `tests/` were deleted on purpose, along with the npm test commands and Playwright. Mentions of `server/scripts` further down this file are history.
- [ ] **Gemini key and model** — `GEMINI_API_KEY` is empty in `.env`, so the trip assistant and the CNIC reading are off. The model is now `GEMINI_MODEL` (default `gemini-2.5-flash`, used by both); confirm it works once a key is set.

## Useful for hotels, can wait

- [x] **Photo management** — reorder photos, choose the cover photo, captions, photos per room category (today the whole set can only be replaced). Done: reorder, cover, captions, and photos per room category.
- [x] **Check-in tracking and booking changes** — mark guests as checked in; change dates or rooms on an existing booking (inventory moved in one transaction, price re-quoted). Done: Check in on confirmed bookings from the arrival date (no-show is then blocked); Change on pending/confirmed, unpaid, not-checked-in bookings, which releases the old nights, reserves the new ones, re-quotes at today's rate and emails the guest.
- [x] **Vendor reports** — occupancy and money collected per hotel. Done: Reports tab (owner/manager) with occupancy, booked revenue, collected, arrivals, cancellations and no-shows per hotel for any dates (`GET /api/v1/vendor/bookings/report`).
- [x] **Hotel staff accounts** — hotel owner invites their own reception staff (`vendor_staff`) with limited access. Done: Team tab (owner only). Managers get hotels, rooms, reservations and reports; Reception gets reservations only. New people get a password setup email. Add/remove has not been run against a real inbox yet.
- [x] **Checkout survives refresh** — selected room, dates and guests are lost on page refresh. Done: kept in sessionStorage for the browser tab; a refreshed `/listing/:id/checkout` reopens checkout.

## Planned for later phases

- [x] Reviews and ratings (Phase 2) — see Homestays section.
- [x] Online payments and refunds by card and wallet through Safepay (sandbox). Going live is under Open now; JazzCash and Easypaisa as their own options are PAY-02.
- [x] Coupons (Phase 2) — partner promo codes, see Homestays section
- [x] Downloadable PDF vouchers (print or save as PDF). Tax invoices are PAY-14.
- [x] Per-listing cancellation policies, seasonal/weekend pricing, taxes and fees.

# Homestays (Phase 2) — status


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
- [x] Click through the homestay screens in a browser. Done 2026-11-04 by the owner with the test sheet.
- [x] **Reviews and ratings (hotels and homestays)** — guests review a finished stay once, up to 30 days after check-out (completed, or confirmed and past check-out): overall 1–5 stars plus staff, cleanliness, comfort, value, location and optional WiFi, with "liked / could be better" text. Listing rating, review count and category averages update automatically. Partners reply publicly (Reviews tab, owner/manager) and can report a review; the admin hides or restores reviews and dismisses reports (Guest reviews tab). Reviews cannot be edited after posting.
- [x] **PDF vouchers and receipts** — My Bookings → View reservation → "Print or save as PDF" (browser print; the file is named after the booking reference). Once marked paid it reads as a payment receipt. No server-generated PDF or tax invoice; the property issues its own invoice since guests pay there.
- [x] **Promo codes (partner-made)** — Partner dashboard → Promo codes (owner/manager/listings): % off (max 90) or PKR off, optional "book by" date and max uses; codes cover all the partner's properties and can be switched off, not edited. Guests enter the code on the checkout review step; the server prices it (room + meals), takes a use inside the booking transaction, gives it back on cancellation, and keeps the same terms when the property changes the booking. Shown on the voucher, the emails and the partner's reservation details. Not run against a real database yet.
- [ ] Offers page promo codes are old listing data, not real coupons, and still say "coming soon". Link offers to partner codes, or remove them.
- [ ] Platform-wide (admin) coupons — not built; the owner chose partner codes because guests pay the property.
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
- [x] Click through the car screens in a browser. Done 2026-11-04 by the owner with the test sheet.
- [ ] Handover photos, fuel and odometer records at pickup/return — add if damage disputes come up.
- [ ] Route fare tables (e.g. Gilgit → Skardu) — the one-way fee and outside-city charge cover it for now.
- [x] Old platform-owned car listings are hidden from guests (2026-11-04), because they could never be booked.
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
- [x] Click through the tour screens and book end to end. Done 2026-11-04 by the owner with the test sheet.
- [ ] Seats per departure are one number per tour; a smaller group on one date is set by closing seats on the calendar.
- [ ] Reports count every day as available for fixed-departure tours, so their occupancy reads low.
- [x] Old platform-owned tours are hidden from guests (2026-11-04), because they could never be booked.
- [ ] Private-group pricing — not built (owner chose per person + child price).

# Requested 2026-10-21

- [x] **Weekend and season prices** — every room / car / tour unit can have a Friday-and-Saturday price and up to 20 non-overlapping seasons (date range + price). A season beats the weekend price. Set from the Rooms / Price & fleet / Price & seats tab ("Weekend & season prices"); applies to new bookings at once, like the base price. Quotes, bookings and partner changes price each night (cars each day, tours the start date). Search "from" prices still show the base price. Self-check: `npx tsx server/scripts/check-room-price.ts`. Not run against a real database or clicked through yet.
- [x] **Commission and refund rules (admin)** — Admin → Tools → "Fees & refunds": commission % (starts at 2.5%) and guest refund tiers counted from when the booking was made (starting values: within 24h 100%, within 48h 75%, later 50%). Every booking stores its commission % and amount; a change re-works the amount at the same %. Cancelling an unpaid booking owes no commission; cancelling a paid one records the refund owed (guest: tiers; partner or admin: 100%) and charges commission only on what the partner keeps. Fee and refund show in partner reservation details and the admin lookup; the refund shows to the guest. Self-check: `npx tsx server/scripts/check-refunds.ts`. Settles the "paid bookings cancelled by admin stay paid" item: the refund is now recorded, but nobody marks it as sent yet (comes with the gateway's refund API).
- [x] **"Pay on arrival"** — the short name for paying the partner at check-in / pickup / tour start, used on listing pages, booking panels, voucher, My Bookings, emails and the footer.
- [x] **Pay now with Safepay (sandbox)** — checkout offers Pay now (when `SAFEPAY_API_KEY` / `SAFEPAY_SECRET_KEY` are set) or Pay on arrival. Pay now creates the booking, holds it for 60 minutes and sends the guest to Safepay's hosted page; the guest returns to My Bookings (`?payment=`), where the server asks Safepay whether the tracker is `TRACKER_ENDED` and, if so, marks it paid and confirmed and emails guest and partner. The webhook (`POST /api/v1/payments/safepay/webhook`) and the expiry sweep run the same check, so a payment is never lost if the guest closes the tab; a payment that lands after the hold was released is recorded as a 100% refund owed. Unpaid holds are hidden from partners. "Complete payment" in My Bookings retries. Smoke test: `npx tsx server/scripts/check-safepay.ts` (opens a PKR 100 sandbox payment; passed 2026-10-21).
- [ ] **Pay now: still to do** — register the webhook URL in the Safepay dashboard once the site is on a public HTTPS domain; switch `SAFEPAY_ENV=production` and live keys after Safepay approves the account. A sandbox payment passed the owner's test on 2026-11-04. Refunds and payouts now have their admin screens. If PayFast is chosen instead, only `server/modules/payments/safepay.ts` and the webhook route change.
- [x] **Policy pages for the payment providers** — Terms rewritten (Pay now / Pay on arrival, partners, commission), Privacy mentions Safepay, new `/refunds` (built live from the admin refund rules) and `/service` (how bookings are delivered, no shipping), linked in the footer.
- [ ] **PayFast website checklist** — still needed from the owner: full office address and a phone number (set `VITE_SUPPORT_PHONE` / `VITE_SUPPORT_WHATSAPP`; footer and Help page show them), at least 7–8 live published listings on the public site, then reply "Acknowledge" to PayFast.
- [x] **Guest ↔ partner messages** — Done 2026-10-21: phone numbers, emails, WhatsApp and links are blocked in messages. Partner contact stays hidden until the guest has a booking (already true: the phone shows on the voucher only after the partner confirms). Partners can still type a number into descriptions or a host bio; admin review must catch it, or filter those fields too.
- [x] **Bookings and Profile pages** — the account page is split: `/bookings` (reservations, Pay now return) and `/profile` (Account & security, Saved stays). The account menu has "My bookings" and "Profile"; old `/user-dashboard` links open Bookings.
- [x] **Become a partner redesign (option A, chosen 2026-10-21)** — photo hero, four photo cards (hotel, homestay, car, tour) with "you'll need" and the existing register/status buttons, commission (live from admin settings) / payments / dashboard row, steps, "What you'll need" lists (Tours added), contact strip. Photos are Unsplash stock until real Gilgit-Baltistan photos are supplied.
- [x] **Messages between guests and partners (2026-10-21)** — Inbox page (`/inbox`, account menu → Messages): one thread per guest per listing, started from "Message the host/partner" on a listing or "Message partner" on a booking (replaces "Call partner"). Partners see "Guest messages" and "My trips" tabs. Phone numbers, emails and links are replaced with "[contact hidden]" before saving (`server/modules/messages/contact-filter.ts`, check: `npx tsx server/scripts/check-contact-filter.ts`). Thread header shows the guest's bookings at that listing. Live delivery is through Inngest Realtime since 2026-11-04 (it replaced Socket.IO); the inbox checks every 4 s when that is not connected.
- [ ] **Messages: still to do** — voucher and confirmation email still show the partner's phone after confirmation. Inside-dashboard messages, reported chats and quick replies are MSG-12, MSG-11 and MSG-06.

# Done 2026-10-22
- [x] **Refund shown before cancelling** — the guest's cancel dialog on a paid booking says the refund % and amount from the admin refund tiers (same rule as the server).
- [x] **Unread messages badge** — count on the account avatar and the "Messages" menu item; refreshes on navigation, on pushed messages, when a thread is opened, and every minute.
- [x] **CNIC pre-check for partner applications** — partners type their CNIC number (required to submit; stored as 12345-1234567-1). On submit the server checks whether another partner account uses the same CNIC and, when `GEMINI_API_KEY` is set, reads the uploaded CNIC PDF with Gemini: is it a CNIC, does the number match, does the name match the account name, is it expired. Results show in Admin → Review inbox and Vendor applications ("All checks passed" / "Needs a closer look") with "Check again". It never approves anything itself. Self-check: `npx tsx server/scripts/check-identity.ts`.
- [ ] **CNIC pre-check: still to do** — set `GEMINI_API_KEY` and run "Check again" on one real application to confirm the AI reading (not run with a real CNIC yet). Partners approved before today have no CNIC number. Official verification needs NADRA Verisys (business agreement, paid per check). Passports aren't supported: every partner must give a CNIC.

# GBBookings vs Booking.com – feature gap list

IDs match docs/SRS-GBBookings-vs-Booking.com.pdf (version 1.1, 2026-10-29). Version 1.1 added the JOIN module: listing a property step by step, compared with join.booking.com.

## P1 – Before public launch

### Authentication & account access
- [x] **AUTH-03** Sign in with Google – Google sign-in at least; most Pakistani users have a Google account. Done 2026-10-29: "Continue with Google" in the sign-in modal (needs GOOGLE_CLIENT_ID + VITE_GOOGLE_CLIENT_ID).
- [x] **AUTH-13** Delete my account (self-service) – Needed for privacy law and app-store rules. Done 2026-10-29: Profile → Account & security → Delete account (emailed code).

### Security & privacy
- [x] **SEC-04** Rate limiting shared across servers (partial: In-memory per instance; on Vercel serverless each instance has its own counter) – Use a Redis/Upstash store for express-rate-limit. Done 2026-10-29: counters live in MongoDB (`ratelimits` collection) instead of Upstash, no new service; trust proxy is on for Vercel.

### Search & discovery
- [x] **SRCH-21** SEO pages (city / property pages indexable) – Prerender listing and destination pages; add sitemap.xml and meta tags. Done 2026-11-04: real HTML for listing and category pages, sitemap.xml, robots.txt, canonical and JSON-LD (not yet run on Vercel).

### Listing (property) page
- [x] **LST-06** Price breakdown incl. taxes and fees (partial: Breakdown yes, no tax / fee lines) Done 2026-11-04: fees and taxes are their own lines.

### Payments, pricing & refunds
- [ ] **PAY-01** Online card payment (partial: Safepay, sandbox only) – Live keys after Safepay approval; register the webhook URL.
- [x] **PAY-04** Refunds through the admin queue. Decided 2026-11-04: the admin refunds in the Safepay dashboard and marks it sent in Admin > Refunds. The automatic route stays built but off (SAFEPAY_AUTO_REFUNDS=false), and would need a partial refund proved first.
- [x] **PAY-05** Refund status ("refund sent") Done 2026-11-04: each refund has a status the guest sees.
- [x] **PAY-06** Cancellation policy per property / per rate, counted from check-in date – Biggest policy gap: a guest who books 3 months ahead gets 50% even when cancelling 2 months before arrival. Done 2026-11-04: four policies, chosen per listing and kept per booking, counted from the start date.
- [x] **PAY-07** Taxes and fees (e.g. GST, tourism tax, service charge) Done 2026-11-04: admin-set taxes, partner-set fees.
- [x] **PAY-13** Partner payouts and statements Done 2026-11-04: statements per partner; the bank transfer itself stays manual.

### Manage a booking (guest, after booking)
- [x] **MNG-04** Guest changes dates / room. Done 2026-11-04: either side proposes, the other accepts or declines; paid bookings refund or leave a balance.
- [x] **MNG-11** Pre-trip reminder emails Done 2026-11-04.

### Reviews & ratings
- [x] **REV-05** Review invitation email – Cheapest way to get reviews; without them every listing shows "New". Done 2026-11-04.

### Messaging & notifications
- [x] **MSG-04** Email when a message arrives and the user is offline Done 2026-11-04: after 10 minutes unread.

### Car rentals
- [x] **CAR-12** Car-specific cancellation window (partial: Global refund tiers) – Solved by PAY per-listing cancellation policy. Done 2026-11-04 through PAY-06.

### Tours & attractions
- [x] **TOUR-11** Tour-specific cancellation (e.g. free until 24 h before) (partial: Global tiers) – Solved by PAY per-listing cancellation policy. Done 2026-11-04 through PAY-06.

### Partner onboarding
- [x] **ONB-05** Payout / bank details collected Done 2026-11-04: in the business profile, IBAN checked, changes approved by the admin.
- [x] **ONB-06** Partner agreement accepted and stored (partial: Only the guest Terms accepted at sign-up) Done 2026-11-04: version, time, user and IP stored. Text is a draft for a lawyer to review.

### Listing a property, step by step
- [x] **JOIN-09** Progress saved after every step, resume later (partial: registration saves each step; the listing wizard saves nothing until the last step, leaving discards it) – Save the draft listing on every "Next" and reopen it at the same step. Done 2026-10-29: hotel and homestay wizard progress is saved on the server on every step and on "Save and exit", resumes at the same step on any device, and shows on partner Home as "unfinished".
- Also part of this flow, tracked elsewhere: per-property cancellation policy (PAY-06), calendar sync (EXT-12), payout details (ONB-05), partner agreement (ONB-06).

### Partner dashboard (Extranet)
- [x] **EXT-10** Finance: statements, commission invoices, payouts Done 2026-11-04: Payouts tab; each statement is also the commission invoice.
- [ ] **EXT-12** Calendar sync / channel manager (iCal, API) – iCal import/export stops double bookings with Airbnb, phone and walk-in bookings.

### Admin / back office
- [ ] **ADM-06** All-bookings list with search and export
- [x] **ADM-10** Refund processing queue ("mark refund sent") Done 2026-11-04: Admin > Refunds.
- [x] **ADM-11** Payouts and reconciliation Done 2026-11-04: Admin > Payouts.

### Customer support & legal
- [ ] **SUP-02** Contact channels (partial: Email; phone and WhatsApp not configured yet) – Set VITE_SUPPORT_PHONE / VITE_SUPPORT_WHATSAPP (also needed by PayFast).

### Non-functional requirements
- [x] **NFR-01** Testing. Decided 2026-11-04: by hand with the test sheet, no automated tests in the repo.
- [x] **NFR-02** Error tracking – Decided 2026-11-04: no third-party tool; errors go to the server logs. Free uptime ping on /api/v1/health is optional.
- [x] **NFR-04** Background jobs (expire pending bookings) (partial: 5-min timer on a long-running server; on Vercel it runs only when a booking request comes in) – Add a Vercel Cron (or host the API on Railway/Render). Done 2026-11-04: Inngest cron (needs keys), or a timer on a long-running server.
- [ ] **NFR-06** Database backups (partial: Not covered by the code (depends on MongoDB Atlas plan)) – Confirm Atlas backups and do one restore test.

## P2 – Competitive parity

### Authentication & account access
- [ ] **AUTH-06** Two-step verification (partial: Email code only; SMS provider not configured; no authenticator app or backup codes) – Add TOTP (authenticator) + backup codes; wire an SMS provider.
- [ ] **AUTH-12** Change email address
- [ ] **AUTH-15** Book without an account (confirmation number + PIN) – Or keep sign-in but make it one step inside checkout.
- [ ] **AUTH-16** New-device sign-in alert email

### Security & privacy
- [ ] **SEC-05** Bot protection / CAPTCHA on sign-up, login, reset – Cloudflare Turnstile or reCAPTCHA on auth forms.
- [ ] **SEC-08** Upload checks (partial: Type and size checked from the upload header; no content (magic byte) check or virus scan)
- [ ] **SEC-09** Audit log (partial: Written for auth, bookings, settings, moderation; no screen to read it) – Admin audit-log viewer (permission audit:read already exists).
- [ ] **SEC-13** Cookie consent banner

### Guest profile & account
- [ ] **PRO-08** Currency preference – Show USD/EUR estimates for foreign tourists.
- [ ] **PRO-09** Email / notification preferences

### Search & discovery
- [ ] **SRCH-01** Destination search (partial: Free text match on title/location/description; popular places list, no type-ahead)
- [ ] **SRCH-03** Children ages
- [ ] **SRCH-08** Star rating (hotel class) filter
- [ ] **SRCH-10** Facilities filter (partial: Typed comma list) – Checkbox chips from the known amenity list. Asked for again in test notes: not done.
- [ ] **SRCH-11** Free cancellation / no prepayment filter
- [ ] **SRCH-13** Distance from centre / landmark (filter + sort)
- [ ] **SRCH-14** Map view of results
- [ ] **SRCH-16** Card price = total for the stay (partial: Base "from" price; weekend/season prices ignored)
- [ ] **SRCH-19** Deals and offers (partial: Offers page is old demo data marked "coming soon") – Link offers to partner promo codes or remove the page.

### Listing (property) page
- [ ] **LST-04** Several rate plans per room (non-refundable cheaper, breakfast included, etc.)
- [ ] **LST-05** Choose quantity per room type (partial: One room type per booking)
- [ ] **LST-15** Official star rating

### Booking & checkout
- [ ] **BKG-02** Instant confirmation (partial: Pay now: yes. Pay on arrival: request the partner must accept within 24 h) – Partner setting "Instant book" for Pay on arrival.
- [ ] **BKG-07** Arrival time
- [ ] **BKG-09** Children ages at booking
- [ ] **BKG-10** Several room types in one booking

### Payments, pricing & refunds
- [ ] **PAY-02** Local wallets (JazzCash, Easypaisa) online
- [ ] **PAY-09** Length-of-stay discounts, minimum stay
- [ ] **PAY-11** Multi-currency display
- [ ] **PAY-14** Invoices (guest tax invoice, partner commission invoice) (partial: Printable voucher / receipt only)

### Manage a booking (guest, after booking)
- [ ] **MNG-05** Edit guest details / special requests after booking
- [ ] **MNG-09** Contact platform support about this booking (partial: Help page only (not linked to the booking))

### Reviews & ratings
- [ ] **REV-10** Car- and tour-specific categories

### Messaging & notifications
- [x] **MSG-03** Real-time delivery (partial: Socket.IO on a long-running server; polling on Vercel) Done 2026-11-04: Inngest Realtime replaces Socket.IO (needs keys; polls otherwise).
- [ ] **MSG-08** Push notifications (web / mobile)
- [ ] **MSG-09** SMS / WhatsApp notifications – WhatsApp is the main channel in Pakistan.
- [ ] **MSG-11** Admin view of reported chats
- [ ] **MSG-12** Messages inside the partner dashboard (partial: Through the account menu, not a dashboard tab)

### Car rentals
- [ ] **CAR-02** Pick-up location search (airport, city) (partial: Base city text only)
- [ ] **CAR-04** Driver age check (partial: Partner sets a minimum; the guest is not asked)
- [ ] **CAR-06** Extras (child seat, extra driver, GPS)
- [ ] **CAR-07** Mileage policy

### Tours & attractions
- [ ] **TOUR-05** Mobile ticket / QR code checked by the partner
- [ ] **TOUR-06** Instant confirmation (partial: Pay now only)

### Partner onboarding
- [ ] **ONB-02** Identity / business verification (partial: Manual admin review + AI CNIC pre-check; no NADRA Verisys) – Set GEMINI_API_KEY and test on a real CNIC; Verisys later.

### Listing a property, step by step
- [x] **JOIN-02** Choose what to list (partial: Hotel, Homestay, Car, Tour) – Add "Apartments & holiday homes" (entire place) and "Campsites & glamping" (tents, huts): common in Gilgit-Baltistan (Fairy Meadows, Deosai, Rama). Done 2026-10-29 (batch 2).
- [x] **JOIN-03** Detailed property category list (partial: 6 hotel types; homestay has none) – Add Hostel, B&B, Guesthouse, Cottage/Chalet, Villa, Apartment, Holiday home, Campsite, Glamping, Farm stay, Other. Done 2026-10-29 (batch 2).
- [x] **JOIN-04** Entire place or private room (partial: homestays only) Done 2026-10-29 (batch 2).
- [x] **JOIN-08** Build the listing while verification is in progress – Let applicants draft their first listing while the application is reviewed; publish only after both are approved. Done 2026-10-29: hotel and homestay applicants get "Add your hotel/homestay while you wait" on the Become a partner page; the listing is created after approval.
- [x] **JOIN-14** Address search with autocomplete Done 2026-10-29 (batches 3–4).
- [x] **JOIN-15** Structured address (street, area, city, postcode, region) (partial: partner business address is structured; the listing location is one text line) – Needed for search by city/area, invoices and tax. Done 2026-10-29 (batches 3–4).
- [x] **JOIN-16** Place the pin by dragging it on a map (partial: paste a Google Maps link / coordinates or "use my location"; map is read-only) Done 2026-10-29 (batches 3–4).
- [x] **JOIN-17** Facilities as a fixed checklist (partial: free-text chips with suggestions) – A fixed list makes the search filters reliable (see SRCH-10). Done 2026-10-29 (batches 3–4).
- [x] **JOIN-18** Breakfast setup: served, included, price, kind (partial: hotels: a "Breakfast" amenity chip; homestays: meals with prices) Done 2026-10-29 (batches 3–4).
- [x] **JOIN-19** Parking: free / paid, price, on-site, reservation – Most guests in Gilgit-Baltistan arrive by car or jeep. Done 2026-10-29 (batches 3–4).
- [x] **JOIN-23** Room type from a fixed list + preset room names (partial: free-text room name) Done 2026-10-29 (batch 2).
- [x] **JOIN-24** Bed configuration: kind × number, per bedroom Done 2026-10-29 (batch 2).
- [x] **JOIN-27** Bathroom private or shared, and its items – Shared bathrooms are common in guesthouses and homestays; guests need to know before booking. Done 2026-10-29 (batch 2).
- [x] **JOIN-30** Entire place: bedrooms, beds per bedroom, bathrooms, size, cots (partial: one free-text "bedrooms and beds" field) Done 2026-10-29 (batch 2).
- [x] **JOIN-31** Price with commission and "what you earn" (partial: price only; commission shown on the Become a partner page) Done 2026-10-29 (batches 3–4).
- [ ] **JOIN-39** Invoicing and tax details per property (partial: NTN, optional, on the partner only; no tax settings) – Ties to PAY-07 taxes and fees.
- [x] **JOIN-41** Licence / permit number per property – E.g. Gilgit-Baltistan Tourism Department registration for hotels and guesthouses. Done 2026-10-29 (batches 3–4).
- Also part of this flow, tracked elsewhere: star rating (LST-15), non-refundable and weekly rates (EXT-04).

### Partner dashboard (Extranet)
- [ ] **EXT-03** Bulk edit rates / availability for many dates (partial: Seasons only, no calendar grid bulk edit)
- [ ] **EXT-04** Rate plans (non-refundable, breakfast included…)
- [ ] **EXT-05** Stay restrictions (min / max nights, closed to arrival)
- [ ] **EXT-06** Promotions (partial: Promo codes only) – Add "early booker" and "last minute" automatic discounts.

### Admin / back office
- [ ] **ADM-09** Audit log viewer
- [ ] **ADM-14** Support tickets / disputes
- [ ] **ADM-15** Business analytics (bookings, revenue, conversion, cancellations)
- [ ] **ADM-16** Content management (destinations, offers, home banners)

### Customer support & legal
- [ ] **SUP-03** Support case per booking
- [ ] **SUP-06** Cookie settings

### Language, devices & extras
- [ ] **UX-04** Accessibility (WCAG) (partial: Not audited) – Run an accessibility audit on search, listing and checkout.
- [ ] **UX-05** AI trip assistant (partial: chat window built 2026-11-04 and recommends real listings; not yet run, needs GEMINI_API_KEY)

### Non-functional requirements
- [x] **NFR-05** Real-time on the hosting platform (partial: Not on Vercel serverless) Done 2026-11-04: Inngest Realtime works on Vercel.

## P3 – Later

### Authentication & account access
- [ ] **AUTH-04** Passwordless sign-in (email code / magic link)
- [ ] **AUTH-05** Passkeys
- [ ] **AUTH-14** Download my data
- [x] **AUTH-18** Google-only users can set a password. Done 2026-11-04: Change password works with an emailed code.

### Security & privacy
- [ ] **SEC-02** CSRF protection (partial: Relies on SameSite=Lax + CORS origin check; no CSRF token) – Acceptable for JSON APIs; add an Origin check on state-changing routes for defence in depth.
- [ ] **SEC-12** Fraud / risky-booking checks
- [ ] **SEC-14** Account enumeration (partial: Login and reset are generic; register says "account already exists")
- [ ] **SEC-15** Lockout abuse (someone locks a victim out) (partial: Anyone knowing an email can lock it for 15 minutes) – Lock per email+IP, or require CAPTCHA after 3 failures instead of locking.

### Guest profile & account
- [ ] **PRO-02** Extra personal details (DOB, nationality, address, CNIC/passport)
- [ ] **PRO-03** Profile photo
- [ ] **PRO-04** Saved travellers / companions
- [ ] **PRO-05** Saved payment methods – Needs Safepay card tokenisation.
- [ ] **PRO-06** Wishlist (partial: One list on its own Saved stays page, not shareable)
- [ ] **PRO-07** Language preference (partial: English / Urdu (RTL), saved in the browser only)
- [ ] **PRO-10** Loyalty programme (Genius-style)
- [ ] **PRO-11** Wallet / travel credits
- [ ] **PRO-12** "My reviews" page
- [ ] **PRO-13** Accessibility preferences

### Search & discovery
- [ ] **SRCH-05** Flexible dates
- [ ] **SRCH-09** Property type filter (partial: Category substring (hotel type / car type))
- [ ] **SRCH-12** Meal plan filter (partial: Breakfast only)
- [ ] **SRCH-15** Filter result counts
- [ ] **SRCH-17** Scarcity signals ("Only 2 left") (partial: Seats left on tours only)
- [ ] **SRCH-18** Recent searches / recently viewed
- [ ] **SRCH-20** Accessibility filter

### Listing (property) page
- [ ] **LST-03** Room size (m²) and bed options (partial: Bed type only, no size)
- [ ] **LST-08** Nearby places and distances
- [ ] **LST-10** Guest questions & answers
- [ ] **LST-11** Property FAQs
- [ ] **LST-16** Accessibility features
- [ ] **LST-17** Similar / recommended properties

### Booking & checkout
- [ ] **BKG-08** Booking for someone else / work trip flag (partial: Guest details can differ from the account; no explicit option)
- [ ] **BKG-11** Add-ons / cross-sell (car, taxi, tour) after booking
- [ ] **BKG-12** Confirmation number + PIN (partial: Reference only (sign-in needed to manage))
- [ ] **BKG-13** Marketing consent at checkout

### Payments, pricing & refunds
- [ ] **PAY-10** Price per number of guests
- [ ] **PAY-15** Deposit / partial prepayment
- [ ] **PAY-16** Saved cards

### Manage a booking (guest, after booking)
- [ ] **MNG-06** Add to calendar (.ics)
- [ ] **MNG-07** Request invoice
- [ ] **MNG-12** Book again

### Reviews & ratings
- [ ] **REV-06** Traveller type (family, couple, solo, group)
- [ ] **REV-07** Filter / sort reviews
- [ ] **REV-08** "Helpful" votes
- [ ] **REV-09** Review translation (EN ↔ UR)
- [ ] **REV-11** Review window (partial: 30 days)

### Messaging & notifications
- [ ] **MSG-05** Photo attachments
- [ ] **MSG-06** Partner quick-reply templates
- [ ] **MSG-07** Automatic translation
- [ ] **MSG-10** In-app notification centre

### Car rentals
- [ ] **CAR-05** Insurance / protection products
- [ ] **CAR-08** Fuel policy (partial: "Fuel included" yes/no)
- [ ] **CAR-11** Handover inspection (photos, fuel, odometer)

### Tours & attractions
- [ ] **TOUR-02** Several time slots per day
- [ ] **TOUR-03** Ticket types (partial: Adult and child)
- [ ] **TOUR-04** Private-group pricing
- [ ] **TOUR-07** Filters: duration, difficulty, language (partial: Tour type only)
- [ ] **TOUR-09** Seats per departure date (partial: One number per tour (close seats on the calendar to reduce))
- [ ] **TOUR-10** Hotel pickup option

### Partner onboarding
- [ ] **ONB-07** One account, several partner types
- [ ] **ONB-08** Import listing from another platform

### Listing a property, step by step
- [ ] **JOIN-05** One or several properties / units in one flow (partial: one listing at a time; "Duplicate listing" afterwards)
- [ ] **JOIN-06** "You're listing…" summary to confirm the choice
- [ ] **JOIN-07** Quick start: go live with the minimum, finish later
- [ ] **JOIN-13** Chain / group / management company
- [ ] **JOIN-20** Languages spoken by staff (partial: homestays only)
- [ ] **JOIN-21** Check-in and check-out as time windows (partial: check-in from, check-out by)
- [ ] **JOIN-22** House rules: parties rule and pet charges (partial: children, pets, smoking only)
- [ ] **JOIN-26** Room size (m²)
- [ ] **JOIN-28** Room amenities and view as a checklist (partial: free-text chips with suggestions)
- [ ] **JOIN-29** Smoking allowed per room (partial: property-wide only)
- [ ] **JOIN-35** Open for bookings from a date / how far ahead guests can book
- [ ] **JOIN-37** Photo minimum and quality checks (partial: at least 1, up to 20) – Require 5+ property photos and warn on low resolution.
- [ ] **JOIN-43** Choose to open now or later (partial: goes live on admin approval; can be paused afterwards)
- [ ] **JOIN-44** Host profile: about you, the property, the neighbourhood (partial: homestays: host name, photo, bio)
- Also part of this flow, tracked elsewhere: lower price for fewer guests (PAY-10).

### Partner dashboard (Extranet)
- [ ] **EXT-09** Advanced analytics (pace, market comparison, ranking)
- [ ] **EXT-13** Partner mobile app / push

### Admin / back office
- [ ] **ADM-12** Platform-wide coupons / campaigns
- [ ] **ADM-13** Newsletter export / sending (partial: Subscribers saved and sent a welcome email; no admin list, export or campaigns)
- [ ] **ADM-17** Several admin roles (support, finance, moderator) (partial: Permissions exist in code; only one "admin" role)

### Customer support & legal
- [ ] **SUP-04** Live chat / support bot

### Language, devices & extras
- [ ] **UX-01** Languages (partial: English, Urdu (RTL) on guest pages; partner and admin screens are English)
- [ ] **UX-03** Native mobile apps
