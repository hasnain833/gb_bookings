import { useEffect, useState, type ReactNode } from 'react';
import { api, type PlatformSettings } from '../../shared/api/api';

export type Policy = 'terms' | 'privacy' | 'refunds' | 'service';

const TITLES: Record<Policy, string> = {
  terms: 'Terms of Use', privacy: 'Privacy Policy', refunds: 'Cancellation & Refund Policy', service: 'Service & Delivery Policy',
};
const email = <a className="text-emerald-700 underline" href="mailto:info@gbbookings.com">info@gbbookings.com</a>;
const Section = ({ title, children }: { title: string; children: ReactNode }) =>
  <section><h2 className="font-semibold text-slate-900">{title}</h2>{children}</section>;

export default function LegalPage({ policy }: { policy: Policy }) {
  return <article className="mx-auto max-w-3xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600 sm:p-10">
    <header><h1 className="text-2xl font-bold text-slate-900">{TITLES[policy]}</h1><p className="mt-2 text-xs text-slate-500">Version: 21 October 2026</p></header>
    {policy === 'privacy' && <>
      <Section title="Information used by GBBookings"><p>We use your name, email address, phone number and booking information to manage your account and reservations, and share the booking details the partner needs to serve you. Partners provide business information and verification documents for our review.</p></Section>
      <Section title="Payments"><p>When you choose Pay now, you pay on the secure page of our payment provider (Safepay). Your card or wallet details go to the provider and are never seen or stored by GBBookings; we receive only whether the payment succeeded.</p></Section>
      <Section title="Account security and cookies"><p>Passwords are stored as hashes. We use cookies for sign-in sessions. If you choose “Remember me for 7 days,” a secure device token remembers completed login verification for that account and browser for seven days. Password changes and signing out all devices revoke remembered verification.</p></Section>
      <Section title="Service providers"><p>Account and reservation data is stored in our database. Resend delivers verification codes and booking emails. Cloudinary stores listing photos and verification documents. Safepay processes online payments. Reservation details are available to the booked partner and authorised GBBookings staff.</p></Section>
      <Section title="Your choices"><p>You can update your profile and manage active sessions in account security. For questions about personal information or account deletion, contact {email}.</p></Section>
    </>}
    {policy === 'terms' && <>
      <Section title="What GBBookings is"><p>GBBookings is a marketplace for hotels, homestays, car rentals and tours in Gilgit-Baltistan. The stay, car or tour is provided by the partner who lists it; GBBookings verifies partners and listings, takes bookings and, for Pay now bookings, collects the payment.</p></Section>
      <Section title="Your account"><p>Provide accurate account and contact information, confirm your email with the signup code, keep your password and codes private, and use only accounts you are authorised to use.</p></Section>
      <Section title="Booking and payment"><p>Prices are in Pakistani rupees (PKR) and include everything shown at checkout. You choose how to pay:</p>
        <ul className="list-disc pl-5"><li><strong>Pay now</strong>: you pay the full amount online when you book, and the booking is confirmed as soon as the payment succeeds.</li><li><strong>Pay on arrival</strong>: you send a request, the partner confirms it (or it expires after 24 hours), and you pay the partner at check-in, pickup or the start of the tour.</li></ul></Section>
      <Section title="Cancellations and refunds"><p>You can cancel in My Bookings until the day before the start date. Refunds for paid bookings follow our <a className="text-emerald-700 underline" href="/refunds">Cancellation &amp; Refund Policy</a>.</p></Section>
      <Section title="Partners"><p>Partners must submit accurate registration information and documents for our review, keep their listings, prices and availability correct, and honour confirmed bookings. GBBookings charges partners a commission on each booking.</p></Section>
      <Section title="Contact"><p>For account or booking questions, contact {email} or see the <a className="text-emerald-700 underline" href="/support">Help &amp; contact</a> page. Read our <a className="text-emerald-700 underline" href="/privacy">Privacy Policy</a> for how we use your data.</p></Section>
    </>}
    {policy === 'refunds' && <RefundPolicy />}
    {policy === 'service' && <>
      <Section title="What you book"><p>GBBookings sells reservations for services in Gilgit-Baltistan: hotel and homestay stays, car rentals (with or without a driver) and guided tours. No physical goods are shipped.</p></Section>
      <Section title="How the booking is delivered"><p>Your booking confirmation and voucher are sent to your email and are always available in My Bookings, where you can print or save them as a PDF. Pay now bookings are confirmed as soon as the payment succeeds. Pay on arrival bookings are confirmed by the partner, usually within 24 hours.</p></Section>
      <Section title="How the service is provided"><p>The partner provides the stay, car or tour on the dates booked: check in at the property, collect the car at the agreed pickup place and time, or join the tour at its meeting point. The partner's phone and WhatsApp appear on your voucher once the booking is confirmed.</p></Section>
      <Section title="If something goes wrong"><p>If a partner cannot provide what you booked, they cancel the booking and a paid booking is refunded in full. Mountain roads can close because of snow, landslides or official orders; contact us and the partner as early as possible so we can help change or cancel. Contact {email} or see <a className="text-emerald-700 underline" href="/support">Help &amp; contact</a>.</p></Section>
    </>}
  </article>;
}

/** Built from the rules set in Admin → Fees & refunds, so the page never goes out of date. */
function RefundPolicy() {
  const [rules, setRules] = useState<Omit<PlatformSettings, 'commissionPercent'> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { api.getRefundRules().then(setRules).catch(() => setFailed(true)); }, []);
  let from = 0;
  return <>
    <Section title="Pay on arrival bookings"><p>Nothing is paid in advance, so there is nothing to refund. Cancel free of charge in My Bookings until the day before the start date.</p></Section>
    <Section title="Pay now bookings cancelled by you"><p>You can cancel in My Bookings until the day before the start date. How much comes back depends on how long after booking you cancel:</p>
      {rules ? <ul className="list-disc pl-5">
        {rules.refundTiers.map((tier) => { const line = <li key={tier.withinHours}>Cancelled {from ? `more than ${from} and ` : ''}within {tier.withinHours} hours of booking: <strong>{tier.refundPercent}% refund</strong></li>; from = tier.withinHours; return line; })}
        <li>Cancelled {from ? `more than ${from} hours after booking` : 'at any time'}: <strong>{rules.laterRefundPercent}% refund</strong></li>
      </ul> : <p>{failed ? 'The refund rules could not be loaded. Please refresh, or contact us.' : 'Loading the refund rules…'}</p>}
    </Section>
    <Section title="Bookings cancelled by the partner or by GBBookings"><p>You get a full refund of everything you paid.</p></Section>
    <Section title="How refunds are paid"><p>Refunds go back to the card or wallet you paid with, usually within 7 to 14 working days depending on your bank or wallet provider. The refund amount is shown on the cancelled booking in My Bookings.</p></Section>
    <Section title="Questions"><p>Contact {email} or see <a className="text-emerald-700 underline" href="/support">Help &amp; contact</a>, with your booking reference.</p></Section>
  </>;
}
