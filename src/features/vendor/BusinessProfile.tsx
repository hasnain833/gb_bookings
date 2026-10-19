import { useState, type FormEvent, type ReactNode } from 'react';
import { Clock, LoaderCircle } from 'lucide-react';
import { api, type VendorChangeRequest, type VendorProfile } from '../../shared/api/api';
import { formatDateForDisplay } from '../../shared/utils/date';

const inputClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';

const detailsOf = (vendor: VendorProfile): VendorChangeRequest => ({
  name: vendor.name, email: vendor.email, phone: vendor.phone, registrationNumber: vendor.registrationNumber ?? '', taxNumber: vendor.taxNumber ?? '',
  address: { line1: vendor.address?.line1 ?? '', city: vendor.address?.city ?? '', region: vendor.address?.region ?? '' },
});

/** Approved business details; changes are sent to the platform admin for approval before they apply. */
export default function BusinessProfile({ vendor, onChange }: { vendor: VendorProfile; onChange: (vendor: VendorProfile) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<VendorChangeRequest>(() => detailsOf(vendor));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = vendor.pendingChanges;
  const current = detailsOf(vendor);
  const shown = pending ?? current;
  // Homestay hosts are verified by CNIC and proof of property, not a business registration.
  const homestay = vendor.businessType === 'homestay';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      onChange(await api.requestVendorChanges({ ...form, registrationNumber: form.registrationNumber?.trim() || undefined, taxNumber: form.taxNumber?.trim() || undefined }));
      setEditing(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to send the change request.'); }
    finally { setBusy(false); }
  };

  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-bold text-slate-900">Business details</h2><p className="mt-1 text-sm text-slate-500">Verified by GBBookings. Changes are reviewed by our team before they apply.</p></div>
        {!editing && <button type="button" onClick={() => { setForm(detailsOf(vendor)); setEditing(true); }} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">{pending ? 'Edit pending request' : 'Request changes'}</button>}
      </div>

      {pending && <p role="status" className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><Clock className="mt-0.5 size-4 shrink-0" />Change request sent {formatDateForDisplay(pending.requestedAt)}. Your current details stay in use until it’s approved. Below are the details you requested.</p>}
      {!pending && vendor.changeRejectionReason && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800"><strong>Your last change request was declined:</strong> {vendor.changeRejectionReason}</p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {editing ? <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={homestay ? 'Host or family name' : 'Business name'}><input required minLength={2} maxLength={160} className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          {!homestay && <Field label="Registration number"><input required minLength={2} maxLength={100} className={inputClass} value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} /></Field>}
          <Field label="Business email"><input required type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Business phone"><input required type="tel" minLength={7} maxLength={30} className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Street address" wide><input required minLength={2} className={inputClass} value={form.address.line1} onChange={(e) => setForm({ ...form, address: { ...form.address, line1: e.target.value } })} /></Field>
          <Field label="City"><input required minLength={2} className={inputClass} value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} /></Field>
          <Field label="Region"><input required minLength={2} className={inputClass} value={form.address.region} onChange={(e) => setForm({ ...form, address: { ...form.address, region: e.target.value } })} /></Field>
          {!homestay && <Field label="NTN / tax number (optional)"><input maxLength={100} className={inputClass} value={form.taxNumber ?? ''} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} /></Field>}
        </div>
        <div className="flex flex-wrap gap-3">
          <button disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#006F3C] px-5 text-sm font-semibold text-white hover:bg-[#005c32] disabled:opacity-50">{busy && <LoaderCircle className="size-4 animate-spin" />}Send for approval</button>
          <button type="button" onClick={() => setEditing(false)} className="min-h-11 rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
        </div>
      </form>
        : <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          {([[homestay ? 'Host' : 'Business name', shown.name, current.name], ...(homestay ? [] : [['Registration number', shown.registrationNumber, current.registrationNumber]]), ['Email', shown.email, current.email], ['Phone', shown.phone, current.phone],
            ['Address', [shown.address.line1, shown.address.city, shown.address.region].filter(Boolean).join(', '), [current.address.line1, current.address.city, current.address.region].filter(Boolean).join(', ')],
            ...(homestay ? [] : [['NTN', shown.taxNumber || '—', current.taxNumber || '—']]),
          ] as Array<[string, string | undefined, string | undefined]>).map(([term, value, before]) => <div key={term}><dt className="text-slate-500">{term}</dt><dd className="font-medium text-slate-900">{value}{pending && value !== before && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-900">changed</span>}</dd></div>)}
        </dl>}
    </section>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`block text-sm font-semibold text-slate-800 ${wide ? 'sm:col-span-2' : ''}`}>{label}{children}</label>;
}
