import { useState, type FormEvent } from 'react';
import { api, EXPERIENCE_TYPES, type VendorListing } from '../../shared/api/api';
import PhotoManager, { toPhotoInput, type EditablePhoto } from './PhotoManager';

const input = 'mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm';
const split = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export default function PropertyEditor({ listing, onSaved, onCancel }: {
  listing: VendorListing; onSaved: (listing: VendorListing) => void; onCancel: () => void;
}) {
  // Start from the edits still waiting for review, so a second save builds on them.
  const current = { ...listing, ...listing.pendingRevision?.changes };
  const live = listing.status === 'published' || listing.status === 'paused';
  const [draft, setDraft] = useState({
    title: current.title, location: current.location, description: current.description,
    hotelType: current.hotelSpecs?.hotelType ?? 'Hotel',
    amenities: current.hotelSpecs?.amenities?.join(', ') ?? '',
    facilities: current.hotelSpecs?.facilities?.join(', ') ?? '',
    policies: current.hotelSpecs?.policies?.join(', ') ?? '',
    checkInTime: current.hotelSpecs?.checkInTime ?? '14:00', checkOutTime: current.hotelSpecs?.checkOutTime ?? '11:00',
    hostName: current.homestaySpecs?.hostName ?? '', experienceType: current.homestaySpecs?.experienceType ?? EXPERIENCE_TYPES[0],
  });
  const [photos, setPhotos] = useState<EditablePhoto[]>(current.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (!photos.length) throw new Error('Add at least one photo.');
      onSaved(await api.updateHotelListing(listing.id, {
        title: draft.title, location: draft.location, description: draft.description,
        hotelSpecs: {
          hotelType: draft.hotelType, amenities: split(draft.amenities), facilities: split(draft.facilities),
          policies: split(draft.policies), checkInTime: draft.checkInTime, checkOutTime: draft.checkOutTime,
        },
        ...(listing.type === 'homestay' ? { homestaySpecs: { hostName: draft.hostName, experienceType: draft.experienceType } } : {}),
        photos: toPhotoInput(photos),
      }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save property.'); }
    finally { setBusy(false); }
  };
  const textField = (key: keyof typeof draft, label: string, type = 'text') => (
    <label className="text-xs font-semibold text-slate-600">{label}<input required type={type} className={input} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>
  );
  return (
    <form onSubmit={save} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      <h3 className="font-bold sm:col-span-2">Edit property details</h3>
      <p className="text-xs text-slate-600 sm:col-span-2">{live
        ? 'Your property stays live and bookable. Changes are sent to GBBookings for review, and guests see them once approved.'
        : 'Saving keeps this property as a draft. Submit it for approval to accept bookings.'}</p>
      {error && <p role="alert" className="text-sm text-rose-700 sm:col-span-2">{error}</p>}
      {textField('title', 'Property name')}{textField('location', 'Location')}
      <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Description<textarea required minLength={20} maxLength={10000} className={`${input} min-h-28 py-3`} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
      {textField('hotelType', 'Property category')}
      {listing.type === 'homestay' && <>
        {textField('hostName', 'Host name')}
        <label className="text-xs font-semibold text-slate-600">Experience<select className={input} value={draft.experienceType} onChange={(event) => setDraft({ ...draft, experienceType: event.target.value as typeof draft.experienceType })}>{EXPERIENCE_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>
      </>}
      {textField('checkInTime', 'Check-in time', 'time')}{textField('checkOutTime', 'Check-out time', 'time')}
      {(['amenities', 'facilities', 'policies'] as const).map((key) => <label key={key} className="text-xs font-semibold capitalize text-slate-600">{key} (comma separated)<input className={input} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>)}
      <div className="sm:col-span-2"><PhotoManager photos={photos} onChange={setPhotos} max={20} label="Property photos" onUploadingChange={setUploading} /></div>
      <div className="flex gap-3 sm:col-span-2"><button disabled={busy || uploading} className="min-h-11 rounded-md bg-[#006F3C] px-4 text-sm font-bold text-white disabled:opacity-50">{live ? 'Send changes for review' : 'Save property'}</button><button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-md border border-slate-300 px-4 text-sm">Cancel</button></div>
    </form>
  );
}
