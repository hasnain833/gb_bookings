import { VendorModel } from '../../models/vendor.model.js';
import { escapeHtml } from '../email/auth-email.templates.js';
import { isEmailConfigured, sendTransactionalEmail } from '../email/resend.service.js';
import { shownEnd } from './rental.js';

export type BookingEvent = 'created' | 'instant_booked' | 'details_changed' | 'confirmed' | 'paid' | 'cancelled' | 'changed' | 'change_requested' | 'change_declined' | 'change_proposed' | 'proposal_declined' | 'no_show' | 'no_show_disputed' | 'no_show_decided' | 'auto_completed' | 'reminder' | 'review_invite' | 'refund_sent';

const guestCopy: Partial<Record<BookingEvent, { subject: string; message: string }>> = {
  created: { subject: 'Booking request received', message: 'We have received your booking request. The property will confirm it shortly.' },
  confirmed: { subject: 'Booking confirmed', message: 'Your booking has been confirmed. Pay on arrival: you pay the partner directly.' },
  instant_booked: { subject: 'Booking confirmed', message: 'Your booking is confirmed. Pay on arrival: you pay the partner directly.' },
  paid: { subject: 'Payment received · booking confirmed', message: 'Thank you, we have received your payment and your booking is confirmed. There is nothing more to pay.' },
  cancelled: { subject: 'Booking cancelled', message: 'Your booking has been cancelled.' },
  changed: { subject: 'Booking changed', message: 'Your booking has been changed as agreed. The updated details and price are below.' },
  no_show: { subject: 'Marked as a no-show', message: 'The partner has marked this booking as a no-show. If you were there, or they turned you away, open My Bookings within 3 days and press "I was there". GBBookings will look into it.' },
  no_show_decided: { subject: 'Your no-show dispute', message: 'GBBookings has looked into the no-show on this booking. The decision is below.' },
  change_proposed: { subject: 'The partner proposed a change', message: 'The partner would like to change your booking. Nothing changes unless you accept. Open My Bookings to accept or decline; if you decline, your booking stays as it was.' },
  change_declined: { subject: 'Change request declined', message: 'The property could not make the change you asked for, so your booking stays as it was.' },
  reminder: { subject: 'Your trip is coming up', message: 'Your booking starts soon. Keep this email handy; your voucher is always in My Bookings.' },
  review_invite: { subject: 'How was it?', message: 'Thank you for booking with GBBookings. A short review helps other travellers and the partner. Open My Bookings and choose Write a review; you have 30 days.' },
  refund_sent: { subject: 'Your refund has been sent', message: 'We have sent your refund. It usually reaches your card or wallet within 7 to 14 working days, depending on your bank or wallet provider.' },
};

const vendorCopy: Partial<Record<BookingEvent, { subject: string; message: string }>> = {
  created: { subject: 'New booking request', message: 'A guest has requested a booking. Please confirm or decline it from your vendor console.' },
  instant_booked: { subject: 'New confirmed booking', message: 'A guest has booked with instant confirmation, so this booking is already confirmed. Collect payment on arrival. If you cannot honour it, cancel it from your vendor console as soon as you can.' },
  details_changed: { subject: 'Guest updated their details', message: 'The guest has updated their contact details, arrival time or requests. The latest are in your reservations.' },
  paid: { subject: 'New paid booking', message: 'A guest has booked and paid online, so the booking is confirmed. Do not collect payment from this guest.' },
  cancelled: { subject: 'Booking cancelled', message: 'A booking at your property has been cancelled and the rooms have been released.' },
  changed: { subject: 'Booking changed', message: 'This booking has been changed. The updated details and price are below.' },
  no_show_disputed: { subject: 'Guest disputes a no-show', message: 'The guest says they were there, so this booking is held back from your statements until GBBookings has looked into it. Their note is below.' },
  no_show_decided: { subject: 'No-show dispute decided', message: 'GBBookings has looked into the no-show on this booking. The decision is below.' },
  auto_completed: { subject: 'Booking completed', message: 'This stay ended 48 hours ago, so it has been marked as completed and commission applies. If something is wrong, contact GBBookings.' },
  proposal_declined: { subject: 'Guest declined your change', message: 'The guest declined the change you proposed, so the booking stays as it was.' },
  change_requested: { subject: 'Guest asked for a change', message: 'A guest would like to change this booking. Open your reservations to accept or decline; the new price is shown there.' },
};

/** The same emails for car rentals, in car words. */
const carWords = (message: string) => message
  .replace('at the property on arrival', 'at pickup').replace('at your property', 'for your car')
  .replace('the rooms have been released', 'the car is free again on those days').replace(/the property/g, 'the car partner');

/** The same emails for tours, in tour words. */
const tourWords = (message: string) => message
  .replace('at the property on arrival', 'at the start of the tour').replace('at your property', 'on your tour')
  .replace('the rooms have been released', 'the seats are free again').replace(/the property/g, 'the tour partner');

function bookingEmail(title: string, name: string, message: string, booking: any, reason?: string) {
  if (booking.rental) message = carWords(message);
  if (booking.tour) message = tourWords(message);
  const rows: [string, string][] = [
    ['Reference', booking.reference],
    [booking.tour ? 'Tour' : 'Property', booking.listingSnapshot.title],
    ...(booking.tour ? [] : [['Room', `${booking.roomSnapshot.name} × ${booking.rooms}`] as [string, string]]),
    ...(booking.tour ? [
      ['Dates', `${booking.checkIn} to ${shownEnd(booking)} (${booking.tour.days} day${booking.tour.days === 1 ? '' : 's'})`],
      ...(booking.tour.meetingPoint ? [['Meeting point', `${booking.tour.meetingPoint}${booking.tour.startTime ? ` at ${booking.tour.startTime}` : ''}`]] : []),
    ] as [string, string][] : booking.rental ? [
      ['Pickup', `${booking.checkIn} at ${booking.rental.pickupTime}, ${booking.rental.pickupPlace}`],
      ['Return', `${shownEnd(booking)}, ${booking.rental.dropoffPlace} (${booking.nights} day${booking.nights === 1 ? '' : 's'})`],
      ['Driver', booking.rental.driver ? 'With driver' : `Self-drive${booking.rental.depositMinor ? ` · deposit PKR ${(booking.rental.depositMinor / 100).toLocaleString('en-PK')} at pickup` : ''}`],
      ['Fuel', booking.rental.fuelIncluded ? 'Included' : 'Paid by the guest'],
      ...(booking.rental.extras?.length ? [['Extras', booking.rental.extras.map((item: any) => item.name).join(', ')]] : []),
      ...(booking.rental.kmPerDay ? [['Mileage', `${booking.rental.kmPerDay} km per day${booking.rental.extraPerKmMinor ? `, then PKR ${(booking.rental.extraPerKmMinor / 100).toLocaleString('en-PK')} per km` : ''}`]] : []),
    ] as [string, string][] : [
      ['Check-in', booking.checkIn],
      ['Check-out', `${booking.checkOut} (${booking.nights} night${booking.nights === 1 ? '' : 's'})`],
    ] as [string, string][]),
    ['Guests', `${booking.adults} adult(s), ${booking.children} child(ren)${booking.childAges?.length ? ` (ages ${booking.childAges.join(', ')})` : ''}`],
    ...(booking.arrivalTime ? [['Arrival time', booking.arrivalTime] as [string, string]] : []),
    ...(booking.meals?.length ? [['Meals', booking.meals.map((meal: any) => meal.type).join(', ')] as [string, string]] : []),
    ...(booking.status === 'confirmed' && booking.listingSnapshot.phone ? [[booking.tour ? 'Tour partner phone / WhatsApp' : 'Property phone / WhatsApp', booking.listingSnapshot.phone] as [string, string]] : []),
    ...(booking.coupon ? [['Promo code', `${booking.coupon.code} (−${booking.pricing.currency} ${((booking.pricing.discountMinor ?? 0) / 100).toLocaleString('en-PK')})`] as [string, string]] : []),
    ...(booking.pricing.charges ?? []).map((line: any) => [line.name, `${booking.pricing.currency} ${(line.amountMinor / 100).toLocaleString('en-PK')}`] as [string, string]),
    ['Total', `${booking.pricing.currency} ${(booking.pricing.totalMinor / 100).toLocaleString('en-PK')}`],
    ['Payment', booking.paymentStatus === 'paid' ? 'Paid' : 'Pay on arrival'],
    ...(reason ? [['Reason', reason] as [string, string]] : []),
  ];
  const table = rows.map(([label, value]) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#5e6d64">${escapeHtml(label)}</td><td style="padding:6px 0;font-weight:700">${escapeHtml(String(value))}</td></tr>`).join('');
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f4f7f5;font-family:Arial,sans-serif;color:#17211c">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px">
      <div style="background:#ffffff;border:1px solid #dce5df;padding:32px">
        <p style="margin:0 0 24px;color:#006f3c;font-size:20px;font-weight:700">GBBookings</p>
        <h1 style="margin:0 0 16px;font-size:24px">${escapeHtml(title)}</h1>
        <p style="line-height:1.6">Hello ${escapeHtml(name)},</p>
        <p style="line-height:1.6">${escapeHtml(message)}</p>
        <table style="border-collapse:collapse;margin-top:16px">${table}</table>
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Emails the guest and vendor about a booking change. Never throws: a failed email must not fail the booking.
 * ponytail: sent inline with the request; move to a queue with retries when BullMQ lands (Phase 7).
 */
export async function notifyBooking(booking: any, event: BookingEvent, reason?: string) {
  if (!isEmailConfigured()) return;
  const sends: Promise<unknown>[] = [];
  const guest = guestCopy[event];
  if (guest) sends.push(sendTransactionalEmail({
    to: { email: booking.guest.email, name: booking.guest.name },
    subject: `${guest.subject} · ${booking.reference}`,
    htmlContent: bookingEmail(guest.subject, booking.guest.name, guest.message, booking, reason),
    tag: `booking-${event}`,
  }));

  const vendor = vendorCopy[event];
  if (vendor && booking.vendorId) {
    sends.push(VendorModel.findById(booking.vendorId).select('name email').lean().then((record: any) => record && sendTransactionalEmail({
      to: { email: record.email, name: record.name },
      subject: `${vendor.subject} · ${booking.reference}`,
      htmlContent: bookingEmail(vendor.subject, record.name, vendor.message, booking, reason),
      tag: `booking-${event}-vendor`,
    })));
  }

  for (const result of await Promise.allSettled(sends)) {
    if (result.status === 'rejected') console.error(`Booking ${booking.reference} ${event} email failed:`, result.reason);
  }
}
