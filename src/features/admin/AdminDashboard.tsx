import { useEffect, useState, type ReactNode } from 'react';
import { Building2, CalendarX, Car, Percent, Hotel, House, Inbox, LayoutDashboard, Mountain, PanelLeftClose, PanelLeftOpen, Search, FileText, LoaderCircle, LogOut, ShieldCheck, Star, Users } from 'lucide-react';
import { api, type AdminBookingLookup, type AdminUser, type AdminVendor, type Paginated, type PlatformSettings, type UserStatusAction, type VendorListing } from '../../shared/api/api';
import SecurityPanel from '../account/SecurityPanel';
import ListingReviewDetails from './ListingReviewDetails';
import { ReviewCard } from '../reviews/ReviewParts';
import type { Review } from '../../types';
import { useReasonDialog, type ReasonRequest } from '../../shared/components/ReasonDialog';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';

type Product = VendorListing['type'];
type Tab = 'overview' | 'inbox' | Product | 'vendors' | 'reviews' | 'users' | 'cancellations' | 'settings' | 'security';
type NavItem = { id: Tab; label: string; icon: typeof Users };

const navGroups: Array<{ title?: string; items: NavItem[] }> = [
  { items: [{ id: 'overview', label: 'Overview', icon: LayoutDashboard }, { id: 'inbox', label: 'Review inbox', icon: Inbox }] },
  { title: 'Products', items: [
    { id: 'hotel', label: 'Hotels', icon: Hotel }, { id: 'homestay', label: 'Homestays', icon: House },
    { id: 'car', label: 'Cars', icon: Car }, { id: 'tour', label: 'Tours', icon: Mountain },
  ] },
  { title: 'People', items: [{ id: 'vendors', label: 'Partners', icon: Building2 }, { id: 'users', label: 'Users', icon: Users }, { id: 'reviews', label: 'Guest reviews', icon: Star }] },
  { title: 'Tools', items: [{ id: 'cancellations', label: 'Cancel a booking', icon: CalendarX }, { id: 'settings', label: 'Fees & refunds', icon: Percent }, { id: 'security', label: 'Account security', icon: ShieldCheck }] },
];
const productNames: Record<Product, [string, string]> = { hotel: ['Hotels', 'hotel'], homestay: ['Homestays', 'homestay'], car: ['Cars', 'car'], tour: ['Tours', 'tour'] };
const PRODUCTS: Product[] = ['hotel', 'homestay', 'car', 'tour'];


const primaryButton = 'min-h-11 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white transition hover:bg-[#005c32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50';
const secondaryButton = 'min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50';
const selectClass = 'min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm capitalize outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10';
const label = (value: string) => value.replace(/_/g, ' ');
const roleLabels: Record<string, string> = {
  admin: 'Platform Admin',
  vendor_owner: 'Vendor Owner', vendor_staff: 'Vendor Employee', customer: 'Customer',
};
const roleLabel = (value: string) => roleLabels[value] ?? label(value);

// Admin decisions always carry a review note.
function useReviewDialog() {
  const { askReason, dialog } = useReasonDialog();
  return { dialog, askReason: (request: ReasonRequest) => askReason({ noteLabel: 'Review note', ...request }) };
}

function useAction() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async (id: string, work: () => Promise<void>) => {
    setBusyId(id);
    setError(null);
    try {
      await work();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The action failed.');
    } finally {
      setBusyId(null);
    }
  };
  return { busyId, error, setError, run };
}

function Panel({ title, icon: Icon, filter, error, loading, empty, children }: {
  title: string; icon: typeof Users; filter?: ReactNode; error: string | null; loading: boolean; empty: string | null; children: ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-2xl border border-[#E1E5DE] bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className="size-5 text-[#006F3C]" />
          <h2 className="font-bold text-slate-900">{title}</h2>
        </div>
        {filter}
      </div>
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="divide-y divide-slate-100" aria-live="polite">
        {loading && <div className="flex justify-center py-6"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading" /></div>}
        {!loading && empty && <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center"><span className="mb-4 rounded-2xl border border-slate-200 bg-white p-4"><Icon className="size-7 text-slate-400" /></span><p className="font-semibold text-slate-700">{empty}</p><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Items matching your filters will appear here.</p></div>}
        {!loading && children}
      </div>
    </section>
  );
}

function Pager({ pagination, onPage }: { pagination?: Paginated<unknown>['pagination']; onPage: (page: number) => void }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      <button type="button" className={secondaryButton} disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>Previous</button>
      <span className="text-slate-600">Page {pagination.page} of {pagination.pages}</span>
      <button type="button" className={secondaryButton} disabled={pagination.page >= pagination.pages} onClick={() => onPage(pagination.page + 1)}>Next</button>
    </div>
  );
}

function usePaged<T>(load: () => Promise<Paginated<T>>, deps: unknown[]) {
  const [result, setResult] = useState<Paginated<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    load()
      .then((next) => active && setResult(next))
      .catch((reason: Error) => active && setLoadError(reason.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  const replace = (id: string, next: T & { id: string }) => setResult((current) => current && {
    ...current, data: current.data.map((item) => (item as { id: string }).id === id ? next : item),
  });
  return { result, loading, loadError, replace };
}

function VendorsPanel() {
  const { askReason, dialog } = useReviewDialog();
  const [status, setStatus] = useState('submitted');
  const [page, setPage] = useState(1);
  const changeRequests = status === 'changes';
  const { result, loading, loadError, replace } = usePaged(
    () => api.admin.listVendors(changeRequests ? { changes: 'pending', page } : { status: status || undefined, page }), [status, page],
  );
  const { busyId, error, run } = useAction();

  const decide = async (vendor: AdminVendor, decision: 'approved' | 'rejected' | 'suspended') => {
    const action = decision === 'approved' ? 'Approve' : decision === 'rejected' ? 'Reject' : 'Suspend';
    const notes = await askReason({ title: `${action} ${vendor.name}`, confirmLabel: `${action} vendor`, destructive: decision !== 'approved', description: decision === 'approved' ? 'Add an approval note to complete your review.' : 'Explain your decision. This note will be shared with the vendor.' });
    if (!notes) return;
    run(vendor.id, async () => replace(vendor.id, (await api.admin.decideVendor(vendor.id, decision, notes)).data));
  };

  const decideChanges = async (vendor: AdminVendor, decision: 'approved' | 'rejected') => {
    const notes = await askReason({
      title: `${decision === 'approved' ? 'Approve' : 'Reject'} changes for ${vendor.name}`, confirmLabel: decision === 'approved' ? 'Apply changes' : 'Reject changes',
      destructive: decision === 'rejected',
      description: decision === 'approved' ? 'The new business details replace the current ones immediately.' : 'Explain what is wrong. This note is shown to the vendor.',
    });
    if (!notes) return;
    run(vendor.id, async () => replace(vendor.id, { ...vendor, ...(await api.admin.decideVendorChanges(vendor.id, decision, notes)) }));
  };

  return (
    <Panel title="Vendor applications" icon={Building2} error={error ?? loadError} loading={loading}
      empty={result?.data.length === 0 ? (changeRequests ? 'No change requests.' : `No ${status ? label(status) : ''} vendors.`) : null}
      filter={
        <select aria-label="Filter vendors by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={selectClass}>
          <option value="">All</option>
          {['submitted', 'approved', 'rejected', 'suspended', 'draft'].map((value) => <option key={value} value={value}>{value}</option>)}
          <option value="changes">Change requests</option>
        </select>
      }>
      {result?.data.map((vendor) => (
        <div key={vendor.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold text-slate-900">{vendor.name} <span className="text-xs font-normal text-slate-500">· {label(vendor.businessType)}</span></p>
            <p className="text-xs text-slate-500">{vendor.email} · {vendor.phone} · Reg. {vendor.registrationNumber ?? '—'}{vendor.taxNumber ? ` · Tax ${vendor.taxNumber}` : ''}</p>
            {vendor.address && <p className="text-xs text-slate-500">{[vendor.address.line1, vendor.address.line2, vendor.address.city, vendor.address.region].filter(Boolean).join(', ')}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {vendor.verificationDocuments.length === 0 && <span className="text-xs text-slate-500">No documents</span>}
              {vendor.verificationDocuments.map((document) => document.url
                ? <a key={document.type} href={document.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#006F3C] underline">{label(document.type)}</a>
                : <span key={document.type} className="text-xs text-slate-500">{label(document.type)} (link unavailable)</span>)}
            </div>
            {(vendor.verificationNotes || vendor.rejectionReason) && <p className="text-xs italic text-slate-600">Note: {vendor.rejectionReason ?? vendor.verificationNotes}</p>}
            {vendor.pendingChanges && <ChangeRequestDiff vendor={vendor} />}
          </div>
          <span className="text-xs font-bold uppercase text-indigo-700">{label(vendor.status)}</span>
          <div className="flex gap-2">
            {vendor.status === 'submitted' && <>
              <button type="button" className={primaryButton} disabled={busyId === vendor.id} onClick={() => decide(vendor, 'approved')}>Approve</button>
              <button type="button" className={secondaryButton} disabled={busyId === vendor.id} onClick={() => decide(vendor, 'rejected')}>Reject</button>
            </>}
            {vendor.pendingChanges && <>
              <button type="button" className={primaryButton} disabled={busyId === vendor.id} onClick={() => decideChanges(vendor, 'approved')}>Approve changes</button>
              <button type="button" className={secondaryButton} disabled={busyId === vendor.id} onClick={() => decideChanges(vendor, 'rejected')}>Reject changes</button>
            </>}
            {vendor.status === 'approved' && !vendor.pendingChanges && <button type="button" className={secondaryButton} disabled={busyId === vendor.id} onClick={() => decide(vendor, 'suspended')}>Suspend</button>}
          </div>
        </div>
      ))}
      <div className="py-3"><Pager pagination={result?.pagination} onPage={setPage} /></div>
      {dialog}
    </Panel>
  );
}

const listingStatusTabs: Array<[VendorListing['status'] | 'all' | 'revisions', string]> = [
  ['submitted', 'Awaiting review'], ['revisions', 'Changes to review'], ['published', 'Live'], ['paused', 'Paused'], ['rejected', 'Returned'], ['draft', 'Drafts'], ['archived', 'Archived'], ['all', 'All'],
];
const listingTone: Record<VendorListing['status'], string> = {
  submitted: 'bg-amber-50 text-amber-800', published: 'bg-emerald-50 text-emerald-800', paused: 'bg-sky-50 text-sky-800',
  rejected: 'bg-rose-50 text-rose-700', draft: 'bg-slate-100 text-slate-700', archived: 'bg-slate-100 text-slate-500',
};
const listingStatusLabel = (status: VendorListing['status']) => listingStatusTabs.find(([value]) => value === status)?.[1] ?? label(status);

function ListingsPanel({ type }: { type: Product }) {
  const { askReason, dialog } = useReviewDialog();
  const [status, setStatus] = useState<VendorListing['status'] | 'all' | 'revisions'>('submitted');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const query = useDebouncedValue(search.trim());
  const [revision, setRevision] = useState(0);
  const { result, loading, loadError, replace } = usePaged(
    () => api.admin.listListings({ status, type, q: query.length >= 2 ? query : undefined, page }), [status, type, query, page, revision],
  );
  const { busyId, error, run } = useAction();
  useEffect(() => { setPage(1); }, [status, type, query]);

  const decide = async (listing: VendorListing, decision: 'published' | 'rejected') => {
    const takeDown = decision === 'rejected' && listing.status !== 'submitted';
    const notes = await askReason({
      title: `${decision === 'published' ? 'Publish' : takeDown ? 'Take down' : 'Reject'} ${listing.title}`,
      confirmLabel: decision === 'published' ? 'Publish listing' : takeDown ? 'Take down listing' : 'Reject listing',
      destructive: decision === 'rejected',
      description: decision === 'published' ? `Add an approval note before publishing this ${productNames[type][1]}.`
        : takeDown ? 'The listing is removed from search and new bookings, and returned to the vendor to fix and resubmit. Existing reservations are kept. This note is shared with the vendor.'
          : 'Explain your decision. This note will be shared with the vendor.',
    });
    if (!notes) return;
    run(listing.id, async () => {
      const updated = (await api.admin.moderateListing(listing.id, decision, notes)).data;
      // Drop it from a status-filtered view once it no longer matches.
      if (status !== 'all' && updated.status !== status) setRevision((value) => value + 1);
      else replace(listing.id, { ...listing, ...updated });
    });
  };

  const decideRevision = async (listing: VendorListing, decision: 'approved' | 'rejected') => {
    const notes = await askReason({
      title: `${decision === 'approved' ? 'Approve' : 'Reject'} changes to ${listing.title}`,
      confirmLabel: decision === 'approved' ? 'Apply changes' : 'Reject changes', destructive: decision === 'rejected',
      description: decision === 'approved' ? 'Guests see the edited details and rooms immediately.'
        : 'The property stays live with its current details. This note is shared with the vendor.',
    });
    if (!notes) return;
    run(listing.id, async () => {
      const updated = (await api.admin.decideListingRevision(listing.id, decision, notes)).data;
      if (status === 'revisions') setRevision((value) => value + 1);
      else replace(listing.id, { ...listing, ...updated });
    });
  };

  return (
    <Panel title={productNames[type][0]} icon={FileText} error={error ?? loadError} loading={loading}
      empty={result?.data.length === 0 ? (query ? 'No listings match your search.' : status === 'submitted' ? 'No listings are waiting for review.' : status === 'revisions' ? 'No live listings have changes waiting.' : `No ${listingStatusLabel(status as VendorListing['status']).toLowerCase()} listings.`) : null}
      filter={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <input type="search" aria-label="Search listings by name or location" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or location" className={`${selectClass} normal-case sm:w-56`} />
          <select aria-label="Filter listings by status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={selectClass}>
            {listingStatusTabs.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </select>
        </div>
      }>
      {result?.pagination && <p className="pt-3 text-xs text-slate-500">{result.pagination.total} listing{result.pagination.total === 1 ? '' : 's'}</p>}
      {result?.data.map((listing) => (
        <div key={listing.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
          {listing.image && <img src={listing.image} alt="" className="h-20 w-28 shrink-0 rounded-md object-cover" />}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">{listing.title}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${listingTone[listing.status]}`}>{listingStatusLabel(listing.status)}</span>
              {listing.pendingRevision && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Changes to review</span>}
            </div>
            <p className="text-xs text-slate-500">{label(listing.type)} · {listing.location} · from PKR {listing.price.toLocaleString()}/{listing.type === 'car' ? 'day' : listing.type === 'tour' ? 'person' : 'night'} · {listing.images.length} photo(s){listing.vendorName ? ` · ${listing.vendorName}` : ''}</p>
            {listing.rejectionReason && <p className="text-xs italic text-rose-700">Note to vendor: {listing.rejectionReason}</p>}
            <button type="button" aria-expanded={reviewingId === listing.id} onClick={() => setReviewingId(reviewingId === listing.id ? null : listing.id)} className="min-h-11 text-xs font-semibold text-emerald-700 underline">{reviewingId === listing.id ? 'Close details' : 'Photos, policies & rooms'}</button>
            {reviewingId === listing.id && <ListingReviewDetails listing={listing} />}
          </div>
          <div className="flex gap-2">
            {listing.status === 'submitted' && <>
              <button type="button" className={primaryButton} disabled={busyId === listing.id} onClick={() => decide(listing, 'published')}>Publish</button>
              <button type="button" className={secondaryButton} disabled={busyId === listing.id} onClick={() => decide(listing, 'rejected')}>Reject</button>
            </>}
            {listing.pendingRevision && <>
              <button type="button" className={primaryButton} disabled={busyId === listing.id} onClick={() => decideRevision(listing, 'approved')}>Approve changes</button>
              <button type="button" className={secondaryButton} disabled={busyId === listing.id} onClick={() => decideRevision(listing, 'rejected')}>Reject changes</button>
            </>}
            {(listing.status === 'published' || listing.status === 'paused') && <button type="button" className={secondaryButton} disabled={busyId === listing.id} onClick={() => decide(listing, 'rejected')}>Take down</button>}
          </div>
        </div>
      ))}
      <div className="py-3"><Pager pagination={result?.pagination} onPage={setPage} /></div>
      {dialog}
    </Panel>
  );
}

function ReviewsPanel() {
  const { askReason, dialog } = useReviewDialog();
  const [status, setStatus] = useState<'reported' | 'hidden' | 'all'>('reported');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const { result, loading, loadError } = usePaged(() => api.admin.listReviews({ status, page }), [status, page, revision]);
  const { busyId, error, run } = useAction();
  useEffect(() => { setPage(1); }, [status]);

  const moderate = async (review: Review, action: 'hide' | 'restore' | 'dismiss') => {
    const reason = (await askReason({
      title: action === 'hide' ? 'Hide this review?' : action === 'restore' ? 'Show this review again?' : 'Keep this review public?',
      destructive: action === 'hide', confirmLabel: action === 'hide' ? 'Hide review' : action === 'restore' ? 'Restore review' : 'Dismiss report',
      description: action === 'hide' ? 'It disappears from the property page and stops counting towards the rating. The partner sees your reason.' : 'The rating is recalculated.',
    }))?.trim();
    if (!reason) return;
    await run(review.id, async () => { await api.admin.moderateReview(review.id, action, reason); setRevision((value) => value + 1); });
  };

  return (
    <Panel title="Guest reviews" icon={Star} error={error ?? loadError} loading={loading}
      empty={result?.data.length === 0 ? (status === 'reported' ? 'No reported reviews.' : status === 'hidden' ? 'No hidden reviews.' : 'No reviews yet.') : null}
      filter={<select aria-label="Filter reviews" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={selectClass}>
        <option value="reported">Reported by partners</option><option value="hidden">Hidden</option><option value="all">All reviews</option>
      </select>}>
      <div className="space-y-3 py-3">
        {result?.data.map((review) => (
          <ReviewCard key={review.id} review={review}
            header={<div className="space-y-1 text-xs"><p className="font-semibold text-slate-600">{review.listingTitle}{review.status === 'hidden' && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Hidden: {review.hiddenReason}</span>}</p>
              {review.report && <p className="rounded-lg bg-amber-50 p-2 text-amber-900"><strong>Partner report:</strong> {review.report.reason}</p>}</div>}
            actions={<div className="flex flex-wrap gap-2 pt-1">
              {review.status === 'published'
                ? <button type="button" className={primaryButton} disabled={busyId === review.id} onClick={() => moderate(review, 'hide')}>Hide review</button>
                : <button type="button" className={primaryButton} disabled={busyId === review.id} onClick={() => moderate(review, 'restore')}>Restore</button>}
              {review.report && review.status === 'published' && <button type="button" className={secondaryButton} disabled={busyId === review.id} onClick={() => moderate(review, 'dismiss')}>Dismiss report</button>}
            </div>} />
        ))}
      </div>
      <div className="py-3"><Pager pagination={result?.pagination} onPage={setPage} /></div>
      {dialog}
    </Panel>
  );
}

function UsersPanel() {
  const { askReason, dialog } = useReviewDialog();
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [staff, setStaff] = useState({ name: '', email: '' });
  const [notice, setNotice] = useState('');
  const { result, loading, loadError, replace } = usePaged(
    () => api.admin.listUsers({ status: status || undefined, role: role || undefined, search: query || undefined, page }),
    [status, role, query, page, revision],
  );
  const { busyId, error, run } = useAction();

  const change = async (user: AdminUser, action: UserStatusAction) => {
    const reason = await askReason({ title: `${label(action)}: ${user.name}`, confirmLabel: label(action), destructive: action === 'suspend' || action === 'archive', description: `Add a note explaining this change for ${user.email}.` });
    if (!reason) return;
    run(user.id, async () => replace(user.id, await api.admin.changeUserStatus(user.id, action, reason)));
  };

  return (
    <Panel title="Users" icon={Users} error={error ?? loadError} loading={loading} empty={result?.data.length === 0 ? 'No users match these filters.' : null}
      filter={
        <form className="flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); setPage(1); }}>
          <input type="search" aria-label="Search by name or email" placeholder="Name or email" value={search} onChange={(event) => setSearch(event.target.value)}
            className="min-h-11 rounded-md border border-slate-300 px-3 text-sm" />
          <select aria-label="Filter users by role" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className={selectClass}>
            <option value="">All roles</option>
            {['customer', 'vendor_owner', 'vendor_staff', 'admin'].map((value) => <option key={value} value={value}>{roleLabel(value)}</option>)}
          </select>
          <select aria-label="Filter users by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={selectClass}>
            <option value="">All statuses</option>
            {['active', 'suspended', 'archived'].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </form>
      }>
      <form className="grid gap-3 bg-slate-50 p-4 sm:grid-cols-3" onSubmit={(event) => {
        event.preventDefault();
        setNotice('');
        run('new-staff', async () => {
          const created = await api.admin.createStaff({ ...staff, role: 'admin' });
          setNotice(created.invitationSent
            ? 'Account created. A password setup link has been emailed to the recipient.'
            : 'Account created, but email delivery failed. Use Resend setup link below.');
          setStaff({ name: '', email: '' });
          setRevision((value) => value + 1);
        });
      }}>
        <h3 className="font-semibold sm:col-span-3">Invite an administrator</h3>
        <label className="text-xs font-semibold">Full name<input required minLength={2} maxLength={120} className={`${selectClass} mt-1 w-full`} value={staff.name} onChange={(event) => setStaff({ ...staff, name: event.target.value })} /></label>
        <label className="text-xs font-semibold">Email<input type="email" required className={`${selectClass} mt-1 w-full`} value={staff.email} onChange={(event) => setStaff({ ...staff, email: event.target.value })} /></label>
        <button disabled={busyId !== null} className={`${primaryButton} self-end`}>Create account and send setup link</button>
        {notice && <p role="status" className="text-sm sm:col-span-3">{notice}</p>}
      </form>
      {result?.data.map((user) => (
        <div key={user.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}{user.phone ? ` · ${user.phone}` : ''} · {user.roles.map(roleLabel).join(', ')}</p>
            <p className="text-xs text-slate-500">Joined {new Date(user.createdAt).toLocaleDateString()} · {user.emailVerified ? 'Email verified' : 'Email not verified'}</p>
          </div>
          <span className="text-xs font-bold uppercase text-indigo-700">{user.status}</span>
          <div className="flex flex-wrap gap-2">
            {user.status === 'active' && user.roles.includes('admin') && <button type="button" className={secondaryButton} disabled={busyId !== null} onClick={() => run(user.id, async () => {
              await api.forgotPassword(user.email);
              setNotice('Password setup instructions requested. The recipient can also use Forgot password on the sign-in screen.');
            })}>Resend setup link</button>}
            {!user.emailVerified && <button type="button" className={secondaryButton} disabled={busyId === user.id} onClick={() => change(user, 'verify_email')}>Verify email</button>}
            {user.status !== 'active' && <button type="button" className={primaryButton} disabled={busyId === user.id} onClick={() => change(user, 'activate')}>Activate</button>}
            {user.status === 'active' && <button type="button" className={secondaryButton} disabled={busyId === user.id} onClick={() => change(user, 'suspend')}>Suspend</button>}
            {user.status !== 'archived' && <button type="button" className={secondaryButton} disabled={busyId === user.id} onClick={() => change(user, 'archive')}>Archive</button>}
          </div>
        </div>
      ))}
      <div className="py-3"><Pager pagination={result?.pagination} onPage={setPage} /></div>
      {dialog}
    </Panel>
  );
}

function ChangeRequestDiff({ vendor }: { vendor: AdminVendor }) {
  const next = vendor.pendingChanges!;
  const address = (value?: { line1?: string; city?: string; region?: string }) => [value?.line1, value?.city, value?.region].filter(Boolean).join(', ');
  const rows: Array<[string, string | undefined, string | undefined]> = [
    ['Name', vendor.name, next.name], ['Email', vendor.email, next.email], ['Phone', vendor.phone, next.phone],
    ['Registration no.', vendor.registrationNumber, next.registrationNumber], ['NTN', vendor.taxNumber, next.taxNumber],
    ['Address', address(vendor.address as any), address(next.address)],
  ];
  const changed = rows.filter(([, before, after]) => (before ?? '') !== (after ?? ''));
  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
      <p className="font-semibold text-amber-900">Requested business changes · {new Date(next.requestedAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</p>
      {changed.length === 0 ? <p className="mt-1 text-amber-800">No differences from the current details.</p>
        : <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">{changed.map(([field, before, after]) => <div key={field} className="contents"><dt className="text-slate-500">{field}</dt><dd><span className="text-slate-500 line-through">{before || '—'}</span> → <strong className="text-slate-900">{after || '—'}</strong></dd></div>)}</dl>}
    </div>
  );
}

function CancelBookingPanel() {
  const { askReason, dialog } = useReviewDialog();
  const [reference, setReference] = useState('');
  const [booking, setBooking] = useState<AdminBookingLookup | null>(null);
  const [notice, setNotice] = useState('');
  const { busyId, error, setError, run } = useAction();

  const find = (event: React.FormEvent) => {
    event.preventDefault();
    setBooking(null); setNotice('');
    run('find', async () => setBooking(await api.admin.findBooking(reference.trim().toUpperCase())));
  };
  const cancel = async () => {
    if (!booking) return;
    const reason = await askReason({
      title: `Cancel ${booking.reference}?`, confirmLabel: 'Cancel booking', destructive: true,
      description: `Rooms are released and both the guest and the hotel are emailed this reason. Only use this for disputes or fraud.${booking.paymentStatus === 'paid' ? ` The booking is paid, so the guest is owed a full refund of PKR ${booking.totalPrice.toLocaleString()}.` : ''}`,
    });
    if (!reason) return;
    run(booking.id, async () => {
      const updated = await api.admin.cancelBooking(booking.id, reason);
      setBooking({ ...booking, ...updated });
      setNotice(`${booking.reference} was cancelled and both parties were notified.`);
    });
  };
  const cancellable = booking && (booking.status === 'pending' || booking.status === 'confirmed');

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
      {dialog}
      <form onSubmit={find} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-semibold text-slate-800">Booking reference
          <input required value={reference} onChange={(event) => { setReference(event.target.value); setError(null); }} placeholder="GB-1A2B3C4D" className={`${selectClass} mt-1.5 w-full normal-case font-mono`} />
        </label>
        <button className={`${primaryButton} inline-flex items-center justify-center gap-2`} disabled={busyId === 'find'}><Search className="size-4" />Find booking</button>
      </form>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {booking && <div className="space-y-4 rounded-xl border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-mono text-lg font-bold">{booking.reference}</p><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize">{label(booking.status)}</span></div>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {[['Hotel', booking.listingTitle], ['Room', `${booking.rooms ?? 1} × ${booking.roomName}`], ['Stay', `${booking.startDate} → ${booking.endDate}`], ['Total', `PKR ${booking.totalPrice.toLocaleString()}`], ['Payment', booking.paymentStatus === 'paid' ? 'Paid' : label(booking.paymentStatus)],
            ['GBBookings fee', `PKR ${(booking.platformFee ?? 0).toLocaleString()} (${booking.platformFeePercent ?? 0}%)`], ...(booking.refund ? [['Refund to guest', `PKR ${booking.refund.amount.toLocaleString()} (${booking.refund.percent}%)`]] : []),
            ['Guest', `${booking.customerName} · ${booking.customerEmail}`], ['Hotel business', booking.vendor ? `${booking.vendor.name} · ${booking.vendor.email}${booking.vendor.phone ? ` · ${booking.vendor.phone}` : ''}` : '—'],
          ].map(([term, value]) => <div key={term}><dt className="text-slate-500">{term}</dt><dd className="font-medium text-slate-900 break-words">{value}</dd></div>)}
        </dl>
        {cancellable ? <button type="button" onClick={cancel} disabled={busyId === booking.id} className="min-h-11 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50">Cancel on guest’s behalf</button>
          : <p className="text-sm text-slate-500">This booking is {label(booking.status)} and can no longer be cancelled.</p>}
      </div>}
    </section>
  );
}

/** Commission and guest refund rules. Tiers count hours from when the booking was made. */
function SettingsPanel() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [notice, setNotice] = useState('');
  const { busyId, error, setError, run } = useAction();
  useEffect(() => { run('load', async () => setSettings(await api.admin.getSettings())); }, []);
  if (!settings) return error ? <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : <p className="text-sm text-slate-500">Loading…</p>;

  const set = (patch: Partial<PlatformSettings>) => { setSettings({ ...settings, ...patch }); setNotice(''); setError(null); };
  const setTier = (index: number, patch: Partial<PlatformSettings['refundTiers'][number]>) =>
    set({ refundTiers: settings.refundTiers.map((tier, at) => at === index ? { ...tier, ...patch } : tier) });
  const lastHours = settings.refundTiers.at(-1)?.withinHours;
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    run('save', async () => { setSettings(await api.admin.saveSettings(settings)); setNotice('Saved. New bookings and cancellations use these rules.'); });
  };
  const percentInput = (value: number, onChange: (value: number) => void, max = 100) =>
    <input required type="number" min={0} max={max} step={0.01} value={value} onChange={(event) => onChange(Number(event.target.value))} className={`${selectClass} mt-1.5 w-28`} />;

  return (
    <form onSubmit={save} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <fieldset className="space-y-2">
        <legend className="text-base font-bold text-slate-900">Commission</legend>
        <label className="block text-sm font-semibold text-slate-800">Percent of every booking's total{percentInput(settings.commissionPercent, (commissionPercent) => set({ commissionPercent }), 50)}</label>
        <p className="text-sm text-slate-500">Each booking keeps the percent it was made with. A cancelled unpaid booking owes nothing; on a paid one it is charged only on what the partner keeps.</p>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="text-base font-bold text-slate-900">Refunds when a guest cancels a paid booking</legend>
        <p className="text-sm text-slate-500">Counted from when the booking was made. Partner or GBBookings cancellations always refund in full. Guests still cannot cancel on or after the start date.</p>
        {settings.refundTiers.map((tier, index) => (
          <div key={index} className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-semibold text-slate-800">Cancelled within (hours)<input required type="number" min={1} step={1} value={tier.withinHours} onChange={(event) => setTier(index, { withinHours: Number(event.target.value) })} className={`${selectClass} mt-1.5 block w-28`} /></label>
            <label className="text-sm font-semibold text-slate-800">Refund %{percentInput(tier.refundPercent, (refundPercent) => setTier(index, { refundPercent }))}</label>
            <button type="button" className={`${secondaryButton} text-rose-700`} onClick={() => set({ refundTiers: settings.refundTiers.filter((_, at) => at !== index) })}>Remove</button>
          </div>
        ))}
        {settings.refundTiers.length < 10 && <button type="button" className={secondaryButton} onClick={() => set({ refundTiers: [...settings.refundTiers, { withinHours: (lastHours ?? 0) + 24, refundPercent: 50 }] })}>Add a time limit</button>}
        <label className="block text-sm font-semibold text-slate-800">{lastHours ? `Cancelled after ${lastHours} hours: refund %` : 'Refund %'}{percentInput(settings.laterRefundPercent, (laterRefundPercent) => set({ laterRefundPercent }))}</label>
      </fieldset>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <button className={primaryButton} disabled={busyId === 'save'}>Save</button>
    </form>
  );
}

type InboxKind = 'partner' | 'business' | 'hotel' | 'changes';
type InboxItem = { key: string; kind: InboxKind; title: string; subtitle: string; at?: string; image?: string; vendor?: AdminVendor; listing?: VendorListing };
const kindLabel: Record<InboxKind, [string, string]> = {
  partner: ['New partner', 'text-[#6B3FA0]'], business: ['Business change', 'text-[#6B3FA0]'],
  hotel: ['New listing', 'text-[#1E5BA8]'], changes: ['Listing changes', 'text-[#8A4B10]'],
};
const ago = (value?: string) => {
  if (!value) return '';
  const minutes = Math.max(1, Math.round((Date.now() - Date.parse(value)) / 60_000));
  return minutes < 60 ? `${minutes}m ago` : minutes < 1_440 ? `${Math.round(minutes / 60)}h ago` : `${Math.round(minutes / 1_440)}d ago`;
};

const address = (vendor: AdminVendor) => [vendor.address?.city, vendor.address?.region].filter(Boolean).join(', ');

/** Everything waiting on an admin decision, oldest first. */
async function loadQueue(): Promise<InboxItem[]> {
  const [partners, business, listings, changes] = await Promise.all([
    api.admin.listVendors({ status: 'submitted', limit: 100 }), api.admin.listVendors({ changes: 'pending', limit: 100 }),
    api.admin.listListings({ status: 'submitted', limit: 100 }), api.admin.listListings({ status: 'revisions', limit: 100 }),
  ]);
  return [
    ...partners.data.map((vendor) => ({ key: `p-${vendor.id}`, kind: 'partner' as const, title: vendor.name, subtitle: `${label(vendor.businessType)} · ${address(vendor) || vendor.email} · ${vendor.verificationDocuments.length} document(s)`, at: vendor.submittedAt ?? vendor.createdAt, vendor })),
    ...business.data.map((vendor) => ({ key: `b-${vendor.id}`, kind: 'business' as const, title: vendor.name, subtitle: 'Wants to change business details', at: vendor.pendingChanges?.requestedAt, vendor })),
    ...listings.data.map((listing) => ({ key: `h-${listing.id}`, kind: 'hotel' as const, title: listing.title, subtitle: `${listing.vendorName ?? 'Partner'} · ${listing.photos?.length || listing.images.length} photo(s)`, at: listing.updatedAt, image: listing.image, listing })),
    ...changes.data.map((listing) => ({ key: `c-${listing.id}`, kind: 'changes' as const, title: listing.title, subtitle: `${listing.vendorName ?? 'Partner'} · ${Object.keys(listing.pendingRevision?.changes ?? {}).length || 'room'} change(s)`, at: listing.pendingRevision?.submittedAt, image: listing.image, listing })),
  ].sort((a, b) => Date.parse(a.at ?? '') - Date.parse(b.at ?? ''));
}

/** Business type of a partner, or the product of a listing, for the queue's product column. */
const itemProduct = (item: InboxItem): Product => item.listing?.type ?? (item.vendor?.businessType === 'vehicle' ? 'car' : item.vendor?.businessType === 'tour_operator' ? 'tour' : item.vendor?.businessType === 'homestay' ? 'homestay' : 'hotel');

/** The review queue with the selected item reviewed alongside. */
function InboxPanel({ onOpen, initialKey, onChanged }: { onOpen: (tab: Tab) => void; initialKey?: string; onChanged: () => void }) {
  const { askReason, dialog } = useReviewDialog();
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [liveHotels, setLiveHotels] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'partners' | 'hotel' | 'changes'>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(initialKey ?? null);
  const [reload, setReload] = useState(0);
  const { busyId, error, setError, run } = useAction();

  useEffect(() => {
    let active = true;
    setError(null);
    Promise.all([loadQueue(), api.admin.listListings({ status: 'published', limit: 1 })]).then(([next, live]) => {
      if (!active) return;
      setItems(next);
      setLiveHotels(live.pagination.total);
      setSelectedKey((current) => next.some((item) => item.key === current) ? current : next[0]?.key ?? null);
    }).catch((reason) => active && setError(reason instanceof Error ? reason.message : 'The review queue could not be loaded.'));
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  const count = (kinds: InboxKind[]) => items?.filter((item) => kinds.includes(item.kind)).length ?? 0;
  const shown = (items ?? []).filter((item) => filter === 'all' || (filter === 'partners' ? item.kind === 'partner' || item.kind === 'business' : item.kind === filter));
  const selected = shown.find((item) => item.key === selectedKey) ?? shown[0];
  const oldestPartner = items?.find((item) => item.kind === 'partner');
  const done = (key: string) => {
    const index = shown.findIndex((item) => item.key === key);
    setItems((current) => current?.filter((item) => item.key !== key) ?? null);
    setSelectedKey(shown[index + 1]?.key ?? shown[index - 1]?.key ?? null);
  };

  const decide = async (item: InboxItem, approve: boolean) => {
    const verbs: Record<InboxKind, [string, string]> = {
      partner: ['Approve partner', 'Reject partner'], business: ['Apply changes', 'Reject changes'],
      hotel: ['Publish listing', 'Reject listing'], changes: ['Approve and publish', 'Reject changes'],
    };
    const confirmLabel = verbs[item.kind][approve ? 0 : 1];
    const notes = await askReason({
      title: `${confirmLabel}: ${item.title}`, confirmLabel, destructive: !approve,
      description: approve ? 'Add a short note to complete your review. The partner is emailed about the decision.'
        : 'Explain what needs fixing. This note is emailed to the partner.',
    });
    if (!notes) return;
    run(item.key, async () => {
      if (item.kind === 'partner') await api.admin.decideVendor(item.vendor!.id, approve ? 'approved' : 'rejected', notes);
      if (item.kind === 'business') await api.admin.decideVendorChanges(item.vendor!.id, approve ? 'approved' : 'rejected', notes);
      if (item.kind === 'hotel') await api.admin.moderateListing(item.listing!.id, approve ? 'published' : 'rejected', notes);
      if (item.kind === 'changes') await api.admin.decideListingRevision(item.listing!.id, approve ? 'approved' : 'rejected', notes);
      done(item.key);
      onChanged();
      if (item.kind === 'hotel' && approve) setLiveHotels((value) => (value ?? 0) + 1);
    });
  };

  const tiles: Array<[string, number | string, string, boolean]> = [
    ['New partners', count(['partner']), oldestPartner ? `Oldest waiting ${ago(oldestPartner.at).replace(' ago', '')}` : 'None waiting', false],
    ['New listings', count(['hotel']), 'Waiting to be published', false],
    ['Changes to live listings', count(['changes']), 'Still bookable while you review', true],
    ['Live listings', liveHotels ?? '—', 'Visible to guests', false],
  ];

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#5A6B61]">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{items === null ? 'Loading your queue…' : items.length === 0 ? 'Nothing needs your decision' : `${items.length} thing${items.length === 1 ? '' : 's'} need${items.length === 1 ? 's' : ''} your decision`}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={secondaryButton} onClick={() => onOpen('cancellations')}>Cancel a booking</button>
          <button type="button" className={secondaryButton} onClick={() => setReload((value) => value + 1)}>Refresh</button>
        </div>
      </div>

      <section aria-label="Summary" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {tiles.map(([name, value, hint, warm]) => <div key={name} className={`rounded-2xl border p-[18px] ${warm ? 'border-[#F3D9B4] bg-[#FFF6EA]' : 'border-[#E1E5DE] bg-white'}`}>
          <p className={`text-sm font-semibold ${warm ? 'text-[#8A4B10]' : 'text-[#5A6B61]'}`}>{name}</p>
          <p className="mt-1.5 text-3xl font-extrabold">{value}</p>
          <p className={`mt-1 text-xs ${warm ? 'text-[#8A4B10]' : 'text-[#5A6B61]'}`}>{hint}</p>
        </div>)}
      </section>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {items === null && !error && <div className="flex justify-center py-10"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading" /></div>}

      {items && <div className="flex flex-wrap items-start gap-5">
        <section aria-label="Review queue" className="min-w-0 max-w-[440px] flex-[1_1_340px] overflow-hidden rounded-2xl border border-[#E1E5DE] bg-white">
          <div className="flex flex-wrap gap-2 border-b border-[#ECEFE9] p-4">
            {([['all', 'All', items.length], ['partners', 'Partners', count(['partner', 'business'])], ['hotel', 'New listings', count(['hotel'])], ['changes', 'Changes', count(['changes'])]] as const).map(([id, text, total]) =>
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}
                className={`min-h-9 rounded-full border px-3.5 text-[13px] font-semibold ${filter === id ? 'border-[#14201A] bg-[#14201A] text-white' : 'border-[#D7DDD6] bg-white text-[#3D4A42]'}`}>{text} {total}</button>)}
          </div>
          {shown.length === 0 && <p className="p-8 text-center text-sm text-[#5A6B61]">You are all caught up.</p>}
          <ul>
            {shown.map((item) => {
              const [kind, tone] = kindLabel[item.kind];
              const on = item.key === selected?.key;
              return <li key={item.key} className="border-t border-[#ECEFE9] first:border-t-0">
                <button type="button" aria-current={on ? 'true' : undefined} onClick={() => setSelectedKey(item.key)}
                  className={`flex w-full gap-3 border-l-4 p-4 text-left ${on ? 'border-[#006F3C] bg-[#F1F8F3]' : 'border-transparent hover:bg-[#F7F8F5]'}`}>
                  {item.image ? <img src={item.image} alt="" className="size-[52px] shrink-0 rounded-[10px] object-cover" />
                    : <span className="flex size-[52px] shrink-0 items-center justify-center rounded-[10px] bg-[#E3D7C6] font-extrabold text-[#6B4A1E]">{item.title.slice(0, 2).toUpperCase()}</span>}
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[11px] font-bold uppercase tracking-[0.08em] ${tone}`}>{kind}</span>
                    <span className="mt-0.5 block truncate text-[15px] font-bold">{item.title}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-[#5A6B61]">{item.subtitle}{item.at ? ` · ${ago(item.at)}` : ''}</span>
                  </span>
                </button>
              </li>;
            })}
          </ul>
        </section>

        {selected && <section aria-label="Selected item" className="min-w-0 flex-[999_1_520px] overflow-hidden rounded-2xl border border-[#E1E5DE] bg-white">
          <div className="flex flex-wrap justify-between gap-4 border-b border-[#ECEFE9] px-6 py-5">
            <div className="min-w-0">
              <p className="flex flex-wrap gap-2">
                {selected.kind === 'changes' && <span className="rounded-full bg-[#E4F3EA] px-2.5 py-1 text-xs font-bold text-[#0B5A33]">Live · still bookable</span>}
                <span className={`rounded-full bg-[#F3F4EF] px-2.5 py-1 text-xs font-bold ${kindLabel[selected.kind][1]}`}>{kindLabel[selected.kind][0]}</span>
              </p>
              <h2 className="mt-2.5 text-2xl font-extrabold">{selected.title}</h2>
              <p className="mt-1 text-sm text-[#5A6B61]">{selected.listing ? `${selected.listing.location} · ${selected.listing.vendorName ?? ''}` : `${selected.vendor!.email} · ${selected.vendor!.phone}`}</p>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <button type="button" className={`${secondaryButton} border-[#E9C3BC] text-[#A12A1C]`} disabled={busyId === selected.key} onClick={() => decide(selected, false)}>{selected.kind === 'partner' || selected.kind === 'hotel' ? 'Reject' : 'Reject changes'}</button>
              <button type="button" className={primaryButton} disabled={busyId === selected.key} onClick={() => decide(selected, true)}>{{ partner: 'Approve partner', business: 'Apply changes', hotel: 'Publish listing', changes: 'Approve and publish' }[selected.kind]}</button>
            </div>
          </div>
          <div className="space-y-5 p-6">
            {selected.vendor && <>
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {[['Business type', label(selected.vendor.businessType)], ['Registration no.', selected.vendor.registrationNumber ?? '—'], ['NTN', selected.vendor.taxNumber ?? '—'],
                  ['Address', [selected.vendor.address?.line1, selected.vendor.address?.city, selected.vendor.address?.region].filter(Boolean).join(', ') || '—']]
                  .map(([term, value]) => <div key={term}><dt className="text-[#5A6B61]">{term}</dt><dd className="font-semibold">{value}</dd></div>)}
              </dl>
              {selected.kind === 'partner' && <div>
                <h3 className="mb-2 text-[15px] font-bold">Documents</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.vendor.verificationDocuments.length === 0 && <span className="text-sm text-[#5A6B61]">No documents attached.</span>}
                  {selected.vendor.verificationDocuments.map((document) => document.url
                    ? <a key={document.type} href={document.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-[#D7DDD6] px-3 text-sm font-semibold capitalize text-[#006F3C] underline">{label(document.type)}</a>
                    : <span key={document.type} className="inline-flex min-h-11 items-center rounded-lg border border-[#ECEFE9] px-3 text-sm capitalize text-[#5A6B61]">{label(document.type)} (link unavailable)</span>)}
                </div>
              </div>}
              {selected.kind === 'business' && <ChangeRequestDiff vendor={selected.vendor} />}
            </>}
            {selected.listing && <ListingReviewDetails key={selected.key} listing={selected.listing} />}
          </div>
        </section>}
      </div>}
    </div>
  );
}

type Summary = { queue: InboxItem[]; live: Record<Product, number>; waiting: Record<Product, number>; paused: number; partners: number; reported: number };

async function loadSummary(): Promise<Summary> {
  const total = (result: Promise<Paginated<unknown>>) => result.then((page) => page.pagination.total);
  const [queue, hotel, homestay, car, tour, paused, partners, reported] = await Promise.all([
    loadQueue(),
    ...PRODUCTS.map((type) => total(api.admin.listListings({ status: 'published', type, limit: 1 }))),
    total(api.admin.listListings({ status: 'paused', limit: 1 })), total(api.admin.listVendors({ status: 'approved', limit: 1 })),
    total(api.admin.listReviews({ status: 'reported', limit: 1 })),
  ]);
  const waiting = { hotel: 0, homestay: 0, car: 0, tour: 0 };
  queue.forEach((item) => { waiting[itemProduct(item)] += 1; });
  return { queue, live: { hotel, homestay, car, tour }, waiting, paused, partners, reported };
}

const kindText: Record<InboxKind, string> = { partner: 'New partner', business: 'Business details change', hotel: 'New listing', changes: 'Changes to a live listing' };

function OverviewPanel({ summary, error, onOpen, onReview }: { summary: Summary | null; error: string | null; onOpen: (tab: Tab) => void; onReview: (key: string) => void }) {
  const [filter, setFilter] = useState<Product | 'all'>('all');
  if (error) return <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>;
  if (!summary) return <div className="flex justify-center py-16"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading" /></div>;
  const { queue, live, waiting } = summary;
  const liveTotal = live.hotel + live.homestay + live.car + live.tour;
  const oldest = queue[0]?.at;
  const shown = queue.filter((item) => filter === 'all' || itemProduct(item) === filter);
  const changeRequests = queue.filter((item) => item.kind === 'business').length;
  const watch = [
    summary.reported > 0 && [`${summary.reported} guest review${summary.reported === 1 ? '' : 's'} reported by partners`, 'reviews'],
    changeRequests > 0 && [`${changeRequests} partner${changeRequests === 1 ? '' : 's'} asked to change business details`, 'inbox'],
    summary.paused > 0 && [`${summary.paused} listing${summary.paused === 1 ? ' is' : 's are'} paused by their partner`, 'hotel'],
  ].filter(Boolean) as Array<[string, Tab]>;
  const tiles: Array<[string, number | string, string]> = [
    ['Waiting for you', queue.length, oldest ? `Oldest ${ago(oldest)}` : 'All caught up'],
    ['Live listings', liveTotal, `${live.hotel} hotels · ${live.homestay} homestays · ${live.car} cars · ${live.tour} tours`],
    ['Approved partners', summary.partners, 'Can list and take bookings'],
    ['Reported reviews', summary.reported, summary.reported ? 'Waiting for moderation' : 'Nothing reported'],
  ];

  return (
    <div className="space-y-6">
      <section aria-label="Summary" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {tiles.map(([name, value, hint]) => <div key={name} className="rounded-2xl border border-[#E3E7E2] bg-white p-5">
          <p className="text-sm font-semibold text-[#5B6B61]">{name}</p>
          <p className="mt-1.5 text-3xl font-extrabold">{value}</p>
          <p className="mt-1 text-[13px] text-[#5B6B61]">{hint}</p>
        </div>)}
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-label="Decision queue" className="min-w-0 flex-[999_1_560px] overflow-hidden rounded-2xl border border-[#E3E7E2] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF1ED] px-5 py-4">
            <h2 className="text-lg font-extrabold">Decision queue</h2>
            <div className="flex flex-wrap gap-1.5">
              {(['all', ...PRODUCTS] as const).map((id) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}
                className={`min-h-9 rounded-full border px-3.5 text-[13px] font-semibold ${filter === id ? 'border-[#17211B] bg-[#17211B] text-white' : 'border-[#D9DED8] bg-white text-[#3D4A42]'}`}>
                {id === 'all' ? `All ${queue.length}` : `${productNames[id][0]} ${waiting[id]}`}</button>)}
            </div>
          </div>
          {shown.length === 0 ? <p className="p-10 text-center text-sm text-[#5B6B61]">Nothing is waiting here. You are all caught up.</p>
            : <div className="overflow-x-auto"><table className="w-full min-w-[640px] border-collapse text-sm">
              <thead><tr className="text-left text-xs tracking-wide text-[#5B6B61]">
                <th className="px-5 py-3 font-bold">WHAT</th><th className="px-2 py-3 font-bold">PRODUCT</th><th className="px-2 py-3 font-bold">FROM</th><th className="px-2 py-3 font-bold">WAITING</th><th className="px-5 py-3 text-right font-bold"><span className="sr-only">Action</span></th>
              </tr></thead>
              <tbody>{shown.map((item) => {
                const hours = item.at ? (Date.now() - Date.parse(item.at)) / 3_600_000 : 0;
                return <tr key={item.key} className="border-t border-[#EEF1ED]">
                  <td className="px-5 py-3.5"><p className="font-bold">{item.title}</p><p className="text-[13px] text-[#5B6B61]">{kindText[item.kind]}</p></td>
                  <td className="px-2 py-3.5"><span className="rounded-full bg-[#EAF4EE] px-2.5 py-1 text-xs font-bold text-[#0B5A33]">{productNames[itemProduct(item)][0]}</span></td>
                  <td className="px-2 py-3.5 text-[#3D4A42]">{item.listing ? item.listing.location : (item.vendor && address(item.vendor)) || '—'}</td>
                  <td className={`px-2 py-3.5 font-semibold ${hours >= 48 ? 'text-[#B91C1C]' : hours >= 24 ? 'text-[#B45309]' : 'text-[#3D4A42]'}`}>{ago(item.at).replace(' ago', '') || '—'}</td>
                  <td className="px-5 py-3.5 text-right"><button type="button" onClick={() => onReview(item.key)} className="min-h-9 rounded-lg border border-[#C9D3CC] bg-white px-3.5 text-[13px] font-bold text-[#006F3C] hover:bg-[#F1F8F4]">Review</button></td>
                </tr>;
              })}</tbody>
            </table></div>}
        </section>

        <aside className="flex flex-[1_1_300px] flex-col gap-4">
          <section className="rounded-2xl border border-[#E3E7E2] bg-white p-5">
            <h2 className="mb-2 font-extrabold">Products at a glance</h2>
            {PRODUCTS.map((id) => <button key={id} type="button" onClick={() => onOpen(id)} className="flex w-full items-center justify-between border-t border-[#EEF1ED] py-2.5 text-left">
              <span><span className="block text-sm font-bold">{productNames[id][0]}</span><span className="text-xs text-[#5B6B61]">{waiting[id] ? `${waiting[id]} waiting` : 'Nothing waiting'}</span></span>
              <span className="text-xl font-extrabold">{live[id]}</span>
            </button>)}
          </section>
          {watch.length > 0 && <section className="rounded-2xl border border-[#F5D9A8] bg-[#FFF8EB] p-5">
            <h2 className="mb-2 font-extrabold text-[#7A4A00]">Keep an eye on</h2>
            <ul className="space-y-1">{watch.map(([text, tab]) => <li key={text}><button type="button" onClick={() => onOpen(tab)} className="min-h-9 text-left text-sm text-[#4A3A1F] underline-offset-2 hover:underline">{text}</button></li>)}</ul>
          </section>}
        </aside>
      </div>
    </div>
  );
}

const sectionDetails: Record<Tab, { title: string; description: string }> = {
  overview: { title: '', description: '' },
  hotel: { title: 'Hotels', description: 'Every hotel on the platform. Review new ones, approve edits to live ones, and take down listings that break the rules.' },
  homestay: { title: 'Homestays', description: 'Every homestay on the platform, from family rooms to entire homes.' },
  car: { title: 'Cars', description: 'Every car listing, from rental companies and owner-drivers.' },
  tour: { title: 'Tours', description: 'Every tour, from tour companies and independent guides.' },
  inbox: { title: 'Review inbox', description: 'Partners, hotels and edits waiting for a decision.' },
  vendors: { title: 'Partner reviews', description: 'Review vendor applications, verify documents and manage partner access.' },
  reviews: { title: 'Guest reviews', description: 'Reviews partners reported, and reviews you have hidden. Remove only abusive, fake or off-topic reviews and personal data; honest criticism stays.' },
  users: { title: 'People & access', description: 'Manage customer and partner accounts, invite administrators and control platform access.' },
  cancellations: { title: 'Cancel a booking', description: 'For disputes or fraud only. Hotels run their own reservations; find a booking by its reference to cancel it on the guest’s behalf.' },
  settings: { title: 'Fees & refunds', description: 'GBBookings’ commission on every booking, and how much a guest gets back when they cancel a paid booking. Changes apply to bookings made or cancelled from now on.' },
  security: { title: 'Account security', description: 'Manage your password, active sessions and two-factor authentication.' },
};

const NAV_KEY = 'gb-admin-nav-open';

export default function AdminDashboard({ roles, userName = 'Staff member', userEmail = '', onSignOut }: {
  roles: string[]; userName?: string; userEmail?: string; onSignOut: () => Promise<void>;
}) {
  const isAdmin = roles.includes('admin');
  const [tab, setTab] = useState<Tab>('overview');
  const [inboxKey, setInboxKey] = useState<string>();
  const [signingOut, setSigningOut] = useState(false);
  const [navOpen, setNavOpen] = useState(() => { try { return localStorage.getItem(NAV_KEY) !== '0'; } catch { return true; } });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryRevision, setSummaryRevision] = useState(0);

  // The menu badges and the overview share one summary; it reloads after inbox decisions.
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    setSummaryError(null);
    loadSummary().then((next) => active && setSummary(next))
      .catch((reason) => active && setSummaryError(reason instanceof Error ? reason.message : 'The overview could not be loaded.'));
    return () => { active = false; };
  }, [isAdmin, summaryRevision]);

  const navigate = (next: Tab) => { setTab(next); setInboxKey(undefined); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const toggleNav = () => setNavOpen((open) => { try { localStorage.setItem(NAV_KEY, open ? '0' : '1'); } catch { /* storage blocked */ } return !open; });
  const signOut = async () => { setSigningOut(true); try { await onSignOut(); } finally { setSigningOut(false); } };

  if (!isAdmin) return <main className="p-8"><h1 className="text-xl font-bold">Admin access required</h1></main>;
  const section = sectionDetails[tab];
  const badges: Partial<Record<Tab, number>> = { inbox: summary?.queue.length, reviews: summary?.reported };
  // Below md the menu is always the icon rail; the toggle only widens it on larger screens.
  const labelClass = navOpen ? 'hidden md:block' : 'hidden';
  const iconsOnly = navOpen ? 'justify-center md:justify-start' : 'justify-center';

  return (
    <div className="flex min-h-dvh bg-[#F4F5F1] font-jakarta text-[#17211B]">
      <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">Skip to workspace</a>
      <nav aria-label="Admin sections" className={`sticky top-0 flex h-dvh w-[68px] shrink-0 flex-col gap-4 overflow-y-auto bg-[#002816] px-2.5 py-5 text-[#CFE3D6] transition-[width] ${navOpen ? 'md:w-64' : ''}`}>
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#006F3C]"><ShieldCheck className="size-5 text-white" /></span>
          <span className={`${labelClass} leading-tight`}><span className="block text-base font-extrabold text-white">GBBookings</span><span className="text-[11px] font-bold tracking-[0.14em] text-[#8FBFA0]">ADMIN</span></span>
        </div>
        <button type="button" onClick={toggleNav} aria-expanded={navOpen} aria-label={navOpen ? 'Collapse menu' : 'Expand menu'} title={navOpen ? 'Collapse menu' : 'Expand menu'}
          className={`hidden min-h-10 items-center gap-2.5 rounded-lg border border-[#1F4A33] px-3 text-[13px] font-semibold hover:bg-white/5 md:flex ${navOpen ? '' : 'justify-center'}`}>
          {navOpen ? <PanelLeftClose className="size-[18px] shrink-0" /> : <PanelLeftOpen className="size-[18px] shrink-0" />}<span className={labelClass}>Collapse menu</span>
        </button>
        {navGroups.map((group, index) => <div key={index} className="flex flex-col gap-0.5">
          {group.title && <p className={`${labelClass} px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#7FA88F]`}>{group.title}</p>}
          {group.title && <div className={`${navOpen ? 'md:hidden' : ''} mx-2 mb-2 h-px bg-[#1F4A33]`} />}
          {group.items.map(({ id, label: text, icon: Icon }) => {
            const current = tab === id;
            const badge = badges[id];
            const tone = current ? 'bg-[#0B4A2C] text-white' : 'text-[#CFE3D6] hover:bg-white/5 hover:text-white';
            return <button key={id} type="button" title={text} aria-label={text} aria-current={current ? 'page' : undefined}
              onClick={() => navigate(id)}
              className={`relative flex min-h-[42px] items-center gap-3 rounded-lg px-3 text-sm font-semibold disabled:cursor-not-allowed ${tone} ${iconsOnly}`}>
              <Icon className="size-[19px] shrink-0" />
              <span className={`${labelClass} flex-1 text-left`}>{text}</span>
              {!!badge && <span className={`${labelClass} rounded-full px-2 text-xs font-extrabold ${id === 'reviews' ? 'bg-[#7F1D1D] text-[#FECACA]' : 'bg-[#F59E0B] text-[#2A1A00]'}`}>{badge}</span>}
              {!!badge && <span aria-hidden="true" className={`${navOpen ? 'md:hidden' : ''} absolute right-2 top-2 size-2 rounded-full bg-[#F59E0B]`} />}
            </button>;
          })}
        </div>)}
        <div className={`mt-auto flex items-center gap-2.5 border-t border-[#1F4A33] px-1 pt-4 ${navOpen ? 'flex-col md:flex-row' : 'flex-col'}`}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F59E3B] font-extrabold text-[#17211B]" aria-hidden="true">{userName.charAt(0).toUpperCase()}</span>
          <span className={`${labelClass} min-w-0 flex-1 text-[13px] leading-tight`}><strong className="block truncate text-white">{userName}</strong><span className="block truncate text-[#8FBFA0]">{userEmail || 'Platform Admin'}</span></span>
          <button type="button" onClick={signOut} disabled={signingOut} aria-label="Sign out" title="Sign out" className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-50"><LogOut className="size-4" /></button>
        </div>
      </nav>
      <main id="admin-content" className="min-w-0 flex-1 space-y-6 px-4 pb-12 pt-7 sm:px-8">
        {tab === 'overview' && <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#5B6B61]">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{!summary ? 'Overview' : summary.queue.length === 0 ? 'Nothing needs your decision' : `${summary.queue.length} decision${summary.queue.length === 1 ? '' : 's'} waiting`}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={secondaryButton} onClick={() => setSummaryRevision((value) => value + 1)}>Refresh</button>
              <button type="button" className={`${primaryButton} inline-flex items-center gap-2`} onClick={() => navigate('cancellations')}><Search className="size-4" />Find a booking</button>
            </div>
          </div>
          <OverviewPanel summary={summary} error={summaryError} onOpen={navigate} onReview={(key) => { navigate('inbox'); setInboxKey(key); }} />
        </>}
        {tab === 'inbox' && <InboxPanel key={inboxKey ?? 'inbox'} initialKey={inboxKey} onOpen={navigate} onChanged={() => setSummaryRevision((value) => value + 1)} />}
        {tab !== 'overview' && tab !== 'inbox' && <>
          <div><h1 className="text-3xl font-extrabold tracking-tight">{section.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#5B6B61]">{section.description}</p></div>
          {PRODUCTS.includes(tab as Product) && <ListingsPanel key={tab} type={tab as Product} />}
          {tab === 'vendors' && <VendorsPanel />}
          {tab === 'reviews' && <ReviewsPanel />}
          {tab === 'users' && <UsersPanel />}
          {tab === 'cancellations' && <CancelBookingPanel />}
          {tab === 'settings' && <SettingsPanel />}
          {tab === 'security' && <section className="rounded-2xl border border-[#E1E5DE] bg-white p-4 sm:p-6"><SecurityPanel /></section>}
        </>}
      </main>
    </div>
  );
}
