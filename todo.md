# GBBookings to-do

Open work is listed in sections 1 to 8. Section 10 lists what was built on 2026-11-05. Older finished items remain in git history.
Priorities come from the owner's notes. IDs match docs/SRS-GBBookings-vs-Booking.com.pdf.

Test sheet: https://claude.ai/artifact/Mb68jpQo5rsJFxMHYcB9Sk

# 1. Fix first: from the latest test round

- [ ] **Booking.com comparison (E-06, rated 4/10, no note).** Say what felt harder or less trustworthy.
- [ ] **Your domain can't receive email.** `gbbookings.com` has no mail servers set up, so mail to `info@gbbookings.com` (shown on the site and in the footer) won't arrive. Set up mailboxes or forwarding for the domain.

# 2. To test: built 2026-11-05

Server flows passed on a throwaway database. The screens have not been opened in a browser.

- [ ] No-shows and disputes (N-01 to N-06), stays completing by themselves (B-18).
- [ ] Booking limits and review rules (B-16, B-17, R-01), paying twice (Y-06).
- [ ] All bookings list and CSV export (D-06, D-07).
- [ ] Calendar sync (K-01 to K-05), with a real Airbnb or Google Calendar link.
- [ ] Payment in its own tab, including a real payment (Y-01, Y-02), sign-in reloading the page (A-01, A-02), newsletter typos (P-11).
- [ ] Admin sign-in code, new-device email, change email, reception staff, real-file upload checks, contact details in listings (T-01 to T-07).
- [ ] OpenStreetMap, map view, free cancellation and hotel class filters, place suggestions, star rating (S-01 to S-05).
- [ ] Stay rules, automatic deals, instant confirmation, price by date range, arrival time, children's ages, edit details (R-01 to R-07).
- [ ] Partner Messages tab, Get help on a booking, reporting a chat, admin Support page (U-01 to U-04). The partner tab and the admin page have not been opened in a browser yet.
- [ ] Car pickup places, driver age, paid extras, mileage; review wording for cars and tours (C-01 to C-05).

# 3. Needs you

- [ ] **Free Gemini key** — `GEMINI_API_KEY` is still empty, so the trip assistant has never answered and the CNIC reading is off. Set it from Google AI Studio, then test P-12 and D-04, and confirm `GEMINI_MODEL` works.
- [ ] **More details from car and tour partners** — O-04 and O-05 asked for them. Say which fields.
- [ ] **Offers page** — link it to real partner promo codes, or remove it. Its demo codes still say coming soon.
- [ ] **Real support phone and WhatsApp** — `VITE_SUPPORT_PHONE` is `+923008888888`, which looks like a placeholder (SUP-02).
- [ ] **PayFast checklist** — full office address, a real phone number, at least 7–8 live listings, then reply "Acknowledge" to PayFast.
- [ ] **Urdu wording** — have an Urdu speaker read it.
- [ ] **Lawyer and accountant** — a lawyer reads the Partner Agreement; an accountant confirms which taxes to set in Admin > Fees & refunds (none set yet).
- [ ] **Map pins on older hotels** — 3 of the 4 live hotels have no map pin, so they don't appear in map view, and their listing map is only a rough lookup from the address. Add pins from the partner side.
- [ ] **On Vercel: settings** — set `APP_URL`, leave `INNGEST_DEV` unset, and leave `MEDIA_MAX_FILE_MB` unset (it would otherwise go over Vercel's upload limit). The site now refuses to start in production without `APP_URL`, or with `INNGEST_DEV`.
- [ ] **CNIC reading with Gemini** — it is now off by default (`CNIC_AI_CHECK=false`), because free plans may use data to improve Google's products. Turn it on only with a paid plan, and say so in the Privacy page.
- [ ] **Refunds recorded before the queue existed** have no entry. Any real ones need paying from the Safepay dashboard.

# 4. Before launch

## Going live
- [ ] **PAY-01** Live Safepay keys and webhook, after Safepay approves the account.
- [ ] **NFR-06** Confirm MongoDB Atlas backups and do one restore test.
- [ ] **Inngest on Vercel** — free account; set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` on Vercel; register `<site>/api/inngest`. Until then scheduled jobs do not run there and the inbox polls.
- [ ] **Check on Vercel** — `/sitemap.xml`, `/robots.txt`, `/listing/<id>` and `/api/inngest` have only run locally.

# 5. Build next: marked important

## Rooms, pricing and booking
- [ ] **LST-04** Rate plans per room (non-refundable cheaper, breakfast included, etc.) – Decision first: changes price, refund and settlement. Suggested: one "non-refundable, X% cheaper" option per room and an optional breakfast price.
- [ ] **LST-05** Several room types in one booking, each with its own quantity (partial: one room type per booking) – Decision first: one booking would hold several rooms, which touches changes, cancellations, refunds, statements and calendar sync.

## Payments and invoices
- [ ] **PAY-02** Local wallets (JazzCash, Easypaisa) online – Needs you: ask Safepay whether wallets can be switched on for the account. Their payment page already handles the choice, so little or no code.
- [ ] **PAY-14** Invoices (guest tax invoice, partner commission invoice) (partial: Printable voucher / receipt only) – Needs you: the accountant's required layout and your tax number (NTN). Partner statements already serve as the commission invoice.

## Partners
- [ ] **ONB-02** Identity / business verification (partial: Manual admin review + AI CNIC pre-check; no NADRA Verisys) – Set GEMINI_API_KEY and test on a real CNIC; Verisys later.

# 6. Later: wanted, after section 5

Marked important by the owner, in the later group of the plan.

## Security
- [ ] **SEC-02** CSRF protection (partial: Relies on SameSite=Lax + CORS origin check; no CSRF token) – Acceptable for JSON APIs; add an Origin check on state-changing routes for defence in depth.
- [ ] **SEC-12** Fraud / risky-booking checks
- [ ] **SEC-14** Account enumeration (partial: Login and reset are generic; register says "account already exists")
- [ ] **SEC-15** Lockout abuse (someone locks a victim out) (partial: Anyone knowing an email can lock it for 15 minutes) – Lock per email+IP, or require CAPTCHA after 3 failures instead of locking.

## Guest profile
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

## Search
- [ ] **SRCH-05** Flexible dates
- [ ] **SRCH-09** Property type filter (partial: Category substring (hotel type / car type))
- [ ] **SRCH-12** Meal plan filter (partial: Breakfast only)
- [ ] **SRCH-15** Filter result counts
- [ ] **SRCH-17** Scarcity signals ("Only 2 left") (partial: shown in the booking panels, not on search result cards)
- [ ] **SRCH-18** Recent searches / recently viewed
- [ ] **SRCH-20** Accessibility filter

## Listing page
- [ ] **LST-08** Nearby places and distances
- [ ] **LST-10** Guest questions & answers
- [ ] **LST-11** Property FAQs
- [ ] **LST-16** Accessibility features
- [ ] **LST-17** Similar / recommended properties

## Booking and payments
- [ ] **BKG-08** Booking for someone else / work trip flag (partial: Guest details can differ from the account; no explicit option)
- [ ] **BKG-11** Add-ons / cross-sell (car, taxi, tour) after booking
- [ ] **BKG-12** Confirmation number + PIN (partial: Reference only (sign-in needed to manage))
- [ ] **BKG-13** Marketing consent at checkout
- [ ] **PAY-10** Price per number of guests
- [ ] **PAY-15** Deposit / partial prepayment
- [ ] **PAY-16** Saved cards
- [ ] **MNG-06** Add to calendar (.ics)
- [ ] **MNG-07** Request invoice
- [ ] **MNG-12** Book again

## Reviews and messages
- [ ] **REV-06** Traveller type (family, couple, solo, group)
- [ ] **REV-07** Filter / sort reviews
- [ ] **REV-08** "Helpful" votes
- [ ] **REV-09** Review translation (EN ↔ UR)
- [ ] **REV-11** Review window (partial: 30 days)
- [ ] **MSG-05** Photo attachments
- [ ] **MSG-06** Partner quick-reply templates
- [ ] **MSG-10** In-app notification centre

## Cars and tours
- [ ] **CAR-05** Insurance / protection products
- [ ] **CAR-08** Fuel policy (partial: "Fuel included" yes/no)
- [ ] **CAR-11** Handover inspection (photos, fuel, odometer)
- [ ] **TOUR-02** Several time slots per day
- [ ] **TOUR-03** Ticket types (partial: Adult and child)
- [ ] **TOUR-04** Private-group pricing
- [ ] **TOUR-07** Filters: duration, difficulty, language (partial: Tour type only)
- [ ] **TOUR-09** Seats per departure date (partial: One number per tour (close seats on the calendar to reduce))
- [ ] **TOUR-10** Hotel pickup option

## Partners and listing a property
- [ ] **ONB-07** One account, several partner types
- [ ] **ONB-08** Import listing from another platform
- [ ] **JOIN-05** One or several properties / units in one flow (partial: one listing at a time; "Duplicate listing" afterwards)
- [ ] **JOIN-06** "You're listing…" summary to confirm the choice
- [ ] **JOIN-07** Quick start: go live with the minimum, finish later
- [ ] **JOIN-13** Chain / group / management company
- [ ] **JOIN-20** Languages spoken by staff (partial: homestays only)
- [ ] **JOIN-21** Check-in and check-out as time windows (partial: check-in from, check-out by)
- [ ] **JOIN-22** House rules: parties rule and pet charges (partial: children, pets, smoking only)
- [ ] **JOIN-28** Room amenities and view as a checklist (partial: free-text chips with suggestions)
- [ ] **JOIN-29** Smoking allowed per room (partial: property-wide only)
- [ ] **JOIN-35** Open for bookings from a date / how far ahead guests can book
- [ ] **JOIN-37** Photo minimum and quality checks (partial: at least 1, up to 20) – Require 5+ property photos and warn on low resolution.
- [ ] **JOIN-43** Choose to open now or later (partial: goes live on admin approval; can be paused afterwards)
- [ ] **JOIN-44** Host profile: about you, the property, the neighbourhood (partial: homestays: host name, photo, bio)
- [ ] **EXT-09** Advanced analytics (pace, market comparison, ranking)

## Admin
- [ ] **ADM-12** Platform-wide coupons / campaigns
- [ ] **ADM-13** Newsletter export / sending (partial: Subscribers saved and sent a welcome email; no admin list, export or campaigns)

# 7. No priority set yet

These had no note. Mark them when you decide.

- [ ] **SRCH-10** Facilities filter (partial: Typed comma list) – Checkbox chips from the known amenity list. Asked for again in test notes: not done.
- [ ] **SRCH-13** Distance from centre / landmark (filter + sort)
- [ ] **SRCH-16** Card price = total for the stay (partial: Base "from" price; weekend/season prices ignored)
- [ ] **MSG-07** Automatic translation
- [ ] **MSG-08** Push notifications (web / mobile)
- [ ] **TOUR-05** Mobile ticket / QR code checked by the partner
- [ ] **JOIN-39** Invoicing and tax details per property (partial: NTN, optional, on the partner only; no tax settings) – Ties to PAY-07 taxes and fees.
- [ ] **EXT-13** Partner mobile app / push
- [ ] **ADM-15** Business analytics (bookings, revenue, conversion, cancellations)
- [ ] **ADM-16** Content management (destinations, offers, home banners)
- [ ] **UX-04** Accessibility (WCAG) (partial: Not audited) – Run an accessibility audit on search, listing and checkout.
- [ ] Route fare tables (e.g. Gilgit → Skardu). The one-way fee and outside-city charge cover it for now.
- [ ] Reports count every day as available for fixed-departure tours, so their occupancy reads low.
- [ ] Voucher and confirmation email still show the partner's phone after confirmation.
- [ ] Code cleanup: about 350 lines and 2 packages can go (old date picker, SMS sign-in code, unused schema and permissions, repeated database checks).

# 8. Not now: do in future

- **AUTH-06** Authenticator app and SMS codes: we don't use SMS, and this is a startup.
- **AUTH-15** Book without an account.
- **SEC-05** Bot protection / CAPTCHA.
- **SEC-09** Audit log viewer.
- **PRO-08** Currency preference: we only serve Pakistan for now.
- **PRO-09** Email and notification preferences: needs a nurture and campaigns system in the admin first.

# 9. Not wanted

**AUTH-04** passwordless sign-in · **AUTH-05** passkeys · **AUTH-14** download my data · **MSG-09** SMS and WhatsApp notifications · **ADM-17** several admin roles · **SUP-04** support bot · **UX-01** more languages · **UX-03** native mobile apps

# 10. Done: built 2026-11-05

Built and checked on the server. Your testing of these is still open in section 2.

- [x] Security audit items: admin sign-in code, CNIC privacy and Gemini off by default, reception staff privacy, security headers, production start checks, upload limits and content checks, stolen sign-in token detection, scheduled jobs
- [x] **AUTH-12** Change email · **AUTH-16** New-device email · **SEC-08** Upload content checks · **SEC-13** Cookie notice
- [x] **SRCH-01** Destination suggestions · **SRCH-08** Hotel class filter · **SRCH-11** Free cancellation filter · **SRCH-14** Map view, with OpenStreetMap across the site · **LST-15** Star rating
- [x] **BKG-02** Instant confirmation · **TOUR-06** Instant confirmation for tours · **BKG-07** Arrival time · **BKG-09** Children's ages (at booking, not in search) · **MNG-05** Edit guest details
- [x] **PAY-09** Length-of-stay discounts · **EXT-03** Set prices by date range · **EXT-05** Stay rules · **EXT-06** Early-booking and last-minute deals
- [x] **MNG-09** Contact support about a booking · **SUP-03** Support case per booking · **ADM-14** Support cases and disputes in the admin · **MSG-11** Admin view of reported chats · **MSG-12** Messages in the partner dashboard
- [x] **CAR-02** Pickup place search · **CAR-04** Driver age check · **CAR-06** Paid extras · **CAR-07** Mileage policy · **REV-10** Car and tour review wording
