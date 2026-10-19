import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, BedDouble, CalendarDays, Check, CheckCircle, Clock, Copy, LoaderCircle, MapPin, Printer, ShieldCheck, Users } from 'lucide-react';
import { handleImageError, type Booking, type Listing } from '../../types';
import { api, mealLabel } from '../../shared/api/api';
import { whatsappNumber } from '../../shared/utils/stayInfo';
import type { MealType } from '../../types';
import { formatDateForDisplay } from '../../shared/utils/date';

export interface CheckoutParams {
  listingId: string; startDate: string; endDate: string; totalPrice: number; guests: number; duration: number;
  roomTypeId?: string; roomName?: string; rooms?: number; adults?: number; children?: number; withDriver?: boolean; payAtHotel?: boolean;
  /** Extra homestay meals; `totalPrice` already includes `mealsTotal`. */
  meals?: MealType[];
  mealsTotal?: number;
}
interface CheckoutFlowProps {
  bookingParams: CheckoutParams; listing: Listing; userEmail?: string; userName?: string;
  existingBooking?: Booking; onSuccess: (booking: Booking) => void; onCancel: () => void;
}
type Step = 'details' | 'review' | 'receipt';

const inputClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';
const buttonClass = 'min-h-11 rounded-lg bg-[#006F3C] px-5 text-sm font-semibold text-white hover:bg-[#005C32] disabled:opacity-50';
const CANCELLATION_NOTE = 'Free cancellation until the day before check-in.';
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const statusTone: Record<Booking['status'], string> = {
  pending: 'bg-amber-50 text-amber-800', confirmed: 'bg-emerald-50 text-emerald-800',
  completed: 'bg-slate-100 text-slate-700', cancelled: 'bg-rose-50 text-rose-700', no_show: 'bg-rose-50 text-rose-700',
};

export default function CheckoutFlow({ bookingParams: params, listing, userEmail = '', userName = '', existingBooking, onSuccess, onCancel }: CheckoutFlowProps) {
  const [step, setStep] = useState<Step>(existingBooking ? 'receipt' : 'details');
  const [contact, setContact] = useState({ name: userName, email: userEmail, phone: '' });
  const [specialRequests, setSpecialRequests] = useState('');
  const [quote, setQuote] = useState(params.totalPrice);
  const [mealCost, setMealCost] = useState(params.mealsTotal ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<Booking | null>(existingBooking ?? null);
  const checkoutKey = useRef(crypto.randomUUID());
  const submitting = useRef(false);

  const review = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (!params.roomTypeId) throw new Error('Select a room from the property page before checking out.');
      const result = await api.getListingAvailability(params.listingId, {
        checkIn: params.startDate, checkOut: params.endDate, adults: params.adults ?? params.guests,
        children: params.children ?? 0, rooms: params.rooms ?? 1, meals: params.meals,
      });
      const room = result.rooms.find((item) => item.id === params.roomTypeId);
      if (!room?.bookable) throw new Error('This room is no longer available. Return to the property to choose another room or dates.');
      setQuote(room.totalPrice); setMealCost(result.mealsTotal); setStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to check availability.'); }
    finally { setBusy(false); }
  };
  const reserve = async () => {
    if (submitting.current || booking || !params.roomTypeId) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const created = await api.createBooking({
        listingId: params.listingId, roomTypeId: params.roomTypeId, checkIn: params.startDate, checkOut: params.endDate,
        rooms: params.rooms ?? 1, adults: params.adults ?? params.guests, children: params.children ?? 0,
        guest: { name: contact.name.trim(), email: contact.email.trim(), phone: contact.phone.trim() },
        specialRequests: specialRequests.trim() || undefined, meals: params.meals?.length ? params.meals : undefined, expectedTotalMinor: Math.round(quote * 100),
      }, checkoutKey.current);
      setBooking(created); setStep('receipt');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to reserve. Please retry.'); }
    finally { submitting.current = false; setBusy(false); }
  };

  if (step === 'receipt' && booking) return <Receipt booking={booking} onDone={() => onSuccess(booking)} />;

  const rooms = params.rooms ?? 1;
  const nights = params.duration;
  const quoteChanged = quote !== params.totalPrice;
  const roomQuote = quote - mealCost;

  return (
    <div id="checkout-flow-component" className="mx-auto max-w-5xl space-y-6 px-4 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button disabled={busy} type="button" onClick={step === 'details' ? onCancel : () => { setStep('details'); checkoutKey.current = crypto.randomUUID(); }} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950"><ArrowLeft className="size-4" />{step === 'details' ? 'Back to property' : 'Edit your details'}</button>
        <Steps current={step} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-4">
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

          {step === 'details' && <form onSubmit={review} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div><h1 className="text-xl font-bold text-slate-950">Who’s checking in?</h1><p className="mt-1 text-sm text-slate-500">The property uses these details to confirm your stay.</p></div>
            <label className="block text-sm font-semibold text-slate-800">Full name<input id="checkout-name" required minLength={2} maxLength={120} autoComplete="name" className={inputClass} value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} /></label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-800">Email address<input id="checkout-email" required type="email" autoComplete="email" className={inputClass} value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} /><span className="mt-1 block text-xs font-normal text-slate-500">Your confirmation is sent here.</span></label>
              <label className="block text-sm font-semibold text-slate-800">Phone number<input id="checkout-phone" required type="tel" minLength={7} maxLength={30} autoComplete="tel" placeholder="03XX XXXXXXX" className={inputClass} value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} /><span className="mt-1 block text-xs font-normal text-slate-500">For the property to reach you about arrival.</span></label>
            </div>
            <label className="block text-sm font-semibold text-slate-800">Special requests <span className="font-normal text-slate-500">(optional)</span><textarea maxLength={1000} placeholder="Arrival time, bed preference, accessibility needs…" className={inputClass + ' min-h-24 py-3'} value={specialRequests} onChange={(event) => setSpecialRequests(event.target.value)} /><span className="mt-1 block text-xs font-normal text-slate-500">Requests depend on availability and aren’t guaranteed.</span></label>
            <button id="btn-checkout-review" disabled={busy} className={buttonClass + ' flex w-full items-center justify-center gap-2'}>{busy && <LoaderCircle className="size-4 animate-spin" />}{busy ? 'Checking availability…' : 'Continue to review'}</button>
          </form>}

          {step === 'review' && <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div><h1 className="text-xl font-bold text-slate-950">Review and request</h1><p className="mt-1 text-sm text-slate-500">Check everything before you send the request.</p></div>
            {quoteChanged && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">The price was updated by the property since you selected the room. The total below is the current price.</p>}
            <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
              <ReviewRow label="Guest">{contact.name}<span className="block text-slate-500">{contact.email} · {contact.phone}</span></ReviewRow>
              <ReviewRow label="Stay">{formatDateForDisplay(params.startDate)} → {formatDateForDisplay(params.endDate)}<span className="block text-slate-500">{plural(nights, 'night')}</span></ReviewRow>
              <ReviewRow label="Room">{rooms} × {params.roomName}<span className="block text-slate-500">{plural(params.adults ?? params.guests, 'adult')}{params.children ? `, ${plural(params.children, 'child')}` : ''}</span></ReviewRow>
              {params.meals?.length ? <ReviewRow label="Meals">{params.meals.map(mealLabel).join(', ')}<span className="block text-slate-500">PKR {mealCost.toLocaleString()} for {plural(params.guests, 'guest')}, paid at check-in</span></ReviewRow> : null}
              {specialRequests.trim() && <ReviewRow label="Requests"><span className="italic">“{specialRequests.trim()}”</span></ReviewRow>}
            </dl>
            <ol className="space-y-3 text-sm text-slate-700">
              {['You send a reservation request — no payment is taken today.', 'The property confirms it, and we email you.', `You pay PKR ${quote.toLocaleString()} at the property. ${CANCELLATION_NOTE}`].map((text, index) => (
                <li key={text} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-[#006F3C]">{index + 1}</span><span className="pt-0.5">{text}</span></li>
              ))}
            </ol>
            <button id="btn-confirm-booking" type="button" disabled={busy} onClick={reserve} className={buttonClass + ' flex w-full items-center justify-center gap-2'}>{busy && <LoaderCircle className="size-4 animate-spin" />}{busy ? 'Sending request…' : `Request reservation · PKR ${quote.toLocaleString()}`}</button>
            <p className="text-center text-xs text-slate-500">By requesting, you agree to the property’s policies shown on its page.</p>
          </section>}
        </div>

        <aside className="lg:sticky lg:top-28" aria-label="Your stay">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <img src={listing.image} alt="" onError={handleImageError} referrerPolicy="no-referrer" className="aspect-[16/9] w-full object-cover" />
            <div className="space-y-4 p-5">
              <div><h2 className="font-bold text-slate-950">{listing.title}</h2><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="size-3.5 shrink-0" />{listing.location}</p></div>
              <ul className="space-y-2 border-y border-slate-100 py-4 text-sm text-slate-700">
                <li className="flex gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-slate-400" /><span>{formatDateForDisplay(params.startDate)} → {formatDateForDisplay(params.endDate)} <span className="text-slate-500">· {plural(nights, 'night')}</span></span></li>
                {(listing.hotelSpecs?.checkInTime || listing.hotelSpecs?.checkOutTime) && <li className="flex gap-2"><Clock className="mt-0.5 size-4 shrink-0 text-slate-400" /><span>Check-in from {listing.hotelSpecs?.checkInTime ?? '—'} · out by {listing.hotelSpecs?.checkOutTime ?? '—'}</span></li>}
                <li className="flex gap-2"><BedDouble className="mt-0.5 size-4 shrink-0 text-slate-400" /><span>{rooms} × {params.roomName}</span></li>
                <li className="flex gap-2"><Users className="mt-0.5 size-4 shrink-0 text-slate-400" /><span>{plural(params.guests, 'guest')}</span></li>
              </ul>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600"><span>PKR {Math.round(roomQuote / nights / rooms).toLocaleString()} × {plural(nights, 'night')}{rooms > 1 ? ` × ${rooms} rooms` : ''}</span><span>PKR {roomQuote.toLocaleString()}</span></div>
                {mealCost > 0 && <div className="flex justify-between text-slate-600"><span>Meals ({params.meals!.map(mealLabel).join(', ')})</span><span>PKR {mealCost.toLocaleString()}</span></div>}
                <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-950"><span>Total</span><span>PKR {quote.toLocaleString()}</span></div>
                <p className="text-xs text-slate-500">Paid at the property on arrival.</p>
              </div>
              <p className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-900"><ShieldCheck className="size-4 shrink-0" />No payment today. {CANCELLATION_NOTE}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Steps({ current }: { current: Step }) {
  const steps: Array<[Step, string]> = [['details', 'Your details'], ['review', 'Review'], ['receipt', 'Confirmed']];
  const currentIndex = steps.findIndex(([id]) => id === current);
  return (
    <ol className="flex items-center gap-2 text-xs font-semibold sm:gap-3" aria-label="Checkout progress">
      {steps.map(([id, text], index) => (
        <li key={id} className="flex items-center gap-2 sm:gap-3" aria-current={id === current ? 'step' : undefined}>
          <span className={`flex size-6 items-center justify-center rounded-full ${index < currentIndex ? 'bg-[#006F3C] text-white' : index === currentIndex ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>{index < currentIndex ? <Check className="size-3.5" /> : index + 1}</span>
          <span className={`hidden sm:inline ${index === currentIndex ? 'text-slate-900' : 'text-slate-500'}`}>{text}</span>
          {index < steps.length - 1 && <span className="h-px w-4 bg-slate-300 sm:w-8" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

function ReviewRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 px-4 py-3"><dt className="text-slate-500">{label}</dt><dd className="break-words font-medium text-slate-900">{children}</dd></div>;
}

function Receipt({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const reference = booking.reference ?? booking.id;
  const pending = booking.status === 'pending';
  const nights = booking.duration ?? 1;
  const copy = () => navigator.clipboard.writeText(reference).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => undefined);
  const payment = booking.paymentStatus === 'paid' ? 'Paid' : booking.status === 'cancelled' ? 'Nothing to pay — reservation cancelled' : `Pay PKR ${booking.totalPrice.toLocaleString()} at the property`;

  return (
    <div id="checkout-flow-component" className="mx-auto max-w-2xl space-y-6 px-4 pb-24">
      <div className="text-center print:hidden">
        <CheckCircle className="mx-auto size-12 text-[#006F3C]" />
        <h1 className="mt-3 text-2xl font-bold text-slate-950">{pending ? 'Request sent — your room is held' : `Reservation ${booking.status.replace('_', '-')}`}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{pending ? `The property will review your request. We’ll email ${booking.customerEmail} as soon as it’s confirmed.${booking.respondBy ? ` If the property hasn’t replied by ${new Date(booking.respondBy).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}, the request expires automatically.` : ''}` : 'Your reservation details are below.'}</p>
      </div>

      <section id="printable-ticket-receipt" className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label="Reservation voucher">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 px-6 py-4 text-white">
          <div><p className="text-xs uppercase tracking-widest text-slate-400">Booking reference</p><p className="mt-0.5 font-mono text-lg font-bold">{reference}</p></div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusTone[booking.status]}`}>{pending ? 'Awaiting confirmation' : booking.status.replace('_', '-')}</span>
            <button type="button" onClick={copy} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs text-slate-300 hover:bg-white/10 print:hidden" aria-label="Copy booking reference"><Copy className="size-3.5" />{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </div>
        <div className="flex gap-4 border-b border-slate-100 p-6">
          {booking.listingImage && <img src={booking.listingImage} alt="" onError={handleImageError} referrerPolicy="no-referrer" className="size-20 shrink-0 rounded-xl object-cover" />}
          <div className="min-w-0"><h2 className="font-bold text-slate-950">{booking.listingTitle}</h2>{booking.listingLocation && <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="size-3.5 shrink-0" />{booking.listingLocation}</p>}<p className="mt-1 text-sm text-slate-700">{booking.rooms ?? 1} × {booking.roomName}</p></div>
        </div>
        <div className="grid grid-cols-2 border-b border-slate-100">
          <div className="border-r border-slate-100 p-6"><p className="text-xs text-slate-500">Check-in</p><p className="mt-1 font-bold text-slate-950">{formatDateForDisplay(booking.startDate)}</p>{booking.checkInTime && <p className="text-sm text-slate-600">from {booking.checkInTime}</p>}</div>
          <div className="p-6"><p className="text-xs text-slate-500">Check-out</p><p className="mt-1 font-bold text-slate-950">{formatDateForDisplay(booking.endDate)}</p>{booking.checkOutTime && <p className="text-sm text-slate-600">by {booking.checkOutTime}</p>}</div>
        </div>
        <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-3 p-6 text-sm">
          <dt className="text-slate-500">Guest</dt><dd className="break-words font-medium text-slate-900">{booking.customerName}<span className="block font-normal text-slate-500">{booking.customerEmail}{booking.customerPhone ? ` · ${booking.customerPhone}` : ''}</span></dd>
          <dt className="text-slate-500">Guests</dt><dd className="font-medium text-slate-900">{plural(booking.adults ?? booking.guests ?? 1, 'adult')}{booking.children ? `, ${plural(booking.children, 'child')}` : ''}</dd>
          {booking.nightlyRate !== undefined && <><dt className="text-slate-500">Rate</dt><dd className="font-medium text-slate-900">PKR {booking.nightlyRate.toLocaleString()} × {plural(nights, 'night')}{(booking.rooms ?? 1) > 1 ? ` × ${booking.rooms} rooms` : ''}</dd></>}
          {booking.meals?.length ? <><dt className="text-slate-500">Meals</dt><dd className="font-medium text-slate-900">{booking.meals.map((meal) => mealLabel(meal.type)).join(', ')} · PKR {(booking.mealsTotal ?? 0).toLocaleString()}</dd></> : null}
          <dt className="text-slate-500">Total</dt><dd className="text-base font-bold text-slate-950">PKR {booking.totalPrice.toLocaleString()}</dd>
          <dt className="text-slate-500">Payment</dt><dd className="font-medium text-slate-900">{payment}</dd>
          {booking.propertyPhone && <><dt className="text-slate-500">Property contact</dt><dd className="font-medium text-slate-900">
            <a href={`tel:${booking.propertyPhone.replace(/\s/g, '')}`} className="text-[#006F3C] underline">{booking.propertyPhone}</a>
            {whatsappNumber(booking.propertyPhone) && <a href={`https://wa.me/${whatsappNumber(booking.propertyPhone)}?text=${encodeURIComponent(`Hello, I have booking ${reference} at ${booking.listingTitle}.`)}`} target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex min-h-9 items-center rounded-md bg-emerald-50 px-2 text-xs font-semibold text-emerald-800 print:hidden">WhatsApp</a>}
          </dd></>}
          {booking.specialRequests && <><dt className="text-slate-500">Requests</dt><dd className="italic text-slate-700">“{booking.specialRequests}”</dd></>}
        </dl>
        {booking.status !== 'cancelled' && <p className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs leading-5 text-slate-600">{CANCELLATION_NOTE} Cancel from My Bookings. Show this reference at the property on arrival.</p>}
      </section>

      <div className="flex flex-wrap justify-center gap-3 print:hidden">
        <button type="button" onClick={onDone} className={buttonClass}>Go to My Bookings</button>
        <button type="button" onClick={() => window.print()} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Printer className="size-4" />Print voucher</button>
      </div>
    </div>
  );
}
