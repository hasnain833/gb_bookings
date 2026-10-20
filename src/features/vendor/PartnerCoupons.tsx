import { useEffect, useState, type FormEvent } from 'react';
import { LoaderCircle, TicketPercent } from 'lucide-react';
import { api, type PartnerCoupon } from '../../shared/api/api';
import { formatDateForDisplay } from '../../shared/utils/date';

const fieldClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';
const emptyForm = { code: '', kind: 'percent' as PartnerCoupon['kind'], value: '', validUntil: '', maxUses: '' };

/** The partner's promo codes for all of their properties: create one, or switch it off. */
export default function PartnerCoupons() {
  const [coupons, setCoupons] = useState<PartnerCoupon[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.getPartnerCoupons().then(setCoupons).catch((reason: Error) => setError(reason.message)); }, []);

  const create = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const coupon = await api.createPartnerCoupon({
        code: form.code.trim(), kind: form.kind, value: Number(form.value),
        validUntil: form.validUntil || undefined, maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      });
      setCoupons((items) => [coupon, ...(items ?? [])]); setForm(emptyForm);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The promo code could not be created.'); }
    finally { setBusy(false); }
  };
  const toggle = async (coupon: PartnerCoupon) => {
    setError('');
    try { const saved = await api.setPartnerCouponActive(coupon.id, !coupon.active); setCoupons((items) => items?.map((item) => item.id === saved.id ? saved : item) ?? null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The promo code could not be updated.'); }
  };

  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="partner-coupons-heading">
      <div className="flex items-center gap-3"><TicketPercent className="size-5 text-[#006F3C]" /><h2 id="partner-coupons-heading" className="font-bold text-slate-900">Promo codes</h2></div>
      <form onSubmit={create} className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <label className="block text-sm font-semibold text-slate-800">Code<input required pattern="[A-Za-z0-9-]{3,20}" title="3–20 letters, digits or dashes" maxLength={20} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="SUMMER10" className={fieldClass + ' uppercase'} /></label>
        <label className="block text-sm font-semibold text-slate-800">Discount
          <span className="mt-1.5 flex gap-2">
            <input required type="number" min={1} max={form.kind === 'percent' ? 90 : 1_000_000} value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} className={fieldClass.replace('mt-1.5 ', '')} aria-label="Discount amount" />
            <select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as PartnerCoupon['kind'] })} className={fieldClass.replace('mt-1.5 w-full ', 'w-24 ')} aria-label="Discount type"><option value="percent">%</option><option value="amount">PKR</option></select>
          </span>
        </label>
        <label className="block text-sm font-semibold text-slate-800">Book by <span className="font-normal text-slate-500">(optional)</span><input type="date" value={form.validUntil} onChange={(event) => setForm({ ...form, validUntil: event.target.value })} className={fieldClass} /></label>
        <label className="block text-sm font-semibold text-slate-800">Max uses <span className="font-normal text-slate-500">(optional)</span><input type="number" min={1} max={100000} value={form.maxUses} onChange={(event) => setForm({ ...form, maxUses: event.target.value })} className={fieldClass} /></label>
        <button disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white hover:bg-[#005C32] disabled:opacity-50">{busy && <LoaderCircle className="size-4 animate-spin" />}Create code</button>
      </form>
      <p className="text-xs text-slate-500">Codes work on all your properties, on the room price and meals. A cancelled booking gives its use back. Codes can be switched off but not changed, so existing bookings keep their deal.</p>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {!coupons && !error && <div className="flex justify-center py-8"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading promo codes" /></div>}
      {coupons?.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No promo codes yet.</p>}
      {coupons && coupons.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="text-xs text-slate-500"><tr><th className="py-2 pr-4 font-medium">Code</th><th className="py-2 pr-4 font-medium">Discount</th><th className="py-2 pr-4 font-medium">Book by</th><th className="py-2 pr-4 font-medium">Used</th><th className="py-2 font-medium"><span className="sr-only">Status</span></th></tr></thead>
        <tbody className="divide-y divide-slate-100">{coupons.map((coupon) => (
          <tr key={coupon.id} className={coupon.active ? '' : 'text-slate-400'}>
            <td className="py-3 pr-4 font-mono font-semibold">{coupon.code}</td>
            <td className="py-3 pr-4">{coupon.kind === 'percent' ? `${coupon.value}%` : `PKR ${coupon.value.toLocaleString()}`}</td>
            <td className="py-3 pr-4">{coupon.validUntil ? formatDateForDisplay(coupon.validUntil) : 'No end date'}</td>
            <td className="py-3 pr-4">{coupon.uses}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}</td>
            <td className="py-3 text-right"><button type="button" onClick={() => toggle(coupon)} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{coupon.active ? 'Switch off' : 'Switch on'}</button></td>
          </tr>
        ))}</tbody>
      </table></div>}
    </section>
  );
}
