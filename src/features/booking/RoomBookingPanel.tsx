import { useEffect, useState } from 'react';
import { BedDouble, Calendar, ShieldCheck, Users } from 'lucide-react';
import { api, mealLabel, type ListingAvailability, type MealOption } from '../../shared/api/api';
import type { MealType, StayInfo } from '../../types';
import { openSeason, PAYMENT_LABELS } from '../../shared/utils/stayInfo';
import { formatDateForDisplay } from '../../shared/utils/date';
import type { CheckoutParams } from './CheckoutFlow';

interface RoomBookingPanelProps {
  listingId: string;
  /** Homestay meals; the ones with a price can be added to the booking. */
  meals?: MealOption[];
  /** A homestay let as a whole: always one unit, so no room count. */
  entireHome?: boolean;
  breakfastIncluded?: boolean;
  paymentMethods?: StayInfo['paymentMethods'];
  openMonths?: number[];
  onProceed: (params: CheckoutParams) => void;
}




const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
const inputClass = 'w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-800 focus:outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';
const labelClass = 'text-xs font-medium text-slate-600 flex items-center gap-1';

/** Live room availability and server-quoted prices for hotels and homestays. */
export default function RoomBookingPanel({ listingId, meals = [], entireHome = false, breakfastIncluded = false, paymentMethods, openMonths, onProceed }: RoomBookingPanelProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [chosenMeals, setChosenMeals] = useState<MealType[]>([]);
  const extraMeals = meals.filter((meal) => !meal.included);
  const [availability, setAvailability] = useState<ListingAvailability | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const datesReady = Boolean(checkIn && checkOut && checkOut > checkIn);
  // The server quotes the free-cancellation date and the meal cost with the availability.
  const choices = [
    ...(availability?.freeCancellationUntil ? [`Free cancellation until ${formatDateForDisplay(availability.freeCancellationUntil)}`] : []),
    paymentMethods?.length ? `Pay at the property (${paymentMethods.map((method) => PAYMENT_LABELS[method]).join(', ')})` : 'Pay at the property',
    ...(breakfastIncluded ? ['Breakfast included'] : []),
  ];
  const offSeason = Boolean(checkIn && openMonths?.length && !openMonths.includes(Number(checkIn.slice(5, 7))));

  useEffect(() => {
    setError(null);
    if (!datesReady) { setAvailability(null); setSelectedRoomId(null); return undefined; }

    let active = true;
    setLoading(true);
    api.getListingAvailability(listingId, { checkIn, checkOut, adults, children, rooms, meals: chosenMeals })
      .then((result) => {
        if (!active) return;
        setAvailability(result);
        // Keep the guest's room when only meals or the party changed and it still fits.
        setSelectedRoomId((current) => result.rooms.find((room) => room.id === current && room.bookable)?.id ?? result.rooms.find((room) => room.bookable)?.id ?? null);
      })
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [listingId, checkIn, checkOut, adults, children, rooms, chosenMeals, datesReady]);

  const selectedRoom = availability?.rooms.find((room) => room.id === selectedRoomId);
  const mealCost = availability?.mealsTotal ?? 0;

  const proceed = () => {
    if (!availability || !selectedRoom) return;
    onProceed({
      listingId,
      roomTypeId: selectedRoom.id,
      roomName: selectedRoom.name,
      startDate: checkIn,
      endDate: checkOut,
      rooms,
      adults,
      children,
      guests: adults + children,
      duration: availability.nights,
      totalPrice: selectedRoom.totalPrice,
      mealsTotal: mealCost,
      meals: chosenMeals,
      payAtHotel: true,
    });
  };

  return (
    <div className="space-y-5" id="room-booking-panel">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <label htmlFor="booking-check-in" className={labelClass}><Calendar className="w-3.5 h-3.5 text-slate-400" /> Check-in</label>
          <input id="booking-check-in" type="date" min={today()} value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="booking-check-out" className={labelClass}><Calendar className="w-3.5 h-3.5 text-slate-400" /> Check-out</label>
          <input id="booking-check-out" type="date" min={checkIn || today()} value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)} className={inputClass} />
        </div>
      </div>

      <div className={`grid gap-2 ${entireHome ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {([
          ['booking-adults', 'Adults', adults, setAdults, 1],
          ['booking-children', 'Children', children, setChildren, 0],
          ...(entireHome ? [] : [['booking-rooms', 'Rooms', rooms, setRooms, 1] as const]),
        ] as const).map(([id, label, value, setValue, min]) => (
          <div key={id} className="space-y-1.5">
            <label htmlFor={id} className={labelClass}><Users className="w-3.5 h-3.5 text-slate-400" /> {label}</label>
            <select id={id} value={value} onChange={(event) => setValue(Number(event.target.value))} className={inputClass}>
              {Array.from({ length: 10 - min + 1 }, (_, index) => index + min).map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {offSeason && <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">This property is usually {openSeason(openMonths).toLowerCase()}. Your dates fall outside that, so check with the property before travelling.</p>}

      <div className="space-y-2" aria-live="polite">
        <span className={labelClass}><BedDouble className="w-3.5 h-3.5 text-slate-400" /> {entireHome ? 'The home' : 'Choose a room'}</span>
        {!datesReady && <p className="text-xs text-slate-500">Select check-in and check-out dates to see {entireHome ? 'if the home is free' : 'available rooms'}.</p>}
        {loading && <div className="h-16 animate-pulse rounded-xl bg-slate-100" aria-label="Checking availability" />}
        {error && <p className="text-xs font-bold text-rose-600" role="alert">{error}</p>}
        {availability && availability.rooms.length === 0 && (
          <p className="text-xs text-slate-500">This property has not published any rooms yet.</p>
        )}
        {availability?.rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            disabled={!room.bookable}
            aria-pressed={room.id === selectedRoomId}
            onClick={() => setSelectedRoomId(room.id)}
            className={`w-full p-3 rounded-lg border text-left transition-all flex items-start justify-between gap-3 ${
              room.id === selectedRoomId ? 'border-[#006F3C] bg-emerald-50/60 ring-1 ring-[#006F3C]' : 'border-slate-200 bg-white hover:border-slate-300'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {room.photos?.[0] && <img src={room.photos[0].url} alt={room.photos[0].caption || room.name} className="size-16 shrink-0 rounded-md object-cover" />}
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold text-slate-900 block">{room.name}</span>
              <span className="text-xs text-slate-500 block mt-0.5">
                {room.bedType} · up to {room.maxAdults} adults{room.maxChildren ? `, ${room.maxChildren} child` : ''}
              </span>
              <span className={`text-xs font-medium block mt-0.5 ${room.available ? 'text-emerald-600' : 'text-rose-600'}`}>
                {room.available === 0 ? 'Sold out' : !room.bookable ? 'Does not fit your party' : `${room.available} left`}
              </span>
              {room.bookable && <span className="mt-1.5 flex flex-wrap gap-1">{choices.map((choice) => <span key={choice} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800">✓ {choice}</span>)}</span>}
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-bold text-slate-900 block">PKR {room.totalPrice.toLocaleString()}</span>
              <span className="text-xs text-slate-500 block">PKR {room.nightlyRate.toLocaleString()} / night</span>
            </div>
          </button>
        ))}
      </div>

      {extraMeals.length > 0 && (
        <fieldset className="space-y-2">
          <legend className={labelClass}>Add meals <span className="font-normal text-slate-400">· per guest per night</span></legend>
          {extraMeals.map((meal) => (
            <label key={meal.type} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span className="flex items-center gap-2"><input type="checkbox" checked={chosenMeals.includes(meal.type)} className="size-4 accent-[#006F3C]"
                onChange={(event) => setChosenMeals(event.target.checked ? [...chosenMeals, meal.type] : chosenMeals.filter((type) => type !== meal.type))} />{mealLabel(meal.type)}</span>
              <span className="text-slate-600">PKR {meal.price.toLocaleString()}</span>
            </label>
          ))}
        </fieldset>
      )}

      {selectedRoom && availability && (
        <div className="space-y-2 border-t border-slate-200 pt-4 text-sm" id="booking-price-breakdown">
          <div className="flex justify-between text-slate-500">
            <span>PKR {selectedRoom.nightlyRate.toLocaleString()} × {availability.nights} night{availability.nights > 1 ? 's' : ''}{entireHome ? '' : ` × ${rooms} room${rooms > 1 ? 's' : ''}`}</span>
            <span className="text-slate-800">PKR {selectedRoom.roomTotal.toLocaleString()}</span>
          </div>
          {mealCost > 0 && <div className="flex justify-between text-slate-500">
            <span>Meals · {adults + children} guest{adults + children > 1 ? 's' : ''} × {availability.nights} night{availability.nights > 1 ? 's' : ''}</span>
            <span className="text-slate-800">PKR {mealCost.toLocaleString()}</span>
          </div>}
          <div className="flex justify-between font-semibold text-slate-900">
            <span>Due at check-in</span>
            <span>PKR {selectedRoom.totalPrice.toLocaleString()}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={proceed}
        disabled={!selectedRoom}
        id="btn-checkout-proceed"
        className="w-full h-11 rounded-lg bg-[#006F3C] px-6 text-sm font-semibold text-white hover:bg-[#005C32] disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {selectedRoom ? 'Reserve' : 'Select dates to reserve'}
      </button>

      <div className="flex items-start gap-2 text-xs text-slate-500 leading-normal">
        <ShieldCheck className="w-4 h-4 text-[#006F3C] shrink-0 mt-0.5" />
        <span>No payment today. You pay at the property. Free cancellation until the day before check-in.</span>
      </div>
    </div>
  );
}
