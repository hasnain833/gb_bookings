import { useEffect, useState } from 'react';
import { Calendar, Car, Clock, MapPin, ShieldCheck, Users } from 'lucide-react';
import { api, type ListingAvailability } from '../../shared/api/api';
import type { CarSpecs, StayInfo } from '../../types';
import { PAYMENT_LABELS } from '../../shared/utils/stayInfo';
import { formatDateForDisplay } from '../../shared/utils/date';
import type { CheckoutParams } from './CheckoutFlow';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
const inputClass = 'w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-800 focus:outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';
const labelClass = 'text-xs font-medium text-slate-600 flex items-center gap-1';
const pkr = (value: number) => `PKR ${value.toLocaleString()}`;

/** Car rental quote: days include pickup and return, prices come from the server. */
export default function CarBookingPanel({ listingId, baseCity, specs, paymentMethods, onProceed }: {
  listingId: string; baseCity: string; specs: CarSpecs; paymentMethods?: StayInfo['paymentMethods']; onProceed: (params: CheckoutParams) => void;
}) {
  const mode = specs.driverMode ?? (specs.withDriver === false ? 'self_drive' : 'with_driver');
  const [pickup, setPickup] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupTime, setPickupTime] = useState('09:00');
  const [passengers, setPassengers] = useState(Math.min(2, specs.seats));
  const [cars, setCars] = useState(1);
  const [driver, setDriver] = useState(mode !== 'self_drive');
  const [outside, setOutside] = useState(false);
  const [oneWay, setOneWay] = useState(false);
  const [pickupPlace, setPickupPlace] = useState('');
  const [dropoffPlace, setDropoffPlace] = useState('');
  const [quote, setQuote] = useState<ListingAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const datesReady = Boolean(pickup && returnDate && returnDate >= pickup);
  const oneWayOffered = (specs.oneWay ?? 'not_offered') !== 'not_offered';

  useEffect(() => {
    setError(null);
    if (!datesReady) { setQuote(null); return undefined; }
    let active = true;
    setLoading(true);
    api.getListingAvailability(listingId, { checkIn: pickup, checkOut: returnDate, adults: passengers, children: 0, rooms: cars, driver: mode === 'both' ? driver : undefined, outsideBaseCity: outside, oneWay })
      .then((result) => active && setQuote(result))
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [listingId, pickup, returnDate, passengers, cars, driver, outside, oneWay, datesReady, mode]);

  const unit = quote?.rooms[0];
  const days = quote?.nights ?? 0;
  const rental = quote?.rental;
  const ready = Boolean(unit?.bookable && pickupPlace.trim().length >= 2 && (!oneWay || dropoffPlace.trim().length >= 2));

  const proceed = () => {
    if (!quote || !unit || !rental || !ready) return;
    onProceed({
      listingId, roomTypeId: unit.id, roomName: unit.name, startDate: pickup, endDate: returnDate,
      rooms: cars, adults: passengers, children: 0, guests: passengers, duration: days,
      totalPrice: unit.totalPrice, extrasTotal: unit.extrasTotal ?? 0, payAtHotel: true, withDriver: rental.driver,
      rental: { driver: rental.driver, pickupPlace: pickupPlace.trim(), pickupTime, dropoffPlace: oneWay ? dropoffPlace.trim() : undefined, outsideBaseCity: outside, oneWay },
    });
  };

  return (
    <div className="space-y-5" id="car-booking-panel">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label htmlFor="car-pickup" className={labelClass}><Calendar className="w-3.5 h-3.5 text-slate-400" /> Pickup</label>
          <input id="car-pickup" type="date" min={today()} value={pickup} onChange={(event) => setPickup(event.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="car-return" className={labelClass}><Calendar className="w-3.5 h-3.5 text-slate-400" /> Return</label>
          <input id="car-return" type="date" min={pickup || today()} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="car-time" className={labelClass}><Clock className="w-3.5 h-3.5 text-slate-400" /> Pickup time</label>
          <input id="car-time" type="time" value={pickupTime} onChange={(event) => setPickupTime(event.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="car-passengers" className={labelClass}><Users className="w-3.5 h-3.5 text-slate-400" /> Passengers</label>
          <select id="car-passengers" value={passengers} onChange={(event) => setPassengers(Number(event.target.value))} className={inputClass}>
            {Array.from({ length: specs.seats * cars }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="car-count" className={labelClass}><Car className="w-3.5 h-3.5 text-slate-400" /> Cars</label>
        <select id="car-count" value={cars} onChange={(event) => setCars(Number(event.target.value))} className={inputClass}>
          {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}</option>)}
        </select>
      </div>

      {mode === 'both' && <fieldset className="grid grid-cols-2 gap-2">
        <legend className={`${labelClass} mb-1.5`}>Driver</legend>
        {([[true, 'With driver'], [false, 'Self-drive']] as const).map(([value, text]) => (
          <label key={text} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${driver === value ? 'border-[#006F3C] bg-emerald-50 font-semibold' : 'border-slate-300'}`}>
            <input type="radio" name="car-driver" checked={driver === value} onChange={() => setDriver(value)} className="size-4 accent-[#006F3C]" />{text}
          </label>
        ))}
      </fieldset>}

      <div className="space-y-1.5">
        <label htmlFor="car-pickup-place" className={labelClass}><MapPin className="w-3.5 h-3.5 text-slate-400" /> Pickup place</label>
        <input id="car-pickup-place" value={pickupPlace} maxLength={200} onChange={(event) => setPickupPlace(event.target.value)} placeholder={`e.g. ${baseCity.split(',')[0]} airport or your hotel`} className={inputClass} />
        {specs.pickupNote && <p className="text-xs text-slate-500">{specs.pickupNote}</p>}
      </div>
      {specs.outsideCityPerDay !== undefined && <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={outside} onChange={(event) => setOutside(event.target.checked)} className="mt-0.5 size-4 accent-[#006F3C]" />
        <span>The trip leaves {baseCity.split(',')[0]}<span className="block text-xs text-slate-500">+{pkr(specs.outsideCityPerDay)} per day</span></span>
      </label>}
      {oneWayOffered && <div className="space-y-2">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={oneWay} onChange={(event) => setOneWay(event.target.checked)} className="mt-0.5 size-4 accent-[#006F3C]" />
          <span>Drop off in another place<span className="block text-xs text-slate-500">{specs.oneWay === 'flat' ? `+${pkr(specs.oneWayFee ?? 0)} per car` : 'Fee agreed with the partner when they confirm'}</span></span>
        </label>
        {oneWay && <input aria-label="Drop-off place" value={dropoffPlace} maxLength={200} onChange={(event) => setDropoffPlace(event.target.value)} placeholder="e.g. Gilgit airport" className={inputClass} />}
      </div>}

      <div aria-live="polite" className="space-y-2">
        {!datesReady && <p className="text-xs text-slate-500">Select pickup and return dates to see the price.</p>}
        {loading && <div className="h-16 animate-pulse rounded-xl bg-slate-100" aria-label="Checking availability" />}
        {error && <p className="text-xs font-bold text-rose-600" role="alert">{error}</p>}
        {unit && !unit.bookable && <p className="text-xs font-bold text-rose-600" role="alert">{unit.available < cars ? `Only ${unit.available} of this car free on those dates.` : `Too many passengers for ${cars} car${cars > 1 ? 's' : ''}.`}</p>}
        {unit?.bookable && rental && <div className="space-y-2 border-t border-slate-200 pt-4 text-sm" id="car-price-breakdown">
          <div className="flex justify-between text-slate-500"><span>{pkr(unit.nightlyRate)} × {days} day{days > 1 ? 's' : ''}{cars > 1 ? ` × ${cars} cars` : ''}</span><span className="text-slate-800">{pkr(unit.roomTotal)}</span></div>
          {rental.driver && rental.driverPerDay > 0 && <div className="flex justify-between text-slate-500"><span>Driver {pkr(rental.driverPerDay)} × {days} day{days > 1 ? 's' : ''}</span><span className="text-slate-800">{pkr(rental.driverPerDay * days * cars)}</span></div>}
          {rental.outsidePerDay > 0 && <div className="flex justify-between text-slate-500"><span>Outside {baseCity.split(',')[0]} × {days} day{days > 1 ? 's' : ''}</span><span className="text-slate-800">{pkr(rental.outsidePerDay * days * cars)}</span></div>}
          {rental.oneWayFee > 0 && <div className="flex justify-between text-slate-500"><span>One-way drop-off</span><span className="text-slate-800">{pkr(rental.oneWayFee * cars)}</span></div>}
          <div className="flex justify-between font-semibold text-slate-900"><span>Due at pickup</span><span>{pkr(unit.totalPrice)}</span></div>
          <ul className="space-y-1 text-xs text-slate-500">
            <li>{rental.fuelIncluded ? '✓ Fuel included' : 'Fuel is paid by you'}</li>
            {rental.oneWayOnRequest && <li>One-way fee is quoted by the partner when they confirm.</li>}
            {!rental.driver && <li>Self-drive: bring your driving licence{specs.minDriverAge ? ` (minimum age ${specs.minDriverAge})` : ''}{rental.deposit ? `. Refundable deposit ${pkr(rental.deposit)} at pickup` : ''}.</li>}
            {quote?.freeCancellationUntil && <li>Free cancellation until {formatDateForDisplay(quote.freeCancellationUntil)}</li>}
            <li>Pay at pickup{paymentMethods?.length ? ` (${paymentMethods.map((method) => PAYMENT_LABELS[method]).join(', ')})` : ''}</li>
          </ul>
        </div>}
      </div>

      <button type="button" onClick={proceed} disabled={!ready} id="btn-car-proceed"
        className="w-full h-11 rounded-lg bg-[#006F3C] px-6 text-sm font-semibold text-white hover:bg-[#005C32] disabled:cursor-not-allowed disabled:bg-slate-300">
        {!unit?.bookable ? 'Select dates to reserve' : pickupPlace.trim().length < 2 ? 'Add the pickup place' : oneWay && dropoffPlace.trim().length < 2 ? 'Add the drop-off place' : 'Reserve'}
      </button>
      <div className="flex items-start gap-2 text-xs text-slate-500 leading-normal">
        <ShieldCheck className="w-4 h-4 text-[#006F3C] shrink-0 mt-0.5" />
        <span>No payment today. You pay at pickup. Days include the pickup and return days.</span>
      </div>
    </div>
  );
}
