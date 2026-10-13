import { useEffect, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { api, type RoomCalendar as Calendar, type VendorRoom } from '../../shared/api/api';
import { formatDateForDisplay } from '../../shared/utils/date';

const todayPk = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
const iso = (date: Date) => date.toISOString().slice(0, 10);
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Month view of one room category's nightly inventory, with closing/reopening rooms for a date range. */
export default function RoomCalendar({ listingId, room }: { listingId: string; room: VendorRoom }) {
  const today = todayPk();
  const [month, setMonth] = useState(today.slice(0, 7)); // YYYY-MM
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [range, setRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [closed, setClosed] = useState(room.totalRooms);

  const first = new Date(`${month}-01T00:00:00Z`);
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  const from = iso(first);
  const to = iso(last);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.getRoomCalendar(listingId, room.id, from, to)
      .then((result) => active && setCalendar(result))
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [listingId, room.id, from, to]);

  const shiftMonth = (delta: number) => setMonth(iso(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + delta, 1))).slice(0, 7));

  // Click a start night, then an end night; a third click starts a new range.
  const pick = (date: string) => setRange((current) => !current.from || current.to
    ? { from: date, to: '' }
    : date < current.from ? { from: date, to: current.from } : { from: current.from, to: date });

  const apply = async (event: FormEvent) => {
    event.preventDefault();
    const end = range.to || range.from;
    if (!range.from) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await api.setRoomClosures(listingId, room.id, { from: range.from, to: end, closed });
      setCalendar(await api.getRoomCalendar(listingId, room.id, from, to));
      setNotice(closed === 0
        ? `All ${room.totalRooms} room(s) reopened for ${formatDateForDisplay(range.from)} – ${formatDateForDisplay(end)}.`
        : `${closed} room(s) closed for ${formatDateForDisplay(range.from)} – ${formatDateForDisplay(end)}.`);
      setRange({ from: '', to: '' });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update availability.'); }
    finally { setBusy(false); }
  };

  const leadingBlanks = (first.getUTCDay() + 6) % 7; // Monday-first grid
  const selectedEnd = range.to || range.from;
  const inRange = (date: string) => Boolean(range.from) && date >= range.from && date <= selectedEnd;

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-semibold text-slate-900">Availability · {room.name}</h4>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => shiftMonth(-1)} disabled={month <= today.slice(0, 7)} aria-label="Previous month" className="flex size-10 items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="size-4" /></button>
          <span className="min-w-32 text-center text-sm font-semibold">{first.toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="flex size-10 items-center justify-center rounded-lg hover:bg-slate-100"><ChevronRight className="size-4" /></button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <div className="relative">
        {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading availability" /></div>}
        <div className="grid grid-cols-7 gap-1 text-center text-xs" role="grid" aria-label="Nightly availability">
          {WEEKDAYS.map((day) => <div key={day} className="py-1 font-semibold text-slate-500" role="columnheader">{day}</div>)}
          {Array.from({ length: leadingBlanks }, (_, index) => <div key={`blank-${index}`} />)}
          {calendar?.days.map((day) => {
            const past = day.date < today;
            const selected = inRange(day.date);
            const tone = day.available === 0 ? 'bg-rose-50 text-rose-800' : day.closed > 0 ? 'bg-sky-50 text-sky-900' : 'bg-emerald-50/60 text-slate-800';
            return (
              <button key={day.date} type="button" disabled={past} onClick={() => pick(day.date)} aria-pressed={selected}
                aria-label={`${formatDateForDisplay(day.date)}: ${day.available} of ${calendar.totalRooms} available, ${day.booked} booked, ${day.closed} closed`}
                className={`flex min-h-14 flex-col items-center justify-center rounded-md p-1 transition disabled:cursor-not-allowed disabled:opacity-35 ${tone} ${selected ? 'ring-2 ring-[#006F3C] ring-offset-1' : 'hover:ring-1 hover:ring-slate-300'}`}>
                <span className="font-semibold">{Number(day.date.slice(8))}</span>
                <span className="text-[11px]">{day.available}/{calendar.totalRooms}</span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span><span className="mr-1 inline-block size-2.5 rounded-sm bg-emerald-100" />Open</span>
        <span><span className="mr-1 inline-block size-2.5 rounded-sm bg-sky-100" />Some rooms closed</span>
        <span><span className="mr-1 inline-block size-2.5 rounded-sm bg-rose-100" />Nothing left to sell</span>
        <span>Numbers show rooms free / total.</span>
      </p>

      <form onSubmit={apply} className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <label className="text-xs font-semibold text-slate-600">From<input type="date" required min={today} value={range.from} onChange={(event) => setRange({ from: event.target.value, to: range.to && range.to < event.target.value ? '' : range.to })} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
        <label className="text-xs font-semibold text-slate-600">To<input type="date" min={range.from || today} value={range.to} onChange={(event) => setRange({ ...range, to: event.target.value })} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
        <label className="text-xs font-semibold text-slate-600">Rooms closed per night<input type="number" min={0} max={room.totalRooms} required value={closed} onChange={(event) => setClosed(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm sm:w-28" /></label>
        <button disabled={busy || !range.from} className="min-h-11 rounded-md bg-[#006F3C] px-4 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : closed === 0 ? 'Reopen rooms' : 'Close rooms'}</button>
      </form>
      <p className="text-xs text-slate-500">Pick nights on the calendar or enter dates. Set 0 to reopen. Rooms guests have already booked can’t be closed. Use pausing the room category to stop all sales instead.</p>
    </div>
  );
}
