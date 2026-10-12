import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle, LoaderCircle, Printer, ShieldCheck } from 'lucide-react';
import type { Booking, Listing } from '../../types';
import { api } from '../../shared/api/api';

export interface CheckoutParams {
  listingId: string; startDate: string; endDate: string; totalPrice: number; guests: number; duration: number;
  roomTypeId?: string; roomName?: string; rooms?: number; adults?: number; children?: number; withDriver?: boolean; payAtHotel?: boolean;
}
interface CheckoutFlowProps {
  bookingParams: CheckoutParams; listing: Listing; userEmail?: string; userName?: string;
  existingBooking?: Booking; onSuccess: (booking: Booking) => void; onCancel: () => void;
}
const inputClass = 'mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm';
const buttonClass = 'min-h-11 rounded-lg bg-[#006F3C] px-5 text-sm font-semibold text-white disabled:opacity-50';

export default function CheckoutFlow({ bookingParams: params, listing, userEmail = '', userName = '', existingBooking, onSuccess, onCancel }: CheckoutFlowProps) {
  const [step, setStep] = useState<'details' | 'review' | 'receipt'>(existingBooking ? 'receipt' : 'details');
  const [contact, setContact] = useState({ name: userName, email: userEmail, phone: '' });
  const [specialRequests, setSpecialRequests] = useState('');
  const [quote, setQuote] = useState(params.totalPrice);
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
        children: params.children ?? 0, rooms: params.rooms ?? 1,
      });
      const room = result.rooms.find((item) => item.id === params.roomTypeId);
      if (!room?.bookable) throw new Error('This room is no longer available. Return to the property to choose another room or dates.');
      setQuote(room.totalPrice); setStep('review');
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
        specialRequests: specialRequests.trim() || undefined, expectedTotalMinor: Math.round(quote * 100),
      }, checkoutKey.current);
      setBooking(created); setStep('receipt');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to reserve. Please retry.'); }
    finally { submitting.current = false; setBusy(false); }
  };


  return (
    <div id="checkout-flow-component" className="mx-auto max-w-xl space-y-5 px-4 pb-20">
      {step !== 'receipt' && <button disabled={busy} type="button" onClick={step === 'details' ? onCancel : () => { setStep('details'); checkoutKey.current = crypto.randomUUID(); }} className="flex min-h-11 items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" />{step === 'details' ? 'Back to property' : 'Edit traveler details'}</button>}
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {step === 'details' && <form onSubmit={review} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold">Traveler details</h1>
        <p className="text-sm text-slate-500">{listing.title} · {params.startDate} to {params.endDate}</p>
        <label className="block text-sm font-semibold">Full name<input id="checkout-name" required minLength={2} maxLength={120} autoComplete="name" className={inputClass} value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} /></label>
        <label className="block text-sm font-semibold">Email address<input id="checkout-email" required type="email" autoComplete="email" className={inputClass} value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} /></label>
        <label className="block text-sm font-semibold">Phone number<input id="checkout-phone" required type="tel" minLength={7} maxLength={30} autoComplete="tel" className={inputClass} value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} /></label>
        <label className="block text-sm font-semibold">Special requests (optional)<textarea maxLength={1000} className={inputClass + ' min-h-24 py-3'} value={specialRequests} onChange={(event) => setSpecialRequests(event.target.value)} /></label>
        <button id="btn-checkout-review" disabled={busy} className={buttonClass + ' w-full'}>{busy ? 'Checking availability…' : 'Review reservation'}</button>
      </form>}
      {step === 'review' && <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold">Review your reservation</h1>
        <dl className="grid grid-cols-2 gap-3 text-sm"><dt>Property</dt><dd>{listing.title}</dd><dt>Room</dt><dd>{params.roomName}</dd><dt>Dates</dt><dd>{params.startDate} to {params.endDate}</dd><dt>Rooms / guests</dt><dd>{params.rooms ?? 1} room(s), {params.guests} guest(s)</dd><dt>Guest</dt><dd>{contact.name}</dd><dt>Total due at check-in</dt><dd className="font-bold">PKR {quote.toLocaleString()}</dd></dl>
        <p className="flex items-start gap-2 text-sm text-slate-600"><ShieldCheck className="size-5 shrink-0 text-[#006F3C]" />No payment today. The property will confirm your request. Free cancellation before the check-in date.</p>
        <button id="btn-confirm-booking" type="button" disabled={busy} onClick={reserve} className={buttonClass + ' flex w-full items-center justify-center gap-2'}>{busy && <LoaderCircle className="size-4 animate-spin" />}{busy ? 'Submitting reservation…' : 'Request reservation — pay at hotel'}</button>
      </section>}
      {step === 'receipt' && booking && <section id="checkout-step-4" className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div className="text-center"><CheckCircle className="mx-auto size-10 text-[#006F3C]" /><h1 className="mt-3 text-xl font-bold">{booking.status === 'pending' ? 'Reservation request received' : 'Reservation ' + booking.status.replace('_', ' ')}</h1><p className="mt-2 text-sm text-slate-600">{booking.status === 'pending' ? 'Your room is reserved while the property reviews your request. Track confirmation in My Bookings.' : 'Your reservation details are shown below.'}</p></div>
        <div id="printable-ticket-receipt" className="space-y-3 border-y border-slate-200 py-4"><p className="font-mono text-sm font-bold">{booking.reference ?? booking.id}</p><h2 className="font-bold">{booking.listingTitle}</h2><dl className="grid grid-cols-2 gap-3 text-sm"><dt>Guest</dt><dd>{booking.customerName}</dd><dt>Room</dt><dd>{booking.roomName} × {booking.rooms ?? 1}</dd><dt>Dates</dt><dd>{booking.startDate} to {booking.endDate}</dd><dt>Status</dt><dd className="capitalize">{booking.status.replace('_', ' ')}</dd><dt>Total</dt><dd className="font-bold">PKR {booking.totalPrice.toLocaleString()}</dd><dt>Payment</dt><dd>{booking.paymentStatus === 'paid' ? 'Paid' : booking.status === 'cancelled' ? 'Cancelled — no online payment collected' : 'Pay at property'}</dd></dl></div>
        <div className="flex flex-wrap gap-3"><button type="button" onClick={() => onSuccess(booking)} className={buttonClass}>Go to My Bookings</button><button type="button" onClick={() => window.print()} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm"><Printer className="size-4" />Print reservation</button></div>
      </section>}
    </div>
  );
}
