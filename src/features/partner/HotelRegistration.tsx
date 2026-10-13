import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, Check, CheckCircle2, FileText, LoaderCircle, MailCheck, Upload } from 'lucide-react';
import { api, type VendorProfile } from '../../shared/api/api';

const inputClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';
const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#006F3C] px-5 text-sm font-semibold text-white hover:bg-[#005c32] disabled:opacity-50';
const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';

const DOCUMENTS = [
  { type: 'business_registration', label: 'Business registration certificate', hint: 'Shows the hotel business is registered.', required: true },
  { type: 'identity', label: 'Owner CNIC / passport', hint: 'Identity of the business owner.', required: true },
  { type: 'property_authorization', label: 'Property ownership or lease', hint: 'Proof you may operate this property.', required: false },
  { type: 'tax', label: 'NTN / tax certificate', hint: 'If the business is tax registered.', required: false },
] as const;

type Step = 'email' | 'business' | 'documents' | 'review';
const STEPS: Array<[Step, string]> = [['business', 'Business details'], ['documents', 'Documents'], ['review', 'Review & submit']];

/** Hotel partner application: business details → verification documents → submit for admin review. */
export default function HotelRegistration({ vendor, emailVerified, onVendorChange, onEmailVerified, onExit }: {
  vendor: VendorProfile | null; emailVerified: boolean;
  onVendorChange: (vendor: VendorProfile) => void; onEmailVerified: () => Promise<boolean>; onExit: () => void;
}) {
  const [step, setStep] = useState<Step>(!emailVerified ? 'email' : vendor?.verificationDocuments?.length ? 'review' : vendor ? 'documents' : 'business');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [business, setBusiness] = useState({
    name: vendor?.name ?? '', email: vendor?.email ?? '', phone: vendor?.phone ?? '',
    registrationNumber: vendor?.registrationNumber ?? '', taxNumber: vendor?.taxNumber ?? '',
    line1: vendor?.address?.line1 ?? '', city: vendor?.address?.city ?? '', region: vendor?.address?.region ?? 'Gilgit-Baltistan',
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const attached = new Set((vendor?.verificationDocuments ?? []).map((document) => document.type));
  const requiredMissing = DOCUMENTS.filter((document) => document.required && !attached.has(document.type));

  const go = (next: Step) => { setStep(next); setError(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const run = async (work: () => Promise<void>) => {
    setBusy(true); setError(''); setNotice('');
    try { await work(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  };

  const saveBusiness = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const input = {
        name: business.name.trim(), email: business.email.trim(), phone: business.phone.trim(), businessType: 'hotel' as const,
        registrationNumber: business.registrationNumber.trim(), taxNumber: business.taxNumber.trim() || undefined,
        address: { line1: business.line1.trim(), city: business.city.trim(), region: business.region.trim(), country: 'PK' },
      };
      const result = vendor ? await api.updateMyVendor(input) : await api.createVendorApplication(input);
      onVendorChange(result.data);
      go('documents');
    });
  };

  const upload = (type: string, file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Please upload the document as a PDF.'); return; }
    setUploading(type);
    void run(async () => {
      const media = await api.uploadMedia('documents', file);
      onVendorChange((await api.attachVendorDocument(type, media.data.id)).data);
    }).finally(() => setUploading(null));
  };

  const submit = () => run(async () => { onVendorChange((await api.submitVendorApplication()).data); });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button type="button" onClick={onExit} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="size-4" />All partner types</button>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#006F3C]">Hotel partner registration</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Register your hotel business</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Your progress is saved after each step. Once our team approves the business, you can add your hotels and rooms.</p>
      </div>

      {step !== 'email' && <ol className="grid grid-cols-3 gap-2" aria-label="Registration progress">
        {STEPS.map(([id, text], index) => {
          const current = STEPS.findIndex(([value]) => value === step);
          const done = index < current;
          return <li key={id} aria-current={id === step ? 'step' : undefined} className={`rounded-lg border px-3 py-2 text-xs font-semibold sm:text-sm ${id === step ? 'border-[#006F3C] bg-emerald-50 text-emerald-900' : done ? 'border-emerald-200 bg-white text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`}>
            <span className="mr-1.5 inline-flex size-5 items-center justify-center rounded-full bg-white text-[11px] ring-1 ring-current">{done ? <Check className="size-3" /> : index + 1}</span>{text}
          </li>;
        })}
      </ol>}

      {vendor?.status === 'rejected' && vendor.rejectionReason && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><strong className="block">Changes requested by our team</strong>{vendor.rejectionReason}</div>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}

      {step === 'email' && <Card>
        <MailCheck className="size-8 text-[#006F3C]" />
        <h2 className="mt-3 text-lg font-bold">First, verify your email address</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">We use it to contact you about your application and bookings.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" disabled={busy} className={secondaryButton} onClick={() => run(async () => { await api.requestEmailVerification(); setNotice('Verification link sent. Open it from your inbox, then come back here.'); })}>Send verification link</button>
          <button type="button" disabled={busy} className={primaryButton} onClick={() => run(async () => { if (await onEmailVerified()) go(vendor ? 'documents' : 'business'); else setError('Your email isn’t verified yet. Open the link we sent, then try again.'); })}>I’ve verified my email</button>
        </div>
      </Card>}

      {step === 'business' && <Card>
        <form onSubmit={saveBusiness} className="space-y-5">
          <h2 className="text-lg font-bold">Business details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Registered business name"><input required minLength={2} maxLength={160} className={inputClass} value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} /></Field>
            <Field label="Registration number"><input required minLength={2} maxLength={100} className={inputClass} value={business.registrationNumber} onChange={(e) => setBusiness({ ...business, registrationNumber: e.target.value })} /></Field>
            <Field label="Business email" hint="Booking requests are sent here."><input required type="email" className={inputClass} value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} /></Field>
            <Field label="Business phone"><input required type="tel" minLength={7} maxLength={30} placeholder="03XX XXXXXXX" className={inputClass} value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} /></Field>
            <Field label="Street address" wide><input required className={inputClass} value={business.line1} onChange={(e) => setBusiness({ ...business, line1: e.target.value })} /></Field>
            <Field label="City"><input required className={inputClass} value={business.city} onChange={(e) => setBusiness({ ...business, city: e.target.value })} /></Field>
            <Field label="Region"><input required className={inputClass} value={business.region} onChange={(e) => setBusiness({ ...business, region: e.target.value })} /></Field>
            <Field label="NTN / tax number" hint="Optional."><input maxLength={100} className={inputClass} value={business.taxNumber} onChange={(e) => setBusiness({ ...business, taxNumber: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end"><button disabled={busy} className={primaryButton}>{busy && <LoaderCircle className="size-4 animate-spin" />}Save and continue</button></div>
        </form>
      </Card>}

      {step === 'documents' && <Card>
        <h2 className="text-lg font-bold">Verification documents</h2>
        <p className="mt-1 text-sm text-slate-600">PDF files only. Documents are private and only seen by our verification team.</p>
        <ul className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200">
          {DOCUMENTS.map((document) => {
            const done = attached.has(document.type);
            return <li key={document.type} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${done ? 'bg-emerald-50 text-[#006F3C]' : 'bg-slate-100 text-slate-500'}`}>{done ? <CheckCircle2 className="size-5" /> : <FileText className="size-5" />}</span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">{document.label} {document.required ? <span className="font-normal text-rose-700">· required</span> : <span className="font-normal text-slate-500">· optional</span>}</p><p className="text-xs text-slate-500">{done ? 'Uploaded. Upload again to replace it.' : document.hint}</p></div>
              <label className={`${secondaryButton} cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}>
                {uploading === document.type ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}{done ? 'Replace' : 'Upload PDF'}
                <input type="file" accept="application/pdf" className="sr-only" disabled={busy} onChange={(event) => { upload(document.type, event.target.files?.[0]); event.target.value = ''; }} />
              </label>
            </li>;
          })}
        </ul>
        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button type="button" onClick={() => go('business')} className={secondaryButton}>Back</button>
          <button type="button" disabled={busy || requiredMissing.length > 0} onClick={() => go('review')} className={primaryButton}>{requiredMissing.length ? `Upload ${requiredMissing.length} required document${requiredMissing.length > 1 ? 's' : ''}` : 'Continue to review'}</button>
        </div>
      </Card>}

      {step === 'review' && vendor && <Card>
        <h2 className="text-lg font-bold">Review and submit</h2>
        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {[['Business', vendor.name], ['Registration no.', vendor.registrationNumber], ['Email', vendor.email], ['Phone', vendor.phone],
            ['Address', [vendor.address?.line1, vendor.address?.city, vendor.address?.region].filter(Boolean).join(', ')], ['NTN', vendor.taxNumber || '—'],
          ].map(([term, value]) => <div key={term}><dt className="text-slate-500">{term}</dt><dd className="font-medium text-slate-900">{value}</dd></div>)}
          <div className="sm:col-span-2"><dt className="text-slate-500">Documents</dt><dd className="font-medium text-slate-900">{DOCUMENTS.filter((document) => attached.has(document.type)).map((document) => document.label).join(', ')}</dd></div>
        </dl>
        <div className="mt-4 flex gap-4 text-sm"><button type="button" onClick={() => go('business')} className="font-semibold text-[#006F3C] underline">Edit details</button><button type="button" onClick={() => go('documents')} className="font-semibold text-[#006F3C] underline">Edit documents</button></div>
        <label className="mt-6 flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-700"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 size-4 accent-[#006F3C]" />I confirm these details are accurate and I am authorised to list this business on GBBookings.</label>
        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button type="button" onClick={() => go('documents')} className={secondaryButton}>Back</button>
          <button type="button" disabled={busy || !confirmed || requiredMissing.length > 0} onClick={submit} className={primaryButton}>{busy && <LoaderCircle className="size-4 animate-spin" />}Submit for review</button>
        </div>
      </Card>}
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">{children}</section>;
}

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: ReactNode }) {
  return <label className={`block text-sm font-semibold text-slate-800 ${wide ? 'sm:col-span-2' : ''}`}>{label}{children}{hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}</label>;
}
