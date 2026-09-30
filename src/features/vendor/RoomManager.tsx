import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { LoaderCircle, Plus } from 'lucide-react';
import { api, type VendorListing, type VendorRoom, type VendorRoomInput } from '../../shared/api/api';

const inputClass = 'min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C]';
const primaryButton = 'min-h-11 rounded-md bg-[#006F3C] px-4 text-sm font-bold text-white disabled:opacity-50';
const secondaryButton = 'min-h-11 rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700 disabled:opacity-50';

const emptyRoom: VendorRoomInput = { name: '', description: '', bedType: 'Double', maxAdults: 2, maxChildren: 1, totalRooms: 1, basePrice: 0, amenities: [] };

/** Add/edit form. `liveOnly` limits it to what a published hotel may change without re-review (mirrors the server). */
function RoomForm({ initial, liveOnly, busy, submitLabel, onSubmit, onCancel }: {
  initial: VendorRoomInput; liveOnly: boolean; busy: boolean; submitLabel: string;
  onSubmit: (input: Partial<VendorRoomInput>) => void; onCancel?: () => void;
}) {
  const [room, setRoom] = useState({ ...initial, amenities: initial.amenities.join(', ') });
  const number = (key: 'maxAdults' | 'maxChildren' | 'totalRooms' | 'basePrice') => ({
    type: 'number', value: room[key], className: inputClass, required: true,
    onChange: (event: ChangeEvent<HTMLInputElement>) => setRoom({ ...room, [key]: Number(event.target.value) }),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const priceAndStock = { basePrice: room.basePrice, totalRooms: room.totalRooms };
    onSubmit(liveOnly ? priceAndStock : {
      ...priceAndStock, name: room.name, bedType: room.bedType, maxAdults: room.maxAdults, maxChildren: room.maxChildren,
      description: room.description || undefined,
      amenities: room.amenities.split(',').map((value) => value.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 bg-slate-50 p-3 sm:grid-cols-3">
      {!liveOnly && <>
        <label className="text-xs font-semibold text-slate-600">Room category<input className={`${inputClass} mt-1`} required minLength={2} value={room.name} onChange={(e) => setRoom({ ...room, name: e.target.value })} /></label>
        <label className="text-xs font-semibold text-slate-600">Bed type<input className={`${inputClass} mt-1`} required minLength={2} value={room.bedType} onChange={(e) => setRoom({ ...room, bedType: e.target.value })} /></label>
        <label className="text-xs font-semibold text-slate-600">Max adults<input {...number('maxAdults')} min={1} max={20} className={`${inputClass} mt-1`} /></label>
        <label className="text-xs font-semibold text-slate-600">Max children<input {...number('maxChildren')} min={0} max={20} className={`${inputClass} mt-1`} /></label>
      </>}
      <label className="text-xs font-semibold text-slate-600">Rooms of this type<input {...number('totalRooms')} min={1} className={`${inputClass} mt-1`} /></label>
      <label className="text-xs font-semibold text-slate-600">Price per night (PKR)<input {...number('basePrice')} min={0} step={1} className={`${inputClass} mt-1`} /></label>
      {!liveOnly && <>
        <label className="text-xs font-semibold text-slate-600 sm:col-span-3">Amenities, comma separated<input className={`${inputClass} mt-1`} value={room.amenities} onChange={(e) => setRoom({ ...room, amenities: e.target.value })} /></label>
        <label className="text-xs font-semibold text-slate-600 sm:col-span-3">Description<textarea className="mt-1 min-h-20 w-full rounded-md border border-slate-300 p-3 text-sm" maxLength={2000} value={room.description ?? ''} onChange={(e) => setRoom({ ...room, description: e.target.value })} /></label>
      </>}
      <div className="flex gap-2 sm:col-span-3">
        <button disabled={busy} className={primaryButton}>{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} className={secondaryButton}>Cancel</button>}
      </div>
    </form>
  );
}

export default function RoomManager({ listing, onListingChange }: { listing: VendorListing; onListingChange: (listing: VendorListing) => void }) {
  const [rooms, setRooms] = useState<VendorRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const editable = listing.status === 'draft' || listing.status === 'rejected';
  const live = listing.status === 'published' || listing.status === 'paused';

  useEffect(() => {
    let active = true;
    api.getHotelRooms(listing.id)
      .then((result) => active && setRooms(result))
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [listing.id]);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The room could not be updated.');
    } finally {
      setBusy(false);
    }
  };
  const replace = (room: VendorRoom) => setRooms((items) => items.map((item) => item.id === room.id ? room : item));

  if (loading) return <div className="flex justify-center py-4"><LoaderCircle className="size-5 animate-spin text-[#006F3C]" aria-label="Loading rooms" /></div>;

  return (
    <div className="space-y-3 pb-2" aria-live="polite">
      {listing.status === 'rejected' && listing.rejectionReason && <p className="bg-rose-50 p-3 text-sm text-rose-700">Rejected: {listing.rejectionReason}</p>}
      {listing.status === 'submitted' && <p className="text-xs text-slate-500">Under review. Rooms can be changed again once the hotel is published or returned.</p>}
      {live && <p className="text-xs text-slate-500">This hotel is live: you can change prices, room counts and pause rooms. Other changes need a new review.</p>}
      {error && <p role="alert" className="bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {rooms.length === 0 && <p className="text-sm text-slate-500">No room categories yet.</p>}
      {rooms.map((room) => (
        <div key={room.id} className="border border-slate-200 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{room.name} <span className="text-xs font-normal text-slate-500">· {room.bedType}</span></p>
              <p className="text-xs text-slate-500">{room.totalRooms} room(s) · up to {room.maxAdults} adults, {room.maxChildren} children · PKR {room.basePrice.toLocaleString()}/night</p>
            </div>
            <span className={`text-xs font-bold uppercase ${room.status === 'paused' ? 'text-amber-700' : 'text-emerald-700'}`}>{room.status}</span>
            {(editable || live) && editingId !== room.id && (
              <div className="flex flex-wrap gap-2">
                <button type="button" className={secondaryButton} disabled={busy} onClick={() => setEditingId(room.id)}>Edit</button>
                <button type="button" className={secondaryButton} disabled={busy} onClick={() => run(async () => {
                  replace(await api.updateHotelRoom(listing.id, room.id, { status: room.status === 'paused' ? 'active' : 'paused' }));
                })}>{room.status === 'paused' ? 'Resume' : 'Pause'}</button>
                {editable && <button type="button" className={secondaryButton} disabled={busy} onClick={() => {
                  if (!window.confirm(`Remove "${room.name}"?`)) return;
                  run(async () => {
                    await api.removeHotelRoom(listing.id, room.id);
                    setRooms((items) => items.filter((item) => item.id !== room.id));
                  });
                }}>Remove</button>}
              </div>
            )}
          </div>
          {editingId === room.id && (
            <div className="mt-3">
              <RoomForm initial={room} liveOnly={!editable} busy={busy} submitLabel="Save room" onCancel={() => setEditingId(null)}
                onSubmit={(input) => run(async () => {
                  replace(await api.updateHotelRoom(listing.id, room.id, input));
                  setEditingId(null);
                })} />
            </div>
          )}
        </div>
      ))}

      {editable && (adding
        ? <RoomForm initial={emptyRoom} liveOnly={false} busy={busy} submitLabel="Add room" onCancel={() => setAdding(false)}
            onSubmit={(input) => run(async () => {
              const created = await api.addHotelRoom(listing.id, { ...emptyRoom, ...input });
              setRooms((items) => [...items, created.data]);
              setAdding(false);
            })} />
        : <button type="button" onClick={() => setAdding(true)} className={`${secondaryButton} flex items-center gap-2`}><Plus className="size-4" />Add room category</button>)}

      {editable && (
        <button type="button" className={primaryButton} disabled={busy || !rooms.some((room) => room.status === 'active')}
          onClick={() => run(async () => onListingChange((await api.submitHotelListing(listing.id)).data))}>
          {listing.status === 'rejected' ? 'Resubmit for review' : 'Submit for review'}
        </button>
      )}
    </div>
  );
}
