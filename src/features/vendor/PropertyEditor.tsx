import { useState, type FormEvent } from 'react';
import { api, EXPERIENCE_TYPES, type VendorListing } from '../../shared/api/api';

const input = 'mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm';
const split = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export default function PropertyEditor({ listing, onSaved, onCancel }: {
  listing: VendorListing; onSaved: (listing: VendorListing) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState({
    title: listing.title, location: listing.location, description: listing.description,
    hotelType: listing.hotelSpecs?.hotelType ?? 'Hotel',
    amenities: listing.hotelSpecs?.amenities?.join(', ') ?? '',
    facilities: listing.hotelSpecs?.facilities?.join(', ') ?? '',
    policies: listing.hotelSpecs?.policies?.join(', ') ?? '',
    checkInTime: listing.hotelSpecs?.checkInTime ?? '14:00', checkOutTime: listing.hotelSpecs?.checkOutTime ?? '11:00',
    hostName: listing.homestaySpecs?.hostName ?? '', experienceType: listing.homestaySpecs?.experienceType ?? EXPERIENCE_TYPES[0],
  });
  const [images, setImages] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (images.length > 20) throw new Error('Choose at most 20 images.');
      const imageIds: string[] = [];
      for (const file of images) imageIds.push((await api.uploadMedia('images', file)).data.id);
      onSaved(await api.updateHotelListing(listing.id, {
        title: draft.title, location: draft.location, description: draft.description,
        hotelSpecs: {
          hotelType: draft.hotelType, amenities: split(draft.amenities), facilities: split(draft.facilities),
          policies: split(draft.policies), checkInTime: draft.checkInTime, checkOutTime: draft.checkOutTime,
        },
        ...(listing.type === 'homestay' ? { homestaySpecs: { hostName: draft.hostName, experienceType: draft.experienceType } } : {}),
        ...(imageIds.length ? { imageIds } : {}),
      }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save property.'); }
    finally { setBusy(false); }
  };
  const textField = (key: keyof typeof draft, label: string, type = 'text') => (
    <label className="text-xs font-semibold text-slate-600">{label}<input required type={type} className={input} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>
  );
  return (
    <form onSubmit={save} className="grid gap-4 border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
      <h3 className="font-bold sm:col-span-2">Edit property details</h3>
      <p className="text-xs text-slate-600 sm:col-span-2">Saving returns this property to draft. Submit it for approval to accept new bookings. Existing reservations remain available.</p>
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
      <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Replace photos (optional; first photo is primary)<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className={`${input} py-2`} onChange={(event) => setImages(Array.from(event.target.files ?? []))} /></label>
      <div className="flex gap-3 sm:col-span-2"><button disabled={busy} className="min-h-11 rounded-md bg-[#006F3C] px-4 text-sm font-bold text-white disabled:opacity-50">Save property</button><button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-md border border-slate-300 px-4 text-sm">Cancel</button></div>
    </form>
  );
}
