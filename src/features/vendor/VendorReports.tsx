import { useEffect, useState } from 'react';
import { BarChart3, LoaderCircle } from 'lucide-react';
import { api, type VendorReport } from '../../shared/api/api';

const fieldClass = 'min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';
const pkDate = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(date);
const pkr = (amount: number) => `PKR ${amount.toLocaleString()}`;

/** Occupancy and money per hotel for a date range; defaults to the current month so far. */
export default function VendorReports() {
  const today = pkDate(new Date());
  const [from, setFrom] = useState(`${today.slice(0, 8)}01`);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<VendorReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!from || !to || from > to) return;
    let active = true;
    setLoading(true); setError('');
    api.getVendorReport(from, to)
      .then((result) => active && setReport(result))
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [from, to]);

  const hotels = report?.hotels ?? [];
  const sum = (key: 'roomNightsSold' | 'roomNightsAvailable' | 'bookedRevenue' | 'collected') => hotels.reduce((total, hotel) => total + hotel[key], 0);
  const available = sum('roomNightsAvailable');
  const totals: Array<[string, string, string]> = [
    ['Occupancy', available ? `${Math.round((sum('roomNightsSold') / available) * 1000) / 10}%` : '–', `${sum('roomNightsSold').toLocaleString()} of ${available.toLocaleString()} room nights`],
    ['Booked revenue', pkr(sum('bookedRevenue')), 'Confirmed and completed stays in these dates'],
    ['Collected', pkr(sum('collected')), 'Payments recorded in these dates'],
  ];

  return (
    <section className="space-y-5" aria-labelledby="vendor-reports-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><BarChart3 className="size-5 text-[#006F3C]" /><h2 id="vendor-reports-heading" className="font-bold text-slate-900">Reports</h2></div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">From<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className={fieldClass} /></label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">to<input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className={fieldClass} /></label>
        </div>
      </div>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {loading && !report ? <div className="flex justify-center py-8"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading report" /></div> : <>
        <div className="grid gap-4 sm:grid-cols-3" aria-busy={loading}>
          {totals.map(([label, value, detail]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p><p className="mt-2 text-xs text-slate-400">{detail}</p></div>)}
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Hotel', 'Occupancy', 'Room nights sold', 'Booked revenue', 'Collected', 'Arrivals', 'Cancelled', 'No-shows'].map((label) => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {hotels.map((hotel) => (
                <tr key={hotel.listingId}>
                  <th scope="row" className="px-4 py-3 font-semibold text-slate-900">{hotel.title}</th>
                  <td className="px-4 py-3">{hotel.occupancy}%</td>
                  <td className="px-4 py-3">{hotel.roomNightsSold.toLocaleString()} / {hotel.roomNightsAvailable.toLocaleString()}</td>
                  <td className="px-4 py-3">{pkr(hotel.bookedRevenue)}</td>
                  <td className="px-4 py-3">{pkr(hotel.collected)}</td>
                  <td className="px-4 py-3">{hotel.arrivals}</td>
                  <td className="px-4 py-3">{hotel.cancelled}</td>
                  <td className="px-4 py-3">{hotel.noShows}</td>
                </tr>
              ))}
              {hotels.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No live or paused hotels yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">Room nights available exclude rooms you closed in the availability calendar. Arrivals, cancellations and no-shows count bookings whose check-in falls in these dates.</p>
      </>}
    </section>
  );
}
