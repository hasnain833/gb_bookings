import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { api, type AdminSupportCase, type ChatReport, type ChatReportThread } from '../../shared/api/api';
import { useReasonDialog } from '../../shared/components/ReasonDialog';
import { toast } from '../../shared/components/Toaster';
import { formatDateForDisplay } from '../../shared/utils/date';

const button = 'inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const primary = 'inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white hover:bg-[#005c32] disabled:opacity-50';
const stamp = (value: string) => new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const failure = (reason: unknown, fallback: string) => toast(reason instanceof Error ? reason.message : fallback, 'error');

function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (next: T) => void; items: Array<[T, string]> }) {
  return <div role="tablist" className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">{items.map(([id, text]) => (
    <button key={id} type="button" role="tab" aria-selected={value === id} onClick={() => onChange(id)} className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${value === id ? 'bg-[#006F3C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{text}</button>
  ))}</div>;
}

function CaseCard({ item, onChanged }: { item: AdminSupportCase; onChanged: () => void }) {
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const booking = item.booking;
  const run = async (work: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try { await work(); toast(done); onChanged(); }
    catch (reason) { failure(reason, 'That could not be saved.'); setBusy(false); }
  };
  return <article className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
    {booking ? <div>
      <h3 className="font-bold text-slate-900">{booking.reference} · {booking.listingTitle}</h3>
      <p className="text-sm text-slate-500">{formatDateForDisplay(booking.startDate)} – {formatDateForDisplay(booking.endDate)} · {booking.status.replace('_', ' ')} · {booking.paymentStatus} · PKR {booking.totalPrice.toLocaleString()}{booking.vendorName ? ` · ${booking.vendorName}` : ''}</p>
      <p className="text-sm text-slate-500">{booking.customerName} · {booking.customerEmail} · {booking.customerPhone}</p>
    </div> : <h3 className="font-bold text-slate-900">Booking not found</h3>}
    <ol className="max-h-72 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
      {item.messages.map((message, index) => <li key={index} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${message.from === 'admin' ? 'ml-auto bg-[#006F3C] text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p className={`mt-1 text-[11px] ${message.from === 'admin' ? 'text-emerald-100' : 'text-slate-500'}`}>{message.from === 'admin' ? 'GBBookings' : 'Guest'} · {stamp(message.at)}</p>
      </li>)}
    </ol>
    <label className="block text-sm font-semibold text-slate-700">Reply to the guest<textarea maxLength={2000} value={reply} onChange={(event) => setReply(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 p-3 text-sm font-normal outline-none focus:border-[#006F3C]" /></label>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy || reply.trim().length < 2} onClick={() => void run(() => api.admin.replySupportCase(item.id, reply.trim(), false), 'Reply sent.')} className={primary}>Send reply</button>
      <button type="button" disabled={busy || reply.trim().length < 2} onClick={() => void run(() => api.admin.replySupportCase(item.id, reply.trim(), true), 'Reply sent and case solved.')} className={button}>Reply and mark solved</button>
      <button type="button" disabled={busy} onClick={() => void run(() => api.admin.setSupportCaseStatus(item.id, item.status === 'open' ? 'resolved' : 'open'), item.status === 'open' ? 'Case marked solved.' : 'Case reopened.')} className={button}>{item.status === 'open' ? 'Mark solved' : 'Reopen'}</button>
    </div>
  </article>;
}

function ReportCard({ item, onChanged }: { item: ChatReport; onChanged: () => void }) {
  const { askReason, dialog } = useReasonDialog();
  const [thread, setThread] = useState<ChatReportThread | null>(null);
  const [busy, setBusy] = useState(false);
  const open = async () => {
    setBusy(true);
    try { setThread(await api.admin.getChatReport(item.id)); }
    catch (reason) { failure(reason, 'The chat could not be opened.'); }
    finally { setBusy(false); }
  };
  const review = async () => {
    const note = await askReason({ title: 'Close this report', description: 'The person who reported the chat is emailed your note.', confirmLabel: 'Close report', noteLabel: 'Your note' });
    if (!note) return;
    try { await api.admin.reviewChatReport(item.id, note); toast('Report closed.'); onChanged(); }
    catch (reason) { failure(reason, 'The report could not be closed.'); }
  };
  return <article className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
    {dialog}
    <div>
      <h3 className="font-bold text-slate-900">{item.guestName ?? 'Guest'} and {item.partnerName ?? 'partner'}</h3>
      <p className="text-sm text-slate-500">{item.listingTitle} · reported by the {item.report.by} · {stamp(item.report.at)}</p>
    </div>
    <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">“{item.report.reason}”</p>
    {item.report.note && <p className="text-sm text-slate-600">Your note: {item.report.note}</p>}
    {thread && <ol className="max-h-80 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
      {thread.messages.map((message, index) => <li key={index} className={`max-w-[85%] rounded-xl border px-3 py-2 text-sm ${message.sender === 'partner' ? 'ml-auto border-sky-200 bg-sky-50' : 'border-slate-200 bg-white'}`}>
        <p className="whitespace-pre-wrap break-words text-slate-800">{message.body}</p>
        <p className="mt-1 text-[11px] text-slate-500">{message.sender === 'partner' ? 'Partner' : 'Guest'} · {stamp(message.at)}{message.contactsHidden ? ' · contact details hidden' : ''}</p>
      </li>)}
    </ol>}
    <div className="flex flex-wrap gap-2">
      {!thread && <button type="button" disabled={busy} onClick={() => void open()} className={button}>{busy && <LoaderCircle className="size-4 animate-spin" />}Read the chat</button>}
      {item.report.status === 'open' && <button type="button" onClick={() => void review()} className={primary}>Close report</button>}
    </div>
  </article>;
}

/** Help requests on bookings, and chats people have reported. Other chats stay private: nothing here can open them. */
export default function SupportPanel({ onChanged }: { onChanged: () => void }) {
  const [view, setView] = useState<'open' | 'resolved' | 'reports' | 'reviewed'>('open');
  const [cases, setCases] = useState<AdminSupportCase[] | null>(null);
  const [reports, setReports] = useState<ChatReport[] | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const changed = () => { setReload((value) => value + 1); onChanged(); };

  useEffect(() => {
    let active = true;
    setCases(null); setReports(null); setError('');
    const fail = (reason: Error) => active && setError(reason.message);
    if (view === 'open' || view === 'resolved') api.admin.listSupportCases(view).then((result) => active && setCases(result.data)).catch(fail);
    else api.admin.listChatReports(view === 'reports' ? 'open' : 'reviewed').then((result) => active && setReports(result)).catch(fail);
    return () => { active = false; };
  }, [view, reload]);

  const rows = cases ?? reports;
  return <div className="space-y-4">
    <Tabs<typeof view> value={view} onChange={setView} items={[['open', 'Open cases'], ['resolved', 'Solved cases'], ['reports', 'Reported chats'], ['reviewed', 'Closed reports']]} />
    {error ? <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
      : !rows ? <div className="flex justify-center py-12"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading" /></div>
      : rows.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Nothing here.</p>
      : cases ? cases.map((item) => <CaseCard key={item.id} item={item} onChanged={changed} />)
      : reports!.map((item) => <ReportCard key={item.id} item={item} onChanged={changed} />)}
  </div>;
}
