import { useEffect, useState } from 'react';
import { CalendarCheck, LoaderCircle } from 'lucide-react';
import { api, type VendorBookingAction } from '../../shared/api/api';
import type { Booking } from '../../types';

const statusFilters: Array<Booking['status'] | 'all'> = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
const todayPk = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());

// Which actions each status allows; mirrors the server's transition table.
function actionsFor(booking: Booking): Array<{ action: VendorBookingAction; label: string }> {
  const started = todayPk() >= booking.startDate;
  if (booking.status === 'pending') return [{ action: 'confirm', label: 'Confirm' }, { action: 'cancel', label: 'Decline' }];
  if (booking.status === 'confirmed') {
    return started
      ? [{ action: 'complete', label: 'Mark completed' }, { action: 'no_show', label: 'No-show' }]
      : [{ action: 'cancel', label: 'Cancel' }];
  }
  return [];
}

export default function VendorReservations() {
  const [status, setStatus] = useState<Booking['status'] | 'all'>('pending');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.getVendorBookings(status === 'all' ? undefined : status)
      .then((result) => active && setBookings(result))
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status]);

  const act = async (booking: Booking, action: VendorBookingAction) => {
    let reason: string | undefined;
    if (action === 'cancel') {
      reason = window.prompt('Reason for cancelling (shared with the guest):')?.trim();
      if (!reason || reason.length < 3) return;
    }
    setBusyId(booking.id);
    setError(null);
    try {
      const updated = await api.actOnVendorBooking(booking.id, action, reason);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarCheck className="size-5 text-[#006F3C]" />
          <h2 id="vendor-reservations-heading" className="font-bold text-slate-900">Reservations</h2>
        </div>
        <label className="text-xs font-semibold text-slate-600">
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm capitalize">
            {statusFilters.map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}
          </select>
        </label>
      </div>

      {error && <p role="alert" className="bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="divide-y divide-slate-200 border-y border-slate-200" aria-live="polite">
        {loading && <div className="flex justify-center py-6"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading reservations" /></div>}
        {!loading && bookings.length === 0 && <p className="py-6 text-sm text-slate-500">No {status === 'all' ? '' : status.replace('_', ' ')} reservations.</p>}
        {!loading && bookings.map((booking) => (
          <div key={booking.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">
                {booking.customerName} · {booking.rooms ?? 1} × {booking.roomName ?? 'Room'}
              </p>
              <p className="text-xs text-slate-500">
                {booking.listingTitle} · {booking.startDate} → {booking.endDate} · {booking.guests} guests
              </p>
              <p className="text-xs text-slate-500">
                <span className="font-mono">{booking.reference}</span> · {booking.customerPhone} · PKR {booking.totalPrice.toLocaleString()} at check-in
              </p>
              {booking.specialRequests && <p className="mt-1 text-xs italic text-slate-600">“{booking.specialRequests}”</p>}
            </div>
            <span className="text-xs font-bold uppercase text-indigo-700">{booking.status.replace('_', ' ')}</span>
            <div className="flex gap-2">
              {actionsFor(booking).map(({ action, label }) => (
                <button key={action} type="button" disabled={busyId === booking.id} onClick={() => act(booking, action)}
                  className={`min-h-11 rounded-md px-4 text-sm font-bold disabled:opacity-50 ${
                    action === 'confirm' || action === 'complete' ? 'bg-[#006F3C] text-white' : 'border border-slate-300 text-slate-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
