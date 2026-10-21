import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, CalendarDays, Clock, CreditCard, LoaderCircle } from 'lucide-react';
import { api, ApiError, type VendorProfile } from '../../shared/api/api';
import { formatDateForDisplay } from '../../shared/utils/date';
import HotelRegistration, { businessTypeOf, type PartnerKind } from './HotelRegistration';

interface BecomePartnerProps {
  isLoggedIn: boolean;
  isPartner: boolean;
  onSignIn: () => void;
  onOpenDashboard: () => void;
  /** Re-reads the account (roles) so the header updates after approval. */
  onAccountChange: () => void;
  onSupport: () => void;
}

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;
// ponytail: stock photos until we have our own from Gilgit-Baltistan partners.
const HERO_PHOTO = photo('1464822759023-fed622ff2c3b');

const TYPES = [
  { id: 'hotel', title: 'Hotels', image: photo('1542314831-068cd1dbfeeb'), alt: 'Hotel with a lit pool at dusk', text: 'Hotels, guest houses and resorts renting rooms by the night.', need: 'business registration and documents' },
  { id: 'homestay', title: 'Homestays', image: photo('1542718610-a1d656d1884c'), alt: 'Wooden house on a hillside at sunset', text: 'Families and hosts welcoming guests into a room or a whole home.', need: 'CNIC and proof of the property' },
  { id: 'car', title: 'Cars', image: photo('1533473359331-0135ef1b58bf'), alt: 'SUV on a gravel mountain road', text: 'Rental companies and owner-drivers, with or without a driver.', need: 'registration or CNIC, licence, vehicle papers' },
  { id: 'tour', title: 'Tours', image: photo('1464822759023-fed622ff2c3b'), alt: 'Snow peaks above a forested valley', text: 'Tour companies and guides running trips, treks and day tours.', need: 'registration or CNIC and guide licence' },
] as const;

const STEPS = [
  { title: 'Create your account', text: 'Sign up or sign in with a verified email.' },
  { title: 'Register and upload documents', text: 'Business details and the papers for your type. Save and come back at any step.' },
  { title: 'We verify you', text: 'Our team checks the documents and approves your business.' },
  { title: 'Add listings, take bookings', text: 'Set prices and dates; each listing is reviewed, then guests can book.' },
];

const NEEDS = [
  ['Hotels', ['Business registration certificate and number', 'Owner CNIC or passport', 'Business address, email and phone', 'Property ownership or lease document (optional)', 'NTN / tax certificate (optional)']],
  ['Homestays', ['Host CNIC (front and back)', 'Proof of property: ownership papers, a lease, or a recent utility bill in your name', 'Home address, email and phone', 'No business registration needed']],
  ['Cars', ['Owner CNIC (front and back)', 'Vehicle registration book or card', 'Owner-drivers: your driving licence', 'Rental companies: business registration number (certificate optional)', 'Address, email and phone']],
  ['Tours', ['Your CNIC (front and back)', 'Guide licence or proof of guiding', 'Tour companies: business registration number (certificate optional)', 'Address, email and phone']],
] as const;

const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#006F3C] px-5 text-sm font-semibold text-white hover:bg-[#005c32] disabled:opacity-50';

export default function BecomePartner({ isLoggedIn, isPartner, onSignIn, onOpenDashboard, onAccountChange, onSupport }: BecomePartnerProps) {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [loading, setLoading] = useState(isLoggedIn);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState<PartnerKind | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [commission, setCommission] = useState<number | null>(null);

  useEffect(() => { api.getCommission().then(setCommission).catch(() => undefined); }, []);

  useEffect(() => {
    if (!isLoggedIn) { setVendor(null); setLoading(false); return undefined; }
    let active = true;
    setLoading(true); setError('');
    Promise.all([
      api.getMyVendor().then((result) => result.data).catch((reason) => {
        if (reason instanceof ApiError && reason.status === 404) return null;
        throw reason;
      }),
      api.getCurrentUser().then(({ user }) => user.emailVerified !== false),
    ]).then(([profile, verified]) => {
      if (!active) return;
      setVendor(profile); setEmailVerified(verified);
      // Approved since the account was loaded: refresh roles so the header shows the dashboard.
      if (profile?.status === 'approved' && !isPartner) onAccountChange();
    }).catch((reason) => active && setError(reason instanceof Error ? reason.message : 'Unable to load your partner status.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, attempt]);

  const editable = !vendor || vendor.status === 'draft' || vendor.status === 'rejected';

  if (registering && isLoggedIn && editable) {
    // An existing application keeps its own type, whichever card was clicked.
    const kind = vendor?.businessType === 'homestay' || vendor?.businessType === 'hotel' ? vendor.businessType : vendor?.businessType === 'vehicle' ? 'car' : vendor?.businessType === 'tour_operator' ? 'tour' : registering;
    return <div className="px-4 pb-20 pt-2"><HotelRegistration kind={kind} vendor={vendor} emailVerified={emailVerified}
      onVendorChange={(next) => { setVendor(next); if (next.status === 'submitted') { setRegistering(null); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
      onEmailVerified={async () => { const verified = (await api.getCurrentUser()).user.emailVerified !== false; setEmailVerified(verified); return verified; }}
      onExit={() => setRegistering(null)} /></div>;
  }

  const start = (kind: PartnerKind) => (isLoggedIn ? setRegistering(kind) : onSignIn());

  const card = 'rounded-2xl border border-slate-200 bg-white';
  return (
    <div className="pb-20">
      <section className="overflow-hidden rounded-3xl bg-cover bg-[center_40%]" style={{ backgroundImage: `url(${HERO_PHOTO})` }}>
        <div className="bg-[#09140e]/65 px-6 pb-28 pt-14 text-white sm:px-12 sm:pb-32 sm:pt-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Partner with GBBookings</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">Bring travellers to your hotel, homestay, cars or tours in Gilgit-Baltistan</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-100 sm:text-lg">Register once, get verified, and manage prices, calendars and bookings from your own dashboard.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#partner-types" className="inline-flex min-h-12 items-center rounded-xl bg-white px-6 text-sm font-bold text-slate-900 hover:bg-slate-100">Choose what you list</a>
            <a href="#partner-steps" className="inline-flex min-h-12 items-center rounded-xl border border-white/60 px-6 text-sm font-semibold text-white hover:bg-white/10">How it works</a>
          </div>
        </div>
      </section>

      <section id="partner-types" aria-label="What would you like to list?" className="relative -mt-16 space-y-4 px-3 sm:px-6">
        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error} <button type="button" onClick={() => setAttempt((value) => value + 1)} className="ml-2 font-semibold underline">Try again</button></div>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map((type) => (
            <article key={type.id} className={`${card} flex flex-col overflow-hidden shadow-sm`}>
              <img src={type.image} alt={type.alt} loading="lazy" referrerPolicy="no-referrer" className="aspect-[4/3] w-full object-cover" />
              <div className="flex flex-1 flex-col gap-2.5 p-5">
                <h2 className="text-xl font-extrabold text-slate-950">{type.title}</h2>
                <p className="text-sm leading-6 text-slate-600">{type.text}</p>
                <p className="flex-1 text-xs leading-5 text-slate-600"><strong className="text-slate-900">You’ll need:</strong> {type.need}</p>
                <div className="pt-2">
                  <PartnerAction kind={type.id as PartnerKind} loading={loading} isLoggedIn={isLoggedIn} isPartner={isPartner} vendor={vendor} onStart={() => start(type.id as PartnerKind)} onOpenDashboard={onOpenDashboard} onSupport={onSupport} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Why partner with us" className="mt-16 grid gap-5 md:grid-cols-3">
        <div className={`${card} p-7`}>
          <p className="text-4xl font-extrabold text-[#006F3C]">{commission === null ? '—' : `${commission}%`}</p>
          <h3 className="mt-2 text-lg font-bold text-slate-950">Commission per booking</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">No sign-up fee and no monthly fee. You only pay when a guest books.</p>
        </div>
        <div className={`${card} p-7`}>
          <CreditCard className="size-9 text-[#006F3C]" aria-hidden="true" />
          <h3 className="mt-2 text-lg font-bold text-slate-950">Paid online or on arrival</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">Guests pay by card or wallet when they book, or pay you at check-in, pickup or the start of the tour.</p>
        </div>
        <div className={`${card} p-7`}>
          <CalendarDays className="size-9 text-[#006F3C]" aria-hidden="true" />
          <h3 className="mt-2 text-lg font-bold text-slate-950">Your own dashboard</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">Weekend and season prices, calendar, promo codes, reports and staff accounts.</p>
        </div>
      </section>

      <section id="partner-steps" aria-labelledby="partner-steps-heading" className="mt-16 space-y-7">
        <h2 id="partner-steps-heading" className="text-3xl font-extrabold text-slate-950">How it works</h2>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t-[3px] border-[#006F3C] pt-4">
              <span className="text-sm font-bold text-[#006F3C]">Step {index + 1}</span>
              <h3 className="mt-1 text-lg font-bold text-slate-950">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="partner-needs-heading" className="mt-16 space-y-6">
        <div><h2 id="partner-needs-heading" className="text-3xl font-extrabold text-slate-950">What you’ll need</h2><p className="mt-1 text-sm text-slate-600">Have these ready as PDF or photo files before you start.</p></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {NEEDS.map(([label, items]) => (
            <div key={label} className={`${card} p-6`}>
              <h3 className="font-bold text-slate-950">{label}</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-700">
                {items.map((item) => <li key={item} className="flex items-start gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-[#006F3C]" />{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-[#0F2A1C] px-6 py-10 text-white sm:px-12">
        <div><h2 className="text-2xl font-extrabold">Questions before you start?</h2><p className="mt-1 text-slate-300">Our partner team will walk you through it.</p></div>
        <button type="button" onClick={onSupport} className="inline-flex min-h-12 items-center rounded-xl bg-white px-6 text-sm font-bold text-[#0F2A1C] hover:bg-slate-100">Contact us</button>
      </section>
    </div>
  );
}

const PARTNER_NAME: Record<string, string> = { hotel: 'a hotel business', homestay: 'a homestay host', vehicle: 'a car rental partner', tour_operator: 'a tour partner' };
const LIST_WHAT: Record<PartnerKind, string> = { hotel: 'a hotel', homestay: 'a homestay', car: 'cars', tour: 'tours' };
const REGISTER: Record<PartnerKind, string> = { hotel: 'Register your hotel', homestay: 'Register as a host', car: 'Register your cars', tour: 'Register your tours' };

function PartnerAction({ kind, loading, isLoggedIn, isPartner, vendor, onStart, onOpenDashboard, onSupport }: {
  kind: PartnerKind; loading: boolean; isLoggedIn: boolean; isPartner: boolean; vendor: VendorProfile | null;
  onStart: () => void; onOpenDashboard: () => void; onSupport: () => void;
}) {
  if (loading) return <LoaderCircle className="size-5 animate-spin text-[#006F3C]" aria-label="Loading your partner status" />;
  if (!isLoggedIn) return <button type="button" onClick={onStart} className={`${primaryButton} w-full`}>Sign in to register<ArrowRight className="size-4" /></button>;
  // One partner account is one business type; the other cards explain rather than offer a second registration.
  if (vendor && vendor.businessType !== businessTypeOf(kind) && vendor.businessType !== 'multi_service') return (
    <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">This account is registered as {PARTNER_NAME[vendor.businessType] ?? 'another partner type'}. To list {LIST_WHAT[kind]} too, register with a different account.</p>
  );
  if (isPartner || vendor?.status === 'approved') return <button type="button" onClick={onOpenDashboard} className={`${primaryButton} w-full`}>Open partner dashboard<ArrowRight className="size-4" /></button>;
  if (!vendor) return <button type="button" onClick={onStart} className={`${primaryButton} w-full`}>{REGISTER[kind]}<ArrowRight className="size-4" /></button>;
  if (vendor.status === 'draft') return <button type="button" onClick={onStart} className={`${primaryButton} w-full`}>Continue registration<ArrowRight className="size-4" /></button>;
  if (vendor.status === 'rejected') return (
    <div className="space-y-3">
      <p className="rounded-lg bg-rose-50 p-3 text-xs leading-5 text-rose-800"><strong className="block">Changes requested</strong>{vendor.rejectionReason}</p>
      <button type="button" onClick={onStart} className={`${primaryButton} w-full`}>Fix and resubmit</button>
    </div>
  );
  if (vendor.status === 'submitted') return (
    <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900"><Clock className="mt-0.5 size-4 shrink-0" /><span><strong className="block">Application under review</strong>{vendor.submittedAt ? `Submitted ${formatDateForDisplay(vendor.submittedAt)}. ` : ''}Your partner dashboard opens here once it’s approved.</span></p>
  );
  return (
    <p className="rounded-lg bg-rose-50 p-3 text-xs leading-5 text-rose-800"><strong className="block">Partner account {vendor.status}</strong>Please <button type="button" onClick={onSupport} className="font-semibold underline">contact support</button>.</p>
  );
}
