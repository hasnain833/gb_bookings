import { useEffect, useState } from 'react';
import { AlertTriangle, LoaderCircle, Plus } from 'lucide-react';
import { api, type VendorListing, type VendorReport } from '../../shared/api/api';
import type { Booking, Review } from '../../types';
import { useReasonDialog } from '../../shared/components/ReasonDialog';
import { LISTING_STATUS } from './HotelWorkspace';
import { canOpen, partnerWords, type MemberArea, type PartnerKind, type VendorTab } from './VendorWorkspace';

const pkDate = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(date);
const pkr = (amount: number) => amount >= 1_000_000 ? `PKR ${(amount / 1_000_000).toFixed(2)}M` : `PKR ${amount.toLocaleString()}`;
const card = 'rounded-2xl border border-[#E3E7E2] bg-white';
const shortDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function timeLeft(respondBy?: string) {
  if (!respondBy) return { text: '', tone: 'text-[#3D4A42]' };
  const hours = (Date.parse(respondBy) - Date.now()) / 3_600_000;
  if (hours <= 0) return { text: 'Expiring now', tone: 'text-[#B91C1C]' };
  const text = hours < 1 ? `${Math.max(1, Math.round(hours * 60))} min left` : `${Math.round(hours)} h left`;
  return { text, tone: hours < 3 ? 'text-[#B91C1C]' : hours < 12 ? 'text-[#B45309]' : 'text-[#3D4A42]' };
}

type HomeData = {
  pending: Booking[]; pendingTotal: number; arriving: Booking[]; inHouse: Booking[];
  tonight?: VendorReport; month?: VendorReport; ahead?: VendorReport; reviews?: Review[]; reviewTotal?: number;
};

/** Partner home: what needs an answer, who arrives or leaves today, and how the business is doing. */
export default function PartnerHome({ kind, listings, access, userName, onTab, onOpenListing, onPending }: {
  kind: PartnerKind; listings: VendorListing[]; access?: MemberArea[]; userName: string;
  onTab: (tab: VendorTab) => void; onOpenListing: (id: string) => void; onPending: (count: number) => void;
}) {
  const words = partnerWords(kind);
  const car = kind === 'car';
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const { askReason, dialog } = useReasonDialog();
  const today = pkDate(new Date());
  const in14 = pkDate(new Date(Date.now() + 13 * 86_400_000));
  const reports = canOpen(access, 'reports');

  useEffect(() => {
    let active = true;
    setError('');
    const skip = <T,>() => Promise.resolve(undefined as T | undefined);
    Promise.all([
      api.getVendorBookings({ status: 'pending' }), api.getVendorBookings({ stay: 'arriving' }), api.getVendorBookings({ stay: 'in_house' }),
      reports ? api.getVendorReport(today, today) : skip<VendorReport>(),
      reports ? api.getVendorReport(`${today.slice(0, 8)}01`, today) : skip<VendorReport>(),
      reports ? api.getVendorReport(today, in14) : skip<VendorReport>(),
      api.getPartnerReviews().catch(() => undefined),
    ]).then(([pending, arriving, inHouse, tonight, month, ahead, reviews]) => {
      if (!active) return;
      // Oldest deadline first: those requests expire soonest.
      const sorted = [...pending.data].sort((a, b) => Date.parse(a.respondBy ?? '') - Date.parse(b.respondBy ?? ''));
      setData({ pending: sorted, pendingTotal: pending.pagination.total, arriving: arriving.data, inHouse: inHouse.data, tonight, month, ahead, reviews: reviews?.data, reviewTotal: reviews?.pagination.total });
      onPending(pending.pagination.total);
    }).catch((reason) => active && setError(reason instanceof Error ? reason.message : 'Your home page could not be loaded.'));
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, reports]);

  const act = async (booking: Booking, action: 'confirm' | 'cancel') => {
    let reason: string | undefined;
    if (action === 'cancel') {
      reason = (await askReason({
        title: 'Decline this request?', destructive: true, confirmLabel: 'Decline request', noteLabel: 'Reason for the guest',
        description: `${booking.customerName} · ${booking.reference ?? booking.id}. The guest is emailed this reason.`,
      }))?.trim();
      if (!reason) return;
    }
    setBusyId(booking.id); setError('');
    try { await api.actOnVendorBooking(booking.id, action, reason); setReload((value) => value + 1); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'The request could not be updated.'); }
    finally { setBusyId(null); }
  };

  const sum = (report: VendorReport | undefined, key: 'roomNightsSold' | 'roomNightsAvailable' | 'bookedRevenue' | 'collected') => report?.hotels.reduce((total, hotel) => total + hotel[key], 0) ?? 0;
  const percent = (report?: VendorReport) => { const available = sum(report, 'roomNightsAvailable'); return available ? Math.round((sum(report, 'roomNightsSold') / available) * 100) : 0; };
  const unit = car ? 'cars' : 'rooms';
  const leaving = data?.inHouse.filter((booking) => booking.endDate === today) ?? [];
  const checkedIn = data?.arriving.filter((booking) => booking.checkedInAt).length ?? 0;
  const missingPolicies = listings.filter((listing) => !car && (listing.status === 'published' || listing.status === 'paused') && !listing.stayInfo?.paymentMethods?.length);
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Karachi' }).format(new Date()));

  const tiles: Array<[string, string, string, boolean]> = data ? [
    ['Requests waiting', String(data.pendingTotal), data.pending[0] ? `First one: ${timeLeft(data.pending[0].respondBy).text || 'answer soon'}` : 'All answered', data.pendingTotal > 0],
    [car ? 'Pickups today' : 'Arriving today', String(data.arriving.length), data.arriving.length ? `${checkedIn} ${car ? 'handed over' : 'checked in'} so far` : 'No one due today', false],
    ...(reports ? [
      [car ? 'Cars out today' : 'Tonight', `${percent(data.tonight)}%`, `${sum(data.tonight, 'roomNightsSold')} of ${sum(data.tonight, 'roomNightsAvailable')} ${unit} ${car ? 'booked' : 'sold'}`, false],
      [new Date().toLocaleDateString('en-GB', { month: 'long' }), pkr(sum(data.month, 'bookedRevenue')), `${pkr(sum(data.month, 'collected'))} collected`, false],
    ] as Array<[string, string, string, boolean]> : [[car ? 'Out on the road' : 'In house', String(data.inHouse.length), `${leaving.length} ${car ? 'returning' : 'leaving'} today`, false] as [string, string, string, boolean]]),
  ] : [];

  const lanes: Array<[string, Booking[], string]> = data ? [
    [car ? 'Pickups today' : 'Arriving today', data.arriving, car ? 'No pickups today.' : 'No arrivals today.'],
    [car ? 'On the road' : 'In house', data.inHouse.filter((booking) => booking.endDate !== today), car ? 'No cars out.' : 'No guests staying.'],
    [car ? 'Returns today' : 'Leaving today', leaving, car ? 'No returns today.' : 'No one leaving today.'],
  ] : [];

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#5B6B61]">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Good {hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}{userName ? `, ${userName.split(' ')[0]}` : ''}</h1>
        </div>
        {canOpen(access, 'new-property') && <button type="button" onClick={() => onTab('new-property')} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-bold text-white hover:bg-[#005c32]"><Plus className="size-4" />Add {words.one}</button>}
      </div>

      {missingPolicies.map((listing) => <div key={listing.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#F5D9A8] bg-[#FFF8EB] px-4 py-3 text-sm text-[#6B4300]">
        <AlertTriangle className="size-5 shrink-0 text-[#B45309]" />
        <span className="flex-[1_1_300px]"><strong>{listing.title}</strong> has no policies or mountain essentials yet. Guests see less, so you get fewer bookings.</span>
        <button type="button" onClick={() => onOpenListing(listing.id)} className="min-h-10 font-bold text-[#7A4A00] underline">Fill them in</button>
      </div>)}

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {!data && !error && <div className="flex justify-center py-16"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading" /></div>}

      {data && listings.length === 0 && canOpen(access, 'new-property') && <section className={`${card} p-6`}>
        <h2 className="text-lg font-extrabold">Add your first {words.one}</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-4">{[`Add the ${words.one}, photos and ${kind === 'homestay' ? 'house rules' : car ? 'driver and fuel terms' : 'policies'}`, car ? 'Set the daily price and how many you have' : 'Add room categories and prices', 'Submit it for review', 'Once approved, guests can book it'].map((step, index) =>
          <li key={step} className="flex items-start gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#EAF4EE] text-xs font-bold text-[#0B5A33]">{index + 1}</span><p className="pt-1 text-sm text-[#3D4A42]">{step}</p></li>)}</ol>
      </section>}

      {data && <>
        <section aria-label="Summary" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
          {tiles.map(([name, value, hint, warm]) => <div key={name} className={`${card} p-5`}>
            <p className="text-sm font-semibold text-[#5B6B61]">{name}</p>
            <p className={`mt-1.5 text-3xl font-extrabold ${warm ? 'text-[#B45309]' : ''}`}>{value}</p>
            <p className="mt-1 text-[13px] text-[#5B6B61]">{hint}</p>
          </div>)}
        </section>

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
            <section aria-labelledby="needs-answer" className={`${card} overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-[#EEF1ED] px-5 py-4">
                <h2 id="needs-answer" className="text-lg font-extrabold">Needs your answer</h2>
                <button type="button" onClick={() => onTab('reservations')} className="min-h-9 text-[13px] font-bold text-[#006F3C] hover:underline">All {words.bookings.toLowerCase()}</button>
              </div>
              {data.pending.length === 0 && <p className="p-8 text-center text-sm text-[#5B6B61]">No requests waiting. New ones appear here, and we email you too.</p>}
              {data.pending.slice(0, 5).map((booking) => {
                const left = timeLeft(booking.respondBy);
                const what = [booking.listingTitle, booking.rooms && booking.roomName ? `${booking.roomName}${booking.rooms > 1 ? ` ×${booking.rooms}` : ''}` : booking.roomName,
                  `${shortDate(booking.startDate)}–${shortDate(booking.endDate)}`, booking.guests ? `${booking.guests} guest${booking.guests === 1 ? '' : 's'}` : '', booking.couponCode ? `promo ${booking.couponCode}` : ''].filter(Boolean).join(' · ');
                return <div key={booking.id} className="flex flex-wrap items-center gap-4 border-t border-[#EEF1ED] px-5 py-3.5 first-of-type:border-t-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EAF4EE] text-sm font-extrabold text-[#0B5A33]" aria-hidden="true">{booking.customerName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
                  <div className="min-w-0 flex-[1_1_240px]">
                    <p className="font-bold">{booking.customerName} <span className="font-medium text-[#5B6B61]">· {booking.reference}</span></p>
                    <p className="text-[13px] text-[#5B6B61]">{what}</p>
                  </div>
                  <div className="min-w-[110px] text-right">
                    <p className="font-extrabold">PKR {booking.totalPrice.toLocaleString()}</p>
                    <p className={`text-xs font-bold ${left.tone}`}>{left.text}</p>
                  </div>
                  {booking.vendorActions?.includes('confirm') && <div className="flex gap-2">
                    <button type="button" disabled={busyId === booking.id} onClick={() => act(booking, 'cancel')} className="min-h-10 rounded-lg border border-[#D9DED8] bg-white px-3.5 text-[13px] font-bold disabled:opacity-50">Decline</button>
                    <button type="button" disabled={busyId === booking.id} onClick={() => act(booking, 'confirm')} className="min-h-10 rounded-lg bg-[#006F3C] px-3.5 text-[13px] font-bold text-white hover:bg-[#005c32] disabled:opacity-50">Confirm</button>
                  </div>}
                </div>;
              })}
            </section>

            <div className="grid gap-4 md:grid-cols-3">
              {lanes.map(([title, items, empty]) => <section key={title} className={`${card} p-4`}>
                <h2 className="mb-1 flex justify-between text-[15px] font-extrabold">{title}<span className="font-semibold text-[#5B6B61]">{items.length}</span></h2>
                {items.length === 0 && <p className="py-3 text-[13px] text-[#5B6B61]">{empty}</p>}
                {items.slice(0, 4).map((booking) => <div key={booking.id} className="border-t border-[#EEF1ED] py-2.5 first-of-type:border-t-0">
                  <p className="truncate text-sm font-bold">{booking.customerName}</p>
                  <p className="truncate text-xs text-[#5B6B61]">{booking.roomName ?? booking.listingTitle}{booking.paymentStatus === 'paid' ? ' · paid' : ` · PKR ${booking.totalPrice.toLocaleString()} due`}</p>
                </div>)}
                {items.length > 4 && <button type="button" onClick={() => onTab('reservations')} className="min-h-9 text-[13px] font-bold text-[#006F3C]">+{items.length - 4} more</button>}
              </section>)}
            </div>
          </div>

          <aside className="flex flex-[1_1_300px] flex-col gap-4">
            {reports && <section className="rounded-2xl bg-[#003D21] p-5 text-white">
              <p className="text-sm font-semibold text-[#B5D5C1]">Next 14 days</p>
              <p className="mt-1 text-3xl font-extrabold">{percent(data.ahead)}% booked</p>
              <div className="mt-3 h-2 rounded-full bg-[#1F5A3B]"><div className="h-2 rounded-full bg-[#7FD3A2]" style={{ width: `${percent(data.ahead)}%` }} /></div>
              <p className="mt-3 text-[13px] text-[#B5D5C1]">{pkr(sum(data.ahead, 'bookedRevenue'))} booked. {percent(data.ahead) < 50 && canOpen(access, 'promo-codes') ? 'Quiet days ahead: a promo code can help.' : ''}</p>
              <div className="mt-3 flex gap-3 text-[13px] font-bold"><button type="button" onClick={() => onTab('reports')} className="min-h-9 underline">Reports</button>{canOpen(access, 'promo-codes') && <button type="button" onClick={() => onTab('promo-codes')} className="min-h-9 underline">Promo codes</button>}</div>
            </section>}

            {data.reviews && <section className={`${card} p-5`}>
              <div className="flex items-baseline justify-between"><h2 className="font-extrabold">Guest reviews</h2><span className="text-sm text-[#5B6B61]">{data.reviewTotal ?? 0} total</span></div>
              {data.reviews.length === 0 ? <p className="mt-2 text-sm text-[#5B6B61]">No reviews yet. Guests can review after their stay.</p> : (() => {
                const review = data.reviews[0];
                return <div className="mt-3 border-t border-[#EEF1ED] pt-3">
                  <p className="text-[13px] font-bold">{review.authorName} · {review.overall}/5{review.listingTitle ? ` · ${review.listingTitle}` : ''}</p>
                  {(review.liked || review.disliked) && <p className="mt-1 line-clamp-3 text-sm leading-6 text-[#3D4A42]">“{review.liked || review.disliked}”</p>}
                  <button type="button" onClick={() => onTab('reviews')} className="mt-2 min-h-9 rounded-lg border border-[#C9D3CC] px-3 text-[13px] font-bold text-[#006F3C]">{review.reply ? 'Open reviews' : 'Reply publicly'}</button>
                </div>;
              })()}
            </section>}

            {listings.length > 0 && <section className={`${card} p-5`}>
              <div className="flex items-baseline justify-between"><h2 className="font-extrabold">{words.many}</h2><button type="button" onClick={() => onTab('properties')} className="min-h-9 text-[13px] font-bold text-[#006F3C]">Manage</button></div>
              {listings.slice(0, 4).map((listing) => <button key={listing.id} type="button" onClick={() => onOpenListing(listing.id)} className="flex w-full items-center gap-3 border-t border-[#EEF1ED] py-2.5 text-left first-of-type:border-t-0">
                {listing.image ? <img src={listing.image} alt="" className="size-11 shrink-0 rounded-lg object-cover" /> : <span className="size-11 shrink-0 rounded-lg bg-[#E3E7E2]" />}
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{listing.title}</span><span className="block truncate text-xs text-[#5B6B61]">{listing.location}</span></span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${listing.pendingRevision ? 'bg-amber-50 text-amber-800' : LISTING_STATUS[listing.status][1]}`}>{listing.pendingRevision ? 'Change in review' : LISTING_STATUS[listing.status][0]}</span>
              </button>)}
            </section>}
          </aside>
        </div>
      </>}
    </div>
  );
}
