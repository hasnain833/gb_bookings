import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Heart, LoaderCircle, MapPin, RefreshCw, ShieldCheck, Star, Trash2, Users, X } from 'lucide-react';
import type { Booking, Listing } from '../../types';
import { handleImageError } from '../../types';
import { api, type Paginated } from '../../shared/api/api';
import { formatDateForDisplay } from '../../shared/utils/date';
import { useBodyScrollLock } from '../../shared/utils/scrollLock';
import SecurityPanel from './SecurityPanel';

interface UserDashboardProps {
  userEmail: string; userName?: string; setView: (view: string) => void;
  onSelectBooking: (booking: Booking) => void; onSelectListing: (listing: Listing) => void;
}
type Tab = 'bookings' | 'saved' | 'security';
const tabs = [
  { id: 'bookings', label: 'My bookings', icon: CalendarDays },
  { id: 'saved', label: 'Saved stays', icon: Heart },
  { id: 'security', label: 'Account & security', icon: ShieldCheck },
] as const;
const statusLabels: Record<Booking['status'], string> = {
  pending: 'Awaiting confirmation', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show',
};
const statusColors: Record<Booking['status'], string> = {
  pending: 'bg-amber-50 text-amber-800', confirmed: 'bg-emerald-50 text-emerald-800',
  completed: 'bg-slate-100 text-slate-600', cancelled: 'bg-rose-50 text-rose-700', no_show: 'bg-slate-100 text-slate-600',
};
const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white hover:bg-[#005c32] disabled:opacity-50';
const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const money = (amount: number) => 'PKR ' + amount.toLocaleString('en-PK', { maximumFractionDigits: 2 });

export default function UserDashboard({ userEmail, userName, setView, onSelectBooking, onSelectListing }: UserDashboardProps) {
  const [tab, setTab] = useState<Tab>('bookings');
  const [status, setStatus] = useState<Booking['status'] | ''>('');
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Paginated<Booking>['pagination'] | null>(null);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [bookingError, setBookingError] = useState('');
  const [saved, setSaved] = useState<Listing[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState('');
  const [reload, setReload] = useState(0);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const cancelLock = useRef(false);
  const name = userName || userEmail.split('@')[0] || 'Traveler';
  const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());

  useEffect(() => {
    let active = true;
    setBookingLoading(true); setBookingError('');
    api.getBookingsPage(page, status || undefined).then((result) => {
      if (!active) return;
      if (page > Math.max(1, result.pagination.pages)) { setPage(Math.max(1, result.pagination.pages)); return; }
      setBookings(result.data); setPagination(result.pagination);
    }).catch((reason) => { if (active) setBookingError(reason instanceof Error ? reason.message : 'We couldn’t load your bookings. Please try again.'); })
      .finally(() => { if (active) setBookingLoading(false); });
    return () => { active = false; };
  }, [page, status, reload, userEmail]);

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
  const confirmCancellation = async (reason: string) => {
    if (!cancelBooking || cancelLock.current) return;
    cancelLock.current = true; setCancelBusy(true); setCancelError('');
    try { await api.cancelBooking(cancelBooking.id, reason.trim() || 'Cancelled by guest'); setCancelBooking(null); setReload((value) => value + 1); }
    catch (error) { setCancelError(error instanceof Error ? error.message : 'We couldn’t cancel this booking. Please try again.'); }
    finally { cancelLock.current = false; setCancelBusy(false); }
  };

  return <div id="user-dashboard-view" className="mx-auto max-w-5xl space-y-6 pb-10">
    <header className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white px-5 py-6 sm:px-7 sm:py-8">
      <div className="flex min-w-0 items-center gap-4"><div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-lg font-semibold text-emerald-800">{initials}</div><div className="min-w-0"><p className="text-xs font-medium text-emerald-700">Your travel space</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Hi, {name.split(' ')[0]}</h1><p className="mt-1 truncate text-sm text-slate-500">{userEmail}</p></div></div>
      <button type="button" onClick={() => setView('hotels')} className={secondaryButton}>Find your next stay<ArrowRight className="size-4" /></button>
    </header>
    <div role="tablist" aria-label="Your account" className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5">
      {tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} aria-controls={'account-panel-' + item.id} id={'account-tab-' + item.id} onClick={() => setTab(item.id)} className={'flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition sm:flex-1 ' + (tab === item.id ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}><item.icon className="size-4" />{item.label}{item.id === 'saved' && saved.length > 0 && <span className="rounded-full bg-slate-100 px-2 text-xs text-slate-600">{saved.length}</span>}</button>)}
    </div>
    <section role="tabpanel" id={'account-panel-' + tab} aria-labelledby={'account-tab-' + tab} className="space-y-4">
      {tab === 'bookings' && <>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Your reservations</h2><p className="mt-1 text-sm text-slate-500">View your stay details and track confirmation.</p></div><div className="flex items-center gap-2"><label className="sr-only" htmlFor="booking-status">Filter reservations</label><select id="booking-status" value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"><option value="">All reservations</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" disabled={bookingLoading} onClick={() => setReload((value) => value + 1)} aria-label="Refresh reservations" className="flex size-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40"><RefreshCw className="size-4" /></button></div></div>
        {bookingError ? <ErrorNotice message={bookingError} onRetry={() => setReload((value) => value + 1)} /> : bookingLoading ? <LoadingCards /> : bookings.length === 0 ? <EmptyState icon={<CalendarDays className="size-6" />} title={status ? 'No matching reservations' : 'Your next trip starts here'} text={status ? 'Choose another status to see your reservations.' : 'Once you book a stay, your reservation details will appear here.'} action={<button type="button" onClick={() => status ? setStatus('') : setView('hotels')} className={primaryButton}>{status ? 'View all reservations' : 'Explore hotels'}<ArrowRight className="size-4" /></button>} /> : <div className="space-y-4">{bookings.map((booking) => <BookingCard key={booking.id} booking={booking} canCancel={['pending', 'confirmed'].includes(booking.status) && today < booking.startDate} onView={() => onSelectBooking(booking)} onCancel={() => { setCancelError(''); setCancelBooking(booking); }} />)}</div>}
        {!bookingLoading && !bookingError && pagination && pagination.pages > 1 && <nav aria-label="Reservation pages" className="flex flex-wrap items-center justify-between gap-3 pt-2"><p className="text-xs text-slate-500">Page {page} of {pagination.pages} · {pagination.total} reservation(s)</p><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className={secondaryButton}><ChevronLeft className="size-4" />Previous</button><button type="button" disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className={secondaryButton}>Next<ChevronRight className="size-4" /></button></div></nav>}
      </>}
      {tab === 'saved' && <>
        <div><h2 className="text-lg font-semibold text-slate-900">Places you’d love to stay</h2><p className="mt-1 text-sm text-slate-500">Your saved properties, ready whenever you are.</p></div>
        {savedError && <ErrorNotice message={savedError} onRetry={() => setReload((value) => value + 1)} />}
        {savedLoading ? <LoadingCards /> : !savedError && saved.length === 0 ? <EmptyState icon={<Heart className="size-6" />} title="Keep your favorite stays close" text="Tap the heart on a property to save it here while you plan your trip." action={<button type="button" onClick={() => setView('hotels')} className={primaryButton}>Discover stays<ArrowRight className="size-4" /></button>} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{saved.map((listing) => <article key={listing.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="relative"><button type="button" onClick={() => onSelectListing(listing)} aria-label={'View ' + listing.title} className="block w-full"><img src={listing.image} alt={listing.title} onError={handleImageError} className="aspect-[4/3] w-full object-cover" /></button><button type="button" disabled={removingId !== null} onClick={() => void removeSaved(listing.id)} aria-label={'Remove ' + listing.title + ' from saved stays'} className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-white text-rose-700 shadow-sm hover:bg-rose-50 disabled:opacity-50">{removingId === listing.id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</button></div><div className="space-y-2 p-4"><p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="size-3.5" />{listing.location}</p><button type="button" onClick={() => onSelectListing(listing)} className="text-left text-base font-semibold text-slate-900 hover:text-emerald-700">{listing.title}</button><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-900">{money(listing.price)}<span className="font-normal text-slate-400">{['hotel', 'homestay'].includes(listing.type) ? ' / night' : listing.type === 'car' ? ' / day' : ''}</span></p>{listing.reviewsCount > 0 && <span className="flex items-center gap-1 text-xs text-slate-600"><Star className="size-3 fill-amber-400 text-amber-400" />{listing.rating}</span>}</div></div></article>)}</div>}
      </>}
      {tab === 'security' && <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7"><SecurityPanel /></div>}
    </section>
    {cancelBooking && <CancelReservationDialog booking={cancelBooking} busy={cancelBusy} error={cancelError} onClose={() => setCancelBooking(null)} onConfirm={confirmCancellation} />}
  </div>;
}

function BookingCard({ booking, canCancel, onView, onCancel }: { booking: Booking; canCancel: boolean; onView: () => void; onCancel: () => void }) {
  return <article className="overflow-hidden rounded-xl border border-slate-200 bg-white sm:flex">
    <img src={booking.listingImage} alt={booking.listingTitle} onError={handleImageError} className="h-44 w-full shrink-0 object-cover sm:h-auto sm:w-44" />
    <div className="min-w-0 flex-1 space-y-4 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className={'rounded-full px-3 py-1 text-xs font-medium ' + statusColors[booking.status]}>{statusLabels[booking.status]}</span><span className="break-all font-mono text-xs text-slate-400">{booking.reference || booking.id}</span></div><div><h3 className="text-lg font-semibold text-slate-900">{booking.listingTitle}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="size-3.5 shrink-0" />{booking.listingLocation}</p></div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600"><span className="flex items-center gap-2"><CalendarDays className="size-4 text-slate-400" />{formatDateForDisplay(booking.startDate)} – {formatDateForDisplay(booking.endDate)}</span><span className="flex items-center gap-2"><Users className="size-4 text-slate-400" />{booking.rooms || 1} room(s) · {booking.guests || booking.adults || 1} guest(s)</span></div>{booking.roomName && <p className="text-sm text-slate-500">{booking.roomName}{booking.duration ? ' · ' + booking.duration + ' night(s)' : ''}</p>}
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4"><div><p className="text-lg font-semibold text-slate-900">{money(booking.totalPrice)}</p><p className="mt-0.5 text-xs text-slate-500">{booking.status === 'cancelled' ? 'Reservation cancelled' : booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentMethod === 'pay_at_hotel' ? 'Payment at the property' : 'See reservation for payment details'}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={onView} className={secondaryButton}>View reservation<ChevronRight className="size-4" /></button>{canCancel && <button type="button" onClick={onCancel} className="min-h-11 rounded-lg px-3 text-sm font-medium text-rose-700 hover:bg-rose-50">Cancel booking</button>}</div></div>
    </div>
  </article>;
}
function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">{message}</p><button type="button" onClick={onRetry} className={secondaryButton}><RefreshCw className="size-4" />Try again</button></div>;
}
function LoadingCards() {
  return <div role="status" aria-label="Loading your account" className="space-y-4">{[0, 1].map((value) => <div key={value} className="h-48 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />)}<span className="sr-only">Loading…</span></div>;
}
function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action: ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">{icon}</div><h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{text}</p><div className="mt-6">{action}</div></div>;
}
function CancelReservationDialog({ booking, busy, error, onClose, onConfirm }: {
  booking: Booking; busy: boolean; error: string; onClose: () => void; onConfirm: (reason: string) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState('');
  useBodyScrollLock(true);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={dialog} aria-labelledby="cancel-reservation-title" aria-describedby="cancel-reservation-description" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-slate-950/50"><div className="flex items-start justify-between gap-4"><h2 id="cancel-reservation-title" className="text-xl font-semibold text-slate-900">Cancel this reservation?</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Close cancellation dialog" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50"><X className="size-5" /></button></div><p id="cancel-reservation-description" className="mt-3 text-sm leading-6 text-slate-500">Your stay at {booking.listingTitle} ({booking.reference || booking.id}) will be cancelled and the reserved rooms released.</p><form onSubmit={(event) => { event.preventDefault(); void onConfirm(reason); }}><label className="mt-4 block text-sm font-medium text-slate-700">Reason (optional)<textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} minLength={3} disabled={busy} className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-600" /></label>{error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}<div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" autoFocus disabled={busy} onClick={onClose} className={secondaryButton}>Keep reservation</button><button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{busy ? 'Cancelling…' : 'Cancel reservation'}</button></div></form></dialog>;
}
