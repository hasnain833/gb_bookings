# Hotels — remaining work

All 12 Phase 1 (Hotels) items are built. These are the open tasks.

## Before handing Phase 1 to the client

- [ ] **End-to-end test on a real database** — click through as customer, vendor and admin: partner registration and approval, hotel creation and approval, search, booking, confirm/decline, pending-request expiry (24h), availability calendar closures, mark paid, admin take-down, admin cancel by reference, business change requests.
- [ ] **Keep live hotels bookable while edits are reviewed** — today any text/photo edit sends a live hotel back to draft (hidden from guests) until re-approved. Keep the published version live and review the edit as a pending revision.
- [ ] **Email vendors about admin decisions** — business approved/rejected/suspended, hotel published/rejected/taken down, business change request approved/rejected.
- [ ] **Clean up old applicant accounts** — users who applied before "role on approval" still have `vendor_owner` without an approved business. One-time database fix (needs owner's OK before running).
- [ ] **Fake newsletter forms** — the Homestays page and footer forms say "Subscribed" but save nothing. Connect them to something real or remove them.

## Useful for hotels, can wait

- [ ] **Photo management** — reorder photos, choose the cover photo, captions, photos per room category (today the whole set can only be replaced).
- [ ] **Check-in tracking and booking changes** — mark guests as checked in; change dates or rooms on an existing booking (inventory moved in one transaction, price re-quoted).
- [ ] **Vendor reports** — occupancy and money collected per hotel.
- [ ] **Hotel staff accounts** — hotel owner invites their own reception staff (`vendor_staff`) with limited access.
- [ ] **Checkout survives refresh** — selected room, dates and guests are lost on page refresh.

## Planned for later phases

- [ ] Reviews and ratings (Phase 2)
- [ ] Online payments and refunds — JazzCash, Easypaisa, card (Phase 2)
- [ ] Coupons and promotional offers (Phase 2)
- [ ] Downloadable PDF vouchers and invoices (Phase 2)
- [ ] Per-hotel cancellation policies, seasonal/weekend pricing, taxes and fees — depend on the Phase 2 payment rules
