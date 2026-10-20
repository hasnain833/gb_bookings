import { useState, type ReactNode } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { TourSpecsInput } from '../../shared/api/api';
import type { StayInfo, TourCategory, TourSpecs } from '../../types';
import { PAYMENT_LABELS } from '../../shared/utils/stayInfo';
import { formatDateForDisplay } from '../../shared/utils/date';
import ChipInput from './ChipInput';

export const TOUR_CATEGORIES: TourCategory[] = ['Trekking', 'Sightseeing', 'Jeep safari', 'Cultural', 'Adventure', 'Day trip'];
const INCLUDED = ['Guide', 'Transport', 'Hotel / camp stays', 'Breakfast', 'All meals', 'Entry tickets', 'Porters', 'Camping gear', 'Permits'];
const LANGUAGES = ['Urdu', 'English', 'Burushaski', 'Shina', 'Balti', 'Wakhi'];
type PaymentMethod = StayInfo['paymentMethods'][number];

export type TourDraft = {
  category: TourCategory; durationDays: number; difficulty: TourSpecs['difficulty']; schedule: 'fixed' | 'daily';
  meetingPoint: string; startTime: string; languages: string[]; minAge: number;
  included: string[]; excluded: string[]; itinerary: Array<{ title: string; desc: string }>;
  childPricing: boolean; childPrice: number; paymentMethods: PaymentMethod[];
};

export const tourDraft = (specs?: TourSpecs, paymentMethods: PaymentMethod[] = ['cash']): TourDraft => ({
  category: specs?.category ?? 'Sightseeing', durationDays: specs?.durationDays ?? 1, difficulty: specs?.difficulty ?? 'Easy',
  schedule: specs?.schedule ?? 'daily', meetingPoint: specs?.meetingPoint ?? '', startTime: specs?.startTime ?? '',
  languages: specs?.languages ?? ['Urdu', 'English'], minAge: specs?.minAge ?? 0,
  included: specs?.included ?? [], excluded: specs?.excluded ?? [],
  itinerary: (specs?.itinerary ?? []).map(({ title, desc }) => ({ title, desc })),
  childPricing: specs?.childPrice !== undefined, childPrice: specs?.childPrice ?? 0, paymentMethods,
});

export const tourInput = (draft: TourDraft): TourSpecsInput => ({
  category: draft.category, durationDays: draft.durationDays, difficulty: draft.difficulty, schedule: draft.schedule,
  meetingPoint: draft.meetingPoint.trim(), languages: draft.languages, included: draft.included, excluded: draft.excluded,
  // Empty days are dropped; the rest are numbered in order.
  itinerary: draft.itinerary.filter((day) => day.title.trim()).map((day, index) => ({ day: index + 1, title: day.title.trim(), desc: day.desc.trim() || day.title.trim() })),
  ...(draft.startTime ? { startTime: draft.startTime } : {}),
  ...(draft.minAge > 0 ? { minAge: draft.minAge } : {}),
  ...(draft.childPricing ? { childPrice: draft.childPrice } : {}),
});

export function tourProblem(draft: TourDraft, part: 'tour' | 'plan' | 'price') {
  if (part === 'tour') {
    if (draft.durationDays < 1 || draft.durationDays > 60) return 'Set a duration between 1 and 60 days.';
    if (draft.meetingPoint.trim().length < 2) return 'Add where the tour starts, e.g. "Hotel pickup in Karimabad".';
    return '';
  }
  if (part === 'plan') return draft.itinerary.some((day) => day.title.trim()) ? '' : 'Add at least one day to the itinerary.';
  if (!draft.paymentMethods.length) return 'Choose at least one way guests can pay.';
  return '';
}

const fieldClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: ReactNode }) {
  return <label className={`block text-sm font-semibold text-slate-700 ${wide ? 'sm:col-span-2' : ''}`}>{label}{children}{hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}</label>;
}

/** What the tour is: type, length, difficulty, where it starts and who leads it. */
export function TourBasicsFields({ value, onChange }: { value: TourDraft; onChange: (draft: TourDraft) => void }) {
  const set = <K extends keyof TourDraft>(key: K, next: TourDraft[K]) => onChange({ ...value, [key]: next });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Type of tour"><select className={fieldClass} value={value.category} onChange={(event) => set('category', event.target.value as TourCategory)}>{TOUR_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field>
      <Field label="Duration (days)" hint="1 for a day trip."><input type="number" required min={1} max={60} className={fieldClass} value={value.durationDays} onChange={(event) => set('durationDays', Number(event.target.value))} /></Field>
      <Field label="Difficulty"><select className={fieldClass} value={value.difficulty} onChange={(event) => set('difficulty', event.target.value as TourDraft['difficulty'])}><option>Easy</option><option>Moderate</option><option>Challenging</option></select></Field>
      <Field label="Minimum age" hint="0 if all ages are welcome."><input type="number" min={0} max={30} className={fieldClass} value={value.minAge} onChange={(event) => set('minAge', Number(event.target.value))} /></Field>
      <Field label="Meeting point" hint="Where guests join, e.g. “Pickup from hotels in Karimabad” or “Skardu airport”."><input required maxLength={300} className={fieldClass} value={value.meetingPoint} onChange={(event) => set('meetingPoint', event.target.value)} /></Field>
      <Field label="Start time (optional)"><input type="time" className={fieldClass} value={value.startTime} onChange={(event) => set('startTime', event.target.value)} /></Field>
      <div className="sm:col-span-2"><ChipInput label="Guide languages" value={value.languages} onChange={(languages) => set('languages', languages)} suggestions={LANGUAGES} /></div>
    </div>
  );
}

/** The plan: what is included, what is not, and the day-by-day itinerary. */
export function TourPlanFields({ value, onChange }: { value: TourDraft; onChange: (draft: TourDraft) => void }) {
  const set = <K extends keyof TourDraft>(key: K, next: TourDraft[K]) => onChange({ ...value, [key]: next });
  const setDay = (index: number, part: 'title' | 'desc', text: string) => set('itinerary', value.itinerary.map((day, at) => at === index ? { ...day, [part]: text } : day));
  return (
    <div className="space-y-6">
      <ChipInput label="Included" value={value.included} onChange={(included) => set('included', included)} suggestions={INCLUDED} />
      <ChipInput label="Not included" value={value.excluded} onChange={(excluded) => set('excluded', excluded)} suggestions={['Lunch', 'Dinner', 'Tips', 'Personal expenses', 'Travel insurance', 'Flights']} />
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-700">Itinerary</legend>
        {value.itinerary.map((day, index) => (
          <div key={index} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[70px_minmax(0,1fr)_auto] sm:items-start">
            <span className="pt-2.5 text-sm font-bold text-[#006F3C]">Day {index + 1}</span>
            <div className="space-y-2">
              <input aria-label={`Day ${index + 1} title`} maxLength={120} placeholder="e.g. Karimabad to Attabad Lake and Passu" className={fieldClass.replace('mt-1.5 ', '')} value={day.title} onChange={(event) => setDay(index, 'title', event.target.value)} />
              <textarea aria-label={`Day ${index + 1} plan`} maxLength={1000} placeholder="What happens this day: stops, walking hours, where guests sleep." className={`${fieldClass.replace('mt-1.5 ', '')} min-h-20 py-2`} value={day.desc} onChange={(event) => setDay(index, 'desc', event.target.value)} />
            </div>
            <button type="button" aria-label={`Remove day ${index + 1}`} onClick={() => set('itinerary', value.itinerary.filter((_, at) => at !== index))} className="flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-4" /></button>
          </div>
        ))}
        {value.itinerary.length < 60 && <button type="button" onClick={() => set('itinerary', [...value.itinerary, { title: '', desc: '' }])} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Plus className="size-4" />Add day {value.itinerary.length + 1}</button>}
      </fieldset>
    </div>
  );
}

/** How dates work, the child price and how guests pay. The adult price and seats live on the tour's booking unit. */
export function TourTermsFields({ value, onChange }: { value: TourDraft; onChange: (draft: TourDraft) => void }) {
  const set = <K extends keyof TourDraft>(key: K, next: TourDraft[K]) => onChange({ ...value, [key]: next });
  const togglePayment = (method: PaymentMethod) => set('paymentMethods', value.paymentMethods.includes(method) ? value.paymentMethods.filter((item) => item !== method) : [...value.paymentMethods, method]);
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold text-slate-700">When does it run?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {([['daily', 'Any day', 'Guests pick a start date. Close days you can’t run it on the calendar.'], ['fixed', 'Fixed departures', 'Only on dates you add, e.g. a group trek every other Saturday.']] as const).map(([mode, title, text]) => (
            <label key={mode} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${value.schedule === mode ? 'border-[#006F3C] bg-emerald-50' : 'border-slate-300'}`}>
              <input type="radio" name="tour-schedule" checked={value.schedule === mode} onChange={() => set('schedule', mode)} className="mt-0.5 size-4 accent-[#006F3C]" />
              <span><span className="block font-semibold text-slate-900">{title}</span><span className="text-slate-600">{text}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-start gap-3 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" checked={value.childPricing} onChange={(event) => set('childPricing', event.target.checked)} className="mt-0.5 size-4 accent-[#006F3C]" /><span><span className="font-semibold">Lower price for children</span><span className="block text-xs text-slate-500">Otherwise children pay the adult price.</span></span></label>
        {value.childPricing && <Field label="Price per child (PKR)"><input type="number" min={0} max={1000000} className={fieldClass} value={value.childPrice} onChange={(event) => set('childPrice', Number(event.target.value))} /></Field>}
      </div>
      <fieldset>
        <legend className="text-sm font-semibold text-slate-700">How guests can pay at the start of the tour</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
            <label key={method} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${value.paymentMethods.includes(method) ? 'border-[#006F3C] bg-emerald-50 font-semibold' : 'border-slate-300'}`}>
              <input type="checkbox" checked={value.paymentMethods.includes(method)} onChange={() => togglePayment(method)} className="size-4 accent-[#006F3C]" />{PAYMENT_LABELS[method]}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

const todayPk = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());

/** Departure dates for a fixed-departure tour. Removing a date stops new bookings for it; existing bookings stay. */
export function DeparturesField({ value, onChange }: { value: string[]; onChange: (dates: string[]) => void }) {
  const [date, setDate] = useState('');
  const today = todayPk();
  const add = () => { if (date && !value.includes(date)) onChange([...value, date].sort()); setDate(''); };
  const upcoming = value.filter((item) => item >= today);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm font-semibold text-slate-700">Add a departure date<input type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} className={fieldClass} /></label>
        <button type="button" disabled={!date} onClick={add} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-bold text-white disabled:opacity-50"><Plus className="size-4" />Add</button>
      </div>
      {upcoming.length === 0 ? <p className="text-sm text-slate-500">No upcoming departures yet. Guests can only book dates you add.</p>
        : <><p className="text-xs text-slate-500">Removing a date stops new bookings for it. Guests already booked on it keep their booking. To limit seats on one date, close seats on the calendar.</p><ul className="flex flex-wrap gap-2" aria-label="Departure dates">
          {upcoming.map((item) => <li key={item} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 pl-3 text-sm font-semibold text-emerald-900">
            {formatDateForDisplay(item)}
            <button type="button" aria-label={`Remove ${formatDateForDisplay(item)}`} onClick={() => onChange(value.filter((other) => other !== item))} className="flex size-9 items-center justify-center rounded-full hover:bg-emerald-100"><X className="size-3.5" /></button>
          </li>)}
        </ul></>}
    </div>
  );
}
