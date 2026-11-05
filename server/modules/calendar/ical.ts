import { todayInPakistan } from '../bookings/stay-dates.js';

const DAY_MS = 86_400_000;
const MAX_NIGHTS_PER_EVENT = 400;
const LOOK_AHEAD_DAYS = 730;
const MAX_EVENTS = 5_000;

const toMs = (date: string) => Date.parse(`${date}T00:00:00Z`);
const toDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** The calendar date of an iCal value. A time in UTC ("...Z") becomes the Pakistan date. */
function dateOf(value: string | undefined) {
  const match = value?.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second, utc] = match;
  if (utc) return todayInPakistan(new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`));
  return `${year}-${month}-${day}`;
}

/**
 * The nights another calendar has taken, one entry per event per night, so two events on one night count twice.
 * The end date is the morning the guest leaves, so it is not a night. Cancelled and "free" events are skipped.
 */
export function busyNights(text: string, today = todayInPakistan()) {
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  if (!/^BEGIN:VCALENDAR/m.test(unfolded)) throw new Error('This link does not return a calendar.');
  const last = toDate(toMs(today) + LOOK_AHEAD_DAYS * DAY_MS);
  const nights: string[] = [];
  const events = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? [];
  for (const event of events.slice(0, MAX_EVENTS)) {
    if (/^STATUS:CANCELLED/mi.test(event) || /^TRANSP:TRANSPARENT/mi.test(event)) continue;
    const start = dateOf(event.match(/^DTSTART[^:\r\n]*:(.+)$/m)?.[1]?.trim());
    if (!start) continue;
    const end = dateOf(event.match(/^DTEND[^:\r\n]*:(.+)$/m)?.[1]?.trim());
    const count = Math.min(MAX_NIGHTS_PER_EVENT, end && end > start ? Math.round((toMs(end) - toMs(start)) / DAY_MS) : 1);
    for (let index = 0; index < count; index += 1) {
      const night = toDate(toMs(start) + index * DAY_MS);
      if (night >= today && night <= last) nights.push(night);
    }
  }
  return nights;
}

/** A feed other calendars can import: unavailable nights only, with nothing about the guests. */
export function buildIcal(roomId: string, roomName: string, nights: string[], now = new Date()) {
  const clean = (text: string) => text.replace(/[\\;,]/g, (character) => `\\${character}`).replace(/[\r\n]+/g, ' ');
  const compact = (date: string) => date.replaceAll('-', '');
  const stamp = now.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const ranges: Array<[string, string]> = [];
  for (const night of [...new Set(nights)].sort()) {
    const open = ranges.at(-1);
    if (open && toMs(open[1]) === toMs(night)) open[1] = toDate(toMs(night) + DAY_MS);
    else ranges.push([night, toDate(toMs(night) + DAY_MS)]);
  }
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GBBookings//Availability//EN', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${clean(roomName)}`,
    ...ranges.flatMap(([start, end]) => [
      'BEGIN:VEVENT', `UID:${roomId}-${start}@gbbookings`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${compact(start)}`, `DTEND;VALUE=DATE:${compact(end)}`, 'SUMMARY:Not available', 'END:VEVENT',
    ]),
    'END:VCALENDAR', '',
  ].join('\r\n');
}
