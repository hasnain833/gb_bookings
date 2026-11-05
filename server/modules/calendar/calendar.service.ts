import { randomBytes, randomUUID } from 'node:crypto';
import { promises as dns } from 'node:dns';
import { BlockList, isIP } from 'node:net';
import { HotelRoomTypeModel } from '../../models/hotel-room-type.model.js';
import { ListingModel } from '../../models/listing.model.js';
import { RoomNightModel } from '../../models/room-night.model.js';
import { VendorModel } from '../../models/vendor.model.js';
import { AppError } from '../../shared/app-error.js';
import { todayInPakistan } from '../bookings/stay-dates.js';
import { escapeHtml } from '../email/auth-email.templates.js';
import { isEmailConfigured, sendTransactionalEmail } from '../email/resend.service.js';
import { busyNights, buildIcal } from './ical.js';

const MAX_FEEDS = 5;
const MAX_FEED_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const SYNC_EVERY_MS = 30 * 60_000;
const SYNC_BATCH = 10;

// Addresses a partner's link must never reach: this server's own network, cloud metadata and the like.
const privateAddresses = new BlockList();
for (const [address, prefix] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 4], ['240.0.0.0', 4]] as const) privateAddresses.addSubnet(address, prefix, 'ipv4');
for (const [address, prefix] of [['::', 128], ['::1', 128], ['64:ff9b::', 96], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]] as const) privateAddresses.addSubnet(address, prefix, 'ipv6');

const unreadable = (reason = 'We could not read that calendar link. Check that it is the iCal (.ics) link and try again.') => new AppError(422, 'CALENDAR_LINK_INVALID', reason);

/** Calendar apps often write webcal://, which is plain HTTPS underneath. */
export const normalizeFeedUrl = (url: string) => url.trim().replace(/^webcal:\/\//i, 'https://');

async function assertPublicUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw unreadable(); }
  if (url.protocol !== 'https:' || (url.port && url.port !== '443') || url.username || url.password) throw unreadable('Use an https:// calendar link.');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await dns.lookup(host, { all: true }).catch(() => { throw unreadable(); });
  if (!addresses.length || addresses.some(({ address, family }) => privateAddresses.check(address, family === 6 ? 'ipv6' : 'ipv4'))) throw unreadable();
  return url;
}

/**
 * Fetches a partner-supplied link. Each redirect is checked again, and the size and time are capped.
 * ponytail: the address is checked before connecting, so DNS rebinding can slip through; pin the resolved IP if this ever matters.
 */
async function fetchCalendar(raw: string) {
  let target = raw;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const url = await assertPublicUrl(target);
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(10_000), headers: { Accept: 'text/calendar, text/plain' } }).catch(() => { throw unreadable(); });
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get('location');
      if (!next) throw unreadable();
      target = new URL(next, url).toString();
      continue;
    }
    if (!response.ok || !response.body) throw unreadable();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
      size += chunk.length;
      if (size > MAX_FEED_BYTES) throw unreadable('That calendar is too large.');
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
  }
  throw unreadable();
}

const feedView = (feed: any, today: string) => ({
  id: feed.id, name: feed.name, url: feed.url, lastSyncAt: feed.lastSyncAt, lastError: feed.lastError || undefined,
  nights: (feed.dates ?? []).filter((date: string) => date >= today).length,
});

/** Totals every feed into the room's nights, then notes nights that now hold more than the room has. */
async function writeSyncedNights(room: any, feeds: any[]) {
  const today = todayInPakistan();
  const counts = new Map<string, number>();
  for (const feed of feeds) for (const date of feed.dates ?? []) if (date >= today) counts.set(date, (counts.get(date) ?? 0) + 1);
  if (counts.size) {
    await RoomNightModel.bulkWrite([...counts].map(([date, count]) => ({
      updateOne: { filter: { roomTypeId: room._id, date }, update: { $set: { synced: Math.min(count, room.totalRooms) }, $setOnInsert: { booked: 0, closed: 0 } }, upsert: true },
    })), { ordered: false });
  }
  await RoomNightModel.updateMany({ roomTypeId: room._id, date: { $gte: today, $nin: [...counts.keys()] }, synced: { $gt: 0 } }, { $set: { synced: 0 } });
  const overbooked = await RoomNightModel.find({
    roomTypeId: room._id, date: { $gte: today, $in: [...counts.keys()] }, booked: { $gt: 0 },
    $expr: { $gt: [{ $add: ['$booked', { $ifNull: ['$closed', 0] }, { $ifNull: ['$synced', 0] }] }, room.totalRooms] },
  }).select('date').sort({ date: 1 }).lean() as any[];
  return overbooked.map((night) => night.date as string);
}

async function emailNewConflicts(room: any, conflicts: string[]) {
  const known = new Set<string>(room.icalConflicts ?? []);
  const fresh = conflicts.filter((date) => !known.has(date));
  if (!fresh.length || !isEmailConfigured()) return;
  const listing = await ListingModel.findById(room.listingId).select('ownerId title').lean() as any;
  const vendor = listing && await VendorModel.findById(listing.ownerId).select('name email').lean() as any;
  if (!vendor) return;
  await sendTransactionalEmail({
    to: { email: vendor.email, name: vendor.name }, subject: `Possible double booking: ${listing.title}`, tag: 'calendar-conflict',
    htmlContent: `<p>Hello ${escapeHtml(vendor.name)},</p><p>Another calendar now shows <strong>${escapeHtml(room.name)}</strong> at ${escapeHtml(listing.title)} as taken on nights already booked on GBBookings: <strong>${fresh.slice(0, 10).map(escapeHtml).join(', ')}</strong>.</p><p>Please check both calendars and sort this out with the guests.</p>`,
  }).catch((error) => console.warn(`Calendar conflict email failed: ${error.message}`));
}

/** Refreshes every feed of a room. A feed that fails keeps its last good nights, so a calendar outage doesn't reopen sold dates. */
async function syncRoom(room: any) {
  const today = todayInPakistan();
  const feeds = await Promise.all((room.icalFeeds ?? []).map(async (saved: any) => {
    const feed = saved.toObject?.() ?? saved;
    try {
      return { ...feed, dates: busyNights(await fetchCalendar(feed.url), today), lastSyncAt: new Date(), lastError: null };
    } catch (error) {
      return { ...feed, lastError: error instanceof AppError ? error.message : 'We could not read this calendar.' };
    }
  }));
  const conflicts = await writeSyncedNights(room, feeds);
  await emailNewConflicts(room, conflicts);
  await HotelRoomTypeModel.updateOne({ _id: room._id }, { $set: { icalFeeds: feeds, icalConflicts: conflicts, icalSyncedAt: new Date() } });
  return { feeds, conflicts };
}

/** Scheduled: the rooms whose calendars are most out of date. */
export async function syncDueCalendars() {
  const rooms = await HotelRoomTypeModel.find({
    'icalFeeds.0': { $exists: true }, status: 'active', deletedAt: null,
    $or: [{ icalSyncedAt: null }, { icalSyncedAt: { $lt: new Date(Date.now() - SYNC_EVERY_MS) } }],
  }).sort({ icalSyncedAt: 1 }).limit(SYNC_BATCH);
  for (const room of rooms) await syncRoom(room).catch((error) => console.warn(`Calendar sync of ${room.publicId} failed: ${error.message}`));
  return rooms.length;
}

const syncView = (room: any, token: string, feeds: any[], conflicts: string[]) => {
  const today = todayInPakistan();
  return { exportPath: `/api/v1/ical/${token}.ics`, feeds: feeds.map((feed) => feedView(feed, today)), conflicts: conflicts.filter((date) => date >= today), syncedAt: room.icalSyncedAt };
};

const newToken = () => randomBytes(32).toString('base64url');

async function tokenOf(room: any) {
  const stored = await HotelRoomTypeModel.findById(room._id).select('+icalToken').lean() as any;
  if (stored?.icalToken) return stored.icalToken as string;
  const token = newToken();
  await HotelRoomTypeModel.updateOne({ _id: room._id }, { $set: { icalToken: token } });
  return token;
}

export async function calendarSyncStatus(room: any) {
  return syncView(room, await tokenOf(room), room.icalFeeds ?? [], room.icalConflicts ?? []);
}

export async function addCalendarFeed(room: any, input: { name: string; url: string }) {
  const url = normalizeFeedUrl(input.url);
  if ((room.icalFeeds ?? []).length >= MAX_FEEDS) throw new AppError(409, 'TOO_MANY_CALENDARS', `A room can sync with up to ${MAX_FEEDS} calendars.`);
  // Read it now, so a wrong link is refused while the partner is still looking at it.
  const text = await fetchCalendar(url);
  let dates: string[];
  try { dates = busyNights(text); } catch { throw unreadable(); }
  const existing = (room.icalFeeds ?? []).map((feed: any) => feed.toObject?.() ?? feed);
  const feeds = [...existing, { id: `fed_${randomUUID()}`, name: input.name, url, dates, lastSyncAt: new Date(), lastError: null }];
  const conflicts = await writeSyncedNights(room, feeds);
  await emailNewConflicts(room, conflicts);
  await HotelRoomTypeModel.updateOne({ _id: room._id }, { $set: { icalFeeds: feeds, icalConflicts: conflicts, icalSyncedAt: new Date() } });
  return syncView({ ...room.toObject?.(), icalSyncedAt: new Date() }, await tokenOf(room), feeds, conflicts);
}

export async function removeCalendarFeed(room: any, feedId: string) {
  const existing = (room.icalFeeds ?? []).map((feed: any) => feed.toObject?.() ?? feed);
  const feeds = existing.filter((feed: any) => feed.id !== feedId);
  if (feeds.length === existing.length) throw new AppError(404, 'CALENDAR_NOT_FOUND', 'That calendar was not found.');
  const conflicts = await writeSyncedNights(room, feeds);
  await HotelRoomTypeModel.updateOne({ _id: room._id }, { $set: { icalFeeds: feeds, icalConflicts: conflicts } });
  return syncView(room, await tokenOf(room), feeds, conflicts);
}

export async function syncCalendarsNow(room: any) {
  const { feeds, conflicts } = await syncRoom(room);
  return syncView({ ...room.toObject?.(), icalSyncedAt: new Date() }, await tokenOf(room), feeds, conflicts);
}

/** A new secret link; the old one stops working at once, for when a link was shared by mistake. */
export async function resetCalendarLink(room: any) {
  const token = newToken();
  await HotelRoomTypeModel.updateOne({ _id: room._id }, { $set: { icalToken: token } });
  return syncView(room, token, room.icalFeeds ?? [], room.icalConflicts ?? []);
}

/**
 * The public feed behind the secret link. Only GBBookings bookings and the partner's own closures are exported:
 * nights that came from other calendars are left out, so two calendars cannot keep echoing each other's blocks.
 */
export async function calendarFeed(token: string) {
  const room = await HotelRoomTypeModel.findOne({ icalToken: token, deletedAt: null }).select('publicId name totalRooms').lean() as any;
  if (!room) throw new AppError(404, 'CALENDAR_NOT_FOUND', 'Calendar not found.');
  const nights = await RoomNightModel.find({
    roomTypeId: room._id, date: { $gte: todayInPakistan() },
    $expr: { $gte: [{ $add: ['$booked', { $ifNull: ['$closed', 0] }] }, room.totalRooms] },
  }).select('date').lean() as any[];
  return buildIcal(room.publicId, room.name, nights.map((night) => night.date));
}
