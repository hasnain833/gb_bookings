import { useState, type FormEvent } from 'react';
import { api, type LatLng, type VendorListing } from '../../shared/api/api';
import { LocationPinField } from '../../shared/components/MapPin';
import { CarBasicsFields, CarTermsFields, carDraft, carInput, carProblem } from './CarFields';
import PhotoManager, { toPhotoInput, type EditablePhoto } from './PhotoManager';
import { primaryButton, secondaryButton } from './RoomManager';

const inputClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-[#006F3C]';

/** "Details & photos" for a car. On a live car the edit waits for review; the daily rate and count live on the Price & fleet tab. */
export default function CarEditor({ listing, onSaved, onCancel }: { listing: VendorListing; onSaved: (listing: VendorListing) => void; onCancel: () => void }) {
  // Start from the edits still waiting for review, so a second save builds on them.
  const { coordinates: pendingPin, ...pendingChanges } = listing.pendingRevision?.changes ?? {};
  const current = { ...listing, ...pendingChanges };
  const live = listing.status === 'published' || listing.status === 'paused';
  const [base, setBase] = useState({ title: current.title, location: current.location, description: current.description });
  const [car, setCar] = useState(() => carDraft(current.carSpecs, current.stayInfo?.paymentMethods));
  const [pin, setPin] = useState<LatLng | undefined>(pendingPin ? { lat: pendingPin.coordinates[1], lng: pendingPin.coordinates[0] } : listing.coordinates);
  const [photos, setPhotos] = useState<EditablePhoto[]>(current.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const problem = carProblem(car, 'car') || carProblem(car, 'terms') || (photos.length ? '' : 'Add at least one photo.');
      if (problem) throw new Error(problem);
      onSaved(await api.updateHotelListing(listing.id, {
        title: base.title, location: base.location, description: base.description,
        carSpecs: carInput(car), stayInfo: { paymentMethods: car.paymentMethods },
        ...(pin ? { coordinates: pin } : {}), photos: toPhotoInput(photos),
      }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save the car.'); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <h3 className="font-bold">Edit car details</h3>
        <p className="mt-1 text-xs text-slate-600">{live
          ? 'Your car stays live and bookable. Changes are sent to GBBookings for review, and guests see them once approved. The daily price and number of cars change at once on the Price & fleet tab.'
          : 'Saving keeps this car as a draft. Submit it for approval to accept bookings.'}</p>
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Listing name<input required minLength={2} maxLength={160} className={inputClass} value={base.title} onChange={(event) => setBase({ ...base, title: event.target.value })} /></label>
        <label className="text-sm font-semibold text-slate-700">Base city<input required minLength={2} maxLength={240} className={inputClass} value={base.location} onChange={(event) => setBase({ ...base, location: event.target.value })} /></label>
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Description<textarea required minLength={20} maxLength={10000} className={`${inputClass} min-h-28 py-3`} value={base.description} onChange={(event) => setBase({ ...base, description: event.target.value })} /></label>
        <div className="sm:col-span-2"><LocationPinField value={pin} onChange={setPin} location={base.location} /></div>
      </div>
      <CarBasicsFields value={car} onChange={setCar} />
      <CarTermsFields value={car} onChange={setCar} />
      <PhotoManager photos={photos} onChange={setPhotos} max={20} label="Car photos" onUploadingChange={setUploading} />
      <div className="flex gap-3"><button disabled={busy || uploading} className={primaryButton}>{live ? 'Send changes for review' : 'Save car'}</button><button type="button" disabled={busy} onClick={onCancel} className={secondaryButton}>Cancel</button></div>
    </form>
  );
}
