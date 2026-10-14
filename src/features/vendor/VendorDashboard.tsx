import { useEffect, useState } from 'react';
import { Archive, ArrowRight, CalendarCheck, Copy, LoaderCircle, Pause, Play } from 'lucide-react';
import { api, type VendorListing, type VendorProfile } from '../../shared/api/api';
import AddHotelWizard from './AddHotelWizard';
import HotelWorkspace, { LISTING_STATUS } from './HotelWorkspace';
import VendorReservations from './VendorReservations';
import SecurityPanel from '../account/SecurityPanel';
import VendorWorkspace, { type VendorTab } from './VendorWorkspace';
import BusinessProfile from './BusinessProfile';
import { useReasonDialog } from '../../shared/components/ReasonDialog';

interface VendorDashboardProps { setView: (view: string) => void; userName: string; userEmail: string; onSignOut: () => Promise<void> }
const toolButton = 'inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';

/** Partner dashboard for approved hotel businesses; registration lives on the Become a partner page. */
export default function VendorDashboard({ setView, userName, userEmail, onSignOut }: VendorDashboardProps) {
  const [tab, setTab] = useState<VendorTab>('overview');
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [listings, setListings] = useState<VendorListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [listingBusyId, setListingBusyId] = useState<string | null>(null);
  const { askReason, dialog } = useReasonDialog();
  const workspace = listings.find((item) => item.id === workspaceId) ?? null;

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

  const navigate = (next: VendorTab) => { setTab(next); setWorkspaceId(null); setMessage(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };

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
        setWorkspaceId(copy.id);
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
    <VendorWorkspace tab={tab} onTab={navigate} hideHeading={tab === 'new-property' || Boolean(workspace && tab === 'properties')} businessName={vendor?.name} status={vendor?.status} userName={userName} userEmail={userEmail} onBrowse={() => setView('explore')} onSignOut={onSignOut}>
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
        {tab === 'new-property' && <AddHotelWizard onExit={() => navigate('properties')} onDone={(created, note) => {
          setListings((items) => [created, ...items.filter((item) => item.id !== created.id)]);
          setTab('properties'); setWorkspaceId(created.id); setMessage(note); window.scrollTo({ top: 0, behavior: 'smooth' });
        }} />}
        {tab === 'properties' && workspace && <HotelWorkspace listing={workspace} busy={listingBusyId === workspace.id} onBack={() => { setWorkspaceId(null); setMessage(''); }}
          onAvailability={(listing, action) => listingAction(listing, action)}
          onChange={(updated, note) => { setListings((items) => items.map((item) => item.id === updated.id ? updated : item)); if (note) setMessage(note); }} />}
        {tab === 'properties' && !workspace && <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 font-bold text-slate-900">Your properties</h2>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {listings.map((listing) => (
              <div key={listing.id} className="flex flex-wrap items-center gap-3 py-4 sm:gap-4">
                <img src={listing.image} alt="" className="size-14 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{listing.title}</p>
                  <p className="text-xs text-slate-500">{listing.type === 'homestay' ? 'Homestay' : 'Hotel'} · {listing.location}</p>
                  <p className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${LISTING_STATUS[listing.status][1]}`}>{LISTING_STATUS[listing.status][0]}</span>
                    {listing.pendingRevision && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Changes in review</span>}
                    {!listing.pendingRevision && listing.revisionRejectionReason && <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">Changes not approved</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setWorkspaceId(listing.id); setMessage(''); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-bold text-white hover:bg-[#005c32]">Manage hotel<ArrowRight className="size-4" /></button>
                  {listing.status === 'published' && <button type="button" disabled={listingBusyId === listing.id} onClick={() => listingAction(listing, 'pause')} className={toolButton}><Pause className="size-4" />Pause</button>}
                  {listing.status === 'paused' && <button type="button" disabled={listingBusyId === listing.id} onClick={() => listingAction(listing, 'resume')} className={`${toolButton} border-[#006F3C] text-[#006F3C]`}><Play className="size-4" />Resume</button>}
                  <button type="button" disabled={listingBusyId === listing.id} onClick={() => listingAction(listing, 'duplicate')} className={toolButton}><Copy className="size-4" />Duplicate</button>
                  <button type="button" disabled={listingBusyId === listing.id} onClick={() => listingAction(listing, 'archive')} className={`${toolButton} text-rose-700 hover:bg-rose-50`}><Archive className="size-4" />Archive</button>
                </div>
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
