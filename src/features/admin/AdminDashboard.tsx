import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Building2, CalendarCheck, ChevronRight, FileText, LoaderCircle, LogOut, ShieldCheck, Users, X } from 'lucide-react';
import { api, type AdminUser, type AdminVendor, type Paginated, type UserStatusAction, type VendorListing } from '../../shared/api/api';
import VendorReservations from '../vendor/VendorReservations';
import SecurityPanel from '../account/SecurityPanel';

type Tab = 'vendors' | 'listings' | 'users' | 'bookings' | 'security';

// Mirrors server/modules/auth/rbac.ts; the server enforces it, this only hides tabs a role cannot use.
const tabRoles: Record<Tab, string[]> = {
  vendors: ['admin'],
  listings: ['admin'],
  users: ['admin'],
  bookings: ['admin', 'support_agent'],
  security: ['admin', 'support_agent'],
};

const tabs: Array<{ id: Tab; label: string; icon: typeof Users }> = [
  { id: 'vendors', label: 'Vendors', icon: Building2 },
  { id: 'listings', label: 'Listings', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'security', label: 'Account security', icon: ShieldCheck },
];

const adminBookings = { load: api.admin.listBookings, act: api.admin.actOnBooking };

const primaryButton = 'min-h-11 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white transition hover:bg-[#005c32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50';
const secondaryButton = 'min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50';
const selectClass = 'min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm capitalize outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10';
const label = (value: string) => value.replace(/_/g, ' ');
const roleLabels: Record<string, string> = {
  admin: 'Platform Admin', support_agent: 'Platform Employee',
  vendor_owner: 'Vendor Owner', vendor_staff: 'Vendor Employee', customer: 'Customer',
};
const roleLabel = (value: string) => roleLabels[value] ?? label(value);

interface ReviewRequest {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
}

function ReviewDialog({ request, onClose }: { request: ReviewRequest; onClose: (reason: string | null) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const noteId = useId();
  const errorId = useId();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) previouslyFocused.focus();
    };
  }, []);

  return createPortal(
    <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); onClose(null); }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm">
      <form onSubmit={(event) => {
        event.preventDefault();
        const reason = note.trim();
        if (reason.length < 3) { setError('Please enter a note of at least 3 characters.'); return; }
        onClose(reason);
      }}>
        <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${request.destructive ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-[#006F3C]'}`}><ShieldCheck className="size-5" /></span>
          <div className="min-w-0 flex-1"><h2 id={titleId} className="text-lg font-bold">{request.title}</h2><p id={descriptionId} className="mt-1 break-words text-sm leading-6 text-slate-600">{request.description}</p></div>
          <button type="button" onClick={() => onClose(null)} aria-label="Close review dialog" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#006F3C]"><X className="size-5" /></button>
        </div>
        <div className="space-y-2 px-6 py-5">
          <label htmlFor={noteId} className="block text-sm font-semibold">Review note <span className="font-normal text-slate-500">(required)</span></label>
          <textarea id={noteId} autoFocus required maxLength={1000} value={note}
            onChange={(event) => { setNote(event.target.value); setError(''); }}
            aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}
            placeholder="Add a short note explaining your decision…"
            className="min-h-32 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15" />
          {error && <p id={errorId} role="alert" className="text-sm text-rose-700">{error}</p>}
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button type="button" className={`${secondaryButton} bg-white hover:bg-slate-100`} onClick={() => onClose(null)}>Cancel</button>
          <button type="submit" className={request.destructive ? 'min-h-11 rounded-md bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800' : `${primaryButton} hover:bg-[#005c32]`}>{request.confirmLabel}</button>
        </div>
      </form>
    </dialog>, document.body,
  );
}

function useReviewDialog() {
  const [request, setRequest] = useState<ReviewRequest | null>(null);
  const resolver = useRef<((reason: string | null) => void) | null>(null);
  useEffect(() => () => { resolver.current?.(null); resolver.current = null; }, []);
  const askReason = (next: ReviewRequest) => new Promise<string | null>((resolve) => {
    resolver.current?.(null);
    resolver.current = resolve;
    setRequest(next);
  });
  const close = (reason: string | null) => {
    resolver.current?.(reason);
    resolver.current = null;
    setRequest(null);
  };
  return { askReason, dialog: request && <ReviewDialog request={request} onClose={close} /> };
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
    <section className="space-y-5">
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
  const { result, loading, loadError, replace } = usePaged(() => api.admin.listVendors({ status: status || undefined, page }), [status, page]);
  const { busyId, error, run } = useAction();

  const decide = async (vendor: AdminVendor, decision: 'approved' | 'rejected' | 'suspended') => {
    const action = decision === 'approved' ? 'Approve' : decision === 'rejected' ? 'Reject' : 'Suspend';
    const notes = await askReason({ title: `${action} ${vendor.name}`, confirmLabel: `${action} vendor`, destructive: decision !== 'approved', description: decision === 'approved' ? 'Add an approval note to complete your review.' : 'Explain your decision. This note will be shared with the vendor.' });
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
      {dialog}
    </Panel>
  );
}

function ListingsPanel() {
  const { askReason, dialog } = useReviewDialog();
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

  const decide = async (listing: VendorListing, decision: 'published' | 'rejected') => {
    const notes = await askReason({ title: `${decision === 'published' ? 'Publish' : 'Reject'} ${listing.title}`, confirmLabel: decision === 'published' ? 'Publish listing' : 'Reject listing', destructive: decision === 'rejected', description: decision === 'published' ? 'Add an approval note before publishing this property.' : 'Explain your decision. This note will be shared with the vendor.' });
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
      {dialog}
    </Panel>
  );
}

function UsersPanel({ roles }: { roles: string[] }) {
  const { askReason, dialog } = useReviewDialog();
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [staff, setStaff] = useState({ name: '', email: '', role: 'support_agent' as 'support_agent' | 'admin' });
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
            {['customer', 'vendor_owner', 'vendor_staff', 'support_agent', 'admin'].map((value) => <option key={value} value={value}>{roleLabel(value)}</option>)}
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
          const created = await api.admin.createStaff(staff);
          setNotice(created.invitationSent
            ? 'Account created. A password setup link has been emailed to the recipient.'
            : 'Account created, but email delivery failed. Use Resend setup link below.');
          setStaff({ name: '', email: '', role: 'support_agent' });
          setRevision((value) => value + 1);
        });
      }}>
        <h3 className="font-semibold sm:col-span-3">Invite an employee{roles.includes('admin') ? ' or administrator' : ''}</h3>
        <label className="text-xs font-semibold">Full name<input required minLength={2} maxLength={120} className={`${selectClass} mt-1 w-full`} value={staff.name} onChange={(event) => setStaff({ ...staff, name: event.target.value })} /></label>
        <label className="text-xs font-semibold">Email<input type="email" required className={`${selectClass} mt-1 w-full`} value={staff.email} onChange={(event) => setStaff({ ...staff, email: event.target.value })} /></label>
        <label className="text-xs font-semibold">Access level<select className={`${selectClass} mt-1 w-full`} value={staff.role} onChange={(event) => setStaff({ ...staff, role: event.target.value as typeof staff.role })}>
          <option value="support_agent">Employee — reservations</option>
          {roles.includes('admin') && <option value="admin">Platform Admin</option>}
        </select></label>
        <button disabled={busyId !== null} className={`${primaryButton} sm:col-span-3`}>Create account and send setup link</button>
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
            {user.status === 'active' && user.roles.some((value) => ['support_agent', 'admin'].includes(value)) && <button type="button" className={secondaryButton} disabled={busyId !== null} onClick={() => run(user.id, async () => {
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

const sectionDetails: Record<Tab, { title: string; description: string }> = {
  vendors: { title: 'Partner reviews', description: 'Review vendor applications, verify documents and manage partner access.' },
  listings: { title: 'Property moderation', description: 'Review submitted properties before they appear on the platform.' },
  users: { title: 'People & access', description: 'Manage customer accounts, invite staff and control platform access.' },
  bookings: { title: 'Reservation operations', description: 'Oversee reservations across all partners and assist guests with their stays.' },
  security: { title: 'Account security', description: 'Manage your password, active sessions and two-factor authentication.' },
};

export default function AdminDashboard({ roles, userName = 'Staff member', userEmail = '', onSignOut }: {
  roles: string[]; userName?: string; userEmail?: string; onSignOut: () => Promise<void>;
}) {
  const allowed = tabs.filter((tab) => tabRoles[tab.id].some((role) => roles.includes(role)));
  const [tab, setTab] = useState<Tab | undefined>(allowed[0]?.id);
  const [signingOut, setSigningOut] = useState(false);
  const { askReason, dialog } = useReviewDialog();
  const selected = allowed.find((item) => item.id === tab)?.id ?? allowed[0]?.id;
  const isAdmin = roles.some((role) => ['admin'].includes(role));
  const roleName = isAdmin ? 'Platform Admin' : 'Platform Employee';
  const navigate = (next: Tab) => { setTab(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const signOut = async () => { setSigningOut(true); try { await onSignOut(); } finally { setSigningOut(false); } };

  if (!selected) return <main className="p-8"><h1 className="text-xl font-bold">Staff access required</h1></main>;
  const section = sectionDetails[selected];
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">Skip to workspace</a>
      <aside className="hidden min-h-dvh flex-col border-r border-slate-800 bg-slate-950 text-slate-300 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-7"><span className="flex size-10 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300"><ShieldCheck className="size-6" /></span><div><p className="text-lg font-bold tracking-tight text-white">GBBookings<span className="text-teal-300">.</span></p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Control center</p></div></div>
        <div className="px-6 pb-3 pt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{isAdmin ? 'Platform management' : 'Operations'}</div>
        <nav className="space-y-1 px-3" aria-label="Admin sections">{allowed.map(({ id, label: text, icon: Icon }) => <button key={id} type="button" onClick={() => navigate(id)} aria-current={selected === id ? 'page' : undefined} className={
          'flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-medium transition ' + (selected === id ? 'bg-teal-400/10 text-teal-300 ring-1 ring-inset ring-teal-400/20' : 'text-slate-400 hover:bg-white/5 hover:text-white')
        }><Icon className="size-5 shrink-0" /><span className="flex-1">{text}</span>{selected === id && <ChevronRight className="size-4" />}</button>)}</nav>
        <div className="mt-auto space-y-4 p-5"><div className="rounded-xl border border-white/10 bg-white/5 p-4"><ShieldCheck className="mb-3 size-5 text-teal-300" /><p className="text-xs font-semibold text-slate-200">Staff workspace</p><p className="mt-2 text-xs leading-5 text-slate-400">Manage the platform with access tailored to your role.</p></div><button type="button" onClick={signOut} disabled={signingOut} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"><LogOut className="size-4" />{signingOut ? 'Signing out…' : 'Sign out'}</button></div>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-8"><div><p className="text-sm font-bold text-slate-900 lg:hidden">GBBookings · Control center</p><div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex"><span>{isAdmin ? 'Administration' : 'Operations'}</span><ChevronRight className="size-3" /><span className="font-medium text-slate-900">{tabs.find(item => item.id === selected)?.label}</span></div><p className="mt-1 text-xs text-slate-500 lg:hidden">{roleName}</p></div><div className="flex min-w-0 items-center gap-3"><span className="hidden rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 xl:inline-flex">{roleName}</span><div className="hidden min-w-0 text-right sm:block"><p className="max-w-48 truncate text-sm font-semibold text-slate-900">{userName}</p><p className="max-w-48 truncate text-xs text-slate-500">{userEmail}</p></div><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700" aria-hidden="true">{userName.charAt(0).toUpperCase()}</span><button type="button" onClick={signOut} disabled={signingOut} aria-label="Sign out" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 lg:hidden"><LogOut className="size-4" /></button></div></div>
          <nav aria-label="Admin sections" className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">{allowed.map(({ id, label: text, icon: Icon }) => <button key={id} type="button" onClick={() => navigate(id)} aria-current={selected === id ? 'page' : undefined} className={'flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold ' + (selected === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600')}><Icon className="size-4" />{text}</button>)}</nav>
        </header>
        <main id="admin-content" className="mx-auto max-w-[1440px] space-y-6 p-4 sm:p-8 xl:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700">{isAdmin ? 'Platform administration' : 'Reservations workspace'}</p><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{section.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{section.description}</p></div><span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"><ShieldCheck className="size-4 text-teal-700" />{isAdmin ? 'Platform staff' : 'Reservations access'}</span></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            {selected === 'vendors' && <VendorsPanel />}
            {selected === 'listings' && <ListingsPanel />}
            {selected === 'users' && <UsersPanel roles={roles} />}
            {selected === 'bookings' && <VendorReservations source={adminBookings} title="All bookings" requestCancellationReason={(booking) => askReason({ title: 'Cancel reservation', confirmLabel: 'Cancel reservation', destructive: true, description: `Explain why you are cancelling ${booking.reference ?? booking.id}. This note will be shared with the guest.` })} />}
            {selected === 'security' && <SecurityPanel />}
          </div>
          <p className="flex items-center gap-2 text-xs text-slate-400"><ArrowUpRight className="size-3" />GBBookings platform operations</p>
        </main>
      </div>
      {dialog}
    </div>
  );
}
