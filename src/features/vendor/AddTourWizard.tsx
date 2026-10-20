import { useState, type ReactNode } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { api, type LatLng, type VendorListing } from '../../shared/api/api';
import { LocationPinField } from '../../shared/components/MapPin';
import { useReasonDialog } from '../../shared/components/ReasonDialog';
import { PAYMENT_LABELS } from '../../shared/utils/stayInfo';
import { formatDateForDisplay } from '../../shared/utils/date';
import { DeparturesField, TourBasicsFields, TourPlanFields, TourTermsFields, tourDraft, tourInput, tourProblem } from './TourFields';
import PhotoManager, { toPhotoInput, type EditablePhoto } from './PhotoManager';
import { primaryButton, secondaryButton } from './RoomManager';

const inputClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';

type StepId = 'tour' | 'about' | 'plan' | 'price' | 'photos' | 'review';
const STEPS: Array<[StepId, string, string, string]> = [
  ['tour', 'The tour', 'Type, days, meeting point', 'What kind of tour is it?'],
  ['about', 'Name & description', 'Area, map, description', 'Tell guests about it'],
  ['plan', 'Itinerary', 'Day by day, what’s included', 'What happens on the tour?'],
  ['price', 'Price & dates', 'Per person, seats, departures', 'Price, group size and dates'],
  ['photos', 'Photos', 'Places on the route', 'Show guests the tour'],
  ['review', 'Review & submit', 'Checked by GBBookings', 'Check everything, then submit'],
];

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: ReactNode }) {
  return <label className={`block text-sm font-semibold text-slate-700 ${wide ? 'sm:col-span-2' : ''}`}>{label}{children}{hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}</label>;
}

/**
 * Add a tour step by step. One listing is one tour; its single booking unit holds the adult price and the seats per departure.
 * Nothing is saved until the last step creates the draft (and its seat entry), then optionally submits it.
 */
export default function AddTourWizard({ onDone, onExit }: { onDone: (listing: VendorListing, message: string) => void; onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [tour, setTour] = useState(() => tourDraft());
  const [about, setAbout] = useState({ title: '', location: '', description: '' });
  const [pin, setPin] = useState<LatLng>();
  const [seats, setSeats] = useState({ adultPrice: 0, count: 12 });
  const [departures, setDepartures] = useState<string[]>([]);
  const [photos, setPhotos] = useState<EditablePhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { askReason, dialog } = useReasonDialog();
  const id = STEPS[step][0];

  const problems: Record<StepId, string> = {
    tour: tourProblem(tour, 'tour'),
    about: about.title.trim().length < 2 ? 'Give the tour a name.' : about.location.trim().length < 2 ? 'Add the area the tour covers.' : about.description.trim().length < 20 ? 'Write a description of at least 20 characters.' : '',
    plan: tourProblem(tour, 'plan'),
    price: seats.adultPrice <= 0 ? 'Set the price per adult.' : seats.count < 1 ? 'Set how many guests can join one departure.'
      : tour.schedule === 'fixed' && departures.length === 0 ? 'Add at least one departure date.' : tourProblem(tour, 'price'),
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
    if ((about.title || about.description || photos.length) && await askReason({ title: 'Leave without saving?', destructive: true, confirmLabel: 'Discard tour', description: 'Nothing has been saved yet. Your entries on these steps will be lost.' }) === null) return;
    onExit();
  };

  const finish = async (submit: boolean) => {
    const blocking = firstProblem(STEPS.length);
    if (blocking) { setError(blocking); return; }
    setBusy(true); setError('');
    let created: VendorListing | null = null;
    try {
      created = (await api.createHotelListing({
        type: 'tour', title: about.title.trim(), location: about.location.trim(), description: about.description.trim(), price: seats.adultPrice,
        imageIds: photos.flatMap((photo) => (photo.mediaId ? [photo.mediaId] : [])), photos: toPhotoInput(photos),
        tourSpecs: tourInput(tour), ...(tour.schedule === 'fixed' ? { departures } : {}),
        stayInfo: { paymentMethods: tour.paymentMethods }, ...(pin ? { coordinates: pin } : {}),
      })).data;
      // The tour's single booking unit: one seat per traveller, the count is the seats per departure.
      await api.addHotelRoom(created.id, {
        name: created.title, bedType: tour.category, maxAdults: 1, maxChildren: 1, totalRooms: seats.count, basePrice: seats.adultPrice, amenities: [],
      });
      if (submit) created = (await api.submitHotelListing(created.id)).data;
      onDone(created, submit ? `${created.title} was submitted. You will get an email once GBBookings has checked it.` : `${created.title} is saved as a draft. Submit it from its Price & seats tab when ready.`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'The tour could not be saved.';
      if (created) onDone(created, `${created.title} was saved as a draft, but not everything went through: ${message} Finish it below.`);
      else setError(message);
    } finally { setBusy(false); }
  };

  const reviewRows: Array<[string, string, number]> = [
    ['Tour', `${tour.category} · ${tour.durationDays} day${tour.durationDays === 1 ? '' : 's'} · ${tour.difficulty}${tour.minAge ? ` · age ${tour.minAge}+` : ''}`, 0],
    ['Meeting point', `${tour.meetingPoint || '—'}${tour.startTime ? ` at ${tour.startTime}` : ''}`, 0],
    ['Name & area', `${about.title || '—'} · ${about.location || '—'}${pin ? ' · map pin set' : ''}`, 1],
    ['Itinerary', `${tour.itinerary.filter((day) => day.title.trim()).length} day(s) · includes ${tour.included.join(', ') || 'nothing listed'}`, 2],
    ['Price', `PKR ${seats.adultPrice.toLocaleString()} per adult${tour.childPricing ? ` · PKR ${tour.childPrice.toLocaleString()} per child` : ''} · ${seats.count} seats per departure`, 3],
    ['Dates', tour.schedule === 'daily' ? 'Any day you have not closed' : departures.map(formatDateForDisplay).join(', ') || '—', 3],
    ['Payment', tour.paymentMethods.map((method) => PAYMENT_LABELS[method]).join(', ') || '—', 3],
    ['Photos', `${photos.length} photo${photos.length === 1 ? '' : 's'}`, 4],
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
          {id === 'tour' && <TourBasicsFields value={tour} onChange={setTour} />}
          {id === 'about' && <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tour name" hint="e.g. “Hunza Valley 3-day tour” or “Rakaposhi Base Camp trek”."><input required maxLength={160} className={inputClass} value={about.title} onChange={(event) => setAbout({ ...about, title: event.target.value })} /></Field>
            <Field label="Area" hint="Where the tour goes, e.g. Hunza, Gilgit-Baltistan."><input required maxLength={240} className={inputClass} placeholder="Hunza, Gilgit-Baltistan" value={about.location} onChange={(event) => setAbout({ ...about, location: event.target.value })} /></Field>
            <Field label="Description" hint="Who it suits, the highlights, fitness needed, what to bring." wide><textarea required minLength={20} maxLength={10000} className={`${inputClass} min-h-28 py-3`} value={about.description} onChange={(event) => setAbout({ ...about, description: event.target.value })} /></Field>
            <div className="sm:col-span-2"><LocationPinField value={pin} onChange={setPin} location={about.location} /></div>
          </div>}
          {id === 'plan' && <TourPlanFields value={tour} onChange={setTour} />}
          {id === 'price' && <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price per adult (PKR)" hint="For the whole tour, not per day."><input type="number" required min={1} max={1000000} className={inputClass} value={seats.adultPrice} onChange={(event) => setSeats({ ...seats, adultPrice: Number(event.target.value) })} /></Field>
              <Field label="Seats per departure" hint="The most guests one departure takes. We never book more."><input type="number" required min={1} max={500} className={inputClass} value={seats.count} onChange={(event) => setSeats({ ...seats, count: Number(event.target.value) })} /></Field>
            </div>
            <TourTermsFields value={tour} onChange={setTour} />
            {tour.schedule === 'fixed' && <div className="rounded-xl border border-slate-200 p-4"><p className="mb-3 text-sm font-semibold text-slate-700">Departure dates</p><DeparturesField value={departures} onChange={setDepartures} /></div>}
          </div>}
          {id === 'photos' && <PhotoManager photos={photos} onChange={setPhotos} max={20} label="Tour photos" onUploadingChange={setUploading} />}
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
