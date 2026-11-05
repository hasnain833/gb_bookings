import { BREAKFAST_KINDS, FACILITIES, type PropertyExtras } from '../../shared/utils/rooms';
import Select from '../../shared/components/Select';

const inputClass = 'mt-1 min-h-11 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C]';
const checkClass = 'flex min-h-11 items-center gap-2 text-sm';

export type Extras = Required<Pick<PropertyExtras, 'parking'>> & Pick<PropertyExtras, 'breakfast' | 'licenceNumber' | 'stars'>;
export const defaultExtras = (hotel: boolean): Extras => ({
  parking: { available: 'free', onSite: true, reservation: false },
  ...(hotel ? { breakfast: { offered: false, included: false } } : {}),
});

export function extrasProblem(extras: Extras) {
  if (extras.breakfast?.offered && !extras.breakfast.included && !extras.breakfast.price) return 'Set the breakfast price per person, or mark it included in the room price.';
  if (extras.parking.available === 'paid' && !extras.parking.price) return 'Set the parking price per day.';
  return '';
}

/** Only what applies is sent: no price for free parking or included breakfast. */
export function extrasInput(extras: Extras): PropertyExtras {
  const { breakfast, parking } = extras;
  return {
    ...(breakfast ? { breakfast: breakfast.offered ? { offered: true, included: breakfast.included, ...(breakfast.included ? {} : { price: breakfast.price }), kinds: breakfast.kinds ?? [] } : { offered: false, included: false } } : {}),
    parking: parking.available === 'none' ? { available: 'none' } : { available: parking.available, onSite: Boolean(parking.onSite), reservation: Boolean(parking.reservation), ...(parking.available === 'paid' ? { price: parking.price } : {}) },
    ...(extras.licenceNumber?.trim() ? { licenceNumber: extras.licenceNumber.trim() } : {}),
    ...(extras.stars ? { stars: extras.stars } : {}),
  };
}

/** Official hotel class. Left out of homestays, which aren't graded. */
export function StarsField({ value, onChange, className }: { value?: number; onChange: (stars?: number) => void; className: string }) {
  return <Select aria-label="Official star rating" value={value ?? ''} onChange={(event) => onChange(Number(event.target.value) || undefined)} className={className}>
    <option value="">Not rated</option>
    {[1, 2, 3, 4, 5].map((stars) => <option key={stars} value={stars}>{stars} star{stars > 1 ? 's' : ''}</option>)}
  </Select>;
}

/** Facilities as one fixed checklist (so search filters match); words saved before the list existed stay listed below it. */
export function FacilityChecklist({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const others = value.filter((item) => !(FACILITIES as readonly string[]).includes(item));
  return (
    <fieldset>
      <legend className="sr-only">Facilities</legend>
      <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
        {FACILITIES.map((item) => (
          <label key={item} className={checkClass}>
            <input type="checkbox" className="size-4 accent-[#006F3C]" checked={value.includes(item)} onChange={(event) => onChange(event.target.checked ? [...value, item] : value.filter((entry) => entry !== item))} />{item}
          </label>
        ))}
      </div>
      {others.length > 0 && <p className="mt-2 text-xs text-slate-500">Also listed: {others.map((item) => (
        <button key={item} type="button" onClick={() => onChange(value.filter((entry) => entry !== item))} className="mr-2 min-h-8 underline" aria-label={`Remove ${item}`}>{item} ×</button>
      ))}</p>}
    </fieldset>
  );
}

const number = (value: number | undefined, set: (value: number | undefined) => void, label: string) => (
  <label className="block text-sm font-semibold text-slate-700">{label}
    <input type="number" min={1} max={100000} required value={value ?? ''} onChange={(event) => set(event.target.value === '' ? undefined : Number(event.target.value))} className={inputClass} />
  </label>
);

/** Breakfast (hotels; homestays set meals with the host) and parking. */
export function ExtrasFields({ value, onChange }: { value: Extras; onChange: (value: Extras) => void }) {
  const { breakfast, parking } = value;
  const setBreakfast = (next: Partial<NonNullable<Extras['breakfast']>>) => onChange({ ...value, breakfast: { offered: false, included: false, ...breakfast, ...next } });
  const setParking = (next: Partial<Extras['parking']>) => onChange({ ...value, parking: { ...parking, ...next } });
  return (
    <div className="space-y-6">
      {breakfast && (
        <fieldset className="space-y-2">
          <legend className="text-base font-bold">Breakfast</legend>
          <div className="flex flex-wrap gap-x-6">
            {[[true, 'Yes, we serve breakfast'], [false, 'No breakfast']].map(([offered, label]) => (
              <label key={String(offered)} className={checkClass}><input type="radio" name="breakfast-offered" className="size-4 accent-[#006F3C]" checked={breakfast.offered === offered} onChange={() => setBreakfast({ offered: offered as boolean })} />{label}</label>
            ))}
          </div>
          {breakfast.offered && <>
            <div className="flex flex-wrap gap-x-6">
              {[[true, 'Included in the room price'], [false, 'Guests pay extra']].map(([included, label]) => (
                <label key={String(included)} className={checkClass}><input type="radio" name="breakfast-included" className="size-4 accent-[#006F3C]" checked={breakfast.included === included} onChange={() => setBreakfast({ included: included as boolean })} />{label}</label>
              ))}
            </div>
            {!breakfast.included && number(breakfast.price, (price) => setBreakfast({ price }), 'Price per person (PKR)')}
            <div className="flex flex-wrap gap-x-4">
              <span className="w-full text-sm font-semibold text-slate-700">Kinds of breakfast</span>
              {BREAKFAST_KINDS.map((kind) => (
                <label key={kind} className={checkClass}><input type="checkbox" className="size-4 accent-[#006F3C]" checked={breakfast.kinds?.includes(kind) ?? false}
                  onChange={(event) => setBreakfast({ kinds: event.target.checked ? [...(breakfast.kinds ?? []), kind] : (breakfast.kinds ?? []).filter((item) => item !== kind) })} />{kind}</label>
              ))}
            </div>
          </>}
        </fieldset>
      )}
      <fieldset className="space-y-2">
        <legend className="text-base font-bold">Parking</legend>
        <div className="flex flex-wrap gap-x-6">
          {([['free', 'Free parking'], ['paid', 'Paid parking'], ['none', 'No parking']] as const).map(([available, label]) => (
            <label key={available} className={checkClass}><input type="radio" name="parking" className="size-4 accent-[#006F3C]" checked={parking.available === available} onChange={() => setParking({ available })} />{label}</label>
          ))}
        </div>
        {parking.available === 'paid' && number(parking.price, (price) => setParking({ price }), 'Price per day (PKR)')}
        {parking.available !== 'none' && <div className="flex flex-wrap gap-x-6">
          <label className={checkClass}><input type="checkbox" className="size-4 accent-[#006F3C]" checked={Boolean(parking.onSite)} onChange={(event) => setParking({ onSite: event.target.checked })} />At the property (not down the road)</label>
          <label className={checkClass}><input type="checkbox" className="size-4 accent-[#006F3C]" checked={Boolean(parking.reservation)} onChange={(event) => setParking({ reservation: event.target.checked })} />Guests must reserve a space</label>
        </div>}
      </fieldset>
    </div>
  );
}

/** Guest-facing lines: "Breakfast included (Desi, Continental)", "Free parking at the property". */
export function extrasLines(extras: PropertyExtras) {
  const { breakfast, parking } = extras;
  return [
    breakfast?.offered && `Breakfast ${breakfast.included ? 'included' : `PKR ${breakfast.price?.toLocaleString()} per person`}${breakfast.kinds?.length ? ` (${breakfast.kinds.join(', ')})` : ''}`,
    parking && (parking.available === 'none' ? 'No parking'
      : `${parking.available === 'free' ? 'Free' : `Paid (PKR ${parking.price?.toLocaleString()} a day)`} parking${parking.onSite ? ' at the property' : ' nearby'}${parking.reservation ? ', reserve ahead' : ''}`),
  ].filter(Boolean) as string[];
}
