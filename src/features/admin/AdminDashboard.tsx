import { useEffect, useState, type ReactNode } from 'react';
import { Building2, CalendarCheck, FileText, LoaderCircle, ShieldCheck, Users } from 'lucide-react';
import { api, type AdminUser, type AdminVendor, type Paginated, type UserStatusAction, type VendorListing } from '../../shared/api/api';
import VendorReservations from '../vendor/VendorReservations';

type Tab = 'vendors' | 'listings' | 'users' | 'bookings';

// Mirrors server/modules/auth/rbac.ts; the server enforces it, this only hides tabs a role cannot use.
const tabRoles: Record<Tab, string[]> = {
  vendors: ['admin', 'super_admin'],
  listings: ['admin', 'super_admin'],
  users: ['admin', 'super_admin'],
  bookings: ['admin', 'super_admin', 'support_agent'],
};

const tabs: Array<{ id: Tab; label: string; icon: typeof Users }> = [
  { id: 'vendors', label: 'Vendors', icon: Building2 },
  { id: 'listings', label: 'Listings', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
];

const adminBookings = { load: (status?: string) => api.admin.listBookings({ status }).then((result) => result.data), act: api.admin.actOnBooking };

const primaryButton = 'min-h-11 rounded-md bg-[#006F3C] px-4 text-sm font-bold text-white disabled:opacity-50';
const secondaryButton = 'min-h-11 rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700 disabled:opacity-50';
const selectClass = 'min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm capitalize';
const label = (value: string) => value.replace(/_/g, ' ');

/** Asks for the note the server requires (3+ characters) on every moderation decision. */
function askReason(message: string) {
  const reason = window.prompt(message)?.trim();
  return reason && reason.length >= 3 ? reason : null;
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
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className="size-5 text-[#006F3C]" />
          <h2 className="font-bold text-slate-900">{title}</h2>
        </div>
        {filter}
      </div>
      {error && <p role="alert" className="bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="divide-y divide-slate-200 border-y border-slate-200" aria-live="polite">
        {loading && <div className="flex justify-center py-6"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading" /></div>}
        {!loading && empty && <p className="py-6 text-sm text-slate-500">{empty}</p>}
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
  const [status, setStatus] = useState('submitted');
  const [page, setPage] = useState(1);
  const { result, loading, loadError, replace } = usePaged(() => api.admin.listVendors({ status: status || undefined, page }), [status, page]);
  const { busyId, error, run } = useAction();

  const decide = (vendor: AdminVendor, decision: 'approved' | 'rejected' | 'suspended') => {
    const notes = askReason(decision === 'approved' ? 'Approval note (kept in the audit log):' : `Reason for ${decision === 'rejected' ? 'rejecting' : 'suspending'} (shared with the vendor):`);
    if (!notes) return;
    run(vendor.id, async () => replace(vendor.id, (await api.admin.decideVendor(vendor.id, decision, notes)).data));
  };

  return (
    <Panel title="Vendor applications" icon={Building2} error={error ?? loadError} loading={loading}
      empty={result?.data.length === 0 ? `No ${status ? label(status) : ''} vendors.` : null}
      filter={
        <select aria-label="Filter vendors by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={selectClass}>
          <option value="">All</option>
          {['submitted', 'approved', 'rejected', 'suspended', 'draft'].map((value) => <option key={value} value={value}>{value}</option>)}
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
          </div>
          <span className="text-xs font-bold uppercase text-indigo-700">{label(vendor.status)}</span>
          <div className="flex gap-2">
            {vendor.status === 'submitted' && <>
              <button type="button" className={primaryButton} disabled={busyId === vendor.id} onClick={() => decide(vendor, 'approved')}>Approve</button>
              <button type="button" className={secondaryButton} disabled={busyId === vendor.id} onClick={() => decide(vendor, 'rejected')}>Reject</button>
            </>}
            {vendor.status === 'approved' && <button type="button" className={secondaryButton} disabled={busyId === vendor.id} onClick={() => decide(vendor, 'suspended')}>Suspend</button>}
          </div>
        </div>
      ))}
      <div className="py-3"><Pager pagination={result?.pagination} onPage={setPage} /></div>
    </Panel>
  );
}

function ListingsPanel() {
  const [listings, setListings] = useState<VendorListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { busyId, error, setError, run } = useAction();

  useEffect(() => {
    let active = true;
    api.admin.listPendingListings()
      .then((result) => active && setListings(result))
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const decide = (listing: VendorListing, decision: 'published' | 'rejected') => {
    const notes = askReason(decision === 'published' ? 'Approval note (kept in the audit log):' : 'Reason for rejecting (shared with the vendor):');
    if (!notes) return;
    run(listing.id, async () => {
      await api.admin.moderateListing(listing.id, decision, notes);
      setListings((items) => items.filter((item) => item.id !== listing.id));
    });
  };

  return (
    <Panel title="Listings awaiting review" icon={FileText} error={error} loading={loading} empty={listings.length === 0 ? 'No listings are waiting for review.' : null}>
      {listings.map((listing) => (
        <div key={listing.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
          {listing.image && <img src={listing.image} alt="" className="h-20 w-28 shrink-0 rounded-md object-cover" />}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold text-slate-900">{listing.title}</p>
            <p className="text-xs text-slate-500">{label(listing.type)} · {listing.location} · from PKR {listing.price.toLocaleString()}/night · {listing.images.length} photo(s)</p>
            <p className="line-clamp-3 text-xs text-slate-600">{listing.description}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className={primaryButton} disabled={busyId === listing.id} onClick={() => decide(listing, 'published')}>Publish</button>
            <button type="button" className={secondaryButton} disabled={busyId === listing.id} onClick={() => decide(listing, 'rejected')}>Reject</button>
          </div>
        </div>
      ))}
    </Panel>
  );
}

function UsersPanel() {
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { result, loading, loadError, replace } = usePaged(
    () => api.admin.listUsers({ status: status || undefined, role: role || undefined, search: query || undefined, page }),
    [status, role, query, page],
  );
  const { busyId, error, run } = useAction();

  const change = (user: AdminUser, action: UserStatusAction) => {
    const reason = askReason(`Reason to ${label(action)} ${user.email} (kept in the audit log):`);
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
            {['customer', 'vendor_owner', 'vendor_staff', 'support_agent', 'admin', 'super_admin'].map((value) => <option key={value} value={value}>{label(value)}</option>)}
          </select>
          <select aria-label="Filter users by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={selectClass}>
            <option value="">All statuses</option>
            {['active', 'suspended', 'archived'].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </form>
      }>
      {result?.data.map((user) => (
        <div key={user.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}{user.phone ? ` · ${user.phone}` : ''} · {user.roles.map(label).join(', ')}</p>
            <p className="text-xs text-slate-500">Joined {new Date(user.createdAt).toLocaleDateString()} · {user.emailVerified ? 'Email verified' : 'Email not verified'}</p>
          </div>
          <span className="text-xs font-bold uppercase text-indigo-700">{user.status}</span>
          <div className="flex flex-wrap gap-2">
            {!user.emailVerified && <button type="button" className={secondaryButton} disabled={busyId === user.id} onClick={() => change(user, 'verify_email')}>Verify email</button>}
            {user.status !== 'active' && <button type="button" className={primaryButton} disabled={busyId === user.id} onClick={() => change(user, 'activate')}>Activate</button>}
            {user.status === 'active' && <button type="button" className={secondaryButton} disabled={busyId === user.id} onClick={() => change(user, 'suspend')}>Suspend</button>}
            {user.status !== 'archived' && <button type="button" className={secondaryButton} disabled={busyId === user.id} onClick={() => change(user, 'archive')}>Archive</button>}
          </div>
        </div>
      ))}
      <div className="py-3"><Pager pagination={result?.pagination} onPage={setPage} /></div>
    </Panel>
  );
}

export default function AdminDashboard({ roles }: { roles: string[] }) {
  const allowed = tabs.filter((tab) => tabRoles[tab.id].some((role) => roles.includes(role)));
  const [tab, setTab] = useState<Tab | undefined>(allowed[0]?.id);

  if (!allowed.length) {
    return (
      <section className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-xl font-bold">Staff access required</h1>
        <p className="mt-2 text-sm text-slate-600">This workspace is only available to GBBookings staff accounts.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <header className="flex items-center gap-3">
        <ShieldCheck className="size-7 text-[#006F3C]" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin workspace</h1>
          <p className="text-sm text-slate-600">Approve vendors and listings, manage users and oversee bookings. Every action is audit-logged.</p>
        </div>
      </header>
      <nav className="flex gap-2 overflow-x-auto border-b border-slate-200" aria-label="Admin sections">
        {allowed.map(({ id, label: text, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}
            className={`flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-bold ${tab === id ? 'border-[#006F3C] text-[#006F3C]' : 'border-transparent text-slate-600'}`}>
            <Icon className="size-4" /> {text}
          </button>
        ))}
      </nav>
      {tab === 'vendors' && <VendorsPanel />}
      {tab === 'listings' && <ListingsPanel />}
      {tab === 'users' && <UsersPanel />}
      {tab === 'bookings' && <VendorReservations source={adminBookings} title="All bookings" />}
    </div>
  );
}
