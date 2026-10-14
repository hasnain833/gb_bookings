import { useState } from 'react';

/** Toggle chips for common values plus "add your own". The value is the selected list, in order. */
export default function ChipInput({ label, value, onChange, suggestions }: {
  label: string; value: string[]; onChange: (value: string[]) => void; suggestions: string[];
}) {
  const [custom, setCustom] = useState('');
  const options = [...suggestions, ...value.filter((item) => !suggestions.includes(item))];
  const toggle = (item: string) => onChange(value.includes(item) ? value.filter((entry) => entry !== item) : [...value, item]);
  const add = () => {
    const item = custom.trim();
    if (item && !value.includes(item)) onChange([...value, item]);
    setCustom('');
  };
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-semibold text-slate-700">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((item) => {
          const on = value.includes(item);
          return <button key={item} type="button" aria-pressed={on} onClick={() => toggle(item)}
            className={`min-h-10 rounded-full border px-3.5 text-sm font-semibold ${on ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}>{on ? '✓ ' : ''}{item}</button>;
        })}
        <span className="flex min-h-10 items-center rounded-full border border-dashed border-slate-300 bg-white pl-3.5 pr-1">
          <input aria-label={`Add your own ${label.toLowerCase()}`} placeholder="Add your own" value={custom} maxLength={100}
            onChange={(event) => setCustom(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }}
            className="w-32 bg-transparent text-sm outline-none" />
          <button type="button" onClick={add} disabled={!custom.trim()} className="min-h-9 rounded-full px-3 text-sm font-bold text-[#006F3C] disabled:opacity-40">Add</button>
        </span>
      </div>
    </fieldset>
  );
}
