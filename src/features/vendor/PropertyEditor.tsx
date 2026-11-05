import { useState, type FormEvent } from 'react';
import { api, EXPERIENCE_TYPES, type LatLng, type VendorListing } from '../../shared/api/api';
import { AddressFields, LocationPinField } from '../../shared/components/MapPin';
import HomestayHostFields, { homestayDraft, homestayInput } from './HomestayHostFields';
import PhotoManager, { toPhotoInput, type EditablePhoto } from './PhotoManager';
import StayInfoFields, { defaultStayInfo, stayInfoProblem } from './StayInfoFields';
import { defaultExtras, ExtrasFields, extrasInput, extrasProblem, FacilityChecklist, type Extras, StarsField } from './PropertyExtrasFields';
import { addressLine, HOME_TYPES, HOTEL_TYPES, type PropertyAddress } from '../../shared/utils/rooms';
import Select from '../../shared/components/Select';

const input = 'mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm';
const split = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export default function PropertyEditor({ listing, onSaved, onCancel }: {
  listing: VendorListing; onSaved: (listing: VendorListing) => void; onCancel: () => void;
}) {
  // Start from the edits still waiting for review, so a second save builds on them.
  const { coordinates: pendingPin, ...pendingChanges } = listing.pendingRevision?.changes ?? {};
  const current = { ...listing, ...pendingChanges };
  const live = listing.status === 'published' || listing.status === 'paused';
  const [draft, setDraft] = useState({
    title: current.title, location: current.location, description: current.description,
    hotelType: current.hotelSpecs?.hotelType ?? (listing.type === 'homestay' ? 'Homestay' : 'Hotel'),
    amenities: current.hotelSpecs?.amenities?.join(', ') ?? '',
    facilities: current.hotelSpecs?.facilities?.join(', ') ?? '',
    policies: current.hotelSpecs?.policies?.join(', ') ?? '',
    checkInTime: current.hotelSpecs?.checkInTime ?? '14:00', checkOutTime: current.hotelSpecs?.checkOutTime ?? '11:00',
    experienceType: current.homestaySpecs?.experienceType ?? EXPERIENCE_TYPES[0],
  });
  const [host, setHost] = useState(() => homestayDraft(current.homestaySpecs));
  // Older listings only have the one-line location; it becomes the street line until the partner splits it up.
  const [address, setAddress] = useState<PropertyAddress>(() => current.address ?? { line1: current.location, area: '', city: '', region: 'Gilgit-Baltistan', postcode: '' });
  const [stayInfo, setStayInfo] = useState(() => current.stayInfo ?? defaultStayInfo());
  const [facilityList, setFacilityList] = useState(() => [...new Set([...(current.hotelSpecs?.amenities ?? []), ...(current.hotelSpecs?.facilities ?? [])])]);
  const [extras, setExtras] = useState<Extras>(() => {
    const specs = current.hotelSpecs;
    const start = defaultExtras(listing.type === 'hotel');
    return { ...start, ...(specs?.parking ? { parking: specs.parking } : {}), ...(specs?.breakfast && listing.type === 'hotel' ? { breakfast: specs.breakfast } : {}), stars: specs?.stars, licenceNumber: specs?.licenceNumber };
  });
  // Pending pins arrive as stored GeoJSON ([lng, lat]).
  const [pin, setPin] = useState<LatLng | undefined>(pendingPin ? { lat: pendingPin.coordinates[1], lng: pendingPin.coordinates[0] } : listing.coordinates);
  const [photos, setPhotos] = useState<EditablePhoto[]>(current.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (!photos.length) throw new Error('Add at least one photo.');
      if (stayInfoProblem(stayInfo)) throw new Error(stayInfoProblem(stayInfo));
      if (address.line1.trim().length < 2 || address.city.trim().length < 2) throw new Error('Add the street or village and the town.');
      if (extrasProblem(extras)) throw new Error(extrasProblem(extras));
      onSaved(await api.updateHotelListing(listing.id, {
        title: draft.title, location: addressLine(address), address, description: draft.description,
        hotelSpecs: {
          hotelType: draft.hotelType, amenities: facilityList, facilities: [],
          policies: split(draft.policies), checkInTime: draft.checkInTime, checkOutTime: draft.checkOutTime,
          ...extrasInput(extras),
        },
        ...(listing.type === 'homestay' ? { homestaySpecs: (({ stayType, ...specs }) => specs)(homestayInput({ ...host, experienceType: draft.experienceType })) } : {}),
        ...(pin ? { coordinates: pin } : {}),
        stayInfo,
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
      {textField('title', 'Property name')}
      <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Description<textarea required minLength={20} maxLength={10000} className={`${input} min-h-28 py-3`} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
      <label className="text-xs font-semibold text-slate-600">Type of property<Select className={input} value={draft.hotelType} onChange={(event) => setDraft({ ...draft, hotelType: event.target.value })}>
        {/* An older listing keeps its own value as an option until it is changed. */}
        {[...new Set([...(listing.type === 'homestay' ? HOME_TYPES : HOTEL_TYPES), draft.hotelType])].map((value) => <option key={value}>{value}</option>)}
      </Select></label>
      {listing.type === 'homestay' && <>
        <label className="text-xs font-semibold text-slate-600">Experience<Select className={input} value={draft.experienceType} onChange={(event) => setDraft({ ...draft, experienceType: event.target.value as typeof draft.experienceType })}>{EXPERIENCE_TYPES.map((value) => <option key={value}>{value}</option>)}</Select></label>
      </>}
      <div className="sm:col-span-2"><AddressFields value={address} onChange={setAddress} onPin={setPin} /></div>
      <div className="sm:col-span-2"><LocationPinField value={pin} onChange={setPin} location={addressLine(address)} /></div>
      <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2"><StayInfoFields value={stayInfo} onChange={setStayInfo} /></div>
      {listing.type === 'homestay' && <div className="sm:col-span-2"><HomestayHostFields value={host} onChange={setHost} onUploadingChange={setUploading} /></div>}
      {textField('checkInTime', 'Check-in time', 'time')}{textField('checkOutTime', 'Check-out time', 'time')}
      <label className="text-xs font-semibold text-slate-600 sm:col-span-2">House rules (comma separated)<input className={input} value={draft.policies} onChange={(event) => setDraft({ ...draft, policies: event.target.value })} /></label>
      <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2"><p className="mb-2 text-sm font-bold">Facilities</p><FacilityChecklist value={facilityList} onChange={setFacilityList} /></div>
      <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2"><ExtrasFields value={extras} onChange={setExtras} /></div>
      {listing.type === 'hotel' && <div className="text-xs font-semibold text-slate-600 sm:col-span-2">Official star rating (if you have one)<StarsField value={extras.stars} onChange={(stars) => setExtras({ ...extras, stars })} className={input} /></div>}
      <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Tourism department registration number (optional)<input maxLength={60} className={input} value={extras.licenceNumber ?? ''} onChange={(event) => setExtras({ ...extras, licenceNumber: event.target.value })} /></label>
      <div className="sm:col-span-2"><PhotoManager photos={photos} onChange={setPhotos} max={20} label="Property photos" onUploadingChange={setUploading} /></div>
      <div className="flex gap-3 sm:col-span-2"><button disabled={busy || uploading} className="min-h-11 rounded-md bg-[#006F3C] px-4 text-sm font-bold text-white disabled:opacity-50">{live ? 'Send changes for review' : 'Save property'}</button><button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-md border border-slate-300 px-4 text-sm">Cancel</button></div>
    </form>
  );
}
