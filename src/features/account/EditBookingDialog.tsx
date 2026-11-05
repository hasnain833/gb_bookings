import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { api } from '../../shared/api/api';
import { TimeInput } from '../../shared/components/Select';
import type { Booking } from '../../types';

const field = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-[#006F3C]';

/** The guest's own details on an upcoming booking. Dates and rooms go through a change request instead. */
export default function EditBookingDialog({ booking, onClose, onSaved }: { booking: Booking; onClose: () => void; onSaved: (booking: Booking) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stay = !booking.rental && !booking.tour;
  const [name, setName] = useState(booking.customerName ?? '');
  const [phone, setPhone] = useState(booking.customerPhone ?? '');
  const [arrivalTime, setArrivalTime] = useState(booking.arrivalTime ?? '');
  const [requests, setRequests] = useState(booking.specialRequests ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      onSaved(await api.updateBookingDetails(booking.id, { name: name.trim(), phone: phone.trim(), specialRequests: requests.trim(), ...(stay ? { arrivalTime: arrivalTime || null } : {}) }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your details could not be saved.');
      setBusy(false);
    }
  };

  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="edit-booking-title" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-0 backdrop:bg-slate-950/60">
    <form onSubmit={save} className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 id="edit-booking-title" className="text-lg font-bold text-slate-900">Edit your details</h2>
        <button type="button" aria-label="Close" onClick={onClose} className="-m-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="size-5" /></button>
      </div>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <label className="block text-sm font-semibold text-slate-800">Full name<input required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={field} /></label>
      <label className="block text-sm font-semibold text-slate-800">Phone number<input required type="tel" pattern="[+]?[0-9][0-9 ()\-]{6,19}" title="Enter a phone number, like 0300 1234567." maxLength={30} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={field} /></label>
      {stay && <label className="block text-sm font-semibold text-slate-800">Arrival time <span className="font-normal text-slate-500">(optional)</span><TimeInput value={arrivalTime} onChange={(event) => setArrivalTime(event.target.value)} className={field} /></label>}
      <label className="block text-sm font-semibold text-slate-800">Special requests <span className="font-normal text-slate-500">(optional)</span><textarea maxLength={1000} value={requests} onChange={(event) => setRequests(event.target.value)} className={`${field} min-h-24 py-3`} /></label>
      <p className="text-xs text-slate-500">The partner sees these at once. To change your dates or room, use Request a change.</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">Cancel</button>
        <button disabled={busy} className="min-h-11 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  </dialog>;
}
