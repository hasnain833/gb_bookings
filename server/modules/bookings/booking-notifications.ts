import { VendorModel } from '../../models/vendor.model.js';
import { escapeHtml } from '../email/auth-email.templates.js';
import { isEmailConfigured, sendTransactionalEmail } from '../email/brevo.service.js';

export type BookingEvent = 'created' | 'confirmed' | 'cancelled';

const guestCopy: Record<BookingEvent, { subject: string; message: string }> = {
  created: { subject: 'Booking request received', message: 'We have received your booking request. The property will confirm it shortly.' },
  confirmed: { subject: 'Booking confirmed', message: 'Your booking has been confirmed by the property. Payment is collected at the hotel.' },
  cancelled: { subject: 'Booking cancelled', message: 'Your booking has been cancelled.' },
};

const vendorCopy: Partial<Record<BookingEvent, { subject: string; message: string }>> = {
  created: { subject: 'New booking request', message: 'A guest has requested a booking. Please confirm or decline it from your vendor console.' },
  cancelled: { subject: 'Booking cancelled', message: 'A booking at your property has been cancelled and the rooms have been released.' },
};

function bookingEmail(title: string, name: string, message: string, booking: any, reason?: string) {
  const rows: [string, string][] = [
    ['Reference', booking.reference],
    ['Property', booking.listingSnapshot.title],
    ['Room', `${booking.roomSnapshot.name} × ${booking.rooms}`],
    ['Check-in', booking.checkIn],
    ['Check-out', `${booking.checkOut} (${booking.nights} night${booking.nights === 1 ? '' : 's'})`],
    ['Guests', `${booking.adults} adult(s), ${booking.children} child(ren)`],
    ['Total', `${booking.pricing.currency} ${(booking.pricing.totalMinor / 100).toLocaleString('en-PK')}`],
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
  sends.push(sendTransactionalEmail({
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
