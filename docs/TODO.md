# GBBookings vs Booking.com – gap to-do list

IDs match docs/SRS-GBBookings-vs-Booking.com.pdf (version 1.1, 2026-10-29). Version 1.1 added the JOIN module: listing a property step by step, compared with join.booking.com.
Open items already tracked in the root todo.md (screen click-throughs, Safepay go-live, PayFast checklist, Gemini key) still apply.

## P1 – Before public launch

### Authentication & account access
- [x] **AUTH-03** Sign in with Google – Google sign-in at least; most Pakistani users have a Google account. Done 2026-10-29: "Continue with Google" in the sign-in modal (needs GOOGLE_CLIENT_ID + VITE_GOOGLE_CLIENT_ID).
- [x] **AUTH-13** Delete my account (self-service) – Needed for privacy law and app-store rules. Done 2026-10-29: Profile → Account & security → Delete account (emailed code).

### Security & privacy
- [x] **SEC-04** Rate limiting shared across servers (partial: In-memory per instance; on Vercel serverless each instance has its own counter) – Use a Redis/Upstash store for express-rate-limit. Done 2026-10-29: counters live in MongoDB (`ratelimits` collection) instead of Upstash, no new service; trust proxy is on for Vercel.

### Search & discovery
- [ ] **SRCH-21** SEO pages (city / property pages indexable) – Prerender listing and destination pages; add sitemap.xml and meta tags.

### Listing (property) page
- [ ] **LST-06** Price breakdown incl. taxes and fees (partial: Breakdown yes, no tax / fee lines)

### Payments, pricing & refunds
- [ ] **PAY-01** Online card payment (partial: Safepay, sandbox only) – Live keys after Safepay approval; register the webhook URL.
- [ ] **PAY-04** Automatic refunds through the gateway
- [ ] **PAY-05** Refund status ("refund sent")
- [ ] **PAY-06** Cancellation policy per property / per rate, counted from check-in date – Biggest policy gap: a guest who books 3 months ahead gets 50% even when cancelling 2 months before arrival.
- [ ] **PAY-07** Taxes and fees (e.g. GST, tourism tax, service charge)
- [ ] **PAY-13** Partner payouts and statements

### Manage a booking (guest, after booking)
- [ ] **MNG-04** Guest changes dates / room – Start with "Request a change" the partner accepts.
- [ ] **MNG-11** Pre-trip reminder emails

### Reviews & ratings
- [ ] **REV-05** Review invitation email – Cheapest way to get reviews; without them every listing shows "New".

### Messaging & notifications
- [ ] **MSG-04** Email when a message arrives and the user is offline

### Car rentals
- [ ] **CAR-12** Car-specific cancellation window (partial: Global refund tiers) – Solved by PAY per-listing cancellation policy.

### Tours & attractions
- [ ] **TOUR-11** Tour-specific cancellation (e.g. free until 24 h before) (partial: Global tiers) – Solved by PAY per-listing cancellation policy.

### Partner onboarding
- [ ] **ONB-05** Payout / bank details collected
- [ ] **ONB-06** Partner agreement accepted and stored (partial: Only the guest Terms accepted at sign-up)

### Listing a property, step by step
- [x] **JOIN-09** Progress saved after every step, resume later (partial: registration saves each step; the listing wizard saves nothing until the last step, leaving discards it) – Save the draft listing on every "Next" and reopen it at the same step. Done 2026-10-29: hotel and homestay wizard progress is saved on the server on every step and on "Save and exit", resumes at the same step on any device, and shows on partner Home as "unfinished".
- Also part of this flow, tracked elsewhere: per-property cancellation policy (PAY-06), calendar sync (EXT-12), payout details (ONB-05), partner agreement (ONB-06).

### Partner dashboard (Extranet)
- [ ] **EXT-10** Finance: statements, commission invoices, payouts
- [ ] **EXT-12** Calendar sync / channel manager (iCal, API) – iCal import/export stops double bookings with Airbnb, phone and walk-in bookings.

### Admin / back office
- [ ] **ADM-06** All-bookings list with search and export
- [ ] **ADM-10** Refund processing queue ("mark refund sent")
- [ ] **ADM-11** Payouts and reconciliation

### Customer support & legal
- [ ] **SUP-02** Contact channels (partial: Email; phone and WhatsApp not configured yet) – Set VITE_SUPPORT_PHONE / VITE_SUPPORT_WHATSAPP (also needed by PayFast).

### Non-functional requirements
- [ ] **NFR-01** Automated tests (partial: Offline self-checks + API end-to-end script; no browser (UI) tests; many screens never clicked through) – Manual click-through of every screen, then a few Playwright smoke tests.
- [ ] **NFR-02** Error tracking / monitoring – Sentry (or similar) on server and browser; uptime ping on /api/v1/health.
- [ ] **NFR-04** Background jobs (expire pending bookings) (partial: 5-min timer on a long-running server; on Vercel it runs only when a booking request comes in) – Add a Vercel Cron (or host the API on Railway/Render).
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
- [ ] **SRCH-10** Facilities filter (partial: Typed comma list) – Checkbox chips from the known amenity list.
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
- [ ] **MSG-03** Real-time delivery (partial: Socket.IO on a long-running server; polling on Vercel)
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
- [ ] **UX-05** AI trip planner (partial: Yes, needs GEMINI_API_KEY)

### Non-functional requirements
- [ ] **NFR-05** Real-time on the hosting platform (partial: Not on Vercel serverless)

## P3 – Later

### Authentication & account access
- [ ] **AUTH-04** Passwordless sign-in (email code / magic link)
- [ ] **AUTH-05** Passkeys
- [ ] **AUTH-14** Download my data
- [ ] **AUTH-18** Google-only users can set a password (partial: only through "Forgot password")

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
- [ ] **PRO-06** Wishlist (partial: One list, not shareable)
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
- [ ] **ADM-13** Newsletter export / sending (partial: Subscribers saved, no export or sending)
- [ ] **ADM-17** Several admin roles (support, finance, moderator) (partial: Permissions exist in code; only one "admin" role)

### Customer support & legal
- [ ] **SUP-04** Live chat / support bot

### Language, devices & extras
- [ ] **UX-01** Languages (partial: English, Urdu (RTL))
- [ ] **UX-03** Native mobile apps
