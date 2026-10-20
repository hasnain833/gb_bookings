import { useState, type ReactNode } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { api, type LatLng, type VendorListing } from '../../shared/api/api';
import { LocationPinField } from '../../shared/components/MapPin';
import { useReasonDialog } from '../../shared/components/ReasonDialog';
import { PAYMENT_LABELS } from '../../shared/utils/stayInfo';
import { CarBasicsFields, CarTermsFields, carDraft, carInput, carProblem, DRIVER_LABELS } from './CarFields';
import PhotoManager, { toPhotoInput, type EditablePhoto } from './PhotoManager';
import { primaryButton, secondaryButton } from './RoomManager';

const inputClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';

type StepId = 'car' | 'base' | 'terms' | 'photos' | 'review';
const STEPS: Array<[StepId, string, string, string]> = [
  ['car', 'The car', 'Make, model, seats', 'Which car are you renting out?'],
  ['base', 'Base & description', 'City, map, description', 'Where is the car based?'],
  ['terms', 'Price & driver', 'Daily rate, driver, fuel', 'How is it rented?'],
  ['photos', 'Photos', 'Outside and inside', 'Show guests the car'],
  ['review', 'Review & submit', 'Checked by GBBookings', 'Check everything, then submit'],
];

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: ReactNode }) {
  return <label className={`block text-sm font-semibold text-slate-700 ${wide ? 'sm:col-span-2' : ''}`}>{label}{children}{hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}</label>;
}

/**
 * Add a car step by step. One listing is one car model; identical cars are its count, so they share one calendar.
 * Nothing is saved until the last step creates the draft (and its single fleet entry), then optionally submits it.
 */
export default function AddCarWizard({ onDone, onExit }: { onDone: (listing: VendorListing, message: string) => void; onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [car, setCar] = useState(() => carDraft());
  const [base, setBase] = useState({ title: '', location: '', description: '' });
  const [pin, setPin] = useState<LatLng>();
  const [fleet, setFleet] = useState({ dailyRate: 0, count: 1 });
  const [photos, setPhotos] = useState<EditablePhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { askReason, dialog } = useReasonDialog();
  const id = STEPS[step][0];
  const defaultTitle = [car.make.trim(), car.model.trim(), car.year].filter(Boolean).join(' ');
  const title = base.title.trim() || defaultTitle;

  const problems: Record<StepId, string> = {
    car: carProblem(car, 'car'),
    base: base.location.trim().length < 2 ? 'Add the city the car is based in.' : base.description.trim().length < 20 ? 'Write a description of at least 20 characters.' : '',
    terms: fleet.dailyRate <= 0 ? 'Set the price per day.' : fleet.count < 1 ? 'Set how many of these cars you have.' : carProblem(car, 'terms'),
    photos: photos.length === 0 ? 'Add at least one photo.' : '',
    review: '',
  };
  const firstProblem = (upTo: number) => STEPS.slice(0, upTo).map(([stepId]) => problems[stepId]).find(Boolean);
  const go = (next: number) => {
    const blocking = firstProblem(next);
    if (next > step && blocking) { setError(blocking); return; }
    setError(''); setStep(next); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const exit = async () => {
    if ((car.make || base.description || photos.length) && await askReason({ title: 'Leave without saving?', destructive: true, confirmLabel: 'Discard car', description: 'Nothing has been saved yet. Your entries on these steps will be lost.' }) === null) return;
    onExit();
  };

  const finish = async (submit: boolean) => {
    const blocking = firstProblem(STEPS.length);
    if (blocking) { setError(blocking); return; }
    setBusy(true); setError('');
    let created: VendorListing | null = null;
    try {
      created = (await api.createHotelListing({
        type: 'car', title, location: base.location.trim(), description: base.description.trim(), price: fleet.dailyRate,
        imageIds: photos.flatMap((photo) => (photo.mediaId ? [photo.mediaId] : [])), photos: toPhotoInput(photos),
        carSpecs: carInput(car), stayInfo: { paymentMethods: car.paymentMethods }, ...(pin ? { coordinates: pin } : {}),
      })).data;
      // The car's single fleet entry: seats are its capacity, the count is how many identical cars there are.
      await api.addHotelRoom(created.id, {
        name: title, bedType: car.category, maxAdults: car.seats, maxChildren: 0, totalRooms: fleet.count, basePrice: fleet.dailyRate, amenities: [],
      });
      if (submit) created = (await api.submitHotelListing(created.id)).data;
      onDone(created, submit ? `${created.title} was submitted. You will get an email once GBBookings has checked it.` : `${created.title} is saved as a draft. Submit it from its Price & fleet tab when ready.`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'The car could not be saved.';
      if (created) onDone(created, `${created.title} was saved as a draft, but not everything went through: ${message} Finish it below.`);
      else setError(message);
    } finally { setBusy(false); }
  };

  const reviewRows: Array<[string, string, number]> = [
    ['Car', `${title} · ${car.category} · ${car.transmission} · ${car.fuelType} · ${car.seats} seats`, 0],
    ['Base', `${base.location || '—'}${pin ? ' · map pin set' : ''}`, 1],
    ['Price', `PKR ${fleet.dailyRate.toLocaleString()} per day · ${fleet.count} car${fleet.count === 1 ? '' : 's'}`, 2],
    ['Driver', `${DRIVER_LABELS[car.driverMode]}${car.driverMode !== 'self_drive' && car.driverPerDay ? ` · driver PKR ${car.driverPerDay.toLocaleString()}/day` : ''}${car.driverMode !== 'with_driver' ? ` · self-drive from age ${car.minDriverAge}, deposit PKR ${car.deposit.toLocaleString()}` : ''}`, 2],
    ['Extras', [car.fuelIncluded ? 'Fuel included' : 'Fuel paid by guest', car.chargesOutside ? `outside base city +PKR ${car.outsideCityPerDay.toLocaleString()}/day` : '', car.oneWay === 'flat' ? `one-way PKR ${car.oneWayFee.toLocaleString()}` : car.oneWay === 'on_request' ? 'one-way on request' : 'no one-way'].filter(Boolean).join(' · '), 2],
    ['Payment at pickup', car.paymentMethods.map((method) => PAYMENT_LABELS[method]).join(', ') || '—', 2],
    ['Photos', `${photos.length} photo${photos.length === 1 ? '' : 's'}`, 3],
  ];

  return (
    <div className="flex flex-wrap items-start gap-7">
      {dialog}
      <nav aria-label="Steps" className="flex w-full flex-col gap-1 lg:w-60 lg:shrink-0">
        {STEPS.map(([stepId, name, hint], index) => {
          const done = index < step && !problems[stepId];
          return (
            <button key={stepId} type="button" onClick={() => go(index)} aria-current={index === step ? 'step' : undefined}
              className={`flex min-h-14 items-start gap-3 rounded-xl px-2.5 py-2.5 text-left ${index === step ? 'border border-emerald-200 bg-white' : 'hover:bg-white/60'}`}>
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${done ? 'bg-[#006F3C] text-white' : index === step ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>{done ? <Check className="size-4" /> : index + 1}</span>
              <span><span className={`block text-sm font-bold ${index > step ? 'text-slate-500' : 'text-slate-900'}`}>{name}</span><span className="text-xs text-slate-500">{hint}</span></span>
            </button>
          );
        })}
        <button type="button" onClick={exit} className="mt-3 min-h-11 rounded-lg px-2.5 text-left text-sm font-semibold text-slate-500 hover:text-slate-800">Cancel and exit</button>
      </nav>

      <div className="min-w-0 flex-[999_1_480px] space-y-5">
        <div>
          <p className="text-sm font-bold text-[#006F3C]">Step {step + 1} of {STEPS.length}</p>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">{STEPS[step][3]}</h2>
        </div>
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          {id === 'car' && <CarBasicsFields value={car} onChange={setCar} />}
          {id === 'base' && <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Base city" hint="Where guests normally pick the car up, e.g. Skardu or Gilgit."><input required maxLength={240} className={inputClass} placeholder="Skardu, Gilgit-Baltistan" value={base.location} onChange={(event) => setBase({ ...base, location: event.target.value })} /></Field>
            <Field label="Listing name" hint={`Leave empty to use "${defaultTitle || 'make model year'}".`}><input maxLength={160} className={inputClass} placeholder={defaultTitle} value={base.title} onChange={(event) => setBase({ ...base, title: event.target.value })} /></Field>
            <Field label="Description" hint="Condition, what the car is good for (e.g. Deosai, Khunjerab), the driver’s experience." wide><textarea required minLength={20} maxLength={10000} className={`${inputClass} min-h-28 py-3`} value={base.description} onChange={(event) => setBase({ ...base, description: event.target.value })} /></Field>
            <div className="sm:col-span-2"><LocationPinField value={pin} onChange={setPin} location={base.location} /></div>
          </div>}
          {id === 'terms' && <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price per day (PKR)" hint="For the car. A driver, trips outside the base city and one-way drop-off are added on top as you set below."><input type="number" required min={1} max={1000000} className={inputClass} value={fleet.dailyRate} onChange={(event) => setFleet({ ...fleet, dailyRate: Number(event.target.value) })} /></Field>
              <Field label="How many of this car?" hint="Identical cars share one listing and calendar. We never book more than you have."><input type="number" required min={1} max={500} className={inputClass} value={fleet.count} onChange={(event) => setFleet({ ...fleet, count: Number(event.target.value) })} /></Field>
            </div>
            <CarTermsFields value={car} onChange={setCar} />
          </div>}
          {id === 'photos' && <PhotoManager photos={photos} onChange={setPhotos} max={20} label="Car photos" onUploadingChange={setUploading} />}
          {id === 'review' && <dl className="divide-y divide-slate-100 text-sm">
            {reviewRows.map(([label, text, target]) => (
              <div key={label} className="grid gap-1 py-3 sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:items-center">
                <dt className="font-semibold text-slate-500">{label}</dt><dd className="text-slate-900">{text}</dd>
                <button type="button" onClick={() => go(target)} className="min-h-11 justify-self-start text-sm font-semibold text-[#006F3C] underline">Edit</button>
              </div>
            ))}
          </dl>}
        </div>

        <div className="flex flex-wrap justify-between gap-3">
          <button type="button" disabled={busy || step === 0} onClick={() => go(step - 1)} className={secondaryButton}>Back</button>
          {id === 'review'
            ? <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy || uploading} onClick={() => finish(false)} className={secondaryButton}>Save as draft</button>
                <button type="button" disabled={busy || uploading} onClick={() => finish(true)} className={primaryButton}>{busy && <LoaderCircle className="size-4 animate-spin" />}Submit for review</button>
              </div>
            : <button type="button" disabled={uploading} onClick={() => go(step + 1)} className={primaryButton}>Continue</button>}
        </div>
      </div>
    </div>
  );
}
