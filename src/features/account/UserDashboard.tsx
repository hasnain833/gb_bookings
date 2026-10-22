import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Building2, CalendarDays, Check, ChevronLeft, ChevronRight, Circle, Heart, LoaderCircle, MapPin, MessageSquare, RefreshCw, Star, Trash2, X } from 'lucide-react';
import type { Booking, Listing } from '../../types';
import { handleImageError } from '../../types';
import { api, ApiError, type AuthUser, type Paginated, type VendorProfile } from '../../shared/api/api';
import { formatDateForDisplay } from '../../shared/utils/date';
import { useBodyScrollLock } from '../../shared/utils/scrollLock';
import SecurityPanel from './SecurityPanel';
import { ReviewDialog } from '../reviews/ReviewParts';

interface UserDashboardProps {
  userEmail: string; userName?: string; setView: (view: string) => void;
  onSelectBooking: (booking: Booking) => void; onSelectListing: (listing: Listing) => void;
  /** Opens the inbox thread with this booking's partner. */
  onMessage: (booking: Booking) => void;
  /** Bookings: the guest's trips. Profile: identity, details, security and saved stays (plus the business card for partners). */
  section: 'bookings' | 'profile';
  /** Set when the guest comes back from Safepay's payment page. */
  paymentReturn?: { bookingId: string; cancelled: boolean };
}
type Trip = 'upcoming' | 'past' | 'cancelled';
const TRIP_TABS: Array<[Trip, string]> = [['upcoming', 'Upcoming'], ['past', 'Past'], ['cancelled', 'Cancelled']];
const statusLabels: Record<Booking['status'], string> = {
  pending: 'Awaiting confirmation', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show',
};
const statusColors: Record<Booking['status'], string> = {
  pending: 'bg-amber-50 text-amber-800', confirmed: 'bg-emerald-50 text-emerald-800',
  completed: 'bg-slate-100 text-slate-600', cancelled: 'bg-rose-50 text-rose-700', no_show: 'bg-slate-100 text-slate-600',
};
const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white hover:bg-[#005c32] disabled:opacity-50';
const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50';
const money = (amount: number) => 'PKR ' + amount.toLocaleString('en-PK', { maximumFractionDigits: 2 });
const clock = (value?: string | Date) => value ? new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'soon';
const awaitingPayment = (booking: Booking) => booking.status === 'pending' && booking.paymentMethod === 'online' && booking.paymentStatus === 'pending';
const BUSINESS_LABEL: Record<string, string> = { hotel: 'Hotel business', homestay: 'Homestay host', vehicle: 'Car rental partner', tour_operator: 'Tour partner', multi_service: 'Partner business' };

export default function UserDashboard(props: UserDashboardProps) {
  return props.section === 'bookings' ? <BookingsPage {...props} /> : <ProfilePage {...props} />;
}

/* ───────────────────────── Bookings & trips ───────────────────────── */

function BookingsPage({ setView, onSelectBooking, onMessage, paymentReturn, userEmail }: UserDashboardProps) {
  const [trip, setTrip] = useState<Trip>('upcoming');
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Paginated<Booking>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const cancelLock = useRef(false);
  const [paymentNotice, setPaymentNotice] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.getBookingsPage(page, trip).then((result) => {
      if (!active) return;
      if (page > Math.max(1, result.pagination.pages)) { setPage(Math.max(1, result.pagination.pages)); return; }
      setBookings(result.data); setPagination(result.pagination);
      // Unpaid Pay now bookings may have been paid without the guest coming back: re-check them with the server.
      for (const booking of result.data.filter(awaitingPayment)) {
        api.verifyPayment(booking.id).then((checked) => {
          if (active && checked.paymentStatus === 'paid') setBookings((items) => items.map((item) => item.id === checked.id ? checked : item));
        }).catch(() => undefined);
      }
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'We couldn’t load your bookings. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, trip, reload, userEmail]);

  // Back from Safepay: the server asks Safepay whether the payment went through.
  useEffect(() => {
    if (!paymentReturn) return;
    api.verifyPayment(paymentReturn.bookingId).then((booking) => {
      setPaymentNotice(booking.paymentStatus === 'paid'
        ? { tone: 'ok', text: `Payment received. ${booking.reference} is confirmed and we have emailed you the details.` }
        : { tone: 'warn', text: `${paymentReturn.cancelled ? 'Payment was cancelled' : 'Payment did not go through'}. ${booking.status === 'pending' ? `${booking.reference} is held until ${clock(booking.respondBy)}: use Complete payment to try again.` : 'The booking was released.'}` });
      setReload((value) => value + 1);
    }).catch((reason) => setPaymentNotice({ tone: 'warn', text: reason instanceof Error ? reason.message : 'We could not check the payment. Refresh in a moment.' }));
  }, [paymentReturn]);

  const completePayment = async (booking: Booking) => {
    setPayingId(booking.id); setPaymentNotice(null);
    try { window.location.assign(await api.startPayment(booking.id)); }
    catch (reason) { setPaymentNotice({ tone: 'warn', text: reason instanceof Error ? reason.message : 'The payment page did not open. Please try again.' }); setPayingId(null); }
  };
  const confirmCancellation = async (reason: string) => {
    if (!cancelBooking || cancelLock.current) return;
    cancelLock.current = true; setCancelBusy(true); setCancelError('');
    try { await api.cancelBooking(cancelBooking.id, reason.trim() || 'Cancelled by guest'); setCancelBooking(null); setReload((value) => value + 1); }
    catch (reason) { setCancelError(reason instanceof Error ? reason.message : 'We couldn’t cancel this booking. Please try again.'); }
    finally { cancelLock.current = false; setCancelBusy(false); }
  };
  const pickTrip = (next: Trip) => { setTrip(next); setPage(1); };

  return <div id="user-dashboard-view" className="mx-auto max-w-5xl space-y-5 pb-10">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Bookings &amp; trips</h1>
      <div className="flex items-center gap-2">
        <button type="button" disabled={loading} onClick={() => setReload((value) => value + 1)} aria-label="Refresh bookings" className="flex size-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40"><RefreshCw className="size-4" /></button>
        <button type="button" onClick={() => setView('hotels')} className={secondaryButton}>Find your next stay<ArrowRight className="size-4" /></button>
      </div>
    </div>
    {paymentNotice && <p role="status" className={`rounded-xl p-4 text-sm ${paymentNotice.tone === 'ok' ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>{paymentNotice.text}</p>}

    <div role="tablist" aria-label="Booking lists" className="flex gap-1 border-b border-slate-200">
      {TRIP_TABS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={trip === id} onClick={() => pickTrip(id)}
        className={`-mb-px min-h-11 border-b-[3px] px-4 text-[15px] font-bold transition ${trip === id ? 'border-[#006F3C] text-[#006F3C]' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
        {label}{trip === id && pagination && !loading ? ` (${pagination.total})` : ''}</button>)}
    </div>

    <section role="tabpanel" aria-label={`${trip} bookings`} className="space-y-4">
      {error ? <ErrorNotice message={error} onRetry={() => setReload((value) => value + 1)} />
        : loading ? <LoadingCards />
        : bookings.length === 0 ? <EmptyState icon={<CalendarDays className="size-6" />}
            title={trip === 'upcoming' ? 'Your next trip starts here' : trip === 'past' ? 'No past trips yet' : 'No cancelled bookings'}
            text={trip === 'upcoming' ? 'Book a stay, car or tour and it will appear here.' : 'They will appear here when you have some.'}
            action={<button type="button" onClick={() => setView('hotels')} className={primaryButton}>Explore stays<ArrowRight className="size-4" /></button>} />
        : bookings.map((booking) => trip === 'upcoming'
          ? <UpcomingCard key={booking.id} booking={booking} today={today} paying={payingId === booking.id}
              canCancel={today < booking.startDate} onView={() => onSelectBooking(booking)} onMessage={() => onMessage(booking)} onPay={() => void completePayment(booking)}
              onCancel={() => { setCancelError(''); setCancelBooking(booking); }} />
          : <CompactCard key={booking.id} booking={booking} onView={() => onSelectBooking(booking)} onReview={() => setReviewBooking(booking)} />)}
      {!loading && !error && pagination && pagination.pages > 1 && <nav aria-label="Booking pages" className="flex flex-wrap items-center justify-between gap-3 pt-2"><p className="text-xs text-slate-500">Page {page} of {pagination.pages}</p><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className={secondaryButton}><ChevronLeft className="size-4" />Previous</button><button type="button" disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className={secondaryButton}>Next<ChevronRight className="size-4" /></button></div></nav>}
    </section>
    {reviewBooking && <ReviewDialog booking={reviewBooking} onClose={() => setReviewBooking(null)} onSaved={(review) => { setBookings((items) => items.map((item) => item.id === reviewBooking.id ? { ...item, review, reviewableUntil: undefined } : item)); setReviewBooking(null); }} />}
    {cancelBooking && <CancelReservationDialog booking={cancelBooking} busy={cancelBusy} error={cancelError} onClose={() => setCancelBooking(null)} onConfirm={confirmCancellation} />}
  </div>;
}

const daysUntil = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
const partySummary = (booking: Booking) => booking.tour
  ? `${booking.guests || 1} traveller(s) · ${booking.tour.days} day(s)`
  : `${booking.duration ?? 1} ${booking.rental ? 'day' : 'night'}(s) · ${booking.rooms || 1} ${booking.rental ? 'car' : 'room'}(s) · ${booking.guests || booking.adults || 1} ${booking.rental ? 'passenger' : 'guest'}(s)`;

function UpcomingCard({ booking, today, canCancel, paying, onView, onMessage, onPay, onCancel }: {
  booking: Booking; today: string; canCancel: boolean; paying: boolean; onView: () => void; onMessage: () => void; onPay: () => void; onCancel: () => void;
}) {
  const unpaid = awaitingPayment(booking);
  const days = daysUntil(today, booking.startDate);
  const when = days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
  const startLabel = booking.tour ? 'Meet' : booking.rental ? 'Pickup' : 'Check-in';
  const startValue = booking.tour ? `${booking.tour.meetingPoint ?? ''}${booking.tour.startTime ? ` · ${booking.tour.startTime}` : ''}`
    : booking.rental ? `${booking.rental.pickupTime}, ${booking.rental.pickupPlace}` : booking.checkInTime ? `From ${booking.checkInTime}` : formatDateForDisplay(booking.startDate);
  return <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white sm:flex-row">
    <img src={booking.listingImage} alt="" onError={handleImageError} className="h-48 w-full object-cover sm:h-auto sm:w-72" />
    <div className="min-w-0 flex-1 space-y-3 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap gap-2">
          <span className={'rounded-full px-3 py-1 text-xs font-bold ' + (unpaid ? 'bg-amber-50 text-amber-800' : statusColors[booking.status])}>{unpaid ? 'Awaiting payment' : statusLabels[booking.status]}</span>
          {booking.paymentStatus === 'paid' && <span className="rounded-full bg-[#00391F] px-3 py-1 text-xs font-bold text-white">Paid</span>}
        </span>
        <span className="break-all font-mono text-xs text-slate-500">{booking.reference || booking.id}</span>
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-slate-950">{booking.listingTitle}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="size-3.5 shrink-0" />{booking.listingLocation}</p>
      </div>
      <p className="text-sm text-slate-600">{formatDateForDisplay(booking.startDate)} – {formatDateForDisplay(booking.endDate)} · {partySummary(booking)} · <strong className="text-slate-900">{when}</strong></p>
      <dl className="grid gap-3 rounded-xl bg-[#F5F7F4] p-3.5 text-sm sm:grid-cols-3">
        <div><dt className="text-slate-500">{startLabel}</dt><dd className="font-semibold text-slate-900">{startValue}</dd></div>
        <div><dt className="text-slate-500">Questions?</dt><dd><button type="button" onClick={onMessage} className="font-semibold text-[#006F3C] underline">Message the partner</button></dd></div>
        <div><dt className="text-slate-500">{booking.paymentStatus === 'paid' ? 'Total paid' : unpaid ? 'To pay now' : 'Pay on arrival'}</dt><dd className="font-semibold text-slate-900">{money(booking.totalPrice)}</dd></div>
      </dl>
      {unpaid && <p className="text-sm font-semibold text-amber-800">Not paid yet · held until {clock(booking.respondBy)}</p>}
      <div className="flex flex-wrap gap-2 pt-1">
        {unpaid && <button type="button" disabled={paying} onClick={onPay} className={primaryButton}>{paying && <LoaderCircle className="size-4 animate-spin" />}Complete payment</button>}
        <button type="button" onClick={onView} className={unpaid ? secondaryButton : primaryButton}>View voucher</button>
        <button type="button" onClick={onMessage} className={secondaryButton}><MessageSquare className="size-4" aria-hidden="true" />Message partner</button>
        {canCancel && <button type="button" onClick={onCancel} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50">Cancel booking</button>}
      </div>
    </div>
  </article>;
}

function CompactCard({ booking, onView, onReview }: { booking: Booking; onView: () => void; onReview: () => void }) {
  const note = booking.status === 'cancelled'
    ? (booking.refund ? <span className="font-semibold text-[#00552E]">Refund {money(booking.refund.amount)} ({booking.refund.percent}%)</span> : <span>Nothing was charged</span>)
    : booking.review ? <span className="flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-400" />You rated it {booking.review.overall}/5</span>
    : booking.reviewableUntil ? <span>Review open until {formatDateForDisplay(booking.reviewableUntil)}</span>
    : <span>{statusLabels[booking.status]}</span>;
  return <article className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:px-5">
    <div className="flex min-w-0 items-center gap-4">
      <img src={booking.listingImage} alt="" onError={handleImageError} className="size-[72px] shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 space-y-1">
        <h2 className="truncate text-base font-bold text-slate-950">{booking.listingTitle}</h2>
        <p className="text-sm text-slate-500">{formatDateForDisplay(booking.startDate)} – {formatDateForDisplay(booking.endDate)} · {money(booking.totalPrice)}</p>
        <p className="text-[13px] text-slate-600">{note}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      {booking.reviewableUntil && <button type="button" onClick={onReview} className={primaryButton}><Star className="size-4" />Write a review</button>}
      <button type="button" onClick={onView} className={secondaryButton}>View<ChevronRight className="size-4" /></button>
    </div>
  </article>;
}

/* ───────────────────────── Profile (design B) ───────────────────────── */

function ProfilePage({ userEmail, userName, setView, onSelectListing }: UserDashboardProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [counts, setCounts] = useState<{ trips: number; upcoming: number } | null>(null);
  const [saved, setSaved] = useState<Listing[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    api.getCurrentUser().then(({ user: me }) => {
      if (!active) return;
      setUser(me);
      // Partner-only: the business this account belongs to (owners have one; staff may not see it).
      if (me.roles?.some((role) => role === 'vendor_owner' || role === 'vendor_staff')) {
        api.getMyVendor().then((result) => active && setVendor(result.data))
          .catch((reason) => { if (!(reason instanceof ApiError && reason.status === 404)) console.error(reason); });
      }
    }).catch(() => undefined);
    Promise.all([api.getBookingsPage(1, 'past'), api.getBookingsPage(1, 'upcoming')])
      .then(([past, upcoming]) => active && setCounts({ trips: past.pagination.total, upcoming: upcoming.pagination.total }))
      .catch(() => undefined);
    return () => { active = false; };
  }, [userEmail]);

  useEffect(() => {
    let active = true;
    setSavedLoading(true); setSavedError('');
    api.getWishlist().then((items) => { if (active) setSaved(items); })
      .catch((reason) => { if (active) setSavedError(reason instanceof Error ? reason.message : 'We couldn’t load your saved stays. Please try again.'); })
      .finally(() => { if (active) setSavedLoading(false); });
    return () => { active = false; };
  }, [reload, userEmail]);

  const removeSaved = async (id: string) => {
    setRemovingId(id); setSavedError('');
    try { await api.removeWishlistItem(id); setSaved((items) => items.filter((item) => item.id !== id)); }
    catch (reason) { setSavedError(reason instanceof Error ? reason.message : 'Unable to remove this saved stay.'); }
    finally { setRemovingId(null); }
  };

  const name = user?.name || userName || userEmail.split('@')[0] || 'Traveller';
  const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const isPartner = Boolean(user?.roles?.some((role) => role === 'vendor_owner' || role === 'vendor_staff'));
  const memberSince = user?.memberSince ? new Date(user.memberSince).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : null;
  const card = 'rounded-2xl border border-slate-200 bg-white';

  return <div id="user-dashboard-view" className="mx-auto flex max-w-6xl flex-wrap items-start gap-8 pb-10">
    <aside className="w-full space-y-5 lg:sticky lg:top-28 lg:w-[340px]">
      <div className={`${card} flex flex-col items-center gap-3 p-7 text-center shadow-[0_6px_24px_rgba(15,42,28,0.08)]`}>
        <span className="flex size-24 items-center justify-center rounded-full bg-[#0F2A1C] text-3xl font-extrabold text-white" aria-hidden="true">{initials}</span>
        <h1 className="text-2xl font-extrabold text-slate-950">{name}</h1>
        <p className="text-sm text-slate-500">{isPartner ? 'Partner' : 'Guest'}{memberSince ? ` · member since ${memberSince}` : ''}</p>
        <dl className="mt-1 grid w-full grid-cols-3 border-t border-slate-200 pt-4">
          {([['Trips', counts?.trips], ['Upcoming', counts?.upcoming], ['Saved', savedLoading ? undefined : saved.length]] as const).map(([label, value], index) => (
            <div key={label} className={index === 1 ? 'border-x border-slate-200' : ''}><dd className="text-xl font-extrabold text-slate-950">{value ?? '—'}</dd><dt className="text-xs text-slate-500">{label}</dt></div>
          ))}
        </dl>
      </div>
      <div className={`${card} space-y-3 p-5`}>
        <h2 className="font-extrabold text-slate-950">Verified</h2>
        <Verified ok={Boolean(user?.emailVerified)} label="Email address" />
        <Verified ok={Boolean(user?.twoFactorEnabled)} label="Two-step sign-in" />
        {isPartner && <Verified ok={vendor?.status === 'approved' || (!vendor && isPartner)} label="Partner documents" />}
      </div>
    </aside>

    <main className="min-w-0 flex-1 basis-[560px] space-y-8">
      {isPartner && <section aria-label="Your business" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#0F2A1C] px-6 py-6 text-white">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-200">Your business</p>
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><Building2 className="size-5 text-emerald-200" aria-hidden="true" />{vendor?.name ?? 'Partner team member'}</h2>
          <p className="text-sm text-slate-300">{[vendor ? BUSINESS_LABEL[vendor.businessType] ?? 'Partner' : null, vendor ? (vendor.status === 'approved' ? 'Approved' : vendor.status) : null, user?.roles?.includes('vendor_owner') ? 'You are the owner' : 'Team member'].filter(Boolean).join(' · ')}</p>
        </div>
        <button type="button" onClick={() => setView('vendor-dashboard')} className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-bold text-[#0F2A1C] hover:bg-slate-100">Open partner dashboard</button>
      </section>}

      <section aria-labelledby="profile-details" className="space-y-1">
        <h2 id="profile-details" className="border-b border-slate-200 pb-2 text-2xl font-extrabold text-slate-950">Personal details</h2>
        {user ? <>
          <EditableRow label="Name" value={user.name} hint="Used on your bookings and reviews." minLength={2}
            onSave={async (value) => setUser(await api.updateProfile({ name: value }))} />
          <EditableRow label="Phone" value={user.phone ?? ''} placeholder="Add a phone number" hint="Filled in at checkout so partners can reach you." minLength={7} allowEmpty
            onSave={async (value) => setUser(await api.updateProfile({ phone: value }))} />
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 py-4">
            <div><p className="text-sm font-bold text-slate-900">Email</p><p className="text-[15px] text-slate-600">{user.email}</p></div>
            {user.emailVerified ? <span className="text-sm font-bold text-[#00552E]">Verified</span> : <span className="text-sm font-semibold text-amber-800">Not verified · see below</span>}
          </div>
        </> : <LoadingCards />}
      </section>

      <section aria-labelledby="profile-security" className="space-y-3">
        <h2 id="profile-security" className="border-b border-slate-200 pb-2 text-2xl font-extrabold text-slate-950">Login &amp; security</h2>
        <div className={`${card} p-5 sm:p-7`}><SecurityPanel /></div>
      </section>

      <section aria-labelledby="profile-saved" className="space-y-3">
        <h2 id="profile-saved" className="border-b border-slate-200 pb-2 text-2xl font-extrabold text-slate-950">Saved stays</h2>
        {savedError && <ErrorNotice message={savedError} onRetry={() => setReload((value) => value + 1)} />}
        {savedLoading ? <LoadingCards /> : !savedError && saved.length === 0 ? <EmptyState icon={<Heart className="size-6" />} title="Keep your favourite places close" text="Tap the heart on a stay, car or tour to save it here while you plan your trip." action={<button type="button" onClick={() => setView('hotels')} className={primaryButton}>Discover stays<ArrowRight className="size-4" /></button>} />
          : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{saved.map((listing) => <article key={listing.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="relative"><button type="button" onClick={() => onSelectListing(listing)} aria-label={'View ' + listing.title} className="block w-full"><img src={listing.image} alt={listing.title} onError={handleImageError} className="aspect-[4/3] w-full object-cover" /></button><button type="button" disabled={removingId !== null} onClick={() => void removeSaved(listing.id)} aria-label={'Remove ' + listing.title + ' from saved stays'} className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-white text-rose-700 shadow-sm hover:bg-rose-50 disabled:opacity-50">{removingId === listing.id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</button></div><div className="space-y-2 p-4"><p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="size-3.5" />{listing.location}</p><button type="button" onClick={() => onSelectListing(listing)} className="text-left text-base font-semibold text-slate-900 hover:text-emerald-700">{listing.title}</button><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-900">{money(listing.price)}<span className="font-normal text-slate-400">{['hotel', 'homestay'].includes(listing.type) ? ' / night' : listing.type === 'car' ? ' / day' : listing.type === 'tour' ? ' / person' : ''}</span></p>{listing.reviewsCount > 0 && <span className="flex items-center gap-1 text-xs text-slate-600"><Star className="size-3 fill-amber-400 text-amber-400" />{listing.rating}</span>}</div></div></article>)}</div>}
      </section>
    </main>
  </div>;
}

function Verified({ ok, label }: { ok: boolean; label: string }) {
  return <p className={`flex items-center gap-2.5 text-sm ${ok ? 'text-slate-900' : 'text-slate-500'}`}>
    {ok ? <Check className="size-[18px] text-[#006F3C]" aria-hidden="true" /> : <Circle className="size-[18px] text-slate-400" aria-hidden="true" />}
    {label}<span className="sr-only">{ok ? ': done' : ': not yet'}</span>
  </p>;
}

/** One "Label · value · Edit" row that turns into a small form. */
function EditableRow({ label, value, hint, placeholder, minLength, allowEmpty = false, onSave }: {
  label: string; value: string; hint: string; placeholder?: string; minLength: number; allowEmpty?: boolean; onSave: (value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await onSave(draft.trim()); setEditing(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save. Please try again.'); }
    finally { setBusy(false); }
  };
  if (editing) return <form onSubmit={submit} className="space-y-2 border-b border-slate-200 py-4">
    <label className="block text-sm font-bold text-slate-900">{label}
      <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} required={!allowEmpty} minLength={allowEmpty && !draft ? undefined : minLength} maxLength={label === 'Name' ? 120 : 30}
        className="mt-1.5 block min-h-11 w-full max-w-md rounded-lg border border-slate-300 px-3 text-[15px] font-normal outline-none focus:border-[#006F3C]" /></label>
    <p className="text-xs text-slate-500">{hint}</p>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <div className="flex gap-2"><button disabled={busy} className={primaryButton}>{busy && <LoaderCircle className="size-4 animate-spin" />}Save</button><button type="button" disabled={busy} onClick={() => { setEditing(false); setDraft(value); setError(''); }} className={secondaryButton}>Cancel</button></div>
  </form>;
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 py-4">
    <div><p className="text-sm font-bold text-slate-900">{label}</p><p className="text-[15px] text-slate-600">{value || <span className="text-slate-400">{placeholder}</span>}</p></div>
    <button type="button" onClick={() => { setDraft(value); setEditing(true); }} className="min-h-11 px-3 text-sm font-bold text-[#006F3C] underline">{value ? 'Edit' : 'Add'}</button>
  </div>;
}

/* ───────────────────────── Shared bits ───────────────────────── */

function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">{message}</p><button type="button" onClick={onRetry} className={secondaryButton}><RefreshCw className="size-4" />Try again</button></div>;
}
function LoadingCards() {
  return <div role="status" aria-label="Loading" className="space-y-4">{[0, 1].map((value) => <div key={value} className="h-40 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />)}<span className="sr-only">Loading…</span></div>;
}
function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action: ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">{icon}</div><h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{text}</p><div className="mt-6">{action}</div></div>;
}
function CancelReservationDialog({ booking, busy, error, onClose, onConfirm }: {
  booking: Booking; busy: boolean; error: string; onClose: () => void; onConfirm: (reason: string) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState('');
  const [refund, setRefund] = useState('');
  useBodyScrollLock(true);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  // Same rule as the server (guestRefundPercent): the tier is picked by hours since the booking was made.
  useEffect(() => {
    if (booking.paymentStatus !== 'paid') return;
    api.getRefundRules().then((rules) => {
      const hours = (Date.now() - new Date(booking.createdAt).getTime()) / 3_600_000;
      const percent = rules.refundTiers.find((tier) => hours <= tier.withinHours)?.refundPercent ?? rules.laterRefundPercent;
      setRefund(` If you cancel now you get ${percent}% back: ${money(Math.round(booking.totalPrice * percent) / 100)} of ${money(booking.totalPrice)}.`);
    }).catch(() => {});
  }, [booking]);
  return <dialog ref={dialog} aria-labelledby="cancel-reservation-title" aria-describedby="cancel-reservation-description" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-slate-950/50"><div className="flex items-start justify-between gap-4"><h2 id="cancel-reservation-title" className="text-xl font-semibold text-slate-900">Cancel this reservation?</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Close cancellation dialog" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50"><X className="size-5" /></button></div><p id="cancel-reservation-description" className="mt-3 text-sm leading-6 text-slate-500">Your booking at {booking.listingTitle} ({booking.reference || booking.id}) will be cancelled and released.{booking.paymentStatus === 'paid' ? (refund || ' You paid online, so you get money back under our refund policy.') : ''}</p><form onSubmit={(event) => { event.preventDefault(); void onConfirm(reason); }}><label className="mt-4 block text-sm font-medium text-slate-700">Reason (optional)<textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} minLength={3} disabled={busy} className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-600" /></label>{error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}<div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" autoFocus disabled={busy} onClick={onClose} className={secondaryButton}>Keep reservation</button><button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{busy ? 'Cancelling…' : 'Cancel reservation'}</button></div></form></dialog>;
}
