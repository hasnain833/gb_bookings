import { useEffect, useState } from 'react';
import { ChevronDown, Download, LoaderCircle, Search } from 'lucide-react';
import { api, type AdminBooking, type AdminBookingFilters } from '../../shared/api/api';
import DateInput from '../../shared/components/DateInput';
import { useReasonDialog } from '../../shared/components/ReasonDialog';
import Select from '../../shared/components/Select';
import { toast } from '../../shared/components/Toaster';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import { formatDateForDisplay } from '../../shared/utils/date';

const button = 'inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const field = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C]';
const pkr = (amount: number) => `PKR ${amount.toLocaleString()}`;
const STATUS_TONE: Record<string, string> = { pending: 'bg-amber-50 text-amber-800', confirmed: 'bg-emerald-50 text-emerald-800', completed: 'bg-slate-100 text-slate-700', cancelled: 'bg-rose-50 text-rose-700', no_show: 'bg-rose-50 text-rose-700' };
const OUTCOME: Record<string, string> = { no_show_stands: 'No-show stands', guest_stayed: 'Guest stayed', refund_guest: 'Guest refunded' };
const label = (value: string) => value.replace(/_/g, ' ');

/** Every booking on the platform: search, filter, export, and the no-show disputes guests have raised. */
export default function BookingsPanel({ onChanged }: { onChanged: () => void }) {
  const { askReason, dialog } = useReasonDialog();
  const [view, setView] = useState<'all' | 'disputes'>('all');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Omit<AdminBookingFilters, 'q' | 'dispute'>>({ status: '', paymentStatus: '', type: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ rows: AdminBooking[]; pages: number; total: number; openDisputes: number } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const q = useDebouncedValue(search.trim());
  const query: AdminBookingFilters = { ...filters, q: q.length >= 2 ? q : '', dispute: view === 'disputes' ? 'open' : '' };

  useEffect(() => { setPage(1); }, [view, q, filters]);

  useEffect(() => {
    let active = true;
    api.admin.listBookings({ ...query, page }).then((response) => {
      if (active) { setResult({ rows: response.data, pages: response.pagination.pages, total: response.pagination.total, openDisputes: response.openDisputes }); setError(''); }
    }).catch((reason: Error) => active && setError(reason.message));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, q, filters, page, reload]);

  const decide = async (booking: AdminBooking, decision: 'no_show_stands' | 'guest_stayed' | 'refund_guest') => {
    const words = {
      no_show_stands: ['The no-show stands', 'The partner keeps any money already paid, less commission. The guest gets no refund.'],
      guest_stayed: ['The guest stayed', 'The booking becomes completed, and commission applies as for any finished stay.'],
      refund_guest: ['Refund the guest', `The booking is cancelled, no commission is charged, and any money paid is refunded in full${booking.paymentMethod === 'pay_at_hotel' ? ' by the partner' : ' from the Refunds queue'}.`],
    }[decision];
    const note = await askReason({ title: `${words[0]}: ${booking.reference}`, description: `${words[1]} Guest and partner are emailed your note.`, confirmLabel: words[0], destructive: decision !== 'guest_stayed', noteLabel: 'Your decision, for the guest and partner' });
    if (!note) return;
    setBusy(true);
    try { await api.admin.decideNoShowDispute(booking.id, decision, note); toast('Decision saved, and both sides were emailed.'); setReload((value) => value + 1); onChanged(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The decision could not be saved.'); }
    finally { setBusy(false); }
  };

  const set = (key: keyof typeof filters) => (event: { target: { value: string } }) => setFilters((current) => ({ ...current, [key]: event.target.value }));

  return <div className="space-y-4">
    {dialog}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div role="tablist" aria-label="Which bookings" className="flex rounded-xl border border-slate-200 bg-white p-1">
        {([['all', 'All bookings'], ['disputes', 'No-show disputes']] as const).map(([id, text]) => <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)}
          className={`flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${view === id ? 'bg-[#006F3C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{text}{id === 'disputes' && Boolean(result?.openDisputes) && <span className={`rounded-full px-1.5 text-xs ${view === id ? 'bg-white text-[#006F3C]' : 'bg-rose-600 text-white'}`}>{result!.openDisputes}</span>}</button>)}
      </div>
      <button type="button" className={button} disabled={!result?.total} onClick={() => void api.admin.exportBookings(query).catch((reason: Error) => setError(reason.message))}><Download className="size-4" aria-hidden="true" />Export CSV</button>
    </div>

    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
      <label className="relative lg:col-span-2"><span className="sr-only">Search bookings</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference, guest, listing or partner" className={`${field} pl-10`} /></label>
      <Select aria-label="Status" value={filters.status} onChange={set('status')} className={field}>
        <option value="">Any status</option>{['pending', 'confirmed', 'completed', 'cancelled', 'no_show'].map((value) => <option key={value} value={value}>{label(value)}</option>)}
      </Select>
      <Select aria-label="Payment" value={filters.paymentStatus} onChange={set('paymentStatus')} className={field}>
        <option value="">Any payment</option><option value="pending">Not paid</option><option value="paid">Paid</option>
      </Select>
      <Select aria-label="Product" value={filters.type} onChange={set('type')} className={field}>
        <option value="">All products</option>{['hotel', 'homestay', 'car', 'tour'].map((value) => <option key={value} value={value}>{value}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1 lg:col-start-6 lg:row-start-1 lg:hidden" />
      <DateInput aria-label="Starts from" placeholder="Starts from" value={filters.from} onChange={set('from')} className={field} />
      <DateInput aria-label="Starts until" placeholder="Starts until" min={filters.from || undefined} value={filters.to} onChange={set('to')} className={field} />
    </div>

    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {!result && !error && <div className="flex justify-center py-10"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading bookings" /></div>}
    {result && <p className="text-sm text-slate-600" role="status">{result.total} booking{result.total === 1 ? '' : 's'}</p>}
    {result?.rows.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{view === 'disputes' ? 'No disputes are waiting.' : 'No bookings match these filters.'}</p>}

    <ul className="space-y-2">
      {result?.rows.map((booking) => {
        const open = openId === booking.id;
        const dispute = booking.noShow?.dispute;
        return <li key={booking.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : booking.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 p-4 text-start hover:bg-slate-50">
            <span className="font-mono text-xs text-slate-500">{booking.reference}</span>
            <span className="min-w-40 flex-1"><span className="block text-sm font-semibold text-slate-900">{booking.listingTitle}</span><span className="block text-xs text-slate-500">{booking.vendorName ?? 'No partner'} · {booking.customerName}</span></span>
            <span className="text-sm text-slate-600">{formatDateForDisplay(booking.startDate)} – {formatDateForDisplay(booking.endDate)}</span>
            <span className="text-sm font-semibold text-slate-900">{pkr(booking.totalPrice)}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_TONE[booking.status] ?? 'bg-slate-100'}`}>{label(booking.status)}</span>
            {dispute?.status === 'open' && <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-semibold text-white">Disputed</span>}
            <ChevronDown className={`size-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {open && <div className="space-y-4 border-t border-slate-100 p-4 text-sm">
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {[['Guest email', booking.customerEmail], ['Guest phone', booking.customerPhone], ['Payment', `${booking.paymentMethod === 'online' ? 'Pay now' : 'Pay on arrival'} · ${booking.paymentStatus === 'paid' ? 'paid' : 'not paid'}`],
                ['GBBookings fee', booking.platformFee ? pkr(booking.platformFee) : '—'], ['Booked', formatDateForDisplay(booking.createdAt)], ['Checked in', booking.checkedInAt ? formatDateForDisplay(booking.checkedInAt) : '—']]
                .map(([term, value]) => <div key={term}><dt className="text-slate-500">{term}</dt><dd className="font-medium text-slate-900 break-words">{value || '—'}</dd></div>)}
            </dl>
            {booking.refunds?.map((refund, index) => <p key={index} className="text-slate-700">Refund: {pkr(refund.amount)} · {refund.channel === 'partner' ? 'the partner returns it' : 'through Safepay'} · {refund.status}</p>)}
            {dispute && <div className="space-y-2 rounded-lg bg-amber-50 p-3 text-amber-950">
              <p className="font-semibold">The guest disputes this no-show, {formatDateForDisplay(dispute.at)}</p>
              <p>“{dispute.note}”</p>
              {dispute.status === 'open' ? <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" disabled={busy} className={button} onClick={() => void decide(booking, 'guest_stayed')}>Guest stayed</button>
                <button type="button" disabled={busy} className={button} onClick={() => void decide(booking, 'refund_guest')}>Refund the guest</button>
                <button type="button" disabled={busy} className={button} onClick={() => void decide(booking, 'no_show_stands')}>No-show stands</button>
              </div> : <p><strong className="font-semibold">{OUTCOME[dispute.status]}:</strong> {dispute.decisionNote}</p>}
            </div>}
            {booking.history?.length ? <div><h3 className="mb-1 font-semibold text-slate-900">History</h3><ol className="space-y-1 text-slate-600">{booking.history.map((event, index) => <li key={index}><span className="capitalize">{label(event.status)}</span>{event.at ? ` · ${formatDateForDisplay(event.at)}` : ''}{event.reason ? ` · ${event.reason}` : ''}</li>)}</ol></div> : null}
          </div>}
        </li>;
      })}
    </ul>

    {result && result.pages > 1 && <nav aria-label="Booking pages" className="flex items-center justify-end gap-3 text-sm">
      <button type="button" className={button} disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
      <span>Page {page} of {result.pages}</span>
      <button type="button" className={button} disabled={page >= result.pages} onClick={() => setPage((value) => value + 1)}>Next</button>
    </nav>}
  </div>;
}
