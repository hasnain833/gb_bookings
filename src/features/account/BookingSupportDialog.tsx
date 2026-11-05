import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { api, type SupportCase } from '../../shared/api/api';
import type { Booking } from '../../types';

const stamp = (value: string) => new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

/** The guest's conversation with GBBookings about one booking. The partner does not see it. */
export default function BookingSupportDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [record, setRecord] = useState<SupportCase | null | undefined>(undefined);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  useEffect(() => {
    let active = true;
    api.getBookingSupport(booking.id).then((result) => active && setRecord(result)).catch((reason: Error) => { if (active) { setRecord(null); setError(reason.message); } });
    return () => { active = false; };
  }, [booking.id]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try { setRecord(await api.writeBookingSupport(booking.id, body.trim())); setBody(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Your message was not sent. Please try again.'); }
    finally { setBusy(false); }
  };

  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="booking-support-title" className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl p-0 backdrop:bg-slate-950/60">
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div><h2 id="booking-support-title" className="text-lg font-bold text-slate-900">Get help from GBBookings</h2><p className="mt-0.5 text-sm text-slate-500">{booking.reference} · {booking.listingTitle}</p></div>
        <button type="button" aria-label="Close" onClick={onClose} className="-m-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="size-5" /></button>
      </div>
      {record === undefined ? <div className="flex justify-center py-6"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading" /></div>
        : record ? <ol className="max-h-72 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-3" aria-label="Messages">
            {record.messages.map((message, index) => <li key={index} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${message.from === 'guest' ? 'ml-auto bg-[#006F3C] text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
              <p className={`mt-1 text-[11px] ${message.from === 'guest' ? 'text-emerald-100' : 'text-slate-500'}`}>{message.from === 'guest' ? 'You' : 'GBBookings'} · {stamp(message.at)}</p>
            </li>)}
          </ol>
        : <p className="text-sm text-slate-600">For a problem the partner can’t solve, such as a payment, a refund or a stay that wasn’t as promised. We reply here and by email. The partner doesn’t see this.</p>}
      {record?.status === 'resolved' && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">We marked this as solved. Write again if you still need help.</p>}
      {record?.status === 'open' && <p role="status" className="text-xs text-slate-500">We have your message and will reply here and by email.</p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <form onSubmit={send} className="space-y-3">
        <label className="block text-sm font-semibold text-slate-800">{record ? 'Add a message' : 'What happened?'}<textarea required minLength={5} maxLength={2000} value={body} onChange={(event) => setBody(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm font-normal outline-none focus:border-[#006F3C]" /></label>
        <button disabled={busy || record === undefined} className="min-h-11 w-full rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Sending…' : 'Send to GBBookings'}</button>
      </form>
    </div>
  </dialog>;
}
