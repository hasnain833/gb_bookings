import type { StayInfo } from '../../types';
import { HEATING_LABELS, HOT_WATER_LABELS, MONTHS, NETWORK_LABELS, PAYMENT_LABELS, POWER_LABELS, ROAD_LABELS } from '../../shared/utils/stayInfo';

export const defaultStayInfo = (): StayInfo => ({
  childrenAllowed: true, petsAllowed: false, smokingAllowed: false, paymentMethods: ['cash'],
  powerBackup: [], heating: [], hotWater: 'always', mobileNetworks: [], roadAccess: 'car', openMonths: MONTHS.map((_, index) => index + 1),
});

/** What blocks saving; the server checks the same. */
export const stayInfoProblem = (info: StayInfo) =>
  !info.paymentMethods.length ? 'Choose at least one way guests can pay.' : !info.openMonths.length ? 'Choose the months you receive guests.' : '';

const inputClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';
const chip = (on: boolean) => `min-h-11 rounded-full border px-3.5 text-sm font-semibold ${on ? 'border-[#006F3C] bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`;

function Toggles<T extends string | number>({ legend, hint, options, value, onChange }: { legend: string; hint?: string; options: Array<[T, string]>; value: T[]; onChange: (value: T[]) => void }) {
  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="text-sm font-semibold text-slate-700">{legend}</legend>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map(([key, label]) => <button key={String(key)} type="button" aria-pressed={value.includes(key)} className={chip(value.includes(key))}
          onClick={() => onChange(value.includes(key) ? value.filter((item) => item !== key) : [...value, key])}>{label}</button>)}
      </div>
    </fieldset>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="text-sm font-semibold text-slate-700">{label}
      <div className="mt-1.5 flex gap-2">{([[true, 'Yes'], [false, 'No']] as const).map(([option, text]) =>
        <button key={text} type="button" aria-pressed={value === option} onClick={() => onChange(option)} className={chip(value === option)}>{text}</button>)}</div>
    </div>
  );
}

const entries = <K extends string>(labels: Record<K, string>) => Object.entries(labels) as Array<[K, string]>;

/** House rules guests filter on, plus the mountain essentials (power, heating, signal, road, season). */
export default function StayInfoFields({ value, onChange }: { value: StayInfo; onChange: (value: StayInfo) => void }) {
  const set = (patch: Partial<StayInfo>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <h3 className="text-base font-bold text-slate-900 sm:col-span-2">Policies</h3>
      <YesNo label="Children welcome" value={value.childrenAllowed} onChange={(childrenAllowed) => set({ childrenAllowed })} />
      <label className="text-sm font-semibold text-slate-700">Minimum age to check in <span className="font-normal text-slate-500">(optional)</span>
        <input type="number" min={0} max={30} className={inputClass} value={value.minCheckInAge ?? ''} placeholder="e.g. 18"
          onChange={(e) => set({ minCheckInAge: e.target.value === '' ? undefined : Number(e.target.value) })} /></label>
      <YesNo label="Pets allowed" value={value.petsAllowed} onChange={(petsAllowed) => set({ petsAllowed })} />
      <YesNo label="Smoking allowed indoors" value={value.smokingAllowed} onChange={(smokingAllowed) => set({ smokingAllowed })} />
      <label className="text-sm font-semibold text-slate-700">Extra bed <span className="font-normal text-slate-500">(PKR per night, empty if none)</span>
        <input type="number" min={0} max={100000} className={inputClass} value={value.extraBedPrice ?? ''} placeholder="No extra beds"
          onChange={(e) => set({ extraBedPrice: e.target.value === '' ? undefined : Number(e.target.value) })} /></label>
      <Toggles legend="How guests can pay at the property" options={entries(PAYMENT_LABELS)} value={value.paymentMethods} onChange={(paymentMethods) => set({ paymentMethods })} />

      <h3 className="pt-2 text-base font-bold text-slate-900 sm:col-span-2">Mountain essentials</h3>
      <p className="-mt-3 text-xs text-slate-500 sm:col-span-2">Travellers to Gilgit-Baltistan ask about these before booking. Be honest; it prevents bad reviews.</p>
      <Toggles legend="Power backup during load-shedding" hint="Leave empty if there is no backup." options={entries(POWER_LABELS)} value={value.powerBackup} onChange={(powerBackup) => set({ powerBackup })} />
      <Toggles legend="Heating" hint="Leave empty if rooms are not heated." options={entries(HEATING_LABELS)} value={value.heating} onChange={(heating) => set({ heating })} />
      <label className="text-sm font-semibold text-slate-700">Hot water<select className={inputClass} value={value.hotWater} onChange={(e) => set({ hotWater: e.target.value as StayInfo['hotWater'] })}>
        {entries(HOT_WATER_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="text-sm font-semibold text-slate-700">Road access<select className={inputClass} value={value.roadAccess} onChange={(e) => set({ roadAccess: e.target.value as StayInfo['roadAccess'] })}>
        {entries(ROAD_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Directions note <span className="font-normal text-slate-500">(optional)</span>
        <input maxLength={300} className={inputClass} value={value.roadNote ?? ''} placeholder="e.g. 10-minute walk up from the Altit Fort parking; we carry luggage"
          onChange={(e) => set({ roadNote: e.target.value || undefined })} /></label>
      <Toggles legend="Mobile signal at the property" hint="Leave empty if there is no signal." options={entries(NETWORK_LABELS)} value={value.mobileNetworks} onChange={(mobileNetworks) => set({ mobileNetworks })} />
      <Toggles legend="Months you receive guests" hint="Many places close in winter. Also close those dates in the availability calendar."
        options={MONTHS.map((month, index) => [index + 1, month] as [number, string])} value={value.openMonths} onChange={(openMonths) => set({ openMonths: [...openMonths].sort((a, b) => a - b) })} />
    </div>
  );
}
