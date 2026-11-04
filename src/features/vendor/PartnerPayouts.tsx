import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { api, type MoneyRow, type Payout, type PayoutStatement, type StatementLine } from '../../shared/api/api';
import Statement, { netLabel, pkr } from '../../shared/components/Statement';
import { formatDateForDisplay } from '../../shared/utils/date';

/** What GBBookings and this partner owe each other, the bookings behind it, and past statements. */
export default function PartnerPayouts({ onBankDetails }: { onBankDetails?: () => void }) {
  const [finance, setFinance] = useState<{ balance: MoneyRow; unsettled: StatementLine[]; payouts: Payout[] } | null>(null);
  const [statement, setStatement] = useState<PayoutStatement | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getPartnerFinance().then(setFinance).catch((reason: Error) => setError(reason.message)); }, []);
  const open = (id: string) => api.getPartnerStatement(id).then(setStatement).catch((reason: Error) => setError(reason.message));

  if (error) return <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>;
  if (!finance) return <div className="flex justify-center py-10"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading payouts" /></div>;
  if (statement) return <Statement statement={statement} onClose={() => setStatement(null)} />;
  const { balance, unsettled, payouts } = finance;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-slate-900">Current balance</h2>
        <p className="mt-1 text-2xl font-extrabold text-slate-950">{netLabel(balance.net)}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          {([['Paid online by guests', balance.collectedOnline], ['Refunded to guests', balance.refunded], ['GBBookings commission', balance.commission]] as const).map(([term, value]) => <div key={term}><dt className="text-slate-500">{term}</dt><dd className="font-semibold">{pkr(value)}</dd></div>)}
        </dl>
        <p className="mt-4 text-sm text-slate-500">Counted once a stay is finished, a guest did not show, or a paid booking was cancelled. Money you collect on arrival stays with you, so only the commission counts against it. Bookings with a refund still open wait until it is sent.{onBankDetails && <> <button type="button" onClick={onBankDetails} className="font-semibold text-[#006F3C] underline">Bank details</button> are in your business profile.</>}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-slate-900">Waiting to be settled</h2>
        {unsettled.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">Nothing waiting right now.</p>
          : <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{unsettled.map((line) => (
            <li key={line.reference} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm"><span><span className="font-mono text-xs">{line.reference}</span><span className="block text-slate-500">{line.listingTitle} · {line.checkIn} · {line.paymentMethod === 'online' ? 'Pay now' : 'On arrival'}</span></span><strong>{pkr(line.net)}</strong></li>
          ))}</ul>}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-slate-900">Statements</h2>
        {payouts.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">GBBookings has not issued a statement yet.</p>
          : <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{payouts.map((payout) => (
            <li key={payout.id}><button type="button" onClick={() => void open(payout.id)} className="flex min-h-14 w-full flex-wrap items-center justify-between gap-2 p-4 text-left text-sm hover:bg-slate-50"><span><span className="font-mono text-xs">{payout.reference}</span><span className="block text-slate-500">{formatDateForDisplay(payout.createdAt)} · {payout.bookings} booking{payout.bookings === 1 ? '' : 's'} · {payout.status === 'settled' ? 'Settled' : 'Not settled yet'}</span></span><strong>{netLabel(payout.net)}</strong></button></li>
          ))}</ul>}
      </section>
    </div>
  );
}
