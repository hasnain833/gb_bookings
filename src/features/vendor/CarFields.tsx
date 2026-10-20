import type { ReactNode } from 'react';
import type { CarSpecsInput } from '../../shared/api/api';
import type { CarCategory, CarSpecs, DriverMode, StayInfo } from '../../types';
import { PAYMENT_LABELS } from '../../shared/utils/stayInfo';
import ChipInput from './ChipInput';

export const CAR_CATEGORIES: CarCategory[] = ['Sedan', 'Hatchback', 'SUV', '4x4 Jeep', 'Van', 'Coaster'];
export const CAR_FEATURES = ['Air conditioning', 'Heater', '4x4', 'Roof carrier', 'Child seat', 'Bluetooth / USB', 'First-aid kit', 'Snow chains'];
export const DRIVER_LABELS: Record<DriverMode, string> = { with_driver: 'With driver only', self_drive: 'Self-drive only', both: 'Guest chooses' };
type PaymentMethod = StayInfo['paymentMethods'][number];

export type CarDraft = {
  make: string; model: string; year: number; category: CarCategory; transmission: 'Automatic' | 'Manual';
  fuelType: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric'; seats: number; luggage: number; features: string[];
  driverMode: DriverMode; driverPerDay: number; fuelIncluded: boolean;
  chargesOutside: boolean; outsideCityPerDay: number;
  oneWay: 'not_offered' | 'flat' | 'on_request'; oneWayFee: number;
  deposit: number; minDriverAge: number; pickupNote: string; paymentMethods: PaymentMethod[];
};

export const carDraft = (specs?: CarSpecs, paymentMethods: PaymentMethod[] = ['cash']): CarDraft => ({
  make: specs?.make ?? '', model: specs?.model ?? '', year: specs?.year ?? new Date().getFullYear() - 5,
  category: (CAR_CATEGORIES as string[]).includes(specs?.category ?? '') ? specs!.category as CarCategory : 'SUV',
  transmission: specs?.transmission ?? 'Automatic',
  fuelType: (['Petrol', 'Diesel', 'Hybrid', 'Electric'] as const).find((fuel) => fuel === specs?.fuelType) ?? 'Petrol',
  seats: specs?.seats ?? 4, luggage: specs?.luggage ?? 2, features: specs?.features ?? [],
  driverMode: specs?.driverMode ?? 'with_driver', driverPerDay: specs?.driverPerDay ?? 0, fuelIncluded: specs?.fuelIncluded ?? false,
  chargesOutside: specs?.outsideCityPerDay !== undefined, outsideCityPerDay: specs?.outsideCityPerDay ?? 0,
  oneWay: specs?.oneWay ?? 'not_offered', oneWayFee: specs?.oneWayFee ?? 0,
  deposit: specs?.deposit ?? 0, minDriverAge: specs?.minDriverAge ?? 21, pickupNote: specs?.pickupNote ?? '', paymentMethods,
});

const selfDrive = (draft: CarDraft) => draft.driverMode !== 'with_driver';

export const carInput = (draft: CarDraft): CarSpecsInput => ({
  make: draft.make.trim(), model: draft.model.trim(), year: draft.year, category: draft.category, transmission: draft.transmission,
  fuelType: draft.fuelType, seats: draft.seats, luggage: draft.luggage, features: draft.features,
  driverMode: draft.driverMode, driverPerDay: draft.driverMode === 'self_drive' ? 0 : draft.driverPerDay, fuelIncluded: draft.fuelIncluded,
  ...(draft.chargesOutside ? { outsideCityPerDay: draft.outsideCityPerDay } : {}),
  oneWay: draft.oneWay, ...(draft.oneWay === 'flat' ? { oneWayFee: draft.oneWayFee } : {}),
  ...(selfDrive(draft) ? { deposit: draft.deposit, minDriverAge: draft.minDriverAge } : {}),
  ...(draft.pickupNote.trim() ? { pickupNote: draft.pickupNote.trim() } : {}),
});

export function carProblem(draft: CarDraft, part: 'car' | 'terms') {
  if (part === 'car') {
    if (draft.make.trim().length < 2) return 'Add the make, e.g. Toyota.';
    if (!draft.model.trim()) return 'Add the model, e.g. Prado.';
    if (draft.year < 1980 || draft.year > new Date().getFullYear() + 1) return 'Check the model year.';
    if (draft.seats < 1) return 'Add the number of passenger seats.';
    return '';
  }
  if (!draft.paymentMethods.length) return 'Choose at least one way guests can pay at pickup.';
  if (draft.oneWay === 'flat' && draft.oneWayFee <= 0) return 'Set the one-way drop-off fee, or choose "price on request".';
  if (selfDrive(draft) && (draft.minDriverAge < 18 || draft.minDriverAge > 30)) return 'Set a minimum self-drive age between 18 and 30.';
  return '';
}

const fieldClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: ReactNode }) {
  return <label className={`block text-sm font-semibold text-slate-700 ${wide ? 'sm:col-span-2' : ''}`}>{label}{children}{hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}</label>;
}

function Money({ label, hint, value, onChange }: { label: string; hint?: string; value: number; onChange: (value: number) => void }) {
  return (
    <Field label={label} hint={hint}>
      <span className="mt-1.5 flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:border-[#006F3C]">
        <span className="mr-1.5 text-sm font-semibold text-slate-500">PKR</span>
        <input type="number" min={0} max={1000000} step={1} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full bg-transparent text-[15px] font-normal outline-none" />
      </span>
    </Field>
  );
}

/** What the car is: make, model, size and features. */
export function CarBasicsFields({ value, onChange }: { value: CarDraft; onChange: (draft: CarDraft) => void }) {
  const set = <K extends keyof CarDraft>(key: K, next: CarDraft[K]) => onChange({ ...value, [key]: next });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Make"><input required maxLength={60} className={fieldClass} placeholder="Toyota" value={value.make} onChange={(event) => set('make', event.target.value)} /></Field>
      <Field label="Model"><input required maxLength={60} className={fieldClass} placeholder="Prado TX" value={value.model} onChange={(event) => set('model', event.target.value)} /></Field>
      <Field label="Model year"><input type="number" required min={1980} max={new Date().getFullYear() + 1} className={fieldClass} value={value.year} onChange={(event) => set('year', Number(event.target.value))} /></Field>
      <Field label="Type"><select className={fieldClass} value={value.category} onChange={(event) => set('category', event.target.value as CarCategory)}>{CAR_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field>
      <Field label="Transmission"><select className={fieldClass} value={value.transmission} onChange={(event) => set('transmission', event.target.value as CarDraft['transmission'])}><option>Automatic</option><option>Manual</option></select></Field>
      <Field label="Fuel"><select className={fieldClass} value={value.fuelType} onChange={(event) => set('fuelType', event.target.value as CarDraft['fuelType'])}>{['Petrol', 'Diesel', 'Hybrid', 'Electric'].map((fuel) => <option key={fuel}>{fuel}</option>)}</select></Field>
      <Field label="Passenger seats" hint="Not counting the driver."><input type="number" required min={1} max={40} className={fieldClass} value={value.seats} onChange={(event) => set('seats', Number(event.target.value))} /></Field>
      <Field label="Large bags"><input type="number" min={0} max={40} className={fieldClass} value={value.luggage} onChange={(event) => set('luggage', Number(event.target.value))} /></Field>
      <div className="sm:col-span-2"><ChipInput label="Features" value={value.features} onChange={(features) => set('features', features)} suggestions={CAR_FEATURES} /></div>
    </div>
  );
}

/** How the car is rented: driver, fuel, out-of-city and one-way charges, self-drive rules, and payment at pickup. */
export function CarTermsFields({ value, onChange }: { value: CarDraft; onChange: (draft: CarDraft) => void }) {
  const set = <K extends keyof CarDraft>(key: K, next: CarDraft[K]) => onChange({ ...value, [key]: next });
  const togglePayment = (method: PaymentMethod) => set('paymentMethods', value.paymentMethods.includes(method) ? value.paymentMethods.filter((item) => item !== method) : [...value.paymentMethods, method]);
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold text-slate-700">Driver</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {(Object.keys(DRIVER_LABELS) as DriverMode[]).map((mode) => (
            <label key={mode} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${value.driverMode === mode ? 'border-[#006F3C] bg-emerald-50 font-semibold' : 'border-slate-300'}`}>
              <input type="radio" name="driver-mode" checked={value.driverMode === mode} onChange={() => set('driverMode', mode)} className="size-4 accent-[#006F3C]" />{DRIVER_LABELS[mode]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        {value.driverMode !== 'self_drive' && <Money label="Driver charge per day" hint="Added to the daily rate when the guest takes a driver. Use 0 if the rate already includes the driver." value={value.driverPerDay} onChange={(next) => set('driverPerDay', next)} />}
        <Field label="Fuel"><select className={fieldClass} value={value.fuelIncluded ? 'yes' : 'no'} onChange={(event) => set('fuelIncluded', event.target.value === 'yes')}><option value="no">Paid by the guest</option><option value="yes">Included in the price</option></select></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-start gap-3 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" checked={value.chargesOutside} onChange={(event) => set('chargesOutside', event.target.checked)} className="mt-0.5 size-4 accent-[#006F3C]" /><span><span className="font-semibold">Charge extra for trips outside the base city</span><span className="block text-xs text-slate-500">e.g. a car based in Skardu that goes to Hunza. Guests say so when booking.</span></span></label>
        {value.chargesOutside && <Money label="Extra per day outside the base city" value={value.outsideCityPerDay} onChange={(next) => set('outsideCityPerDay', next)} />}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="One-way drop-off" hint="Returning the car in another city."><select className={fieldClass} value={value.oneWay} onChange={(event) => set('oneWay', event.target.value as CarDraft['oneWay'])}><option value="not_offered">Not offered</option><option value="flat">Flat fee</option><option value="on_request">Offered, price on request</option></select></Field>
        {value.oneWay === 'flat' && <Money label="One-way fee per car" value={value.oneWayFee} onChange={(next) => set('oneWayFee', next)} />}
      </div>
      {value.driverMode !== 'with_driver' && <div className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
        <p className="text-sm font-semibold text-slate-700 sm:col-span-2">Self-drive rules</p>
        <Money label="Refundable deposit" hint="Paid at pickup and returned with the car. Use 0 for none." value={value.deposit} onChange={(next) => set('deposit', next)} />
        <Field label="Minimum driver age"><input type="number" min={18} max={30} className={fieldClass} value={value.minDriverAge} onChange={(event) => set('minDriverAge', Number(event.target.value))} /></Field>
      </div>}
      <fieldset>
        <legend className="text-sm font-semibold text-slate-700">How guests can pay at pickup</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
            <label key={method} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${value.paymentMethods.includes(method) ? 'border-[#006F3C] bg-emerald-50 font-semibold' : 'border-slate-300'}`}>
              <input type="checkbox" checked={value.paymentMethods.includes(method)} onChange={() => togglePayment(method)} className="size-4 accent-[#006F3C]" />{PAYMENT_LABELS[method]}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Pickup notes (optional)" hint="Shown to guests, e.g. “Free pickup from Skardu airport and hotels in town.”" wide><textarea maxLength={500} className={`${fieldClass} min-h-20 py-3`} value={value.pickupNote} onChange={(event) => set('pickupNote', event.target.value)} /></Field>
    </div>
  );
}
