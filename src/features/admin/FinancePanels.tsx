import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { api, type AdminRefund, type PartnerBalance, type Payout, type PayoutStatement, type Reconciliation } from '../../shared/api/api';
import { useReasonDialog } from '../../shared/components/ReasonDialog';
import Statement, { pkr } from '../../shared/components/Statement';
import { formatDateForDisplay } from '../../shared/utils/date';
import DateInput from '../../shared/components/DateInput';

const button = 'inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const primary = 'inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white hover:bg-[#005c32] disabled:opacity-50';
const field = 'min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C]';
const STATUS: Record<AdminRefund['status'], [string, string]> = {
  pending: ['Waiting', 'bg-amber-50 text-amber-800'], sending: ['Result unknown', 'bg-rose-50 text-rose-700'], failed: ['Failed', 'bg-rose-50 text-rose-700'], sent: ['Sent', 'bg-emerald-50 text-emerald-800'],
};
const KIND: Record<string, string> = { cancellation: 'Cancelled booking', change: 'Booking made cheaper', late_payment: 'Paid after release', duplicate_payment: 'Paid twice' };
const Alert = ({ text }: { text: string }) => text ? <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{text}</p> : null;
const Spinner = () => <div className="flex justify-center py-10"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading" /></div>;

/** Money owed back to guests. A failed or unknown attempt never retries itself, because the money may have moved. */
export function RefundsPanel() {
  const [filter, setFilter] = useState<'open' | 'sent'>('open');
  const [refunds, setRefunds] = useState<AdminRefund[] | null>(null);
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const { askReason, dialog } = useReasonDialog();
  const load = () => api.admin.getRefunds(filter).then((result) => { setRefunds(result.data); setAuto(result.autoRefunds); }).catch((reason: Error) => setError(reason.message));
  useEffect(() => { setRefunds(null); void load(); }, [filter]);

  const act = async (refund: AdminRefund, work: () => Promise<unknown>) => {
    setBusy(refund.id); setError('');
    try { await work(); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'That did not work.'); } finally { setBusy(''); }
  };
  const markSent = async (refund: AdminRefund) => {
    const note = (await askReason({
      title: `Mark ${pkr(refund.amount)} as sent?`, confirmLabel: 'Mark sent', noteLabel: refund.channel === 'partner' ? 'How the partner returned it' : 'Safepay refund reference',
      description: `${refund.guestName} · ${refund.reference}. The guest is emailed that the refund is on its way. Only do this once the money has really moved.`,
    }))?.trim();
    if (note) await act(refund, () => api.admin.markRefundSent(refund, note));
  };

  return (
    <section className="space-y-4">
      {dialog}
      {!auto && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Automatic Safepay refunds are off (SAFEPAY_AUTO_REFUNDS). Refund each one in the Safepay dashboard, then mark it sent here.</p>}
      <div className="flex gap-2" role="tablist" aria-label="Refund status">
        {(['open', 'sent'] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={`min-h-10 rounded-full border px-4 text-sm font-bold ${filter === value ? 'border-[#17211B] bg-[#17211B] text-white' : 'border-[#D9DED8] bg-white text-[#3D4A42]'}`}>{value === 'open' ? 'To do' : 'Sent'}</button>)}
      </div>
      <Alert text={error} />
      {!refunds ? <Spinner /> : refunds.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{filter === 'open' ? 'No refunds waiting.' : 'No refunds sent yet.'}</p>
        : <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{refunds.map((refund) => (
          <li key={refund.id} className="space-y-2 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span><strong>{pkr(refund.amount)}</strong> · {refund.guestName} <span className="text-slate-500">({refund.guestEmail})</span></span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[refund.status][1]}`}>{STATUS[refund.status][0]}</span>
            </div>
            <p className="text-slate-500"><span className="font-mono text-xs">{refund.reference}</span> · {refund.listingTitle} · {KIND[refund.kind] ?? refund.kind} · {refund.channel === 'safepay' ? 'Back through Safepay' : 'Partner holds this money'} · {formatDateForDisplay(refund.sentAt ?? refund.createdAt)}</p>
            {refund.lastError && <p className="text-rose-700">{refund.lastError}</p>}
            {refund.status === 'sending' && <p className="text-rose-700">The last attempt never reported back. Check the Safepay dashboard before doing anything else.</p>}
            {refund.note && <p className="text-slate-600">Note: {refund.note}</p>}
            {filter === 'open' && <div className="flex flex-wrap gap-2 pt-1">
              {auto && refund.channel === 'safepay' && ['pending', 'failed'].includes(refund.status) && <button type="button" disabled={busy === refund.id} onClick={() => act(refund, () => api.admin.retryRefund(refund))} className={primary}>Send through Safepay</button>}
              <button type="button" disabled={busy === refund.id} onClick={() => void markSent(refund)} className={button}>Mark as sent</button>
            </div>}
          </li>
        ))}</ul>}
    </section>
  );
}

const firstOfMonth = () => `${new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date()).slice(0, 8)}01`;
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());

/** What each partner is owed or owes, the statements issued, and the totals to check against Safepay and the bank. */
export function PayoutsPanel() {
  const [balances, setBalances] = useState<PartnerBalance[] | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [statement, setStatement] = useState<PayoutStatement | null>(null);
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [totals, setTotals] = useState<Reconciliation | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const { askReason, dialog } = useReasonDialog();
  const load = () => Promise.all([api.admin.getBalances().then(setBalances), api.admin.getPayouts().then(setPayouts)]).catch((reason: Error) => setError(reason.message));
  useEffect(() => { void load(); }, []);
  useEffect(() => { if (from && to && from <= to) api.admin.getReconciliation(from, to).then(setTotals).catch((reason: Error) => setError(reason.message)); }, [from, to, payouts]);

  const run = async (id: string, work: () => Promise<unknown>) => {
    setBusy(id); setError('');
    try { await work(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'That did not work.'); } finally { setBusy(''); }
  };
  const create = (balance: PartnerBalance) => run(balance.vendorId, async () => { setStatement(await api.admin.createPayout(balance.vendorId)); await load(); });
  const settle = async (payout: Payout) => {
    const reference = (await askReason({
      title: `Settle ${payout.reference}?`, confirmLabel: 'Mark settled', noteLabel: 'Bank transfer reference',
      description: `${payout.net >= 0 ? `You sent ${pkr(payout.net)} to` : `You received ${pkr(-payout.net)} from`} ${payout.vendorName ?? 'the partner'}. The partner is emailed. This cannot be undone.`,
    }))?.trim();
    if (reference) await run(payout.id, async () => { await api.admin.settlePayout(payout.id, reference); await load(); });
  };

  if (statement) return <Statement statement={statement} onClose={() => setStatement(null)} />;
  return (
    <div className="space-y-6">
      {dialog}
      <Alert text={error} />
      <section className="space-y-3">
        <h2 className="font-bold text-slate-900">Partner balances</h2>
        {!balances ? <Spinner /> : balances.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Nothing to settle right now.</p>
          : <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{balances.map((balance) => (
            <li key={balance.vendorId} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <span><strong>{balance.name}</strong><span className="block text-slate-500">{balance.bookings} booking{balance.bookings === 1 ? '' : 's'} · {balance.net > 0 ? `Pay them ${pkr(balance.net)}` : balance.net < 0 ? `They owe ${pkr(-balance.net)}` : 'Even'}{balance.net > 0 && !balance.hasBankDetails ? ' · no bank details yet' : ''}</span></span>
              <button type="button" disabled={busy === balance.vendorId || (balance.net > 0 && !balance.hasBankDetails)} onClick={() => void create(balance)} className={primary}>Create statement</button>
            </li>
          ))}</ul>}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-slate-900">Statements</h2>
        {payouts.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No statements yet.</p>
          : <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{payouts.map((payout) => (
            <li key={payout.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <span><span className="font-mono text-xs">{payout.reference}</span> · <strong>{payout.vendorName}</strong><span className="block text-slate-500">{formatDateForDisplay(payout.createdAt)} · {payout.net >= 0 ? `Pay ${pkr(payout.net)}` : `Receive ${pkr(-payout.net)}`} · {payout.status === 'settled' ? `Settled, ref ${payout.bankReference}` : 'Open'}</span></span>
              <span className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void run(payout.id, async () => setStatement(await api.admin.getPayout(payout.id)))} className={button}>View</button>
                {payout.status === 'open' && <button type="button" disabled={busy === payout.id} onClick={() => void settle(payout)} className={primary}>Mark settled</button>}
              </span>
            </li>
          ))}</ul>}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-slate-900">Reconciliation</h2>
        <div className="flex flex-wrap gap-3">
          <label className="text-xs font-semibold text-slate-600">From<DateInput value={from} max={to} onChange={(event) => setFrom(event.target.value)} className={`${field} ml-2`} /></label>
          <label className="text-xs font-semibold text-slate-600">To<DateInput value={to} min={from} onChange={(event) => setTo(event.target.value)} className={`${field} ml-2`} /></label>
        </div>
        {totals && <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {([['Collected online', totals.collectedOnline], ['Refunds sent', totals.refundsSent], ['Refunds still owed (all time)', totals.refundsOutstanding], ['Paid to partners', totals.paidToPartners], ['Received from partners', totals.receivedFromPartners], ['Commission on settled statements', totals.commissionSettled]] as const).map(([term, value]) => <div key={term}><dt className="text-slate-500">{term}</dt><dd className="font-semibold">{pkr(value)}</dd></div>)}
        </dl>}
        {totals && <p className="rounded-lg bg-slate-50 p-3 text-sm"><strong>Should have stayed with GBBookings over this period: {pkr(totals.expectedHeld)}.</strong> Compare it with the Safepay settlement report and the bank statement for the same dates. A difference means a payment, refund or transfer was recorded here but not there, or the other way round.</p>}
      </section>
    </div>
  );
}
