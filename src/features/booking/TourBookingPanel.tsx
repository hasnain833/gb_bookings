import { useEffect, useState } from 'react';
import { Calendar, MapPin, ShieldCheck, Users } from 'lucide-react';
import { api, type ListingAvailability } from '../../shared/api/api';
import type { StayInfo, TourSpecs } from '../../types';
import { PAYMENT_LABELS } from '../../shared/utils/stayInfo';
import { formatDateForDisplay } from '../../shared/utils/date';
import type { CheckoutParams } from './CheckoutFlow';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const inputClass = 'w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-800 focus:outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';
const labelClass = 'text-xs font-medium text-slate-600 flex items-center gap-1';
const pkr = (value: number) => `PKR ${value.toLocaleString()}`;

/** Tour quote: one seat per traveller on the chosen start date; prices come from the server. */
export default function TourBookingPanel({ listingId, specs, departures = [], paymentMethods, onProceed }: {
  listingId: string; specs: TourSpecs; departures?: string[]; paymentMethods?: StayInfo['paymentMethods']; onProceed: (params: CheckoutParams) => void;
}) {
  const fixed = specs.schedule === 'fixed';
  const [date, setDate] = useState(fixed ? departures[0] ?? '' : '');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [quote, setQuote] = useState<ListingAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const days = specs.durationDays;
  const childrenAllowed = !specs.minAge || specs.minAge < 18;

  useEffect(() => {
    setError(null);
    if (!date) { setQuote(null); return undefined; }
    let active = true;
    setLoading(true);
    api.getListingAvailability(listingId, { checkIn: date, checkOut: date, adults, children, rooms: adults + children })
      .then((result) => active && setQuote(result))
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [listingId, date, adults, children]);

  const unit = quote?.rooms[0];
  const seats = adults + children;
  const endDate = date ? addDays(date, days - 1) : '';

  const proceed = () => {
    if (!unit?.bookable) return;
    onProceed({
      listingId, roomTypeId: unit.id, roomName: unit.name, startDate: date, endDate,
      rooms: seats, adults, children, guests: seats, duration: days, totalPrice: unit.totalPrice, payAtHotel: true,
      tour: { days, meetingPoint: specs.meetingPoint, startTime: specs.startTime },
    });
  };

  return (
    <div className="space-y-5" id="tour-booking-panel">
      <div className="space-y-1.5">
        <label htmlFor="tour-date" className={labelClass}><Calendar className="w-3.5 h-3.5 text-slate-400" /> {fixed ? 'Departure' : 'Start date'}</label>
        {fixed
          ? departures.length
            ? <select id="tour-date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass}>
                {departures.map((item) => <option key={item} value={item}>{formatDateForDisplay(item)}{days > 1 ? ` – ${formatDateForDisplay(addDays(item, days - 1))}` : ''}</option>)}
              </select>
            : <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">No upcoming departures right now. Check back soon.</p>
          : <input id="tour-date" type="date" min={today()} value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} />}
        {date && days > 1 && <p className="text-xs text-slate-500">Ends {formatDateForDisplay(endDate)} · {days} days</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label htmlFor="tour-adults" className={labelClass}><Users className="w-3.5 h-3.5 text-slate-400" /> Adults</label>
          <select id="tour-adults" value={adults} onChange={(event) => setAdults(Number(event.target.value))} className={inputClass}>
            {Array.from({ length: 20 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}
          </select>
        </div>
        {childrenAllowed && <div className="space-y-1.5">
          <label htmlFor="tour-children" className={labelClass}><Users className="w-3.5 h-3.5 text-slate-400" /> Children</label>
          <select id="tour-children" value={children} onChange={(event) => setChildren(Number(event.target.value))} className={inputClass}>
            {Array.from({ length: 11 }, (_, index) => index).map((count) => <option key={count} value={count}>{count}</option>)}
          </select>
        </div>}
      </div>
      {specs.minAge ? <p className="text-xs text-slate-500">Minimum age {specs.minAge}.</p> : null}
      {specs.meetingPoint && <p className="flex items-start gap-1.5 text-xs text-slate-600"><MapPin className="mt-0.5 w-3.5 h-3.5 shrink-0 text-slate-400" />Meet at {specs.meetingPoint}{specs.startTime ? `, ${specs.startTime}` : ''}</p>}

      <div aria-live="polite" className="space-y-2">
        {!date && !fixed && <p className="text-xs text-slate-500">Pick a start date to see the price.</p>}
        {loading && <div className="h-16 animate-pulse rounded-xl bg-slate-100" aria-label="Checking seats" />}
        {error && <p className="text-xs font-bold text-rose-600" role="alert">{error}</p>}
        {unit && !unit.bookable && <p className="text-xs font-bold text-rose-600" role="alert">{unit.available === 0 ? 'This date is full.' : `Only ${unit.available} seat${unit.available === 1 ? '' : 's'} left on this date.`}</p>}
        {unit?.bookable && <div className="space-y-2 border-t border-slate-200 pt-4 text-sm" id="tour-price-breakdown">
          <div className="flex justify-between text-slate-500"><span>{pkr(unit.nightlyRate)} × {adults} adult{adults > 1 ? 's' : ''}</span><span className="text-slate-800">{pkr(unit.nightlyRate * adults)}</span></div>
          {children > 0 && <div className="flex justify-between text-slate-500"><span>{pkr(specs.childPrice ?? unit.nightlyRate)} × {children} child{children > 1 ? 'ren' : ''}</span><span className="text-slate-800">{pkr((specs.childPrice ?? unit.nightlyRate) * children)}</span></div>}
          <div className="flex justify-between font-semibold text-slate-900"><span>Due at the start</span><span>{pkr(unit.totalPrice)}</span></div>
          <ul className="space-y-1 text-xs text-slate-500">
            <li>{unit.available} seat{unit.available === 1 ? '' : 's'} left on this date</li>
            {quote?.freeCancellationUntil && <li>Free cancellation until {formatDateForDisplay(quote.freeCancellationUntil)}</li>}
            <li>Pay at the start of the tour{paymentMethods?.length ? ` (${paymentMethods.map((method) => PAYMENT_LABELS[method]).join(', ')})` : ''}</li>
          </ul>
        </div>}
      </div>

      <button type="button" onClick={proceed} disabled={!unit?.bookable} id="btn-tour-proceed"
        className="w-full h-11 rounded-lg bg-[#006F3C] px-6 text-sm font-semibold text-white hover:bg-[#005C32] disabled:cursor-not-allowed disabled:bg-slate-300">
        {unit?.bookable ? 'Reserve' : date ? 'Not available' : 'Select a date to reserve'}
      </button>
      <div className="flex items-start gap-2 text-xs text-slate-500 leading-normal">
        <ShieldCheck className="w-4 h-4 text-[#006F3C] shrink-0 mt-0.5" />
        <span>No payment today. You pay at the start of the tour.</span>
      </div>
    </div>
  );
}
