import { connectDatabase } from '../../database/connection.js';
import { BookingModel } from '../../models/booking.model.js';
import { notifyBooking } from '../bookings/booking-notifications.js';
import { checkRecentDuplicatePayments, completeFinishedStays, expireStalePendingBookings } from '../bookings/booking.service.js';
import { syncDueCalendars } from '../calendar/calendar.service.js';
import { todayInPakistan } from '../bookings/stay-dates.js';
import { sendPendingRefunds } from '../finance/refunds.service.js';
import { sendOfflineMessageAlerts } from '../messages/message.service.js';
import { REVIEW_WINDOW_DAYS } from '../reviews/review.service.js';

const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/** Claims one email by setting its flag first, so overlapping runs never send it twice. */
async function sendOnce(filter: Record<string, unknown>, flag: 'reminderSentAt' | 'reviewInviteSentAt', event: 'reminder' | 'review_invite') {
  let sent = 0;
  for (const candidate of await BookingModel.find({ ...filter, [flag]: null }).limit(200).select('_id').lean()) {
    const booking = await BookingModel.findOneAndUpdate({ _id: candidate._id, [flag]: null }, { $set: { [flag]: new Date() } }, { returnDocument: 'after' });
    if (booking) { await notifyBooking(booking, event); sent += 1; }
  }
  return sent;
}

/** Guests two days before the start; ended stays, while they can still be reviewed. */
export async function sendTripEmails(today = todayInPakistan()) {
  const reminders = await sendOnce({ status: 'confirmed', checkIn: { $gte: today, $lte: addDays(today, 2) } }, 'reminderSentAt', 'reminder');
  // `checkOut` is the day after a car's return or a tour's start, so this waits until the stay is over for every product.
  const invites = await sendOnce({ status: 'completed', checkOut: { $lte: today, $gte: addDays(today, -REVIEW_WINDOW_DAYS) } }, 'reviewInviteSentAt', 'review_invite');
  return { reminders, invites };
}

/** Every few minutes: expire unanswered bookings, finish stuck refunds, alert people about unread messages. */
export async function runFrequentJobs() {
  if (!await connectDatabase()) return { skipped: 'no database' };
  const results = await Promise.allSettled([expireStalePendingBookings(), sendPendingRefunds(), sendOfflineMessageAlerts(), completeFinishedStays(), checkRecentDuplicatePayments(), syncDueCalendars()]);
  for (const result of results) if (result.status === 'rejected') console.error('Scheduled job failed:', result.reason);
  return { expired: results[0].status === 'fulfilled' ? results[0].value : null };
}

export async function runDailyJobs() {
  if (!await connectDatabase()) return { skipped: 'no database' };
  return sendTripEmails();
}
