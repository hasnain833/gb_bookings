import { useState, type ReactNode } from 'react';
import { Check, Image as ImageIcon, LoaderCircle, Plus } from 'lucide-react';
import { api, type VendorListing, type VendorRoomInput } from '../../shared/api/api';
import { useReasonDialog } from '../../shared/components/ReasonDialog';
import ChipInput from './ChipInput';
import PhotoManager, { toPhotoInput, type EditablePhoto } from './PhotoManager';
import { emptyRoom, primaryButton, RoomForm, secondaryButton } from './RoomManager';

const inputClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';
const STEPS = [
  ['Basics', 'Name, type, description'],
  ['Location & policies', 'Address, check-in, rules'],
  ['Photos', 'Cover and gallery'],
  ['Rooms', 'Categories, prices, stock'],
  ['Review & submit', 'Checked by GBBookings'],
] as const;

type DraftRoom = { input: VendorRoomInput; photos: EditablePhoto[] };

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={`text-sm font-semibold text-slate-700 ${wide ? 'sm:col-span-2' : ''}`}>{label}{children}</label>;
}

/** Add a hotel in five steps; nothing is saved until the last step creates the draft (and optionally submits it). */
export default function AddHotelWizard({ onDone, onExit }: { onDone: (listing: VendorListing, message: string) => void; onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [hotel, setHotel] = useState({ title: '', hotelType: 'Hotel', description: '', location: '', checkInTime: '14:00', checkOutTime: '11:00' });
  const [amenities, setAmenities] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [policies, setPolicies] = useState<string[]>([]);
  const [photos, setPhotos] = useState<EditablePhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [rooms, setRooms] = useState<DraftRoom[]>([]);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { askReason, dialog } = useReasonDialog();

  const problems = [
    hotel.title.trim().length < 2 ? 'Add the hotel name.' : hotel.description.trim().length < 20 ? 'Write a description of at least 20 characters.' : '',
    hotel.location.trim().length < 2 ? 'Add the location.' : '',
    photos.length === 0 ? 'Add at least one photo.' : '',
    rooms.length === 0 ? 'Add at least one room category.' : '',
  ];
  const go = (next: number) => {
    const blocking = problems.slice(0, Math.min(next, 4)).find(Boolean);
    if (next > step && blocking) { setError(blocking); return; }
    setError(''); setEditing(null); setStep(next); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const exit = async () => {
    const dirty = hotel.title || hotel.description || photos.length || rooms.length;
    if (dirty && await askReason({ title: 'Leave without saving?', destructive: true, confirmLabel: 'Discard hotel', description: 'Nothing has been saved yet. Your entries on these steps will be lost.' }) === null) return;
    onExit();
  };

  const finish = async (submit: boolean) => {
    const blocking = problems.find(Boolean);
    if (blocking) { setError(blocking); return; }
    setBusy(true); setError('');
    let created: VendorListing | null = null;
    try {
      created = (await api.createHotelListing({
        type: 'hotel', title: hotel.title.trim(), location: hotel.location.trim(), description: hotel.description.trim(),
        price: Math.min(...rooms.map((room) => room.input.basePrice)),
        imageIds: photos.flatMap((photo) => photo.mediaId ? [photo.mediaId] : []), photos: toPhotoInput(photos),
        hotelSpecs: { hotelType: hotel.hotelType.trim() || 'Hotel', amenities, facilities, policies, checkInTime: hotel.checkInTime, checkOutTime: hotel.checkOutTime },
      })).data;
      for (const room of rooms) await api.addHotelRoom(created.id, { ...emptyRoom, ...room.input });
      if (submit) created = (await api.submitHotelListing(created.id)).data;
      onDone(created, submit ? `${created.title} was submitted. You will get an email once GBBookings has checked it.` : `${created.title} is saved as a draft. Submit it from its Rooms tab when ready.`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'The hotel could not be saved.';
      // The draft exists even if a room failed; send the vendor to finish it in the workspace.
      if (created) onDone(created, `${created.title} was saved as a draft, but not everything went through: ${message} Finish it below.`);
      else setError(message);
    } finally { setBusy(false); }
  };

  const fromPrice = rooms.length ? Math.min(...rooms.map((room) => room.input.basePrice)) : null;

  return (
    <div className="flex flex-wrap items-start gap-7">
      {dialog}
      <nav aria-label="Steps" className="flex w-full flex-col gap-1 lg:w-60 lg:shrink-0">
        {STEPS.map(([name, hint], index) => {
          const done = index < step && !problems[index];
          return <button key={name} type="button" onClick={() => go(index)} aria-current={index === step ? 'step' : undefined}
            className={`flex min-h-14 items-start gap-3 rounded-xl px-2.5 py-2.5 text-left ${index === step ? 'border border-emerald-200 bg-white' : 'hover:bg-white/60'}`}>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${done ? 'bg-[#006F3C] text-white' : index === step ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>{done ? <Check className="size-4" /> : index + 1}</span>
            <span><span className={`block text-sm font-bold ${index > step ? 'text-slate-500' : 'text-slate-900'}`}>{name}</span><span className="text-xs text-slate-500">{hint}</span></span>
          </button>;
        })}
        <button type="button" onClick={exit} className="mt-3 min-h-11 rounded-lg px-2.5 text-left text-sm font-semibold text-slate-500 hover:text-slate-800">Cancel and exit</button>
      </nav>

      <div className="min-w-0 flex-[999_1_480px] space-y-5">
        <div>
          <p className="text-sm font-bold text-[#006F3C]">Step {step + 1} of {STEPS.length}</p>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">{[
            'Tell guests about your hotel', 'Where is it, and what are the rules?', 'Show guests the place', 'What rooms do guests book?', 'Check everything, then submit',
          ][step]}</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">{[
            'The name and description appear on the hotel page and in search.',
            'Check-in and check-out times are shown on every booking.',
            'Add up to 20 photos. The first is the cover in search results; captions help guests.',
            'Add one category per kind of room, such as Deluxe Double or Family Suite. We never sell more rooms than you set.',
            'GBBookings checks new hotels before guests can book them, usually within a day. You get an email either way.',
          ][step]}</p>
        </div>
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        {step === 0 && <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <Field label="Hotel name"><input className={inputClass} required maxLength={160} value={hotel.title} onChange={(e) => setHotel({ ...hotel, title: e.target.value })} placeholder="Shigar Riverside Lodge" /></Field>
          <Field label="Type of property"><input className={inputClass} list="hotel-types" maxLength={80} value={hotel.hotelType} onChange={(e) => setHotel({ ...hotel, hotelType: e.target.value })} /></Field>
          <datalist id="hotel-types"><option value="Hotel" /><option value="Guest House" /><option value="Resort" /><option value="Boutique Hotel" /><option value="Lodge" /><option value="Motel" /></datalist>
          <Field label="Description" wide><textarea className={`${inputClass} min-h-36 py-3`} maxLength={10000} value={hotel.description} onChange={(e) => setHotel({ ...hotel, description: e.target.value })} placeholder="What makes the stay special: views, food, how far the main sights are." /><span className="mt-1 block text-xs font-normal text-slate-500">{hotel.description.trim().length}/20 characters minimum</span></Field>
        </div>}

        {step === 1 && <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <Field label="Location" wide><input className={inputClass} maxLength={240} value={hotel.location} onChange={(e) => setHotel({ ...hotel, location: e.target.value })} placeholder="Main Bazaar, Shigar, Skardu" /></Field>
          <Field label="Check-in from"><input type="time" className={inputClass} value={hotel.checkInTime} onChange={(e) => setHotel({ ...hotel, checkInTime: e.target.value })} /></Field>
          <Field label="Check-out by"><input type="time" className={inputClass} value={hotel.checkOutTime} onChange={(e) => setHotel({ ...hotel, checkOutTime: e.target.value })} /></Field>
          <div className="sm:col-span-2"><ChipInput label="Amenities" value={amenities} onChange={setAmenities} suggestions={['WiFi', 'Breakfast', 'Parking', 'Heating', 'Restaurant', 'Mountain view', 'Room service', 'Airport pickup']} /></div>
          <div className="sm:col-span-2"><ChipInput label="Facilities" value={facilities} onChange={setFacilities} suggestions={['Garden', 'Generator backup', 'Laundry', 'Conference room', 'Prayer area', 'Family hall']} /></div>
          <div className="sm:col-span-2"><ChipInput label="House rules" value={policies} onChange={setPolicies} suggestions={['No smoking indoors', 'No pets', 'ID required at check-in', 'Quiet hours after 10 pm']} /></div>
        </div>}

        {step === 2 && <div className="rounded-2xl border border-slate-200 bg-white p-5"><PhotoManager photos={photos} onChange={setPhotos} max={20} label="Property photos" onUploadingChange={setUploading} /></div>}

        {step === 3 && <div className="space-y-3">
          {rooms.map((room, index) => editing === index
            ? <RoomForm key={index} initial={{ ...room.input, photos: room.photos }} live={false} busy={false} submitLabel="Save room" onCancel={() => setEditing(null)}
                onSubmit={(input, roomPhotos) => { setRooms(rooms.map((item, at) => at === index ? { input, photos: roomPhotos } : item)); setEditing(null); }} />
            : <article key={index} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                {room.photos[0] ? <img src={room.photos[0].url} alt="" className="h-16 w-22 rounded-lg object-cover" /> : <span className="flex h-16 w-22 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><ImageIcon className="size-5" /></span>}
                <div className="min-w-[180px] flex-1"><p className="font-extrabold">{room.input.name}</p><p className="mt-0.5 text-sm text-slate-500">{room.input.totalRooms} room{room.input.totalRooms === 1 ? '' : 's'} · {room.input.bedType} · {room.input.maxAdults} adults, {room.input.maxChildren} children · PKR {room.input.basePrice.toLocaleString()}/night</p></div>
                <div className="flex gap-2"><button type="button" className={secondaryButton} onClick={() => setEditing(index)}>Edit</button><button type="button" className={secondaryButton} onClick={() => setRooms(rooms.filter((_, at) => at !== index))}>Remove</button></div>
              </article>)}
          {editing === 'new'
            ? <RoomForm initial={emptyRoom} live={false} busy={false} submitLabel="Add this room" onCancel={() => setEditing(null)}
                onSubmit={(input, roomPhotos) => { setRooms([...rooms, { input, photos: roomPhotos }]); setEditing(null); setError(''); }} />
            : <button type="button" className={`${secondaryButton} w-full border-dashed`} onClick={() => setEditing('new')}><Plus className="size-4" />{rooms.length ? 'Add another room category' : 'Add a room category'}</button>}
        </div>}

        {step === 4 && <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          {[
            ['Basics', `${hotel.title || '—'} · ${hotel.hotelType}`, 0],
            ['Location', `${hotel.location || '—'} · check-in ${hotel.checkInTime}, check-out ${hotel.checkOutTime}`, 1],
            ['Amenities & rules', [...amenities, ...facilities, ...policies].join(', ') || 'None added', 1],
            ['Photos', `${photos.length} photo${photos.length === 1 ? '' : 's'}${photos.filter((photo) => photo.caption?.trim()).length ? `, ${photos.filter((photo) => photo.caption?.trim()).length} with captions` : ''}`, 2],
            ['Rooms', rooms.map((room) => `${room.input.name} (${room.input.totalRooms})`).join(', ') || 'None yet', 3],
          ].map(([name, value, target]) => <div key={name as string} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <div className="min-w-0"><p className="text-sm font-bold">{name}</p><p className="text-sm text-slate-600">{value}</p></div>
            <button type="button" className="min-h-11 text-sm font-bold text-[#006F3C]" onClick={() => go(target as number)}>Edit</button>
          </div>)}
        </div>}

        <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5">
          {step > 0 ? <button type="button" className={secondaryButton} onClick={() => go(step - 1)}>Back</button> : <span />}
          {step < 4
            ? <button type="button" className={primaryButton} disabled={uploading || editing !== null} onClick={() => go(step + 1)}>Continue</button>
            : <div className="flex flex-wrap gap-2">
                <button type="button" className={secondaryButton} disabled={busy} onClick={() => finish(false)}>Save as draft</button>
                <button type="button" className={primaryButton} disabled={busy} onClick={() => finish(true)}>{busy && <LoaderCircle className="size-4 animate-spin" />}Submit for review</button>
              </div>}
        </div>
      </div>

      <aside aria-label="Guest preview" className="w-full space-y-2.5 xl:w-80 xl:shrink-0">
        <p className="text-xs font-bold tracking-[0.12em] text-slate-500">HOW GUESTS WILL SEE IT</p>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {photos[0] ? <img src={photos[0].url} alt={photos[0].caption || 'Cover photo'} className="h-44 w-full object-cover" /> : <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-500">Cover photo</div>}
          <div className="space-y-2.5 p-4">
            <div><p className="text-[17px] font-extrabold">{hotel.title || 'Your hotel name'}</p><p className="mt-0.5 text-sm text-slate-500">{hotel.hotelType || 'Hotel'} · {hotel.location || 'Location'}</p></div>
            {fromPrice !== null && <p className="text-sm"><span className="text-slate-500">from</span> <strong>PKR {fromPrice.toLocaleString()}</strong> <span className="text-slate-500">/ night</span></p>}
            {rooms.length > 0 && <ul className="divide-y divide-slate-100 border-t border-slate-100 text-sm">{rooms.map((room, index) => <li key={index} className="flex justify-between gap-3 py-2"><span className="truncate">{room.input.name}</span><strong>{room.input.basePrice.toLocaleString()}</strong></li>)}</ul>}
          </div>
        </div>
      </aside>
    </div>
  );
}
