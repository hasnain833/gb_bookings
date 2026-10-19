import { ArrowLeft, BarChart3, Briefcase, Building2, CalendarCheck, ChevronRight, LayoutDashboard, LogOut, Plus, ShieldCheck, Star, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import GBLogo from '../../shared/components/GBLogo';

export type VendorTab = 'overview' | 'properties' | 'new-property' | 'reservations' | 'reviews' | 'reports' | 'team' | 'business' | 'security';

/** Areas the server grants this team member (GET /vendors/me → membership.access). */
export type MemberArea = 'listings' | 'reservations' | 'reports' | 'team' | 'business';
const TAB_AREA: Partial<Record<VendorTab, MemberArea>> = {
  overview: 'listings', properties: 'listings', 'new-property': 'listings', reservations: 'reservations', reviews: 'listings', reports: 'reports', team: 'team', business: 'business',
};
// Before the account loads, show the owner's layout; security is open to everyone.
export const canOpen = (access: MemberArea[] | undefined, tab: VendorTab) => !TAB_AREA[tab] || !access || access.includes(TAB_AREA[tab]!);

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'properties', label: 'Properties & rooms', icon: Building2 },
  { id: 'reservations', label: 'Reservations', icon: CalendarCheck },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'business', label: 'Business profile', icon: Briefcase },
  { id: 'security', label: 'Account security', icon: ShieldCheck },
] as const;

const titles = (word: string): Record<VendorTab, [string, string]> => ({
  overview: ['Partner dashboard', `Your ${word}s, rooms and reservations in one place.`],
  properties: [`${word.charAt(0).toUpperCase()}${word.slice(1)}s & rooms`, 'Manage your properties, room categories and publication reviews.'],
  'new-property': [`Add a ${word}`, 'Create a property draft, add its rooms, then submit it for admin approval.'],
  reservations: ['Reservations', 'Review guest requests and manage upcoming stays.'],
  reviews: ['Guest reviews', 'Read what guests say, reply publicly, or report a review that breaks the rules.'],
  reports: ['Reports', 'Occupancy and money per hotel for any dates.'],
  team: ['Team', 'Give managers and reception staff their own sign-in.'],
  business: ['Business profile', 'Your verified business details. Changes are approved by GBBookings before they apply.'],
  security: ['Account security', 'Manage email verification, your password and active sessions.'],
});

export default function VendorWorkspace({ tab, onTab, businessName, status, access, kind = 'hotel', userName, userEmail, onBrowse, onSignOut, hideHeading = false, children }: {
  tab: VendorTab; access?: MemberArea[]; kind?: 'hotel' | 'homestay'; hideHeading?: boolean; onTab: (tab: VendorTab) => void; businessName?: string;
  status?: string; userName: string; userEmail: string; onBrowse: () => void;
  onSignOut: () => Promise<void>; children: ReactNode;
}) {
  const word = kind === 'homestay' ? 'homestay' : 'hotel';
  const heading = titles(word)[tab];
  return (
    <div className="min-h-dvh bg-[#F5F6F2] font-jakarta text-slate-900 lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-5 py-6 lg:block">
          <button type="button" onClick={onBrowse} aria-label="Go to GBBookings"><GBLogo size="sm" /></button>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 lg:ml-9">Partner dashboard</p>
        </div>
        <div className="mx-4 hidden rounded-xl border border-slate-200 bg-slate-50 p-4 lg:block">
          <p className="truncate text-sm font-semibold">{businessName || `Your ${word} business`}</p>
          <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><span className={`size-2 rounded-full ${status === 'approved' ? 'bg-emerald-500' : 'bg-amber-400'}`} />{status === 'approved' ? `Verified ${word} partner` : status ?? 'Loading…'}</p>
        </div>
        <nav aria-label="Partner navigation" className="flex gap-1 overflow-x-auto px-3 py-3 lg:mt-4 lg:flex-col lg:overflow-visible">
          {navigation.filter((item) => canOpen(access, item.id)).map((item) => {
            const disabled = status !== undefined && status !== 'approved' && item.id !== 'overview' && item.id !== 'security' && item.id !== 'business';
            const selected = tab === item.id || (item.id === 'properties' && tab === 'new-property');
            return <button key={item.id} type="button" disabled={disabled} onClick={() => onTab(item.id)} title={disabled ? 'Unavailable while your partner account is not active' : undefined}
              aria-current={selected ? 'page' : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50'}`}>
              <item.icon className="size-4 shrink-0" />{item.id === 'properties' ? titles(word).properties[0] : item.label}
            </button>;
          })}
        </nav>
        <div className="mt-auto hidden space-y-2 border-t border-slate-100 p-4 lg:block">
          <button type="button" onClick={onBrowse} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-50"><ArrowLeft className="size-4" />Browse GBBookings</button>
          <button type="button" onClick={onSignOut} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-50"><LogOut className="size-4" />Sign out</button>
        </div>
      </aside>
      <div className="min-w-0 flex-1 lg:ml-64">
        <header className="flex min-h-20 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-8">
          <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm"><span>Partner dashboard</span><ChevronRight className="size-3" /><span className="font-medium text-slate-900">{tab === 'new-property' || tab === 'properties' ? heading[0] : navigation.find((item) => item.id === tab)?.label}</span></div>
          <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="max-w-48 truncate text-sm font-semibold">{userName}</p><p className="max-w-48 truncate text-xs text-slate-500">{userEmail}</p></div><span className="flex size-10 items-center justify-center rounded-full bg-emerald-50 font-semibold text-emerald-800">{userName.charAt(0).toUpperCase() || 'P'}</span><button type="button" onClick={onSignOut} aria-label="Sign out" className="rounded-lg border border-slate-200 p-3 text-slate-500 lg:hidden"><LogOut className="size-4" /></button></div>
        </header>
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-7 sm:px-8 sm:py-9">
          {!hideHeading && <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">GBBookings partners</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading[0]}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{heading[1]}</p></div>{status === 'approved' && tab !== 'new-property' && canOpen(access, 'new-property') && <button type="button" onClick={() => onTab('new-property')} className="flex min-h-11 items-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white hover:bg-[#005c32]"><Plus className="size-4" />Add {word}</button>}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}
