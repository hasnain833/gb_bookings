import { useEffect, useState } from 'react';
import { ChevronRight, Pause, Play } from 'lucide-react';
import { api, type VendorListing, type VendorRoom } from '../../shared/api/api';
import PropertyEditor from './PropertyEditor';
import RoomCalendar from './RoomCalendar';
import RoomManager, { secondaryButton } from './RoomManager';
import VendorReservations from './VendorReservations';

type HotelTab = 'rooms' | 'details' | 'availability' | 'reservations';

export const LISTING_STATUS: Record<VendorListing['status'], [string, string]> = {
  draft: ['Draft', 'bg-slate-100 text-slate-700'],
  submitted: ['Awaiting approval', 'bg-amber-50 text-amber-800'],
  published: ['Live · bookable', 'bg-emerald-50 text-emerald-800'],
  paused: ['Paused', 'bg-sky-50 text-sky-800'],
  rejected: ['Changes requested', 'bg-rose-50 text-rose-700'],
  archived: ['Archived', 'bg-slate-100 text-slate-500'],
};

/** Availability tab: one room category's month calendar at a time. */
function AvailabilityTab({ listing }: { listing: VendorListing }) {
  const [rooms, setRooms] = useState<VendorRoom[] | null>(null);
  const [roomId, setRoomId] = useState('');
  useEffect(() => {
    let active = true;
    api.getHotelRooms(listing.id).then((result) => {
      if (!active) return;
      const visible = result.filter((room) => !room.pendingRevision?.isNew);
      setRooms(visible); setRoomId(visible[0]?.id ?? '');
    }).catch(() => active && setRooms([]));
    return () => { active = false; };
  }, [listing.id]);
  if (!rooms) return <p className="text-sm text-slate-500" role="status">Loading rooms…</p>;
  if (!rooms.length) return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Add a room category first.</p>;
  const room = rooms.find((item) => item.id === roomId) ?? rooms[0];
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Room category">
        {rooms.map((item) => <button key={item.id} type="button" aria-pressed={item.id === room.id} onClick={() => setRoomId(item.id)}
          className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${item.id === room.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}>{item.name}</button>)}
      </div>
      <RoomCalendar key={room.id} listingId={listing.id} room={room} />
    </div>
  );
}

export default function HotelWorkspace({ listing, onBack, onChange, onAvailability, busy }: {
  listing: VendorListing; onBack: () => void; onChange: (listing: VendorListing, message?: string) => void;
  onAvailability: (listing: VendorListing, action: 'pause' | 'resume') => void; busy: boolean;
}) {
  const [tab, setTab] = useState<HotelTab>('rooms');
  const [status, tone] = LISTING_STATUS[listing.status];
  const tabs: Array<[HotelTab, string]> = [['rooms', 'Rooms'], ['details', 'Details & photos'], ['availability', 'Availability'], ['reservations', 'Reservations']];
  const editable = ['draft', 'rejected', 'published', 'paused'].includes(listing.status);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 pt-5 sm:px-7">
        <p className="flex items-center gap-1 text-sm text-slate-500"><button type="button" onClick={onBack} className="min-h-11 font-semibold text-[#006F3C] hover:underline">Hotels &amp; rooms</button><ChevronRight className="size-4" /><span className="truncate">{listing.title}</span></p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <img src={listing.image} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-extrabold tracking-tight">{listing.title}</h2>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500"><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>{status}</span>{listing.location} · {listing.hotelSpecs?.hotelType ?? (listing.type === 'homestay' ? 'Homestay' : 'Hotel')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {listing.status === 'published' && <button type="button" className={secondaryButton} disabled={busy} onClick={() => onAvailability(listing, 'pause')}><Pause className="size-4" />Pause hotel</button>}
            {listing.status === 'paused' && <button type="button" className={`${secondaryButton} border-[#006F3C] text-[#006F3C]`} disabled={busy} onClick={() => onAvailability(listing, 'resume')}><Play className="size-4" />Resume hotel</button>}
          </div>
        </div>
        <nav aria-label="Hotel sections" className="mt-4 flex gap-6 overflow-x-auto">
          {tabs.map(([id, text]) => <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}
            className={`min-h-12 shrink-0 border-b-[3px] text-sm font-bold ${tab === id ? 'border-[#006F3C] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{text}</button>)}
        </nav>
      </div>

      {listing.pendingRevision && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Changes in review.</strong> Your edits go live once GBBookings approves them. Guests can still book the current version.</p>}
      {!listing.pendingRevision && listing.revisionRejectionReason && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><strong>Your last changes were not approved:</strong> {listing.revisionRejectionReason}</p>}
      {listing.status === 'rejected' && listing.rejectionReason && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><strong>Admin note:</strong> {listing.rejectionReason}</p>}
      {listing.status === 'paused' && <p className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">Paused: hidden from guests. Existing reservations are unaffected.</p>}

      {tab === 'rooms' && <RoomManager listing={listing} onListingChange={(updated) => onChange(updated, updated.status === 'submitted' ? `${updated.title} submitted for review.` : undefined)} />}
      {tab === 'details' && (editable
        ? <PropertyEditor key={listing.id + (listing.pendingRevision?.submittedAt ?? '')} listing={listing} onCancel={() => setTab('rooms')} onSaved={(updated) => {
            onChange(updated, updated.pendingRevision ? 'Changes sent for review. Your hotel stays live meanwhile.'
              : updated.status === 'published' || updated.status === 'paused' ? 'Saved. Nothing guests see has changed.' : 'Saved as a draft.');
            setTab('rooms');
          }} />
        : <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Details can be edited again once the review is finished.</p>)}
      {tab === 'availability' && <AvailabilityTab listing={listing} />}
      {tab === 'reservations' && <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"><VendorReservations listingId={listing.id} /></div>}
    </div>
  );
}
