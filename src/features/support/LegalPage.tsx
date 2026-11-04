import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../../shared/api/api';
import { CANCELLATION_POLICIES, CANCELLATION_POLICY_KEYS, policyLines } from '../../shared/utils/cancellation';
import { PARTNER_AGREEMENT_VERSION } from '../../shared/utils/partner-agreement';

export type Policy = 'terms' | 'privacy' | 'refunds' | 'service' | 'partner-agreement';

const TITLES: Record<Policy, string> = {
  terms: 'Terms of Use', privacy: 'Privacy Policy', refunds: 'Cancellation & Refund Policy', service: 'Service & Delivery Policy', 'partner-agreement': 'Partner Agreement',
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
      <Section title="Service providers"><p>Account and reservation data is stored in our database. Resend delivers verification codes and booking emails. Cloudinary stores listing photos and verification documents. Safepay processes online payments. If you choose “Continue with Google,” Google shares your name and verified email address with us. Reservation details are available to the booked partner and authorised GBBookings staff.</p></Section>
      <Section title="Your choices"><p>You can update your profile and manage active sessions in account security. You can delete your account yourself under Profile → Account &amp; security → Delete account: your name, email, phone and saved stays are removed, while past bookings stay with the property under the details you booked with. Partner accounts are closed through {email}, which also answers questions about personal information.</p></Section>
    </>}
    {policy === 'terms' && <>
      <Section title="What GBBookings is"><p>GBBookings is a marketplace for hotels, homestays, car rentals and tours in Gilgit-Baltistan. The stay, car or tour is provided by the partner who lists it; GBBookings verifies partners and listings, takes bookings and, for Pay now bookings, collects the payment.</p></Section>
      <Section title="Your account"><p>Provide accurate account and contact information, confirm your email with the signup code, keep your password and codes private, and use only accounts you are authorised to use.</p></Section>
      <Section title="Booking and payment"><p>Prices are in Pakistani rupees (PKR). Any fees and taxes are shown as their own lines at checkout and included in the total. You choose how to pay:</p>
        <ul className="list-disc pl-5"><li><strong>Pay now</strong>: you pay the full amount online when you book, and the booking is confirmed as soon as the payment succeeds.</li><li><strong>Pay on arrival</strong>: you send a request, the partner confirms it (or it expires after 24 hours), and you pay the partner at check-in, pickup or the start of the tour.</li></ul></Section>
      <Section title="Cancellations and refunds"><p>You can cancel in My Bookings until the day before the start date. Refunds for paid bookings follow our <a className="text-emerald-700 underline" href="/refunds">Cancellation &amp; Refund Policy</a>.</p></Section>
      <Section title="Partners"><p>Partners must submit accurate registration information and documents for our review, keep their listings, prices and availability correct, and honour confirmed bookings. GBBookings charges partners a commission on each booking.</p></Section>
      <Section title="Contact"><p>For account or booking questions, contact {email} or see the <a className="text-emerald-700 underline" href="/support">Help &amp; contact</a> page. Read our <a className="text-emerald-700 underline" href="/privacy">Privacy Policy</a> for how we use your data.</p></Section>
    </>}
    {policy === 'refunds' && <RefundPolicy />}
    {policy === 'partner-agreement' && <PartnerAgreement />}
    {policy === 'service' && <>
      <Section title="What you book"><p>GBBookings sells reservations for services in Gilgit-Baltistan: hotel and homestay stays, car rentals (with or without a driver) and guided tours. No physical goods are shipped.</p></Section>
      <Section title="How the booking is delivered"><p>Your booking confirmation and voucher are sent to your email and are always available in My Bookings, where you can print or save them as a PDF. Pay now bookings are confirmed as soon as the payment succeeds. Pay on arrival bookings are confirmed by the partner, usually within 24 hours.</p></Section>
      <Section title="How the service is provided"><p>The partner provides the stay, car or tour on the dates booked: check in at the property, collect the car at the agreed pickup place and time, or join the tour at its meeting point. The partner's phone and WhatsApp appear on your voucher once the booking is confirmed.</p></Section>
      <Section title="If something goes wrong"><p>If a partner cannot provide what you booked, they cancel the booking and a paid booking is refunded in full. Mountain roads can close because of snow, landslides or official orders; contact us and the partner as early as possible so we can help change or cancel. Contact {email} or see <a className="text-emerald-700 underline" href="/support">Help &amp; contact</a>.</p></Section>
    </>}
  </article>;
}

/** Each listing shows its own policy; this page explains all of them, from the same rules the server applies. */
function RefundPolicy() {
  return <>
    <Section title="Pay on arrival bookings"><p>Nothing is paid in advance, so there is nothing to refund. Cancel free of charge in My Bookings until the day before the start date.</p></Section>
    <Section title="Pay now bookings cancelled by you"><p>You can cancel in My Bookings until the day before the start date. Each listing has one of these policies, shown on its page and at checkout. How much comes back depends on how many days before the start date you cancel:</p>
      <ul className="list-disc pl-5">
        {CANCELLATION_POLICY_KEYS.map((key) => <li key={key}><strong>{CANCELLATION_POLICIES[key].label}:</strong> {policyLines(key).join('; ')}.</li>)}
      </ul>
      <p className="mt-2">Your booking keeps the policy it was made under, even if the partner changes it later. Bookings made before these policies keep the refund shown when they were booked.</p>
    </Section>
    <Section title="Bookings cancelled by the partner or by GBBookings"><p>You get a full refund of everything you paid.</p></Section>
    <Section title="Changing a booking"><p>Use Request a change in My Bookings. If the partner accepts and the new total is lower, the difference is refunded. If it is higher, you pay the difference on arrival.</p></Section>
    <Section title="How refunds are paid"><p>Refunds go back to the card or wallet you paid with, usually within 7 to 14 working days depending on your bank or wallet provider. My Bookings shows the amount and when we sent it. If you paid the partner on arrival, the partner returns the money.</p></Section>
    <Section title="Questions"><p>Contact {email} or see <a className="text-emerald-700 underline" href="/support">Help &amp; contact</a>, with your booking reference.</p></Section>
  </>;
}

function PartnerAgreement() {
  const [commission, setCommission] = useState<number | null>(null);
  useEffect(() => { api.getCommission().then(setCommission).catch(() => undefined); }, []);
  return <>
    <p>Version {PARTNER_AGREEMENT_VERSION}. This agreement is between GBBookings and the business or person listing on GBBookings (the partner).</p>
    <Section title="Listing"><p>You must be entitled to offer what you list. Keep your listings, prices, availability, fees and policies correct. GBBookings reviews partners and listings and can refuse, pause or remove them. Do not put contact details in listings or messages, or ask guests to book or pay outside GBBookings.</p></Section>
    <Section title="Honouring bookings"><p>Provide what was booked at the price shown. Answer booking requests within the time shown; unanswered requests expire. Guests pay under the cancellation policy on the listing when they booked. If you cancel a paid booking, the guest is refunded in full.</p></Section>
    <Section title="Commission"><p>You pay GBBookings a commission of {commission === null ? 'the percent shown on the Become a partner page' : `${commission}%`} of each booking, excluding taxes. Each booking keeps the percent in force when it was made. GBBookings can change the percent for future bookings by updating this agreement. On a cancelled paid booking, commission applies only to what you keep.</p></Section>
    <Section title="Payments and statements"><p>Pay now money is collected by GBBookings. Pay on arrival money is collected by you. GBBookings issues statements showing, booking by booking, what was collected, refunded and charged in commission. It pays what it owes to the bank account in your business profile. You pay any commission a statement shows you owe within 14 days of the statement. Bookings with an open refund wait until that refund is sent.</p></Section>
    <Section title="Refunds"><p>GBBookings returns Pay now refunds to guests. If you collected the money on arrival and a refund is due, you return it to the guest promptly.</p></Section>
    <Section title="Taxes"><p>You are responsible for your own taxes and licences, including remitting any taxes shown on your bookings.</p></Section>
    <Section title="Guest data"><p>Use guest details only to provide the booking, keep them secure, and do not use them for marketing.</p></Section>
    <Section title="Suspension and ending"><p>Either side can end this agreement with notice, but confirmed bookings must still be honoured and amounts owed still paid. GBBookings can suspend an account for fraud, repeated cancellations, false information or guest safety concerns.</p></Section>
    <Section title="Liability"><p>You are responsible for the service you provide to guests. Pakistani law applies to this agreement.</p></Section>
    <Section title="Contact"><p>Questions about this agreement: {email}.</p></Section>
  </>;
}
