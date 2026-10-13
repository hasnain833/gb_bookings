import { useEffect, useState } from 'react';
import { CalendarCheck, ChevronDown, LoaderCircle, Search, X } from 'lucide-react';
import { api, type BookingListParams, type Paginated, type VendorBookingAction } from '../../shared/api/api';
import { useReasonDialog } from '../../shared/components/ReasonDialog';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import { formatDateForDisplay } from '../../shared/utils/date';
import type { Booking } from '../../types';

const statusFilters: Array<Booking['status'] | 'all'> = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
const todayPk = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
const statusLabel = (status: string) => status.replace('_', '-');
const statusStyle: Record<Booking['status'], string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  completed: 'bg-slate-100 text-slate-700 ring-slate-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  no_show: 'bg-rose-50 text-rose-700 ring-rose-200',
};
const fieldClass = 'min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';

// Which actions each status allows; mirrors the server's transition table.
function actionsFor(booking: Booking): Array<{ action: VendorBookingAction; label: string }> {
  const started = todayPk() >= booking.startDate;
  const payable = booking.paymentMethod === 'pay_at_hotel' && booking.paymentStatus === 'pending'
    ? [{ action: 'mark_paid' as const, label: 'Mark paid' }] : [];
  if (booking.status === 'pending') return [{ action: 'confirm', label: 'Confirm' }, { action: 'cancel', label: 'Decline' }];
  if (booking.status === 'confirmed') {
    return started
      ? [{ action: 'complete', label: 'Mark completed' }, ...payable, { action: 'no_show', label: 'No-show' }]
      : [...payable, { action: 'cancel', label: 'Cancel' }];
  }
  if (booking.status === 'completed') return payable;
  return [];
}

interface ReservationsSource {
  load: (params: BookingListParams) => Promise<Paginated<Booking>>;
  act: (bookingId: string, action: VendorBookingAction, reason?: string) => Promise<Booking>;
}

const vendorSource: ReservationsSource = { load: api.getVendorBookings, act: api.actOnVendorBooking };

export function StatusBadge({ status }: { status: Booking['status'] }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyle[status]}`}>{statusLabel(status)}</span>;
}

/** Vendor reservations by default; the admin workspace passes the all-bookings source. */
export default function VendorReservations({ source = vendorSource, title = 'Reservations', properties = [] }: {
  source?: ReservationsSource; title?: string; properties?: Array<{ id: string; title: string }>;
}) {
  const [status, setStatus] = useState<Booking['status'] | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [listingId, setListingId] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Paginated<Booking>['pagination'] | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { askReason, dialog } = useReasonDialog();
  const query = useDebouncedValue(search.trim());
  const filtered = Boolean(query || from || to || listingId);

  useEffect(() => { setPage(1); }, [status, query, from, to, listingId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    source.load({ status: status === 'all' ? undefined : status, q: query.length >= 2 ? query : undefined, from: from || undefined, to: to || undefined, listingId: listingId || undefined, page })
      .then((result) => { if (active) { setBookings(result.data); setPagination(result.pagination); } })
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [status, query, from, to, listingId, source, page]);

  const clearFilters = () => { setSearch(''); setFrom(''); setTo(''); setListingId(''); };

  const act = async (booking: Booking, action: VendorBookingAction) => {
    let reason: string | undefined;
    const ref = booking.reference ?? booking.id;
    if (action === 'cancel') {
      const declining = booking.status === 'pending';
      reason = (await askReason({
        title: declining ? 'Decline reservation request' : 'Cancel reservation', destructive: true,
        confirmLabel: declining ? 'Decline request' : 'Cancel reservation', noteLabel: 'Reason for the guest',
        description: `${booking.customerName} · ${ref}. The rooms are released and the guest is emailed this reason.`,
      }))?.trim();
      if (!reason) return;
    } else if (action === 'mark_paid') {
      if (await askReason({ title: 'Record payment received?', confirmLabel: `Record PKR ${booking.totalPrice.toLocaleString()} paid`, description: `Confirm the guest ${booking.customerName} paid PKR ${booking.totalPrice.toLocaleString()} at the property for ${ref}. This is logged and cannot be undone here.` }) === null) return;
    } else if (action === 'no_show') {
      if (await askReason({ title: 'Mark as no-show?', destructive: true, confirmLabel: 'Mark no-show', description: `${booking.customerName} did not arrive for ${ref}. This cannot be undone.` }) === null) return;
    }
    setBusyId(booking.id);
    setError(null);
    try {
      const updated = await source.act(booking.id, action, reason);
      // Drop it from a filtered list once it no longer matches.
      setBookings((items) => items
        .map((item) => item.id === updated.id ? updated : item)
        .filter((item) => status === 'all' || item.status === status));
    } catch (reasonError) {
      setError(reasonError instanceof Error ? reasonError.message : 'The booking could not be updated.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="vendor-reservations-heading">
      {dialog}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarCheck className="size-5 text-[#006F3C]" />
          <h2 id="vendor-reservations-heading" className="font-bold text-slate-900">{title}</h2>
          {pagination && <span className="text-sm text-slate-500">{pagination.total} found</span>}
        </div>
      </div>

      {/* Status tabs */}
      <div role="tablist" aria-label="Filter by status" className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {statusFilters.map((value) => (
          <button key={value} type="button" role="tab" aria-selected={status === value} onClick={() => setStatus(value)}
            className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-semibold capitalize transition ${status === value ? 'border-[#006F3C] text-[#006F3C]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {statusLabel(value)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <label className="relative">
          <span className="sr-only">Search reservations</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference, guest name, email or phone" className={`${fieldClass} w-full pl-9`} />
        </label>
        {properties.length > 1 && <label><span className="sr-only">Property</span>
          <select value={listingId} onChange={(event) => setListingId(event.target.value)} className={`${fieldClass} w-full`}>
            <option value="">All properties</option>
            {properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}
          </select></label>}
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">Check-in from<input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className={fieldClass} /></label>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">to<input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className={fieldClass} /></label>
      </div>
      {filtered && <button type="button" onClick={clearFilters} className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-[#006F3C]"><X className="size-4" />Clear search and dates</button>}

      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="space-y-3" aria-live="polite" aria-busy={loading}>
        {loading && <div className="flex justify-center py-8"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading reservations" /></div>}
        {!loading && bookings.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No {status === 'all' ? '' : `${statusLabel(status)} `}reservations{filtered ? ' match your search' : ''}.
          </div>
        )}
        {!loading && bookings.map((booking) => {
          const open = openId === booking.id;
          return (
            <article key={booking.id} className="rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-slate-900">{booking.customerName}</p>
                    <StatusBadge status={booking.status} />
                    {booking.paymentStatus === 'paid' && <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">Paid</span>}
                  </div>
                  {booking.status === 'pending' && booking.respondBy && <p className="text-xs font-semibold text-amber-800">Respond by {new Date(booking.respondBy).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} or the request expires and the rooms are released.</p>}
                  <p className="text-sm text-slate-600">
                    {formatDateForDisplay(booking.startDate)} → {formatDateForDisplay(booking.endDate)} · {booking.duration} night{booking.duration === 1 ? '' : 's'} · {booking.rooms ?? 1} × {booking.roomName ?? 'Room'}
                  </p>
                  <p className="text-xs text-slate-500"><span className="font-mono">{booking.reference}</span> · {booking.listingTitle} · <strong className="font-semibold text-slate-700">PKR {booking.totalPrice.toLocaleString()}</strong></p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {actionsFor(booking).map(({ action, label }) => (
                    <button key={action} type="button" disabled={busyId === booking.id} onClick={() => act(booking, action)}
                      className={`min-h-11 rounded-lg px-4 text-sm font-semibold disabled:opacity-50 ${
                        action === 'confirm' || action === 'complete' || action === 'mark_paid' ? 'bg-[#006F3C] text-white hover:bg-[#005c32]' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}>
                      {busyId === booking.id && (action === 'confirm' || action === 'complete') ? <LoaderCircle className="mx-auto size-4 animate-spin" /> : label}
                    </button>
                  ))}
                  <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : booking.id)}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    Details<ChevronDown className={`size-4 transition ${open ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              {open && <ReservationDetails booking={booking} />}
            </article>
          );
        })}
      </div>
      {pagination && pagination.pages > 1 && <nav aria-label="Reservation pages" className="flex items-center justify-end gap-3 text-sm"><button type="button" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)} className="min-h-11 rounded-lg border border-slate-300 px-4 disabled:opacity-50">Previous</button><span>Page {pagination.page} of {pagination.pages}</span><button type="button" disabled={loading || page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className="min-h-11 rounded-lg border border-slate-300 px-4 disabled:opacity-50">Next</button></nav>}
    </section>
  );
}

function ReservationDetails({ booking }: { booking: Booking }) {
  const rows: Array<[string, string | undefined]> = [
    ['Guest email', booking.customerEmail],
    ['Guest phone', booking.customerPhone],
    ['Guests', `${booking.adults ?? booking.guests} adult(s)${booking.children ? `, ${booking.children} child(ren)` : ''}`],
    ['Check-in', `${formatDateForDisplay(booking.startDate)}${booking.checkInTime ? ` from ${booking.checkInTime}` : ''}`],
    ['Check-out', `${formatDateForDisplay(booking.endDate)}${booking.checkOutTime ? ` by ${booking.checkOutTime}` : ''}`],
    ['Rate', booking.nightlyRate ? `PKR ${booking.nightlyRate.toLocaleString()} × ${booking.duration} night(s) × ${booking.rooms ?? 1} room(s)` : undefined],
    ['Total', `PKR ${booking.totalPrice.toLocaleString()}`],
    ['Payment', booking.paymentStatus === 'paid' ? `Paid${booking.paidAt ? ` · recorded ${new Date(booking.paidAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}` : booking.paymentMethod === 'pay_at_hotel' ? 'Collect at the property' : booking.paymentStatus],
    ['Booked on', formatDateForDisplay(booking.createdAt)],
  ];
  return (
    <div className="grid gap-6 border-t border-slate-100 bg-slate-50/60 p-4 text-sm md:grid-cols-2">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2">
        {rows.filter(([, value]) => value).map(([label, value]) => <div key={label} className="contents"><dt className="text-slate-500">{label}</dt><dd className="break-words font-medium text-slate-800">{value}</dd></div>)}
        {booking.specialRequests && <><dt className="text-slate-500">Requests</dt><dd className="italic text-slate-700">“{booking.specialRequests}”</dd></>}
      </dl>
      <div>
        <h3 className="mb-2 font-semibold text-slate-900">Status history</h3>
        <ol className="space-y-3 border-l border-slate-200 pl-4">
          {(booking.history ?? []).map((event, index) => (
            <li key={index} className="relative">
              <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-[#006F3C] ring-4 ring-slate-50" />
              <p className="font-medium capitalize text-slate-800">{statusLabel(event.status)} <span className="font-normal text-slate-500">· {new Date(event.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span></p>
              {event.reason && <p className="text-slate-600">{event.reason}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
