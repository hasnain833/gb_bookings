import { useEffect, useRef, useState } from 'react';
import { Building2, CalendarDays, ChevronDown, MessageSquare, Compass, Globe, HelpCircle, LogOut, Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import { useLanguage } from '../../app/LanguageContext';
import GBLogo from './GBLogo';
import { api } from '../api/api';
import { onMessage } from '../api/realtime';

interface NavbarProps {
  currentView: string; setView: (view: string) => void; userEmail: string; userName?: string;
  isLoggedIn: boolean; isStaff?: boolean; isPartner?: boolean;
  onOpenNotifications: () => void; onOpenAuthModal: (mode?: 'signin' | 'register') => void;
  onSignOut: () => void | Promise<void>;
}
export default function Navbar({ currentView, setView, userName, userEmail, isLoggedIn, isStaff = false, isPartner = false, onOpenAuthModal, onSignOut }: NavbarProps) {
  const { language, requestLanguageChange, isRtl } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [unread, setUnread] = useState(0);
  const header = useRef<HTMLElement>(null);
  // Refreshed on navigation (so it clears after reading the inbox), on pushed messages, when the inbox opens a thread, and every minute where there is no socket.
  useEffect(() => {
    if (!isLoggedIn || isStaff) { setUnread(0); return; }
    const refresh = () => api.unreadMessages().then((counts) => setUnread(counts.guest + counts.partner)).catch(() => undefined);
    void refresh();
    const timer = window.setInterval(refresh, 60_000);
    const stop = onMessage(() => void refresh());
    window.addEventListener('gb:messages-read', refresh);
    return () => { window.clearInterval(timer); stop(); window.removeEventListener('gb:messages-read', refresh); };
  }, [isLoggedIn, isStaff, currentView]);
  const unreadLabel = unread > 9 ? '9+' : String(unread);
  const displayName = userName || userEmail.split('@')[0] || 'My account';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const links = [
    { id: 'hotels', label: isRtl ? 'ہوٹلز' : 'Hotels' },
    { id: 'homestays', label: isRtl ? 'ہوم اسٹیز' : 'Homestays' },
    { id: 'cars', label: isRtl ? 'گاڑیاں' : 'Cars' },
    { id: 'tours', label: isRtl ? 'ٹورز' : 'Tours' },
  ];
  const extraLinks = [
    { id: 'destinations', label: 'Destinations', icon: Compass },
    { id: 'offers', label: 'Offers', icon: Building2 },
    { id: 'support', label: 'Help & support', icon: HelpCircle },
  ];
  // Approved partners go to their dashboard; everyone else (including signed-out visitors) to the partner page.
  const partnerLink = isPartner ? { view: 'vendor-dashboard', label: 'Partner dashboard' } : { view: 'become-partner', label: 'Become a partner' };
  const navigate = (view: string) => { setMobileOpen(false); setAccountOpen(false); setMoreOpen(false); setView(view); };
  useEffect(() => { setMobileOpen(false); setAccountOpen(false); setMoreOpen(false); setError(''); }, [currentView, isLoggedIn]);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) { setMobileOpen(false); setAccountOpen(false); setMoreOpen(false); }
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileOpen(false); setAccountOpen(false); setMoreOpen(false); }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeEscape); };
  }, []);
  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true); setError('');
    try { await onSignOut(); }
    catch { setError('We couldn’t sign you out. Please try again.'); }
    finally { setSigningOut(false); }
  };

  return <header ref={header} id="app-navbar" className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
    <div className="hidden border-b border-emerald-900/10 bg-[#063d2b] text-emerald-50 sm:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[11px] sm:px-6 lg:px-8">
        <p className="flex items-center gap-2"><ShieldCheck className="size-3.5" /><span>Verified local partners · Free cancellation before check-in</span></p>
        <div className="flex shrink-0 items-center gap-4"><button type="button" onClick={() => navigate('support')} className="hover:text-white">Help & support</button><span className="text-emerald-200">PKR</span><label className="flex items-center gap-1.5"><Globe className="size-3.5" /><span className="sr-only">Language</span><select aria-label="Language" value={language} onChange={(event) => requestLanguageChange(event.target.value as 'en' | 'ur')} className="cursor-pointer bg-transparent text-[11px] outline-none"><option value="en" className="text-slate-900">English</option><option value="ur" className="text-slate-900">اردو</option></select></label></div>
      </div>
    </div>
    <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:min-h-20 sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate('explore')} aria-label="GBBookings home" className="shrink-0"><GBLogo size="sm" showText={false} className="sm:hidden" /><GBLogo size="md" className="hidden sm:inline-flex" /></button>
      <nav aria-label="Main navigation" className="hidden items-center gap-1 xl:flex">
        {links.map((link) => <button type="button" key={link.id} onClick={() => navigate(link.id)} aria-current={currentView === link.id ? 'page' : undefined} className={'min-h-11 rounded-lg px-3 text-sm font-medium transition ' + (currentView === link.id ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')}>{link.label}</button>)}
        <div className="relative"><button type="button" aria-expanded={moreOpen} aria-controls="nav-more" onClick={() => { setMoreOpen(!moreOpen); setAccountOpen(false); }} className="flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">Explore<ChevronDown className="size-3.5" /></button>{moreOpen && <div id="nav-more" className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">{extraLinks.map((link) => <button key={link.id} type="button" onClick={() => navigate(link.id)} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-slate-600 hover:bg-slate-50"><link.icon className="size-4 text-slate-400" />{link.label}</button>)}</div>}</div>
      </nav>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {isLoggedIn ? <>
          <div className="relative"><button type="button" aria-expanded={accountOpen} aria-controls="nav-account" onClick={() => { setAccountOpen(!accountOpen); setMoreOpen(false); }} className="flex min-h-11 items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2.5 hover:border-emerald-300"><span className="relative flex size-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800">{initials}{unread > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unreadLabel}</span>}</span><span className="hidden max-w-28 truncate text-sm font-medium text-slate-700 lg:block">{displayName.split(' ')[0]}</span><ChevronDown className="size-3.5 text-slate-400" /><span className="sr-only">Account menu{unread > 0 ? `, ${unread} unread messages` : ''}</span></button>
            {accountOpen && <div id="nav-account" className="absolute -right-12 top-full mt-3 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg sm:right-0"><div className="border-b border-slate-100 px-3 py-3"><p className="truncate text-sm font-semibold text-slate-900">{displayName}</p><p className="mt-1 truncate text-xs text-slate-500">{userEmail}</p></div>{isStaff ? <button type="button" onClick={() => navigate('admin-dashboard')} className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-slate-700 hover:bg-slate-50"><UserRound className="size-4 text-slate-400" />Admin workspace</button> : <><button type="button" onClick={() => navigate('bookings')} className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-slate-700 hover:bg-slate-50"><CalendarDays className="size-4 text-slate-400" />My bookings</button><button type="button" onClick={() => navigate('inbox')} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-slate-700 hover:bg-slate-50"><MessageSquare className="size-4 text-slate-400" />Messages{unread > 0 && <span className="ml-auto rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">{unreadLabel}</span>}</button><button type="button" onClick={() => navigate('profile')} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-slate-700 hover:bg-slate-50"><UserRound className="size-4 text-slate-400" />Profile</button></>}{isPartner && !isStaff && <button type="button" onClick={() => navigate('vendor-dashboard')} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-slate-700 hover:bg-slate-50"><Building2 className="size-4 text-slate-400" />Partner dashboard</button>}<button type="button" onClick={() => void signOut()} disabled={signingOut} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50"><LogOut className="size-4" />{signingOut ? 'Signing out…' : 'Sign out'}</button>{error && <p role="alert" className="px-3 py-2 text-xs leading-5 text-rose-700">{error}</p>}</div>}
          </div>
          {!isStaff && <button type="button" onClick={() => navigate(partnerLink.view)} aria-current={currentView === partnerLink.view ? 'page' : undefined} className="hidden min-h-11 items-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white hover:bg-[#005c32] sm:inline-flex"><Building2 className="size-4" />{partnerLink.label}</button>}
        </> : <><button type="button" onClick={() => navigate('become-partner')} aria-current={currentView === 'become-partner' ? 'page' : undefined} className="hidden min-h-11 rounded-lg px-3 text-sm font-medium text-slate-600 hover:text-emerald-800 lg:inline-flex lg:items-center">Become a partner</button><button type="button" onClick={() => onOpenAuthModal('signin')} className="min-h-11 rounded-lg px-2 text-sm font-medium text-slate-600 hover:text-emerald-800 sm:px-3">Sign in</button><button type="button" onClick={() => onOpenAuthModal('register')} className="min-h-11 rounded-lg bg-[#006F3C] px-3 text-sm font-semibold text-white hover:bg-[#005c32] sm:px-4">Register</button></>}
        <button type="button" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="nav-mobile" onClick={() => { setMobileOpen(!mobileOpen); setAccountOpen(false); }} className="flex size-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 xl:hidden">{mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
      </div>
    </div>
    {mobileOpen && <nav id="nav-mobile" aria-label="Mobile navigation" className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 xl:hidden"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-1">{[...links, ...extraLinks].map((link) => <button key={link.id} type="button" onClick={() => navigate(link.id)} className={'min-h-11 rounded-lg px-3 text-left text-sm font-medium ' + (currentView === link.id ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50')}>{link.label}</button>)}{!isStaff && <button type="button" onClick={() => navigate(partnerLink.view)} className="min-h-11 rounded-lg px-3 text-left text-sm font-semibold text-emerald-800">{partnerLink.label}</button>}</div><div className="mt-3 flex items-center gap-3 border-t border-slate-100 px-3 pt-3 text-xs text-slate-500"><span>PKR</span><label className="flex items-center gap-2"><Globe className="size-3.5" /><select aria-label="Mobile language" value={language} onChange={(event) => requestLanguageChange(event.target.value as 'en' | 'ur')} className="min-h-9 bg-transparent"><option value="en">English</option><option value="ur">اردو</option></select></label></div></nav>}
  </header>;
}
