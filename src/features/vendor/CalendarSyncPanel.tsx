import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, CalendarSync, Copy, LoaderCircle, RefreshCw, Trash2 } from 'lucide-react';
import { api, type CalendarSync as Sync, type VendorRoom } from '../../shared/api/api';
import { toast } from '../../shared/components/Toaster';
import { formatDateForDisplay } from '../../shared/utils/date';

const button = 'inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const field = 'mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-[#006F3C]';
const when = (value?: string) => value ? new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'not yet';

/** Two-way calendar sync for one room category, so bookings elsewhere and bookings here cannot double up. */
export default function CalendarSyncPanel({ listingId, room, onChanged }: { listingId: string; room: VendorRoom; onChanged: () => void }) {
  const [sync, setSync] = useState<Sync | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getCalendarSync(listingId, room.id).then((result) => active && setSync(result)).catch((reason: Error) => active && setError(reason.message));
    return () => { active = false; };
  }, [listingId, room.id]);

  const act = async (action: () => Promise<Sync>, done?: string) => {
    setBusy(true); setError('');
    try { setSync(await action()); onChanged(); if (done) toast(done); return true; }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'That did not work. Please try again.'); return false; }
    finally { setBusy(false); }
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (await act(() => api.addCalendarFeed(listingId, room.id, { name: name.trim(), url: url.trim() }), 'Calendar connected. Those nights are now closed here.')) { setName(''); setUrl(''); }
  };

  const link = sync ? `${window.location.origin}${sync.exportPath}` : '';

  return <section aria-labelledby={`calendar-sync-${room.id}`} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
    <div>
      <h4 id={`calendar-sync-${room.id}`} className="flex items-center gap-2 font-semibold text-slate-900"><CalendarSync className="size-4 text-[#006F3C]" aria-hidden="true" />Calendar sync · {room.name}</h4>
      <p className="mt-1 text-sm text-slate-600">Keeps this calendar in step with Airbnb, Google Calendar or any calendar with an iCal link, so the same night isn't sold twice. It updates about every 30 minutes.</p>
    </div>

    {error && <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {!sync && !error && <LoaderCircle className="size-5 animate-spin text-[#006F3C]" aria-label="Loading calendar sync" />}

    {sync && <>
      {sync.conflicts.length > 0 && <p role="alert" className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-950">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span><strong className="font-semibold">Possible double booking</strong> on {sync.conflicts.slice(0, 6).map(formatDateForDisplay).join(', ')}{sync.conflicts.length > 6 ? ` and ${sync.conflicts.length - 6} more` : ''}. Another calendar has these nights taken, and so does a guest here. Please check both.</span>
      </p>}

      <div className="space-y-2">
        <h5 className="text-sm font-semibold text-slate-900">Send your GBBookings dates to other calendars</h5>
        <p className="text-sm text-slate-600">Paste this link into the other site's "import calendar" setting. It only shows which nights are taken, never guest details. Keep it private.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input readOnly aria-label="Your calendar link" value={link} onFocus={(event) => event.target.select()} className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 font-mono text-xs" />
          <button type="button" className={button} onClick={() => void navigator.clipboard.writeText(link).then(() => toast('Link copied.')).catch(() => setError('Copy failed. Select the link and copy it yourself.'))}><Copy className="size-4" aria-hidden="true" />Copy</button>
          <button type="button" className={button} disabled={busy} onClick={() => void act(() => api.resetCalendarLink(listingId, room.id), 'New link made. Update it on the other sites.')}>Make a new link</button>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h5 className="text-sm font-semibold text-slate-900">Bring in dates from other calendars</h5>
          {sync.feeds.length > 0 && <button type="button" className={button} disabled={busy} onClick={() => void act(() => api.syncCalendarsNow(listingId, room.id), 'Calendars updated.')}><RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />Update now</button>}
        </div>
        {sync.feeds.length > 0 && <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {sync.feeds.map((feed) => <li key={feed.id} className="flex items-center gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{feed.name}</p>
              <p className="truncate text-xs text-slate-500" title={feed.url}>{feed.url}</p>
              <p className="text-xs text-slate-600">{feed.nights} night{feed.nights === 1 ? '' : 's'} closed · updated {when(feed.lastSyncAt)}</p>
              {feed.lastError && <p className="text-xs font-medium text-rose-700">{feed.lastError} Its last known dates stay closed.</p>}
            </div>
            <button type="button" disabled={busy} aria-label={`Remove ${feed.name}`} className="flex size-10 shrink-0 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50" onClick={() => void act(() => api.removeCalendarFeed(listingId, room.id, feed.id), 'Calendar removed, and its nights reopened.')}><Trash2 className="size-4" /></button>
          </li>)}
        </ul>}
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-end">
          <label className="text-xs font-semibold text-slate-600">Name<input required minLength={2} maxLength={60} placeholder="Airbnb" value={name} onChange={(event) => setName(event.target.value)} className={field} /></label>
          <label className="text-xs font-semibold text-slate-600">iCal link (.ics)<input required type="url" maxLength={2000} placeholder="https://www.airbnb.com/calendar/ical/..." title="Enter the full calendar link, starting with https://" value={url} onChange={(event) => setUrl(event.target.value)} className={field} /></label>
          <button disabled={busy} className="min-h-11 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Reading…' : 'Connect'}</button>
        </form>
      </div>
    </>}
  </section>;
}
