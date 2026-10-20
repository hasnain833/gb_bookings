import { useEffect, useState } from 'react';
import { Archive, ArrowRight, Copy, LoaderCircle, Pause, Play } from 'lucide-react';
import { api, type VendorListing, type VendorProfile } from '../../shared/api/api';
import AddHotelWizard from './AddHotelWizard';
import AddCarWizard from './AddCarWizard';
import AddTourWizard from './AddTourWizard';
import HotelWorkspace, { LISTING_STATUS } from './HotelWorkspace';
import VendorReservations from './VendorReservations';
import SecurityPanel from '../account/SecurityPanel';
import VendorWorkspace, { canOpen, partnerWords, type MemberArea, type VendorTab } from './VendorWorkspace';
import PartnerHome from './PartnerHome';
import VendorReports from './VendorReports';
import HotelTeam from './HotelTeam';
import PartnerReviews from './PartnerReviews';
import PartnerCoupons from './PartnerCoupons';
import BusinessProfile from './BusinessProfile';
import { useReasonDialog } from '../../shared/components/ReasonDialog';

interface VendorDashboardProps { setView: (view: string) => void; userName: string; userEmail: string; onSignOut: () => Promise<void> }
const toolButton = 'inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#D9DED8] bg-white px-3 text-sm font-semibold text-[#3D4A42] hover:bg-slate-50 disabled:opacity-50';

/** Partner dashboard for approved hotel businesses; registration lives on the Become a partner page. */
export default function VendorDashboard({ setView, userName, userEmail, onSignOut }: VendorDashboardProps) {
  const [tab, setTab] = useState<VendorTab>('overview');
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [access, setAccess] = useState<MemberArea[]>();
  const [listings, setListings] = useState<VendorListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [listingBusyId, setListingBusyId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number>();
  const { askReason, dialog } = useReasonDialog();
  const workspace = listings.find((item) => item.id === workspaceId) ?? null;
  const word = vendor?.businessType === 'homestay' ? 'homestay' : vendor?.businessType === 'vehicle' ? 'car' : vendor?.businessType === 'tour_operator' ? 'tour' : 'hotel';
  const words = partnerWords(word);
  const typeLabel = (type: VendorListing['type']) => (type === 'homestay' ? 'Homestay' : type === 'car' ? 'Car' : type === 'tour' ? 'Tour' : 'Hotel');

  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError('');
    api.getMyVendor()
      .then(async (result) => {
        if (!active) return;
        setVendor(result.data);
        setAccess(result.membership.access);
        // Reception staff work reservations only; they cannot load the hotel list.
        if (!canOpen(result.membership.access, 'overview')) setTab('reservations');
        else if (result.data.status === 'approved') {
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
    const label = typeLabel(listing.type).toLowerCase();
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
    <VendorWorkspace tab={tab} access={access} kind={word} badges={{ reservations: pendingCount }} onTab={navigate} hideHeading={tab === 'new-property' || Boolean(workspace && tab === 'properties')} businessName={vendor?.name} status={vendor?.status} userName={userName} userEmail={userEmail} onBrowse={() => setView('explore')} onSignOut={onSignOut}>
      {loading ? <div className="flex min-h-64 items-center justify-center" role="status"><LoaderCircle className="size-7 animate-spin text-[#006F3C]" /><span className="sr-only">Loading your workspace</span></div>
        : loadError ? <div role="alert" className="rounded-xl border border-rose-200 bg-white p-6"><p className="text-sm text-rose-700">{loadError}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="mt-4 min-h-11 rounded-lg border px-4 text-sm font-semibold">Try again</button></div> : <div className="space-y-6">
      {dialog}
      {message && <p className="border-l-4 border-[#006F3C] bg-emerald-50 p-3 text-sm text-slate-700" role="status">{message}</p>}

      {vendor && vendor.status !== 'approved' && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">Your partner account is {vendor.status}. {words.many} tools are unavailable until GBBookings approves it. <button type="button" className="font-semibold underline" onClick={() => setView('become-partner')}>View partner status</button></div>}

      {tab === 'overview' && vendor?.status === 'approved' && <PartnerHome kind={word} listings={listings} access={access} userName={userName} onTab={navigate}
        onOpenListing={(id) => { navigate('properties'); setWorkspaceId(id); }} onPending={setPendingCount} />}

      {tab === 'business' && vendor && <BusinessProfile vendor={vendor} onChange={setVendor} />}

      {tab === 'security' && <section className="rounded-xl border border-slate-200 bg-white p-6"><SecurityPanel /></section>}

      {vendor?.status === 'approved' && <>
        {tab === 'reservations' && <VendorReservations properties={listings} car={word === 'car'} tour={word === 'tour'} defaultTab={canOpen(access, 'overview') ? 'pending' : 'arriving'} />}
        {tab === 'reviews' && canOpen(access, 'reviews') && <PartnerReviews properties={listings} />}
        {tab === 'promo-codes' && canOpen(access, 'promo-codes') && <PartnerCoupons />}
        {tab === 'reports' && canOpen(access, 'reports') && <VendorReports />}
        {tab === 'team' && canOpen(access, 'team') && <HotelTeam />}
        {tab === 'new-property' && (() => {
          const done = (created: VendorListing, note: string) => {
            setListings((items) => [created, ...items.filter((item) => item.id !== created.id)]);
            setTab('properties'); setWorkspaceId(created.id); setMessage(note); window.scrollTo({ top: 0, behavior: 'smooth' });
          };
          if (word === 'car') return <AddCarWizard onExit={() => navigate('properties')} onDone={done} />;
          if (word === 'tour') return <AddTourWizard onExit={() => navigate('properties')} onDone={done} />;
          return <AddHotelWizard kind={word} onExit={() => navigate('properties')} onDone={done} />;
        })()}
        {tab === 'properties' && workspace && <HotelWorkspace listing={workspace} busy={listingBusyId === workspace.id} onBack={() => { setWorkspaceId(null); setMessage(''); }}
          onAvailability={(listing, action) => listingAction(listing, action)}
          onChange={(updated, note) => { setListings((items) => items.map((item) => item.id === updated.id ? updated : item)); if (note) setMessage(note); }} />}
        {tab === 'properties' && !workspace && (listings.length === 0
          ? <p className="rounded-2xl border border-dashed border-[#C9D3CC] bg-white p-10 text-center text-sm text-[#5B6B61]">No {words.one}s yet. Use “Add {words.one}” to create your first one.</p>
          : <div className="grid gap-5 lg:grid-cols-2">
            {listings.map((listing) => (
              <article key={listing.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#E3E7E2] bg-white">
                <div className="flex gap-4 p-4">
                  {listing.image ? <img src={listing.image} alt="" className="h-28 w-36 shrink-0 rounded-xl object-cover" /> : <span className="h-28 w-36 shrink-0 rounded-xl bg-[#E3E7E2]" />}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate text-lg font-extrabold">{listing.title}</h2>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${LISTING_STATUS[listing.status][1]}`}>{LISTING_STATUS[listing.status][0]}</span>
                    </div>
                    <p className="text-[13px] text-[#5B6B61]">{typeLabel(listing.type)} · {listing.location}{listing.tourSpecs ? ` · ${listing.tourSpecs.durationDays} day${listing.tourSpecs.durationDays === 1 ? '' : 's'} · ${listing.tourSpecs.schedule === 'fixed' ? `${(listing.departures ?? []).length} departure date(s)` : 'any day'}` : ''}{listing.carSpecs ? ` · ${[listing.carSpecs.transmission, listing.carSpecs.seats ? `${listing.carSpecs.seats} seats` : ''].filter(Boolean).join(' · ')}` : ''}</p>
                    <p className="text-sm font-bold">From PKR {listing.price.toLocaleString()}/{listing.type === 'car' ? 'day' : listing.type === 'tour' ? 'person' : 'night'}</p>
                    <p className="flex flex-wrap gap-1.5">
                      {listing.pendingRevision && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Changes in review</span>}
                      {!listing.pendingRevision && listing.revisionRejectionReason && <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">Changes not approved</span>}
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[#EEF1ED] bg-[#FAFBF9] px-4 py-3">
                  <button type="button" onClick={() => { setWorkspaceId(listing.id); setMessage(''); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#006F3C] px-3.5 text-sm font-bold text-white hover:bg-[#005c32]">Manage<ArrowRight className="size-4" /></button>
                  {listing.status === 'published' && <button type="button" disabled={listingBusyId === listing.id} onClick={() => listingAction(listing, 'pause')} className={toolButton}><Pause className="size-4" />Pause</button>}
                  {listing.status === 'paused' && <button type="button" disabled={listingBusyId === listing.id} onClick={() => listingAction(listing, 'resume')} className={`${toolButton} border-[#006F3C] text-[#006F3C]`}><Play className="size-4" />Resume</button>}
                  <button type="button" disabled={listingBusyId === listing.id} onClick={() => listingAction(listing, 'duplicate')} className={toolButton}><Copy className="size-4" />Duplicate</button>
                  <button type="button" disabled={listingBusyId === listing.id} onClick={() => listingAction(listing, 'archive')} className={`${toolButton} ml-auto text-rose-700 hover:bg-rose-50`}><Archive className="size-4" />Archive</button>
                </div>
              </article>
            ))}
          </div>)}
      </>}
    </div>}
    </VendorWorkspace>
  );
}
