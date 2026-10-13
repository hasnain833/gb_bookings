import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Archive, ArrowRight, CalendarCheck, Copy, Hotel, LoaderCircle, Pause, Play } from 'lucide-react';
import { api, type VendorListing, type VendorProfile } from '../../shared/api/api';
import RoomManager from './RoomManager';
import VendorReservations from './VendorReservations';
import PropertyEditor from './PropertyEditor';
import SecurityPanel from '../account/SecurityPanel';
import VendorWorkspace, { type VendorTab } from './VendorWorkspace';
import BusinessProfile from './BusinessProfile';
import { useReasonDialog } from '../../shared/components/ReasonDialog';

interface VendorDashboardProps { setView: (view: string) => void; userName: string; userEmail: string; onSignOut: () => Promise<void> }
const inputClass = 'min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C]';
const listingStatus: Record<VendorListing['status'], [string, string]> = {
  draft: ['Draft', 'bg-slate-100 text-slate-700'],
  submitted: ['Awaiting approval', 'bg-amber-50 text-amber-800'],
  published: ['Live', 'bg-emerald-50 text-emerald-800'],
  paused: ['Paused', 'bg-sky-50 text-sky-800'],
  rejected: ['Changes requested', 'bg-rose-50 text-rose-700'],
  archived: ['Archived', 'bg-slate-100 text-slate-500'],
};
const toolButton = 'inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';

/** Partner dashboard for approved hotel businesses; registration lives on the Become a partner page. */
export default function VendorDashboard({ setView, userName, userEmail, onSignOut }: VendorDashboardProps) {
  const [tab, setTab] = useState<VendorTab>('overview');
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [listings, setListings] = useState<VendorListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [hotel, setHotel] = useState({ title: '', location: '', description: '', price: '', hotelType: 'Hotel', amenities: '', facilities: '', policies: '', checkInTime: '14:00', checkOutTime: '11:00', roomName: '', bedType: 'Double', maxAdults: '2', maxChildren: '1', totalRooms: '1' });
  const [hotelImages, setHotelImages] = useState<File[]>([]);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [openListingId, setOpenListingId] = useState<string | null>(null);
  const [listingBusyId, setListingBusyId] = useState<string | null>(null);
  const { askReason, dialog } = useReasonDialog();

  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError('');
    api.getMyVendor()
      .then(async (result) => {
        if (!active) return;
        setVendor(result.data);
        if (result.data.status === 'approved') {
          const hotels = await api.getVendorListings();
          if (active) setListings(hotels);
        }
      })
      .catch((error) => { if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load your partner account.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const navigate = (next: VendorTab) => { setTab(next); setMessage(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const createHotel = async (event: FormEvent) => {
    event.preventDefault();
    if (!hotelImages.length || hotelImages.length > 20) { setMessage('Select between 1 and 20 property images.'); return; }
    setBusy(true); setMessage('');
    let createdListingId: string | null = null;
    try {
      const imageIds: string[] = [];
      for (const file of hotelImages) imageIds.push((await api.uploadMedia('images', file)).data.id);
      const created = await api.createHotelListing({
        type: 'hotel',
        title: hotel.title, location: hotel.location, description: hotel.description, price: Number(hotel.price), imageIds,
        hotelSpecs: {
          hotelType: hotel.hotelType,
          amenities: hotel.amenities.split(',').map((value) => value.trim()).filter(Boolean),
          facilities: hotel.facilities.split(',').map((value) => value.trim()).filter(Boolean),
          policies: hotel.policies.split(',').map((value) => value.trim()).filter(Boolean),
          checkInTime: hotel.checkInTime, checkOutTime: hotel.checkOutTime,
        },
      });
      // Keep the draft visible even if room creation fails; it can be completed through the room manager.
      setListings((items) => [created.data, ...items]);
      createdListingId = created.data.id;
      await api.addHotelRoom(created.data.id, {
        name: hotel.roomName, bedType: hotel.bedType, maxAdults: Number(hotel.maxAdults), maxChildren: Number(hotel.maxChildren),
        totalRooms: Number(hotel.totalRooms), basePrice: Number(hotel.price), amenities: [],
      });
      setOpenListingId(created.data.id);
      setTab('properties');
      // Left as a draft so the vendor can add more room categories before submitting.
      setMessage('Hotel saved as a draft. Add any other room categories below, then submit it for review.'); setHotelImages([]);
      setHotel((current) => ({ ...current, title: '', location: '', description: '', price: '', roomName: '' }));
    } catch (error) {
      if (createdListingId) { setOpenListingId(createdListingId); setTab('properties'); }
      setMessage(`${createdListingId ? 'Property draft saved, but its first room could not be added. Add the room below. ' : ''}${error instanceof Error ? error.message : 'Unable to create the hotel.'}`);
    }
    finally { setBusy(false); }
  };

  const listingAction = async (listing: VendorListing, action: 'pause' | 'resume' | 'duplicate' | 'archive') => {
    const label = listing.type === 'homestay' ? 'homestay' : 'hotel';
    if (action === 'archive' && await askReason({
      title: `Archive ${listing.title}?`, destructive: true, confirmLabel: `Archive ${label}`,
      description: 'It disappears from search and from this list, and cannot be booked. Existing reservations stay in Reservations and must still be honoured.',
    }) === null) return;
    if (action === 'pause' && await askReason({
      title: `Pause ${listing.title}?`, confirmLabel: 'Pause bookings',
      description: 'Guests will not find or book it until you resume. Existing reservations are not affected.',
    }) === null) return;
    setListingBusyId(listing.id); setMessage('');
    try {
      if (action === 'archive') {
        await api.archiveListing(listing.id);
        setListings((items) => items.filter((item) => item.id !== listing.id));
        setMessage(`${listing.title} archived.`);
      } else if (action === 'duplicate') {
        const copy = await api.duplicateListing(listing.id);
        setListings((items) => [copy, ...items]);
        setEditingListingId(copy.id);
        setMessage('Draft copy created. Rename it and update the details, then submit it for review.');
      } else {
        const updated = await api.setListingStatus(listing.id, action === 'pause' ? 'paused' : 'published');
        setListings((items) => items.map((item) => item.id === updated.id ? updated : item));
        setMessage(action === 'pause' ? `${listing.title} is paused and hidden from guests.` : `${listing.title} is live again.`);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The property could not be updated.'); }
    finally { setListingBusyId(null); }
  };

  return (
    <VendorWorkspace tab={tab} onTab={navigate} businessName={vendor?.name} status={vendor?.status} userName={userName} userEmail={userEmail} onBrowse={() => setView('explore')} onSignOut={onSignOut}>
      {loading ? <div className="flex min-h-64 items-center justify-center" role="status"><LoaderCircle className="size-7 animate-spin text-[#006F3C]" /><span className="sr-only">Loading your workspace</span></div>
        : loadError ? <div role="alert" className="rounded-xl border border-rose-200 bg-white p-6"><p className="text-sm text-rose-700">{loadError}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="mt-4 min-h-11 rounded-lg border px-4 text-sm font-semibold">Try again</button></div> : <div className="space-y-6">
      {dialog}
      {message && <p className="border-l-4 border-[#006F3C] bg-emerald-50 p-3 text-sm text-slate-700" role="status">{message}</p>}

      {vendor && vendor.status !== 'approved' && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">Your partner account is {vendor.status}. Hotel tools are unavailable. <button type="button" className="font-semibold underline" onClick={() => setView('become-partner')}>View partner status</button></div>}

      {tab === 'overview' && <>
        <section className="overflow-hidden rounded-2xl bg-[#063d2b] p-6 text-white sm:p-8"><p className="text-xs font-medium text-emerald-200">Welcome, {userName || 'partner'}</p><h2 className="mt-3 text-xl font-semibold sm:text-2xl">{listings.length ? 'Your hotels at a glance' : 'Add your first hotel'}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100">{listings.length ? 'Manage rooms, availability and reservations. Answer new booking requests quickly — they expire if left pending.' : 'Create a hotel, add its room categories and photos, then submit it for review. Once approved, guests can book it.'}</p><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => navigate(listings.length ? 'properties' : 'new-property')} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-emerald-900">{listings.length ? 'Manage hotels' : 'Add a hotel'}<ArrowRight className="size-4" /></button><button type="button" onClick={() => navigate('reservations')} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/30 px-4 text-sm font-semibold text-white hover:bg-white/10"><CalendarCheck className="size-4" />Reservations</button></div></section>
        <div className="grid gap-4 sm:grid-cols-3">{[
          ['Hotels', String(listings.length), 'In your workspace'],
          ['Live', String(listings.filter((item) => item.status === 'published').length), 'Visible and bookable by guests'],
          ['Awaiting approval', String(listings.filter((item) => item.status === 'submitted').length), 'Under review by our team'],
        ].map(([label, value, detail]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p><p className="mt-2 text-xs text-slate-400">{detail}</p></div>)}</div>
        <section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="font-semibold">Getting a hotel live</h2><ol className="mt-5 grid gap-5 md:grid-cols-4">{['Add the hotel, photos and policies', 'Add room categories and prices', 'Submit it for review', 'Once approved, guests can book it'].map((label, index) => <li key={label} className="flex items-start gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">{index + 1}</span><p className="pt-1 text-sm leading-5 text-slate-600">{label}</p></li>)}</ol></section>
      </>}

      {tab === 'business' && vendor && <BusinessProfile vendor={vendor} onChange={setVendor} />}

      {tab === 'security' && <section className="rounded-xl border border-slate-200 bg-white p-6"><SecurityPanel /></section>}

      {vendor?.status === 'approved' && <>
        {tab === 'reservations' && <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"><VendorReservations properties={listings} /></div>}
        {tab === 'new-property' && <form onSubmit={createHotel} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3"><Hotel className="size-5 text-[#006F3C]" /><h2 className="font-bold text-slate-900">Add a hotel</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Hotel name"><input className={inputClass} required value={hotel.title} onChange={(e) => setHotel({ ...hotel, title: e.target.value })} /></Field>
            <Field label="Location"><input className={inputClass} required value={hotel.location} onChange={(e) => setHotel({ ...hotel, location: e.target.value })} /></Field>
            <Field label="Base price PKR"><input className={inputClass} type="number" min="0" required value={hotel.price} onChange={(e) => setHotel({ ...hotel, price: e.target.value })} /></Field>
            <Field label="Property photos (first photo is primary)"><input className={`${inputClass} pt-2`} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" required onChange={(e) => setHotelImages(Array.from(e.target.files ?? []))} /></Field>
            <label className="text-xs font-semibold text-slate-600 md:col-span-2">Description<textarea className="mt-1 min-h-28 w-full rounded-md border border-slate-300 p-3 text-sm" minLength={20} required value={hotel.description} onChange={(e) => setHotel({ ...hotel, description: e.target.value })} /></label>
            <Field label="Amenities, comma separated"><input className={inputClass} value={hotel.amenities} onChange={(e) => setHotel({ ...hotel, amenities: e.target.value })} /></Field>
            <Field label="Policies, comma separated"><input className={inputClass} value={hotel.policies} onChange={(e) => setHotel({ ...hotel, policies: e.target.value })} /></Field>
            <Field label="Facilities, comma separated"><input className={inputClass} value={hotel.facilities} onChange={(e) => setHotel({ ...hotel, facilities: e.target.value })} /></Field>
            <Field label="First room category"><input className={inputClass} required value={hotel.roomName} onChange={(e) => setHotel({ ...hotel, roomName: e.target.value })} /></Field>
            <Field label="Total rooms"><input className={inputClass} type="number" min="1" required value={hotel.totalRooms} onChange={(e) => setHotel({ ...hotel, totalRooms: e.target.value })} /></Field>
            <Field label="Bed type"><input className={inputClass} required value={hotel.bedType} onChange={(e) => setHotel({ ...hotel, bedType: e.target.value })} /></Field>
            <Field label="Adults per room"><input className={inputClass} type="number" min="1" max="20" required value={hotel.maxAdults} onChange={(e) => setHotel({ ...hotel, maxAdults: e.target.value })} /></Field>
            <Field label="Children per room"><input className={inputClass} type="number" min="0" max="20" required value={hotel.maxChildren} onChange={(e) => setHotel({ ...hotel, maxChildren: e.target.value })} /></Field>
            <Field label="Check-in time"><input className={inputClass} type="time" required value={hotel.checkInTime} onChange={(e) => setHotel({ ...hotel, checkInTime: e.target.value })} /></Field>
            <Field label="Check-out time"><input className={inputClass} type="time" required value={hotel.checkOutTime} onChange={(e) => setHotel({ ...hotel, checkOutTime: e.target.value })} /></Field>
          </div>
          <button disabled={busy} className="min-h-11 rounded-md bg-[#0F172A] px-5 text-sm font-bold text-white disabled:opacity-50">Save as draft</button>
        </form>}
        {tab === 'properties' && <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 font-bold text-slate-900">Your properties</h2>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {listings.map((listing) => (
              <div key={listing.id} className="py-4">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <img src={listing.image} alt="" className="size-14 rounded-md object-cover" />
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{listing.title}</p><p className="text-xs text-slate-500">{listing.type === 'homestay' ? 'Homestay' : 'Hotel'} · {listing.location}</p></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${listingStatus[listing.status][1]}`}>{listingStatus[listing.status][0]}</span>
                </div>
                {listing.status === 'rejected' && listing.rejectionReason && <p className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-800"><strong>Admin note:</strong> {listing.rejectionReason}</p>}
                {listing.status === 'paused' && <p className="mt-3 text-sm text-sky-800">Hidden from guests. Existing reservations are unaffected.</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {['draft', 'rejected', 'published', 'paused'].includes(listing.status) && <button type="button" className={toolButton} aria-expanded={editingListingId === listing.id} onClick={() => setEditingListingId(editingListingId === listing.id ? null : listing.id)}>Edit property</button>}
                  <button type="button" aria-expanded={openListingId === listing.id} onClick={() => setOpenListingId(openListingId === listing.id ? null : listing.id)} className={toolButton}>
                    {openListingId === listing.id ? 'Close rooms' : 'Rooms'}
                  </button>
                  {listing.status === 'published' && <button type="button" disabled={listingBusyId === listing.id} onClick={() => listingAction(listing, 'pause')} className={toolButton}><Pause className="size-4" />Pause</button>}
                  {listing.status === 'paused' && <button type="button" disabled={listingBusyId === listing.id} onClick={() => listingAction(listing, 'resume')} className={`${toolButton} border-[#006F3C] text-[#006F3C]`}><Play className="size-4" />Resume</button>}
                  <button type="button" disabled={listingBusyId === listing.id} onClick={() => listingAction(listing, 'duplicate')} className={toolButton}><Copy className="size-4" />Duplicate</button>
                  <button type="button" disabled={listingBusyId === listing.id} onClick={() => listingAction(listing, 'archive')} className={`${toolButton} text-rose-700 hover:bg-rose-50`}><Archive className="size-4" />Archive</button>
                </div>
                {editingListingId === listing.id && <div className="mt-3"><PropertyEditor key={listing.id} listing={listing} onCancel={() => setEditingListingId(null)} onSaved={(updated) => {
                  setListings((items) => items.map((item) => item.id === updated.id ? updated : item));
                  setEditingListingId(null); setOpenListingId(updated.id); setMessage('Property saved as a draft. Submit it for review when ready.');
                }} /></div>}
                {openListingId === listing.id && (
                  <div className="mt-3">
                    <RoomManager listing={listing} onListingChange={(updated) => {
                      setListings((items) => items.map((item) => item.id === updated.id ? updated : item));
                      setMessage(`${updated.title} submitted for review.`);
                    }} />
                  </div>
                )}
              </div>
            ))}
            {listings.length === 0 && <p className="py-6 text-sm text-slate-500">No properties yet.</p>}
          </div>
        </section>}
      </>}
    </div>}
    </VendorWorkspace>
  );
}

function Field({ label, grow = false, children }: { label: string; grow?: boolean; children: ReactNode }) {
  return <label className={`text-xs font-semibold text-slate-600 ${grow ? 'flex-1' : ''}`}>{label}<span className="mt-1 block">{children}</span></label>;
}
