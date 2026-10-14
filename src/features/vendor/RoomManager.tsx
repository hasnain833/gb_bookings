import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { CalendarDays, Image as ImageIcon, LoaderCircle, Minus, Plus } from 'lucide-react';
import { api, type RoomCalendar as Calendar, type VendorListing, type VendorRoom, type VendorRoomInput } from '../../shared/api/api';
import { useReasonDialog } from '../../shared/components/ReasonDialog';
import ChipInput from './ChipInput';
import PhotoManager, { toPhotoInput, type EditablePhoto } from './PhotoManager';
import RoomCalendar from './RoomCalendar';

const inputClass = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C]';
export const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-bold text-white hover:bg-[#005c32] disabled:opacity-50';
export const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
export const ROOM_AMENITIES = ['Heating', 'WiFi', 'Mountain view', 'Attached bath', 'Hot water', 'Balcony', 'TV', 'Kettle'];

export const emptyRoom: Omit<VendorRoomInput, 'photos'> = { name: '', description: '', bedType: 'Double', maxAdults: 2, maxChildren: 1, totalRooms: 1, basePrice: 0, amenities: [] };

/** Add/edit form. On a live hotel, price and room count apply at once; the rest is reviewed before guests see it. */
export function RoomForm({ initial, live, busy, submitLabel, onSubmit, onCancel }: {
  initial: Omit<VendorRoomInput, 'photos'> & { photos?: EditablePhoto[] }; live: boolean; busy: boolean; submitLabel: string;
  onSubmit: (input: VendorRoomInput, photos: EditablePhoto[]) => void; onCancel?: () => void;
}) {
  const [room, setRoom] = useState(initial);
  const [photos, setPhotos] = useState<EditablePhoto[]>(initial.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const number = (key: 'maxAdults' | 'maxChildren' | 'totalRooms' | 'basePrice') => ({
    type: 'number', value: room[key], className: `${inputClass} mt-1`, required: true,
    onChange: (event: ChangeEvent<HTMLInputElement>) => setRoom({ ...room, [key]: Number(event.target.value) }),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      basePrice: room.basePrice, totalRooms: room.totalRooms, name: room.name.trim(), bedType: room.bedType.trim(),
      maxAdults: room.maxAdults, maxChildren: room.maxChildren, description: room.description?.trim() || undefined,
      amenities: room.amenities, photos: toPhotoInput(photos),
    }, photos);
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-xl border-2 border-[#006F3C] bg-white p-5 sm:grid-cols-3">
      {live && <p className="text-sm text-slate-600 sm:col-span-3">Price and room count change immediately. Name, capacity, description, amenities and photos are reviewed by GBBookings first; guests see the current version until then.</p>}
      <label className="text-sm font-semibold text-slate-700">Name<input className={`${inputClass} mt-1`} required minLength={2} placeholder="Deluxe Double" value={room.name} onChange={(e) => setRoom({ ...room, name: e.target.value })} /></label>
      <label className="text-sm font-semibold text-slate-700">Bed type<input className={`${inputClass} mt-1`} required minLength={2} list="bed-types" value={room.bedType} onChange={(e) => setRoom({ ...room, bedType: e.target.value })} /></label>
      <datalist id="bed-types"><option value="Double" /><option value="Twin" /><option value="King" /><option value="King + sofa bed" /><option value="Single" /></datalist>
      <label className="text-sm font-semibold text-slate-700">Rooms of this type<input {...number('totalRooms')} min={1} /></label>
      <label className="text-sm font-semibold text-slate-700">Price per night (PKR)<input {...number('basePrice')} min={0} step={1} /></label>
      <label className="text-sm font-semibold text-slate-700">Max adults<input {...number('maxAdults')} min={1} max={20} /></label>
      <label className="text-sm font-semibold text-slate-700">Max children<input {...number('maxChildren')} min={0} max={20} /></label>
      <div className="sm:col-span-3"><ChipInput label="Room amenities" value={room.amenities} onChange={(amenities) => setRoom({ ...room, amenities })} suggestions={ROOM_AMENITIES} /></div>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-3">Description (optional)<textarea className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 p-3 text-sm" maxLength={2000} value={room.description ?? ''} onChange={(e) => setRoom({ ...room, description: e.target.value })} /></label>
      <div className="sm:col-span-3"><PhotoManager photos={photos} onChange={setPhotos} max={10} label="Room photos (optional)" onUploadingChange={setUploading} /></div>
      <div className="flex flex-wrap gap-2 sm:col-span-3">
        <button disabled={busy || uploading} className={primaryButton}>{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} className={secondaryButton}>Cancel</button>}
      </div>
    </form>
  );
}

const todayPk = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/** Rooms free per night for the next two weeks; closed or sold-out nights stand out. */
function NightStrip({ listingId, room, refresh }: { listingId: string; room: VendorRoom; refresh: number }) {
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  useEffect(() => {
    let active = true;
    const from = todayPk();
    api.getRoomCalendar(listingId, room.id, from, addDays(from, 13)).then((result) => active && setCalendar(result)).catch(() => undefined);
    return () => { active = false; };
  }, [listingId, room.id, refresh]);
  if (!calendar) return <div className="h-12 animate-pulse rounded-lg bg-slate-100" aria-hidden="true" />;
  const tight = Math.max(1, Math.floor(calendar.totalRooms / 4));
  return (
    <ol className="grid grid-cols-7 gap-1 sm:grid-cols-14" aria-label={`${room.name}: rooms free for the next 14 nights`}>
      {calendar.days.map((day) => {
        const tone = day.available === 0 ? 'bg-slate-700 text-white' : day.available <= tight ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50 text-emerald-800';
        const weekday = new Date(`${day.date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }).slice(0, 2);
        return <li key={day.date} className="flex flex-col items-center gap-1 text-[11px] text-slate-500" title={`${day.date}: ${day.available} free, ${day.booked} booked, ${day.closed} closed`}>
          {weekday}<span className={`flex h-8 w-full items-center justify-center rounded-md text-xs font-extrabold ${tone}`}>{day.closed >= calendar.totalRooms ? '✕' : day.available}</span>
        </li>;
      })}
    </ol>
  );
}

function RoomCard({ listing, room, live, editable, busy, onRun, onReplace, onRemove, onEdited }: {
  listing: VendorListing; room: VendorRoom; live: boolean; editable: boolean; busy: boolean;
  onRun: (work: () => Promise<void>) => void; onReplace: (room: VendorRoom) => void; onRemove: () => void; onEdited: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [price, setPrice] = useState(room.basePrice);
  const [count, setCount] = useState(room.totalRooms);
  const [refresh, setRefresh] = useState(0);
  const isNew = Boolean(room.pendingRevision?.isNew);
  const shown = { ...room, ...room.pendingRevision?.changes };
  const cover = shown.photos?.[0];
  const dirty = price !== room.basePrice || count !== room.totalRooms;
  const canEdit = editable || live;

  const saveStock = () => onRun(async () => {
    onReplace(await api.updateHotelRoom(listing.id, room.id, { basePrice: price, totalRooms: count }));
    setRefresh((value) => value + 1);
  });
  const toggle = () => onRun(async () => onReplace(await api.updateHotelRoom(listing.id, room.id, { status: room.status === 'paused' ? 'active' : 'paused' })));

  if (editing) {
    return <RoomForm initial={{ ...shown, photos: shown.photos }} live={live} busy={busy} submitLabel="Save room" onCancel={() => setEditing(false)}
      onSubmit={(input) => onRun(async () => {
        const updated = await api.updateHotelRoom(listing.id, room.id, input);
        onReplace(updated); setPrice(updated.basePrice); setCount(updated.totalRooms); setEditing(false); onEdited();
      })} />;
  }

  return (
    <article className={`space-y-4 rounded-2xl border bg-white p-5 ${isNew ? 'border-dashed border-amber-300 bg-amber-50/30' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-start gap-5">
        <div className="w-36 shrink-0">
          {cover ? <img src={cover.url} alt={cover.caption || shown.name} className="h-24 w-36 rounded-lg object-cover" />
            : <div className="flex h-24 w-36 flex-col items-center justify-center gap-1 rounded-lg bg-slate-100 text-xs text-slate-500"><ImageIcon className="size-5" />No photo</div>}
          <p className="mt-1.5 text-xs text-slate-500">{shown.photos?.length ?? 0} photo{shown.photos?.length === 1 ? '' : 's'}</p>
        </div>
        <div className="min-w-[200px] flex-1">
          <h3 className="flex flex-wrap items-center gap-2 text-lg font-extrabold text-slate-900">{shown.name}
            {room.pendingRevision && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">{isNew ? 'New · awaiting review' : 'Changes in review'}</span>}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{shown.bedType} · up to {shown.maxAdults} adult{shown.maxAdults === 1 ? '' : 's'}{shown.maxChildren ? `, ${shown.maxChildren} child${shown.maxChildren === 1 ? '' : 'ren'}` : ''}</p>
          {shown.amenities.length > 0 && <p className="mt-2.5 flex flex-wrap gap-1.5">{shown.amenities.map((amenity) => <span key={amenity} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{amenity}</span>)}</p>}
          {isNew && <p className="mt-2 text-sm text-amber-900">Hidden from guests until approved.</p>}
          {canEdit && <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={secondaryButton} disabled={busy} onClick={() => setEditing(true)}>Edit details &amp; photos</button>
            {(editable || isNew) && <button type="button" className={`${secondaryButton} text-rose-700`} disabled={busy} onClick={onRemove}>{editable ? 'Remove' : 'Withdraw'}</button>}
          </div>}
        </div>
        {canEdit && <div className="flex flex-wrap items-end gap-4">
          <label className="text-xs font-bold text-slate-700">Price per night
            <span className="mt-1.5 flex min-h-11 w-40 items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:border-[#006F3C]">
              <span className="mr-1.5 font-semibold text-slate-500">PKR</span>
              <input type="number" min={0} value={price} onChange={(event) => setPrice(Number(event.target.value))} className="w-full bg-transparent text-[15px] font-bold outline-none" />
            </span>
          </label>
          <div className="text-xs font-bold text-slate-700">Rooms of this type
            <span className="mt-1.5 flex items-center gap-1.5">
              <button type="button" aria-label={`One ${shown.name} room fewer`} disabled={count <= 1} onClick={() => setCount(count - 1)} className="flex size-11 items-center justify-center rounded-lg border border-slate-300 bg-white disabled:opacity-40"><Minus className="size-4" /></button>
              <span className="min-w-8 text-center text-base font-extrabold" aria-live="polite">{count}</span>
              <button type="button" aria-label={`One ${shown.name} room more`} onClick={() => setCount(count + 1)} className="flex size-11 items-center justify-center rounded-lg border border-slate-300 bg-white"><Plus className="size-4" /></button>
            </span>
          </div>
          {dirty && <button type="button" className={primaryButton} disabled={busy || price < 0} onClick={saveStock}>Save</button>}
          {!isNew && <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-bold">
            <input type="checkbox" className="peer sr-only" checked={room.status !== 'paused'} disabled={busy} onChange={toggle} />
            <span className="relative h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-[#1F8A55] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#006F3C] after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" aria-hidden="true" />
            {room.status === 'paused' ? 'Not bookable' : 'Bookable'}
          </label>}
        </div>}
      </div>
      {!isNew && <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold">Rooms free · next 14 nights</p>
          <p className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-emerald-50 ring-1 ring-emerald-200" />Free</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-amber-100" />Almost full</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-slate-700" />Full or closed</span>
            {canEdit && <button type="button" aria-expanded={calendarOpen} onClick={() => setCalendarOpen(!calendarOpen)} className="inline-flex min-h-11 items-center gap-1.5 font-bold text-[#006F3C]"><CalendarDays className="size-4" />{calendarOpen ? 'Close calendar' : 'Open calendar'}</button>}
          </p>
        </div>
        <NightStrip listingId={listing.id} room={room} refresh={refresh} />
        {calendarOpen && <div className="mt-4"><RoomCalendar listingId={listing.id} room={room} /></div>}
      </div>}
    </article>
  );
}

export default function RoomManager({ listing, onListingChange }: { listing: VendorListing; onListingChange: (listing: VendorListing) => void }) {
  const [rooms, setRooms] = useState<VendorRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const { askReason, dialog } = useReasonDialog();
  const editable = listing.status === 'draft' || listing.status === 'rejected';
  const live = listing.status === 'published' || listing.status === 'paused';

  useEffect(() => {
    let active = true;
    api.getHotelRooms(listing.id)
      .then((result) => active && setRooms(result))
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [listing.id]);

  const run = async (work: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await work(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'The room could not be updated.'); }
    finally { setBusy(false); }
  };
  const replace = (room: VendorRoom) => setRooms((items) => items.map((item) => item.id === room.id ? room : item));
  const refreshListing = async () => { if (live) onListingChange(await api.getHotelListing(listing.id)); };
  const remove = async (room: VendorRoom) => {
    if (await askReason({ title: `Remove "${room.name}"?`, destructive: true, confirmLabel: 'Remove room category', description: editable ? 'It is removed from this draft. You can add it again before submitting.' : 'This new room category is withdrawn from review.' }) === null) return;
    run(async () => {
      await api.removeHotelRoom(listing.id, room.id);
      setRooms((items) => items.filter((item) => item.id !== room.id));
      await refreshListing();
    });
  };

  if (loading) return <div className="flex justify-center py-8"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading rooms" /></div>;
  const totalRooms = rooms.filter((room) => !room.pendingRevision?.isNew).reduce((sum, room) => sum + room.totalRooms, 0);

  return (
    <div className="space-y-4" aria-live="polite">
      {dialog}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500"><strong className="text-slate-900">{rooms.length} room categor{rooms.length === 1 ? 'y' : 'ies'} · {totalRooms} room{totalRooms === 1 ? '' : 's'}.</strong>{live ? ' Price, room count and on/off apply straight away.' : ''}</p>
        {(editable || live) && !adding && <button type="button" onClick={() => setAdding(true)} className={primaryButton}><Plus className="size-4" />Add room category</button>}
      </div>
      {listing.status === 'submitted' && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600">Under review. Rooms can be changed again once the hotel is published or returned to you.</p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {adding && <RoomForm initial={emptyRoom} live={live} busy={busy} submitLabel="Add room" onCancel={() => setAdding(false)}
        onSubmit={(input) => run(async () => {
          const created = await api.addHotelRoom(listing.id, { ...emptyRoom, ...input });
          setRooms((items) => [...items, created.data]);
          setAdding(false);
          await refreshListing();
        })} />}

      {rooms.length === 0 && !adding && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No room categories yet. Add one so guests can book.</p>}
      {rooms.map((room) => <RoomCard key={room.id} listing={listing} room={room} live={live} editable={editable} busy={busy}
        onRun={run} onReplace={replace} onRemove={() => remove(room)} onEdited={() => void refreshListing()} />)}

      {editable && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-900">{rooms.some((room) => room.status === 'active') ? 'Ready when you are: GBBookings checks the hotel before guests can book it.' : 'Add at least one bookable room category before submitting.'}</p>
          <button type="button" className={primaryButton} disabled={busy || !rooms.some((room) => room.status === 'active')}
            onClick={() => run(async () => onListingChange((await api.submitHotelListing(listing.id)).data))}>
            {listing.status === 'rejected' ? 'Resubmit for review' : 'Submit for review'}
          </button>
        </div>
      )}
    </div>
  );
}
