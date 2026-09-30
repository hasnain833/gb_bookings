import React, { lazy, Suspense, useState, useEffect } from 'react';
import Navbar from '../shared/components/Navbar';
import MobileAppBottomNav from '../shared/components/MobileAppBottomNav';
import { Booking, Listing } from '../types';
import type { CheckoutParams } from '../features/booking/CheckoutFlow';
import { useLanguage } from './LanguageContext';
import { api, AUTH_EXPIRED_EVENT } from '../shared/api/api';

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
const AdminDashboard = lazy(() => import('../features/admin/AdminDashboard'));
const AiPlanner = lazy(() => import('../features/planner/AiPlanner'));
const SupportCentre = lazy(() => import('../features/support/SupportCentre'));
const AuthModal = lazy(() => import('../features/auth/AuthModal'));
const AccountActionModal = lazy(() => import('../features/auth/AccountActionModal'));
const Footer = lazy(() => import('../shared/components/Footer'));
const MobileInstallPrompt = lazy(() => import('../shared/components/MobileInstallPrompt'));

// Views that need a signed-in user. Every navigation path (navbar, dashboards, deep flows) is gated at render time.
const PROTECTED_VIEWS = new Set(['user-dashboard', 'vendor-dashboard', 'admin-dashboard', 'checkout']);
const STAFF_ROLES = ['admin', 'super_admin', 'support_agent'];

export default function App() {
  const { t, isRtl } = useLanguage();
  const [view, setView] = useState<string>('explore'); // 'explore' (Homepage) | 'homestays' | 'hotels' | 'cars' | 'tours' | 'destinations' | 'offers' | 'search' | 'details' | 'checkout' | 'user-dashboard' | 'vendor-dashboard' | 'ai-planner' | 'support'
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  
  // Search parameters to carry from landing page search widget
  const [searchParams, setSearchParams] = useState({
    destination: 'Hunza Valley',
    dates: '',
    guests: 2,
    type: 'hotel' as 'hotel' | 'car' | 'tour' | 'homestay' | 'destination' | 'offer'
  });

  const [exploreTab, setExploreTab] = useState<'hotel' | 'homestay' | 'car' | 'tour'>('hotel');

  // Booking details passed to Checkout Flow
  const [bookingParams, setBookingParams] = useState<CheckoutParams | null>(null);
  // Set when reopening a past booking's receipt, so checkout never re-submits it.
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const isStaff = userRoles.some((role) => STAFF_ROLES.includes(role));
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');

  // Dynamic Navbar offset calculation to prevent fixed header overlap on all devices
  const [navbarHeight, setNavbarHeight] = useState<number>(120);

  useEffect(() => {
    let active = true;

    api.getCurrentUser()
      .then(({ user }) => {
        if (!active) return undefined;
        setUserEmail(user.email);
        setUserName(user.name);
        setUserRoles(user.roles ?? []);
        setIsLoggedIn(true);
        return api.getNotifications();
      })
      .then((notifications) => {
        if (active && notifications) {
          setNotificationsCount(notifications.filter((notification) => !notification.read).length);
        }
      })
      .catch(() => {
        if (active) setIsLoggedIn(false);
      })
      .finally(() => {
        if (active) setAuthChecked(true);
      });

    const handleAuthExpired = () => {
      setIsLoggedIn(false);
      setUserEmail('');
      setUserName('');
      setUserRoles([]);
      setNotificationsCount(0);
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

  useEffect(() => {
    const updateNavHeight = () => {
      const el = document.getElementById('app-navbar');
      if (el) {
        setNavbarHeight(el.offsetHeight);
      }
    };

    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);

    let ro: ResizeObserver | null = null;
    const el = document.getElementById('app-navbar');
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateNavHeight();
      });
      ro.observe(el);
    }

    return () => {
      window.removeEventListener('resize', updateNavHeight);
      if (ro) ro.disconnect();
    };
  }, []);

  const handleOpenAuthModal = (mode: 'signin' | 'register' = 'signin') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const handleSuccessLogin = (email: string, name?: string) => {
    const finalName = name || email.split('@')[0];
    setUserEmail(email);
    setUserName(finalName);
    setIsLoggedIn(true);
    // The auth modal only reports email/name; fetch roles so staff see the admin workspace link.
    api.getCurrentUser().then(({ user }) => setUserRoles(user.roles ?? [])).catch(() => setUserRoles([]));
    // Resume a protected view the user was sent to sign in for (e.g. checkout); otherwise open the dashboard.
    setView((current) => PROTECTED_VIEWS.has(current) ? current : 'user-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    try {
      await api.logout();
    } catch {
      // The client still clears an already-expired session.
    }
    setIsLoggedIn(false);
    setUserEmail('');
    setUserName('');
    setUserRoles([]);
    setNotificationsCount(0);
    setView('homestays');
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

  // Navigate to listing details helper
  const handleSelectListing = (listing: Listing) => {
    setSelectedListingId(listing.id);
    setSelectedListing(listing);
    setView('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Launch checkout flow helper
  const handleProceedToCheckout = (params: CheckoutParams) => {
    setReceiptBooking(null);
    setBookingParams(params);
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
    } else if (v === 'dashboard-user' || v === 'user-dashboard') {
      setView('user-dashboard');
    } else if (v === 'dashboard-vendor' || v === 'vendor-dashboard') {
      setView('vendor-dashboard');
    } else {
      setView(v);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#006F3C] selection:text-white overflow-x-hidden w-full relative">
      
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
        notificationsCount={notificationsCount}
        unreadNotifications={notificationsCount > 0}
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
          paddingTop: `calc(${navbarHeight + 14}px + env(safe-area-inset-top, 0px))`
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
              <div className="min-h-[30vh] animate-pulse rounded-lg bg-slate-100" aria-label="Checking your session" />
            )}
          </section>
        ) : (<>
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
              extra: { guestCount: searchParams.guests }
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
              setView('user-dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {view === 'user-dashboard' && (
          <UserDashboard 
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

        {view === 'vendor-dashboard' && (
          <VendorDashboard 
            setView={(v) => {
              setView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {view === 'admin-dashboard' && <AdminDashboard roles={userRoles} />}

        {view === 'ai-planner' && (
          <AiPlanner 
            setView={(v) => {
              setView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectListing={handleSelectListing}
          />
        )}

        {view === 'support' && (
          <SupportCentre />
        )}
        </>)}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <Footer onNavigate={handleNavigation} />

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
          onSuccessLogin={handleSuccessLogin}
        />

        <AccountActionModal />

        <MobileInstallPrompt />
      </Suspense>

      {/* Native-grade Mobile App Bottom Tab Navigation */}
      <MobileAppBottomNav 
        currentView={view}
        setView={handleNavigation}
        isLoggedIn={isLoggedIn}
        onOpenAuthModal={handleOpenAuthModal}
        unreadNotifications={notificationsCount > 0}
      />

    </div>
  );
}
