import { EXPERIENCE_TYPES, MEAL_TYPES, mealLabel, type HomestaySpecs, type HomestaySpecsInput, type MealOption } from '../../shared/api/api';
import type { MealType } from '../../types';
import ChipInput from './ChipInput';
import PhotoManager, { toPhotoInput, type EditablePhoto } from './PhotoManager';

/** Editor state: every meal has a row; `offered` decides whether it is saved. */
export type HomestayDraft = Omit<HomestaySpecs, 'hostImage' | 'meals'> & { hostPhoto: EditablePhoto[]; meals: Array<MealOption & { offered: boolean }> };

export function homestayDraft(specs?: Partial<HomestaySpecs>): HomestayDraft {
  return {
    hostName: specs?.hostName ?? '', experienceType: specs?.experienceType ?? EXPERIENCE_TYPES[0], stayType: specs?.stayType ?? 'rooms',
    hostBio: specs?.hostBio ?? '', languages: specs?.languages ?? [], familyOnSite: specs?.familyOnSite ?? false,
    hostPhoto: specs?.hostImage ? [{ url: specs.hostImage }] : [],
    meals: MEAL_TYPES.map((type) => {
      const saved = specs?.meals?.find((meal) => meal.type === type);
      return { type, offered: Boolean(saved), included: saved?.included ?? type === 'breakfast', price: saved?.price ?? 0 };
    }),
  };
}

export function homestayInput(draft: HomestayDraft): HomestaySpecsInput {
  const [hostPhoto] = toPhotoInput(draft.hostPhoto);
  return {
    hostName: draft.hostName.trim(), experienceType: draft.experienceType, stayType: draft.stayType,
    hostBio: draft.hostBio?.trim() || undefined, languages: draft.languages, familyOnSite: draft.familyOnSite,
    ...(hostPhoto ? { hostPhoto } : {}),
    meals: draft.meals.filter((meal) => meal.offered).map(({ type, included, price }) => ({ type, included, price: included ? 0 : price })),
  };
}

const inputClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';

/** Host profile and meals; shown to guests on the homestay page. */
export default function HomestayHostFields({ value, onChange, onUploadingChange }: { value: HomestayDraft; onChange: (value: HomestayDraft) => void; onUploadingChange?: (uploading: boolean) => void }) {
  const setMeal = (type: MealType, patch: Partial<HomestayDraft['meals'][number]>) =>
    onChange({ ...value, meals: value.meals.map((meal) => meal.type === type ? { ...meal, ...patch } : meal) });
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">Host name<input required minLength={2} maxLength={120} className={inputClass} value={value.hostName} onChange={(e) => onChange({ ...value, hostName: e.target.value })} placeholder="Karim and family" /></label>
      <div className="sm:col-span-2"><ChipInput label="Languages spoken"value={value.languages} onChange={(languages) => onChange({ ...value, languages })} suggestions={['Urdu', 'English', 'Burushaski', 'Wakhi', 'Shina', 'Balti']} /></div>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">About the host <span className="font-normal text-slate-500">(optional)</span>
        <textarea maxLength={1000} className={`${inputClass} min-h-24 py-3`} value={value.hostBio} onChange={(e) => onChange({ ...value, hostBio: e.target.value })} placeholder="Who will welcome guests, how long you have hosted, what you love showing visitors." /></label>
      <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" checked={value.familyOnSite} onChange={(e) => onChange({ ...value, familyOnSite: e.target.checked })} className="mt-0.5 size-4 accent-[#006F3C]" />The host family lives at the property</label>
      <div className="sm:col-span-2"><PhotoManager photos={value.hostPhoto} onChange={(hostPhoto) => onChange({ ...value, hostPhoto })} max={1} label="Host photo (optional)" onUploadingChange={onUploadingChange} /></div>
      <fieldset className="space-y-2 sm:col-span-2">
        <legend className="text-sm font-semibold text-slate-700">Meals</legend>
        <p className="text-xs text-slate-500">Included meals are part of the nightly price. Extra meals are chosen by guests when booking and paid at check-in. Prices are per guest per night.</p>
        {value.meals.map((meal) => (
          <div key={meal.type} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
            <label className="flex min-w-28 items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={meal.offered} onChange={(e) => setMeal(meal.type, { offered: e.target.checked })} className="size-4 accent-[#006F3C]" />{mealLabel(meal.type)}</label>
            {meal.offered && <>
              <select aria-label={`${mealLabel(meal.type)} pricing`} value={meal.included ? 'included' : 'extra'} onChange={(e) => setMeal(meal.type, { included: e.target.value === 'included' })} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="included">Included</option><option value="extra">Extra charge</option>
              </select>
              {!meal.included && <label className="flex items-center gap-2 text-sm">PKR<input type="number" min={0} max={100000} required value={meal.price} onChange={(e) => setMeal(meal.type, { price: Number(e.target.value) })} className="min-h-11 w-28 rounded-lg border border-slate-300 px-3" /><span className="text-xs text-slate-500">per guest / night</span></label>}
            </>}
          </div>
        ))}
      </fieldset>
    </div>
  );
}
