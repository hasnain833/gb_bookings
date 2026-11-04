import { Printer } from 'lucide-react';
import type { PayoutStatement } from '../api/api';
import { formatDateForDisplay } from '../utils/date';

export const pkr = (amount: number) => `PKR ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

/** What a net figure means, in plain words, from the partner's side. */
export const netLabel = (net: number) => net > 0 ? `GBBookings pays you ${pkr(net)}` : net < 0 ? `You pay GBBookings ${pkr(-net)}` : 'Nothing to pay either way';

/** One statement between GBBookings and a partner; printing it gives the statement and commission invoice as a PDF. */
export default function Statement({ statement, onClose }: { statement: PayoutStatement; onClose: () => void }) {
  const print = () => { const title = document.title; document.title = `GBBookings statement ${statement.reference}`; window.print(); document.title = title; };
  return (
    <section id="printable-ticket-receipt" aria-label={`Statement ${statement.reference}`} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Statement and commission invoice</p>
          <h2 className="font-mono text-xl font-bold">{statement.reference}</h2>
          <p className="mt-1 text-sm text-slate-500">Issued {formatDateForDisplay(statement.createdAt)} · {statement.status === 'settled' ? `Settled ${formatDateForDisplay(statement.settledAt ?? '')}${statement.bankReference ? ` · bank reference ${statement.bankReference}` : ''}` : 'Not settled yet'}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button type="button" onClick={print} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Printer className="size-4" />Print or save as PDF</button>
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
        </div>
      </div>
      {statement.vendor && <p className="text-sm text-slate-700"><strong>{statement.vendor.name}</strong>{statement.vendor.taxNumber ? ` · NTN ${statement.vendor.taxNumber}` : ''}{statement.vendor.address?.city ? ` · ${[statement.vendor.address.line1, statement.vendor.address.city].filter(Boolean).join(', ')}` : ''}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500"><tr><th className="py-2 pr-3 font-semibold">Booking</th><th className="py-2 pr-3 font-semibold">Start</th><th className="py-2 pr-3 font-semibold">Paid</th><th className="py-2 pr-3 text-right font-semibold">Total</th><th className="py-2 pr-3 text-right font-semibold">Online</th><th className="py-2 pr-3 text-right font-semibold">Refunded</th><th className="py-2 pr-3 text-right font-semibold">Commission</th><th className="py-2 text-right font-semibold">Net</th></tr></thead>
          <tbody>{statement.lines.map((line) => <tr key={line.reference} className="border-b border-slate-100"><td className="py-2 pr-3"><span className="font-mono text-xs">{line.reference}</span><span className="block text-slate-500">{line.listingTitle}</span></td><td className="py-2 pr-3">{line.checkIn}</td><td className="py-2 pr-3">{line.paymentMethod === 'online' ? 'Pay now' : 'On arrival'}</td><td className="py-2 pr-3 text-right">{line.total.toLocaleString()}</td><td className="py-2 pr-3 text-right">{line.collectedOnline.toLocaleString()}</td><td className="py-2 pr-3 text-right">{line.refunded.toLocaleString()}</td><td className="py-2 pr-3 text-right">{line.commission.toLocaleString()}</td><td className="py-2 text-right font-semibold">{line.net.toLocaleString()}</td></tr>)}</tbody>
          <tfoot className="font-bold"><tr><td colSpan={4} className="py-2 pr-3">Total (PKR)</td><td className="py-2 pr-3 text-right">{statement.collectedOnline.toLocaleString()}</td><td className="py-2 pr-3 text-right">{statement.refunded.toLocaleString()}</td><td className="py-2 pr-3 text-right">{statement.commission.toLocaleString()}</td><td className="py-2 text-right">{statement.net.toLocaleString()}</td></tr></tfoot>
        </table>
      </div>
      <p className="rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-900">{netLabel(statement.net)}. Commission invoiced by GBBookings on this statement: {pkr(statement.commission)}.</p>
      {statement.bank && <p className="text-xs text-slate-500">Bank account on this statement: {statement.bank.accountTitle}, {statement.bank.bankName}, {statement.bank.iban}</p>}
    </section>
  );
}
