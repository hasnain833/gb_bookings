import { useState, type FormEvent } from 'react';
import { LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { api, type VendorListing } from '../../shared/api/api';
import { CANCELLATION_POLICIES, CANCELLATION_POLICY_KEYS, DEFAULT_CANCELLATION_POLICY, policyLines } from '../../shared/utils/cancellation';
import Select from '../../shared/components/Select';

const fieldClass = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';
type Fee = NonNullable<VendorListing['fees']>[number];

/** The listing's cancellation policy and the fees it adds on top of the price. Guests see both before they book. */
export default function PoliciesFeesPanel({ listing, onChange }: { listing: VendorListing; onChange: (listing: VendorListing, message?: string) => void }) {
  const [policy, setPolicy] = useState(listing.cancellationPolicy ?? DEFAULT_CANCELLATION_POLICY);
  const [fees, setFees] = useState<Fee[]>(listing.fees ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const setFee = (index: number, patch: Partial<Fee>) => setFees(fees.map((fee, at) => at === index ? { ...fee, ...patch } : fee));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const updated = await api.updateHotelListing(listing.id, { cancellationPolicy: policy, fees: fees.map((fee) => ({ ...fee, name: fee.name.trim() })) });
      onChange(updated, updated.pendingRevision ? 'Saved. Your changes go live once GBBookings approves them.' : 'Policy and fees saved.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save.'); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6">
      <fieldset className="space-y-3">
        <legend className="text-base font-bold text-slate-900">Cancellation policy</legend>
        <p className="text-sm text-slate-500">How much a guest who paid online gets back. Existing bookings keep the policy they were made under. A guest paying on arrival has nothing to refund.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {CANCELLATION_POLICY_KEYS.map((key) => (
            <label key={key} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${policy === key ? 'border-[#006F3C] bg-emerald-50/50' : 'border-slate-200'}`}>
              <input type="radio" name="policy" checked={policy === key} onChange={() => setPolicy(key)} className="mt-1 accent-[#006F3C]" />
              <span>
                <span className="block font-semibold text-slate-900">{CANCELLATION_POLICIES[key].label}</span>
                {policyLines(key).map((line) => <span key={line} className="block text-sm text-slate-500">{line}</span>)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-base font-bold text-slate-900">Fees</legend>
        <p className="text-sm text-slate-500">Charges you add to every booking, such as a service charge. Guests see each one as its own line. Leave this empty if your price already includes everything. GBBookings sets taxes.</p>
        {fees.map((fee, index) => (
          <div key={index} className="flex flex-wrap items-end gap-3">
            <label className="min-w-48 flex-1 text-sm font-semibold text-slate-700">Name<input required minLength={2} maxLength={60} value={fee.name} placeholder="e.g. Service charge" onChange={(event) => setFee(index, { name: event.target.value })} className={`${fieldClass} mt-1.5 font-normal`} /></label>
            <label className="text-sm font-semibold text-slate-700">Charged as<Select value={fee.kind} onChange={(event) => setFee(index, { kind: event.target.value as Fee['kind'] })} className={`${fieldClass} mt-1.5 font-normal`}><option value="percent">Percent of the price</option><option value="amount">PKR per booking</option></Select></label>
            <label className="w-32 text-sm font-semibold text-slate-700">{fee.kind === 'percent' ? 'Percent' : 'PKR'}<input required type="number" min={fee.kind === 'percent' ? 0.01 : 1} max={fee.kind === 'percent' ? 50 : 100000} step={fee.kind === 'percent' ? 0.01 : 1} value={fee.value || ''} onChange={(event) => setFee(index, { value: Number(event.target.value) })} className={`${fieldClass} mt-1.5 font-normal`} /></label>
            <button type="button" aria-label={`Remove ${fee.name || 'fee'}`} onClick={() => setFees(fees.filter((_, at) => at !== index))} className="flex size-11 items-center justify-center rounded-lg border border-slate-300 text-rose-700 hover:bg-rose-50"><Trash2 className="size-4" /></button>
          </div>
        ))}
        {fees.length < 5 && <button type="button" onClick={() => setFees([...fees, { name: '', kind: 'percent', value: 0 }])} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Plus className="size-4" />Add a fee</button>}
      </fieldset>

      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#006F3C] px-5 text-sm font-semibold text-white hover:bg-[#005c32] disabled:opacity-50">{busy && <LoaderCircle className="size-4 animate-spin" />}Save policy and fees</button>
    </form>
  );
}
