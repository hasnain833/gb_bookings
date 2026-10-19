import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Building2, CalendarCheck, Car, Clock, FileCheck2, Home, LoaderCircle, Mountain, ShieldCheck, UserPlus, Wallet } from 'lucide-react';
import { api, ApiError, type VendorProfile } from '../../shared/api/api';
import { formatDateForDisplay } from '../../shared/utils/date';
import HotelRegistration, { type PartnerKind } from './HotelRegistration';

interface BecomePartnerProps {
  isLoggedIn: boolean;
  isPartner: boolean;
  onSignIn: () => void;
  onOpenDashboard: () => void;
  /** Re-reads the account (roles) so the header updates after approval. */
  onAccountChange: () => void;
  onSupport: () => void;
}

const TYPES = [
  { id: 'hotel', title: 'Hotels', icon: Building2, text: 'Hotels, guest houses and resorts renting rooms by the night.', available: true },
  { id: 'homestay', title: 'Homestays', icon: Home, text: 'Local families and hosts welcoming guests into their homes.', available: true },
  { id: 'car', title: 'Cars', icon: Car, text: 'Car rental companies, with or without drivers.', available: false },
  { id: 'tour', title: 'Tours', icon: Mountain, text: 'Tour operators and guides running trips and packages.', available: false },
] as const;

const STEPS = [
  { icon: UserPlus, title: 'Create your account', text: 'Sign up or sign in with a verified email.' },
  { icon: FileCheck2, title: 'Register your business', text: 'Add business details and upload verification documents.' },
  { icon: ShieldCheck, title: 'We verify it', text: 'Our team reviews your documents and approves your business.' },
  { icon: CalendarCheck, title: 'Start receiving bookings', text: 'Add your properties, then manage rooms and reservations.' },
];

const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#006F3C] px-5 text-sm font-semibold text-white hover:bg-[#005c32] disabled:opacity-50';

export default function BecomePartner({ isLoggedIn, isPartner, onSignIn, onOpenDashboard, onAccountChange, onSupport }: BecomePartnerProps) {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [loading, setLoading] = useState(isLoggedIn);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState<PartnerKind | null>(null);
  const [attempt, setAttempt] = useState(0);

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
    const kind = vendor?.businessType === 'homestay' || vendor?.businessType === 'hotel' ? vendor.businessType : registering;
    return <div className="px-4 pb-20 pt-2"><HotelRegistration kind={kind} vendor={vendor} emailVerified={emailVerified}
      onVendorChange={(next) => { setVendor(next); if (next.status === 'submitted') { setRegistering(null); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
      onEmailVerified={async () => { const verified = (await api.getCurrentUser()).user.emailVerified !== false; setEmailVerified(verified); return verified; }}
      onExit={() => setRegistering(null)} /></div>;
  }

  const start = (kind: PartnerKind) => (isLoggedIn ? setRegistering(kind) : onSignIn());

  return (
    <div className="space-y-14 pb-20">
      <section className="overflow-hidden rounded-3xl bg-[#063d2b] px-6 py-12 text-white sm:px-12 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">GBBookings partners</p>
        <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">Grow your business with travellers coming to Gilgit-Baltistan</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-emerald-100">List your property or service, reach guests planning their trip, and manage every booking from one partner dashboard.</p>
        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-emerald-50">
          <li className="flex items-center gap-2"><BadgeCheck className="size-4 text-emerald-300" />Free to register</li>
          <li className="flex items-center gap-2"><Wallet className="size-4 text-emerald-300" />Guests pay you at the property</li>
          <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-300" />Verified partners only</li>
        </ul>
      </section>

      <section aria-labelledby="partner-types-heading" className="space-y-6">
        <div><h2 id="partner-types-heading" className="text-2xl font-bold text-slate-950">What would you like to list?</h2><p className="mt-1 text-sm text-slate-600">Each business type has its own registration. More are on the way.</p></div>
        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error} <button type="button" onClick={() => setAttempt((value) => value + 1)} className="ml-2 font-semibold underline">Try again</button></div>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map((type) => (
            <article key={type.id} className={`flex flex-col rounded-2xl border bg-white p-6 ${type.available ? 'border-emerald-200 shadow-sm' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <span className={`flex size-12 items-center justify-center rounded-xl ${type.available ? 'bg-emerald-50 text-[#006F3C]' : 'bg-slate-100 text-slate-400'}`}><type.icon className="size-6" /></span>
                {!type.available && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Coming soon</span>}
              </div>
              <h3 className={`mt-5 text-lg font-bold ${type.available ? 'text-slate-950' : 'text-slate-500'}`}>{type.title}</h3>
              <p className="mt-1 flex-1 text-sm leading-6 text-slate-500">{type.text}</p>
              <div className="mt-6">
                {type.available
                  ? <PartnerAction kind={type.id as PartnerKind} loading={loading} isLoggedIn={isLoggedIn} isPartner={isPartner} vendor={vendor} onStart={() => start(type.id as PartnerKind)} onOpenDashboard={onOpenDashboard} onSupport={onSupport} />
                  : <p className="text-sm text-slate-400">Registration opens soon.</p>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="partner-steps-heading" className="space-y-6">
        <h2 id="partner-steps-heading" className="text-2xl font-bold text-slate-950">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-[#006F3C] text-sm font-bold text-white">{index + 1}</span><step.icon className="size-5 text-slate-400" /></div>
              <h3 className="mt-4 font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {([
        ['hotels', ['Business registration certificate and number', 'Owner CNIC or passport', 'Business address, email and phone', 'Property ownership or lease document (optional)', 'NTN / tax certificate (optional)']],
        ['homestays', ['Host CNIC (front and back)', 'Proof of property: ownership papers, a lease, or a recent utility bill in your name', 'Home address, email and phone', 'No business registration needed']],
      ] as const).map(([label, items]) => (
        <section key={label} className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-2">
          <div><h2 className="text-xl font-bold text-slate-950">What you’ll need for {label}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Have these ready as PDF files before you start. You can save and come back at any step.</p></div>
          <ul className="space-y-3 text-sm text-slate-700">
            {items.map((item) => <li key={item} className="flex items-start gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-[#006F3C]" />{item}</li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PartnerAction({ kind, loading, isLoggedIn, isPartner, vendor, onStart, onOpenDashboard, onSupport }: {
  kind: PartnerKind; loading: boolean; isLoggedIn: boolean; isPartner: boolean; vendor: VendorProfile | null;
  onStart: () => void; onOpenDashboard: () => void; onSupport: () => void;
}) {
  if (loading) return <LoaderCircle className="size-5 animate-spin text-[#006F3C]" aria-label="Loading your partner status" />;
  if (!isLoggedIn) return <button type="button" onClick={onStart} className={`${primaryButton} w-full`}>Sign in to register<ArrowRight className="size-4" /></button>;
  // One partner account is one business type; the other cards explain rather than offer a second registration.
  if (vendor && vendor.businessType !== kind && vendor.businessType !== 'multi_service') return (
    <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">This account is registered as a {vendor.businessType === 'homestay' ? 'homestay host' : 'hotel business'}. To list {kind === 'homestay' ? 'a homestay' : 'a hotel'} too, register with a different account.</p>
  );
  if (isPartner || vendor?.status === 'approved') return <button type="button" onClick={onOpenDashboard} className={`${primaryButton} w-full`}>Open partner dashboard<ArrowRight className="size-4" /></button>;
  if (!vendor) return <button type="button" onClick={onStart} className={`${primaryButton} w-full`}>{kind === 'homestay' ? 'Register as a host' : 'Register your hotel'}<ArrowRight className="size-4" /></button>;
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
