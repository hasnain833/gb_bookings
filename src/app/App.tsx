import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import Navbar from '../shared/components/Navbar';
import MobileAppBottomNav from '../shared/components/MobileAppBottomNav';
import { Booking, Listing } from '../types';
import type { CheckoutParams } from '../features/booking/CheckoutFlow';
import { api, AUTH_EXPIRED_EVENT, resetApiSession, markApiSession, type AuthUser } from '../shared/api/api';
import { OPEN_SIGN_IN_EVENT } from '../shared/hooks/useWishlist';

const ExploreSection = lazy(() => import('../features/catalog/ExploreSection'));
const ListingsSearch = lazy(() => import('../features/catalog/ListingsSearch'));
const HomestaysSection = lazy(() => import('../features/catalog/HomestaysSection'));
const HotelsSection = lazy(() => import('../features/catalog/HotelsSection'));
const CarsSection = lazy(() => import('../features/catalog/CarsSection'));
const ToursSection = lazy(() => import('../features/catalog/ToursSection'));
const OffersSection = lazy(() => import('../features/catalog/OffersSection'));
const DestinationsSection = lazy(() => import('../features/catalog/DestinationsSection'));
const ListingDetails = lazy(() => import('../features/catalog/ListingDetails'));
const CheckoutFlow = lazy(() => import('../features/booking/CheckoutFlow'));
const UserDashboard = lazy(() => import('../features/account/UserDashboard'));
const VendorDashboard = lazy(() => import('../features/vendor/VendorDashboard'));
const BecomePartner = lazy(() => import('../features/partner/BecomePartner'));
const AdminDashboard = lazy(() => import('../features/admin/AdminDashboard'));
const AiPlannerWidget = lazy(() => import('../features/planner/AiPlannerWidget'));
const LegalPage = lazy(() => import('../features/support/LegalPage'));
const SupportCentre = lazy(() => import('../features/support/SupportCentre'));
const AuthModal = lazy(() => import('../features/auth/AuthModal'));
const AccountActionModal = lazy(() => import('../features/auth/AccountActionModal'));
const Footer = lazy(() => import('../shared/components/Footer'));
const MobileInstallPrompt = lazy(() => import('../shared/components/MobileInstallPrompt'));

// Views that need a signed-in user. Every navigation path (navbar, dashboards, deep flows) is gated at render time.
const PROTECTED_VIEWS = new Set(['user-dashboard', 'vendor-dashboard', 'admin-dashboard', 'checkout']);
const STAFF_ROLES = ['admin'];
// Granted only when an admin approves the business; applicants are customers until then.
const VENDOR_ROLES = ['vendor_owner', 'vendor_staff'];

// Each role's home: staff → admin panel, vendors → host portal, everyone else → traveler dashboard.
const homeDashboard = (roles: string[]) =>
  roles.some((role) => STAFF_ROLES.includes(role)) ? 'admin-dashboard'
    : roles.some((role) => VENDOR_ROLES.includes(role)) ? 'vendor-dashboard'
    : 'user-dashboard';

// URL <-> view sync so refresh, deep links and the browser Back button work.
// ponytail: hand-rolled History API routing; move to a router library if routes need more params than a listing id.
const PATH_VIEWS = new Set(['homestays', 'hotels', 'cars', 'tours', 'destinations', 'offers', 'user-dashboard', 'vendor-dashboard', 'become-partner', 'admin-dashboard', 'ai-planner', 'support', 'terms', 'privacy']);
const SEARCH_TYPES = ['hotel', 'car', 'tour', 'homestay', 'destination', 'offer'] as const;
type SearchType = typeof SEARCH_TYPES[number];

// The chosen room, dates and guests survive a refresh of /listing/:id/checkout for this browser tab only.
const CHECKOUT_STORAGE_KEY = 'gb.checkout';
function savedCheckout(listingId: string): CheckoutParams | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CHECKOUT_STORAGE_KEY) ?? 'null');
    return saved?.listingId === listingId ? saved : null;
  } catch { return null; }
}
function saveCheckout(params: CheckoutParams | null) {
  try { if (params) sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(params)); else sessionStorage.removeItem(CHECKOUT_STORAGE_KEY); } catch { /* storage unavailable: refresh reopens the listing */ }
}

function readLocation() {
  const [, first = '', id, sub] = window.location.pathname.split('/');
  if (first === 'listing' && id) {
    const listingId = decodeURIComponent(id);
    return { view: sub === 'checkout' && savedCheckout(listingId) ? 'checkout' : 'details', listingId };
  }
  if (first === 'search') {
    const query = new URLSearchParams(window.location.search);
    const type = query.get('type') as SearchType;
    return { view: 'search', type: SEARCH_TYPES.includes(type) ? type : undefined, destination: query.get('destination') ?? undefined };
  }
  if (first === 'list-property') return { view: 'become-partner' }; // old links
  return { view: PATH_VIEWS.has(first) ? first : 'explore' };
}

function urlForView(view: string, listingId: string | null, search: { type: string; destination: string }) {
  if (view === 'details' && listingId) return `/listing/${encodeURIComponent(listingId)}`;
  if (view === 'checkout' && listingId) return `/listing/${encodeURIComponent(listingId)}/checkout`;
  if (view === 'search') return `/search?${new URLSearchParams({ type: search.type, destination: search.destination })}`;
  return PATH_VIEWS.has(view) ? `/${view}` : '/';
}

export default function App() {
  const [initialLocation] = useState(readLocation);
  const [view, setView] = useState<string>(initialLocation.view); // 'explore' (Homepage) | 'homestays' | 'hotels' | 'cars' | 'tours' | 'destinations' | 'offers' | 'search' | 'details' | 'checkout' | 'user-dashboard' | 'vendor-dashboard' | 'ai-planner' | 'support'
  const [selectedListingId, setSelectedListingId] = useState<string | null>(initialLocation.listingId ?? null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Search parameters to carry from landing page search widget
  const [searchParams, setSearchParams] = useState({
    destination: initialLocation.destination ?? 'Hunza Valley',
    dates: '',
    guests: 2,
    type: (initialLocation.type ?? 'hotel') as SearchType,
    experience: undefined as string | undefined,
  });

  // Push a history entry whenever the visible page changes; the first sync only normalizes the URL.
  const isFirstUrlSync = useRef(true);
  useEffect(() => {
    // Email actions must retain their token until the lazy action dialog reads it.
    if (/^\/(verify-email|reset-password)\/?$/.test(window.location.pathname)) return;
    const url = urlForView(view, selectedListingId, searchParams);
    if (url !== window.location.pathname + window.location.search) {
      window.history[isFirstUrlSync.current ? 'replaceState' : 'pushState'](null, '', url);
    }
    isFirstUrlSync.current = false;
  }, [view, selectedListingId, searchParams.type, searchParams.destination]);

  // Browser Back/Forward: restore the page from the URL.
  useEffect(() => {
    const handlePopState = () => {
      const next = readLocation();
      if (next.listingId) setSelectedListingId(next.listingId);
      if (next.view === 'checkout') setBookingParams((current) => current ?? savedCheckout(next.listingId!));
      if (next.view === 'search') {
        setSearchParams((prev) => ({ ...prev, type: next.type ?? prev.type, destination: next.destination ?? prev.destination }));
      }
      setView(next.view);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);


  // Booking details passed to Checkout Flow
  const [bookingParams, setBookingParams] = useState<CheckoutParams | null>(() => initialLocation.view === 'checkout' ? savedCheckout(initialLocation.listingId!) : null);
  // Set when reopening a past booking's receipt, so checkout never re-submits it.
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const accountGeneration = useRef(0);
  const logoutInFlight = useRef<Promise<unknown> | null>(null);
  const hasSession = useRef(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const isStaff = userRoles.some((role) => STAFF_ROLES.includes(role));
  const isVendor = userRoles.some((role) => VENDOR_ROLES.includes(role));
  useEffect(() => {
    if (isLoggedIn && isStaff && view !== 'admin-dashboard') setView('admin-dashboard');
  }, [isLoggedIn, isStaff, view]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');
  const [showPlanner, setShowPlanner] = useState(false);
  useEffect(() => {
    if (view === 'ai-planner') { setShowPlanner(true); setView('explore'); }
  }, [view]);

  useEffect(() => {
    let active = true;
    const generation = accountGeneration.current;

    api.getCurrentUser()
      .then(({ user }) => {
        if (!active || generation !== accountGeneration.current) return undefined;
        setUserId(user.id);
        hasSession.current = true;
        markApiSession();
        setAuthChecked(true);
        setUserEmail(user.email);
        setUserName(user.name);
        setUserRoles(user.roles ?? []);
        setIsLoggedIn(true);
      })
      .catch(() => {
        if (active && generation === accountGeneration.current) setIsLoggedIn(false);
      })
      .finally(() => {
        if (active && generation === accountGeneration.current) setAuthChecked(true);
      });

    const handleAuthExpired = () => {
      setAuthChecked(true);
      const wasSignedIn = hasSession.current;
      hasSession.current = false;
      accountGeneration.current += 1;
      resetApiSession();
      setUserId('');
      setIsLoggedIn(false);
      setUserEmail('');
      setUserName('');
      setUserRoles([]);
      setReceiptBooking(null); setBookingParams(null);
      if (wasSignedIn) setView('explore');
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      active = false;
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  const needsSignIn = authChecked && !isLoggedIn && PROTECTED_VIEWS.has(view);

  useEffect(() => {
    if (needsSignIn) {
      setAuthModalMode('signin');
      setShowAuthModal(true);
    }
  }, [needsSignIn]);

  const handleOpenAuthModal = async (mode: 'signin' | 'register' = 'signin') => {
    // Finish clearing the old cookies before allowing a different account to sign in.
    if (logoutInFlight.current) await logoutInFlight.current;
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const handleSuccessLogin = (user: AuthUser) => {
    accountGeneration.current += 1;
    resetApiSession();
    markApiSession();
    setUserId(user.id);
    hasSession.current = true;
    setUserEmail(user.email);
    setUserName(user.name);
    setUserRoles(user.roles ?? []);
    setAuthChecked(true);
    setIsLoggedIn(true);
    setView((current) => (user.roles ?? []).some((role) => STAFF_ROLES.includes(role)) ? 'admin-dashboard'
      : current === 'admin-dashboard' ? homeDashboard(user.roles ?? [])
        : current === 'vendor-dashboard' && !(user.roles ?? []).some((role) => VENDOR_ROLES.includes(role)) ? 'become-partner' : current);
  };

  const handleSignOut = async () => {
    if (logoutInFlight.current) { await logoutInFlight.current; return; }
    const destination = PROTECTED_VIEWS.has(view) ? '/' : window.location.href;
    const pending = api.logout().then(() => {
      accountGeneration.current += 1;
      resetApiSession();
      hasSession.current = false;
      setUserId(''); setIsLoggedIn(false); setUserEmail(''); setUserName(''); setUserRoles([]);
      setReceiptBooking(null); setBookingParams(null); setSelectedListing(null); setSelectedListingId(null);
      setShowAuthModal(false); setShowPlanner(false);
      window.location.replace(destination);
    }).finally(() => { if (logoutInFlight.current === pending) logoutInFlight.current = null; });
    logoutInFlight.current = pending;
    await pending;
  };

  useEffect(() => {
    const handleNavToType = (e: any) => {
      const { type, destination } = e.detail;
      setSearchParams(prev => ({ ...prev, type, destination }));
      setView('search');
    };
    window.addEventListener('nav-to-type', handleNavToType);
    return () => window.removeEventListener('nav-to-type', handleNavToType);
  }, []);

  // Pages ask for sign-in (e.g. saving to the wishlist while signed out).
  useEffect(() => {
    const openSignIn = () => handleOpenAuthModal('signin');
    window.addEventListener(OPEN_SIGN_IN_EVENT, openSignIn);
    return () => window.removeEventListener(OPEN_SIGN_IN_EVENT, openSignIn);
  }, []);

  // Navigate to listing details helper
  const handleSelectListing = (listing: Listing) => {
    setSelectedListingId(listing.id);
    setSelectedListing(listing);
    setView('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // A checkout restored after a refresh has its room and dates but not the listing yet.
  useEffect(() => {
    if (view !== 'checkout' || !bookingParams || selectedListing?.id === bookingParams.listingId) return;
    let active = true;
    api.getListing(bookingParams.listingId).then((listing) => active && setSelectedListing(listing)).catch(() => active && setView('details'));
    return () => { active = false; };
  }, [view, bookingParams, selectedListing?.id]);

  // Launch checkout flow helper
  const handleProceedToCheckout = (params: CheckoutParams) => {
    setReceiptBooking(null);
    setBookingParams(params);
    saveCheckout(params);
    setView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Trigger search from landing page
  const handleTriggerSearch = (params: any) => {
    setSearchParams(params);
    setView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigation = (v: string) => {
    if (v === 'hotels' || v === 'browse-hotels') {
      setView('hotels');
    } else if (v === 'homestays' || v === 'browse-homestays') {
      setView('homestays');
    } else if (v === 'cars' || v === 'browse-cars') {
      setView('cars');
    } else if (v === 'tours' || v === 'browse-tours' || v === 'packages') {
      setView('tours');
    } else if (v === 'destinations' || v === 'browse-destinations') {
      setView('destinations');
    } else if (v === 'offers' || v === 'browse-offers') {
      setView('offers');
    } else if (v === 'my-dashboard') {
      setView(homeDashboard(userRoles));
    } else if (v === 'dashboard-user' || v === 'user-dashboard') {
      setView('user-dashboard');
    } else if (v === 'dashboard-vendor' || v === 'vendor-dashboard') {
      setView(isVendor ? 'vendor-dashboard' : 'become-partner');
    } else {
      setView(v);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshAccount = () => {
    const generation = accountGeneration.current;
    api.getCurrentUser().then(({ user }) => { if (generation === accountGeneration.current) setUserRoles(user.roles ?? []); }).catch(() => {});
  };

  // Only approved partners have a dashboard; everyone else is sent to the partner page.
  const partnerDashboardBlocked = authChecked && isLoggedIn && view === 'vendor-dashboard' && !isVendor;
  useEffect(() => { if (partnerDashboardBlocked) setView('become-partner'); }, [partnerDashboardBlocked]);

  // Staff have a separate application shell, including on refresh and after session expiry.
  if (isStaff || (authChecked && view === 'admin-dashboard')) {
    return (
      <div className="min-h-dvh bg-slate-100 font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-950">
        <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm text-slate-500" role="status">Loading workspace…</div>}>
          {isLoggedIn && isStaff ? <AdminDashboard key={userId} roles={userRoles} userName={userName} userEmail={userEmail} onSignOut={handleSignOut} />
              : <main className="flex min-h-dvh items-center justify-center p-6"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">GBBookings · Administration</p>
                <h1 className="mt-5 text-2xl font-bold">{isLoggedIn ? 'Admin access required' : 'Sign in to your workspace'}</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">{isLoggedIn ? 'This area is reserved for platform administrators.' : 'Use your administrator account to continue.'}</p>
                <button type="button" onClick={isLoggedIn ? () => setView(homeDashboard(userRoles)) : () => handleOpenAuthModal('signin')} className="mt-6 min-h-11 w-full rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">{isLoggedIn ? 'Return to your dashboard' : 'Admin sign in'}</button>
              </section></main>}
          {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} initialMode={authModalMode} onSuccessLogin={handleSuccessLogin} />}
          <AccountActionModal />
        </Suspense>
      </div>
    );
  }

  if (authChecked && view === 'vendor-dashboard' && !partnerDashboardBlocked) {
    return (
      <div className="min-h-dvh bg-[#f4f6f8] font-sans text-slate-900">
        <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm text-slate-500" role="status">Loading partner dashboard…</div>}>
          {isLoggedIn && isVendor ? <VendorDashboard key={userId} setView={handleNavigation} userName={userName} userEmail={userEmail} onSignOut={handleSignOut} />
            : <main className="flex min-h-dvh items-center justify-center p-6"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">GBBookings partners</p>
              <h1 className="mt-5 text-2xl font-bold">Sign in to your partner dashboard</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">Use the account you registered your business with.</p>
              <button type="button" onClick={() => handleOpenAuthModal('signin')} className="mt-6 min-h-11 w-full rounded-lg bg-[#006F3C] px-5 text-sm font-semibold text-white">Sign in</button>
              <button type="button" onClick={() => handleNavigation('become-partner')} className="mt-3 min-h-11 w-full text-sm font-medium text-slate-600">Not a partner yet? Become a partner</button>
            </section></main>}
          {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} initialMode={authModalMode} onSuccessLogin={handleSuccessLogin} />}
          <AccountActionModal />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#006F3C] selection:text-white overflow-x-clip w-full relative">
      
      {/* Top Navigation Bar */}
      <Navbar 
        currentView={
          view === 'user-dashboard' ? 'dashboard-user' :
          view === 'vendor-dashboard' ? 'dashboard-vendor' :
          view === 'search' && searchParams.type === 'hotel' ? 'hotels' :
          view === 'search' && searchParams.type === 'homestay' ? 'homestays' :
          view === 'search' && searchParams.type === 'car' ? 'cars' :
          view === 'search' && searchParams.type === 'tour' ? 'tours' :
          view === 'search' && searchParams.type === 'destination' ? 'destinations' :
          view === 'search' && searchParams.type === 'offer' ? 'offers' :
          view
        } 
        setView={handleNavigation} 
        userEmail={userEmail}
        userName={userName}
        isLoggedIn={isLoggedIn}
        isStaff={isStaff}
        isPartner={isVendor}
        onOpenNotifications={() => {
          setView('user-dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuthModal={handleOpenAuthModal}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main 
        className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 min-w-0"
        style={{ 
          paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
          paddingTop: '1.5rem'
        }}
      >
        <Suspense fallback={<div className="min-h-[45vh] animate-pulse rounded-lg bg-slate-100" aria-label="Loading page" />}>
        {PROTECTED_VIEWS.has(view) && !isLoggedIn ? (
          <section className="mx-auto max-w-md py-16 text-center" aria-live="polite">
            {authChecked ? (
              <>
                <h1 className="text-xl font-bold">Sign in to continue</h1>
                <p className="mt-2 text-sm text-slate-600">You need an account to view this page.</p>
                <button
                  type="button"
                  onClick={() => handleOpenAuthModal('signin')}
                  className="mt-5 min-h-11 bg-[#006F3C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#005C32]"
                >
                  Sign in
                </button>
              </>
            ) : (
              <div className="min-h-[30vh] animate-pulse rounded-lg bg-slate-100" aria-label="Loading workspace" />
            )}
          </section>
        ) : (<>
        {(view === 'terms' || view === 'privacy') && <LegalPage policy={view} />}
        {view === 'explore' && (
          <ExploreSection 
            setView={handleNavigation}
            setSearchFilters={(filters) => {
              setSearchParams(prev => ({
                ...prev,
                destination: filters.destination !== undefined ? filters.destination : prev.destination,
                dates: filters.startDate !== undefined ? filters.startDate : prev.dates,
                guests: Number(filters.extra?.guestCount || prev.guests),
                type: filters.extra?.isHomestay ? 'homestay' : prev.type
              }));
            }}
            onSelectListing={handleSelectListing}
          />
        )}

        {view === 'homestays' && (
          <HomestaysSection 
            onSelectListing={handleSelectListing}
            onTriggerSearch={handleTriggerSearch}
          />
        )}

        {view === 'hotels' && (
          <HotelsSection 
            onSelectListing={handleSelectListing}
            onTriggerSearch={handleTriggerSearch}
          />
        )}

        {view === 'cars' && (
          <CarsSection 
            onSelectListing={handleSelectListing}
            onTriggerSearch={handleTriggerSearch}
          />
        )}

        {view === 'tours' && (
          <ToursSection 
            onSelectListing={handleSelectListing}
            onTriggerSearch={handleTriggerSearch}
          />
        )}

        {view === 'offers' && (
          <OffersSection 
            onSelectListing={handleSelectListing}
            onTriggerSearch={handleTriggerSearch}
          />
        )}

        {view === 'destinations' && (
          <DestinationsSection 
            onTriggerSearch={handleTriggerSearch}
            setView={handleNavigation}
          />
        )}

        {view === 'search' && (
          <ListingsSearch 
            type={searchParams.type}
            initialFilters={{
              destination: searchParams.destination,
              startDate: searchParams.dates,
              endDate: '',
              extra: { guestCount: searchParams.guests, experience: searchParams.experience, withDriver: (searchParams as { extra?: { withDriver?: boolean } }).extra?.withDriver }
            }}
            onSelectListing={handleSelectListing}
          />
        )}

        {view === 'details' && selectedListingId && (
          <ListingDetails 
            listingId={selectedListingId}
            onBack={() => setView('search')}
            onProceedToCheckout={handleProceedToCheckout}
          />
        )}

        {view === 'checkout' && bookingParams && selectedListing && (
          <CheckoutFlow 
            bookingParams={bookingParams}
            listing={selectedListing}
            userEmail={userEmail}
            userName={userName}
            existingBooking={receiptBooking ?? undefined}
            onCancel={() => setView(receiptBooking ? 'user-dashboard' : 'details')}
            onSuccess={() => {
              saveCheckout(null);
              setView('user-dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {view === 'user-dashboard' && (
          <UserDashboard key={userId}
            userEmail={userEmail}
            userName={userName}
            setView={(v) => {
               setView(v);
               window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectListing={handleSelectListing}
            onSelectBooking={(booking) => {
              // Open checkout invoice receipt page again
              const listingRef = {
                id: booking.listingId,
                title: booking.listingTitle,
                image: booking.listingImage,
                location: booking.listingLocation,
                price: booking.nightlyRate ?? booking.totalPrice,
                rating: 0,
                reviewsCount: 0,
                type: booking.listingType,
                description: '',
              } as Listing;
              setSelectedListing(listingRef);
              setBookingParams({
                listingId: booking.listingId,
                startDate: booking.startDate,
                endDate: booking.endDate,
                totalPrice: booking.totalPrice,
                guests: booking.guests || 2,
                duration: booking.duration ?? 1,
                withDriver: booking.withDriver
              });
              setReceiptBooking(booking);
              setView('checkout');
            }}
          />
        )}

        {view === 'support' && (
          <SupportCentre />
        )}

        {view === 'become-partner' && (
          <BecomePartner key={userId} isLoggedIn={isLoggedIn} isPartner={isVendor}
            onSignIn={() => handleOpenAuthModal('signin')}
            onOpenDashboard={() => { refreshAccount(); setView('vendor-dashboard'); }}
            onAccountChange={refreshAccount}
            onSupport={() => handleNavigation('support')} />
        )}
        </>)}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <Footer onNavigate={handleNavigation} />

        {showPlanner && <AiPlannerWidget onClose={() => setShowPlanner(false)} onNavigate={handleNavigation} onSelectListing={handleSelectListing} />}

        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            initialMode={authModalMode}
            onSuccessLogin={handleSuccessLogin}
          />
        )}

        <AccountActionModal />

        <MobileInstallPrompt />
      </Suspense>

      <button type="button" aria-label="Open AI trip planner" aria-haspopup="dialog" onClick={() => setShowPlanner(true)} className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-40 flex min-h-12 items-center gap-2 rounded-full bg-[#006F3C] px-4 text-sm font-semibold text-white shadow-lg hover:bg-[#005c32] sm:right-6 lg:bottom-6"><Sparkles className="size-5" /><span className="hidden sm:inline">AI Planner</span></button>

      {/* Native-grade Mobile App Bottom Tab Navigation */}
      <MobileAppBottomNav 
        currentView={view}
        setView={handleNavigation}
        isLoggedIn={isLoggedIn}
        onOpenAuthModal={handleOpenAuthModal}
      />

    </div>
  );
}
