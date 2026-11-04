import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { api, type ChangeQuote, type ListingAvailability } from '../../shared/api/api';
import type { Booking } from '../../types';
import Select from '../../shared/components/Select';
import DateInput from '../../shared/components/DateInput';

const field = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-[#006F3C]';
const money = (amount: number) => `PKR ${amount.toLocaleString()}`;
const tomorrow = () => new Date(Date.now() + 86_400_000 + 5 * 3_600_000).toISOString().slice(0, 10);

/** A guest asks to move their booking. The price is worked out first; the partner then accepts or declines. */
export default function ChangeBookingDialog({ booking, onClose, onSent }: { booking: Booking; onClose: () => void; onSent: (booking: Booking) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const tour = Boolean(booking.tour);
  const car = Boolean(booking.rental);
  const [checkIn, setCheckIn] = useState(booking.startDate);
  const [checkOut, setCheckOut] = useState(booking.endDate);
  const [roomTypeId, setRoomTypeId] = useState(booking.roomTypeId ?? '');
  const [rooms, setRooms] = useState(booking.rooms ?? 1);
  const [note, setNote] = useState('');
  const [roomChoices, setRoomChoices] = useState<ListingAvailability['rooms']>([]);
  const [quote, setQuote] = useState<ChangeQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);

  const input = { checkIn, checkOut: tour ? checkIn : checkOut, roomTypeId, rooms };
  const changed = checkIn !== booking.startDate || (!tour && checkOut !== booking.endDate) || roomTypeId !== booking.roomTypeId || rooms !== (booking.rooms ?? 1);
  const ready = changed && Boolean(checkIn) && (tour || car ? checkOut >= checkIn : checkOut > checkIn);

  // Other room categories, for stays. Cars and tours keep the unit they booked.
  useEffect(() => {
    if (tour || car || !checkIn || checkOut <= checkIn) return;
    api.getListingAvailability(booking.listingId, { checkIn, checkOut, adults: booking.adults ?? 1, children: booking.children ?? 0, rooms }).then((result) => setRoomChoices(result.rooms)).catch(() => undefined);
  }, [checkIn, checkOut, rooms]);

  useEffect(() => {
    setQuote(null); setError('');
    if (!ready) return undefined;
    let active = true;
    const timer = setTimeout(() => {
      api.requestBookingChange(booking.id, { ...input, preview: true })
        .then((result) => { if (active) setQuote(result.quote); })
        .catch((reason: Error) => { if (active) setError(reason.message); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [checkIn, checkOut, roomTypeId, rooms]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const result = await api.requestBookingChange(booking.id, { ...input, note: note.trim() || undefined });
      if (result.booking) onSent(result.booking);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The request could not be sent.'); }
    finally { setBusy(false); }
  };

  return (
    <dialog ref={dialog} aria-labelledby="change-booking-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-slate-950/50">
      <div className="flex items-start justify-between gap-4">
        <h2 id="change-booking-title" className="text-xl font-semibold text-slate-900">Request a change</h2>
        <button type="button" disabled={busy} onClick={onClose} aria-label="Close" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50"><X className="size-5" /></button>
      </div>
      <p className="mt-2 text-sm text-slate-500">{booking.listingTitle} ({booking.reference}). Your booking stays as it is until the partner accepts. The price is at today's rates.</p>
      <form onSubmit={send} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">{tour ? 'New start date' : car ? 'Pickup' : 'Check-in'}<DateInput required min={tomorrow()} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className={field} /></label>
          {!tour && <label className="text-sm font-semibold text-slate-700">{car ? 'Return' : 'Check-out'}<DateInput required min={checkIn} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className={field} /></label>}
          {!tour && !car && roomChoices.length > 1 && <label className="text-sm font-semibold text-slate-700">Room<Select value={roomTypeId} onChange={(event) => setRoomTypeId(event.target.value)} className={field}>{roomChoices.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</Select></label>}
          {!tour && <label className="text-sm font-semibold text-slate-700">{car ? 'Cars' : 'Rooms'}<input required type="number" min={1} max={20} value={rooms} onChange={(event) => setRooms(Number(event.target.value))} className={field} /></label>}
        </div>
        <label className="block text-sm font-semibold text-slate-700">Note for the partner <span className="font-normal text-slate-500">(optional)</span><textarea maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className={`${field} min-h-20 py-2`} /></label>
        {quote && <p role="status" className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">New total <strong>{money(quote.newTotal)}</strong> (now {money(quote.currentTotal)}).{quote.refund ? ` If accepted, ${money(quote.refund)} comes back to you.` : quote.balanceDue ? ` If accepted, you pay the remaining ${money(quote.balanceDue)} on arrival.` : ''}</p>}
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" disabled={busy} onClick={onClose} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Keep my booking</button>
          <button disabled={busy || !quote} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white hover:bg-[#005c32] disabled:opacity-50">{busy && <LoaderCircle className="size-4 animate-spin" />}Send request</button>
        </div>
      </form>
    </dialog>
  );
}
