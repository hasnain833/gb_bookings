import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GBLogo from './components/GBLogo';
import ExploreSection from './components/ExploreSection';
import ListingsSearch from './components/ListingsSearch';
import HomestaysSection from './components/HomestaysSection';
import HotelsSection from './components/HotelsSection';
import CarsSection from './components/CarsSection';
import ToursSection from './components/ToursSection';
import OffersSection from './components/OffersSection';
import DestinationsSection from './components/DestinationsSection';
import ListingDetails from './components/ListingDetails';
import CheckoutFlow from './components/CheckoutFlow';
import UserDashboard from './components/UserDashboard';
import VendorDashboard from './components/VendorDashboard';
import AiPlanner from './components/AiPlanner';
import SupportCentre from './components/SupportCentre';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import { Listing, Booking } from './types';
import { useLanguage } from './LanguageContext';

export default function App() {
  const { t, isRtl } = useLanguage();
  const [view, setView] = useState<string>('homestays'); // 'explore' | 'homestays' | 'search' | 'details' | 'checkout' | 'user-dashboard' | 'vendor-dashboard' | 'ai-planner' | 'support'
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
  const [bookingParams, setBookingParams] = useState<{
    listingId: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    guests: number;
    duration: number;
    withDriver?: boolean;
  } | null>(null);

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userEmail, setUserEmail] = useState('ibtesaam0@gmail.com');
  const [userName, setUserName] = useState('Ibtesaam Raza');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');

  const handleOpenAuthModal = (mode: 'signin' | 'register' = 'signin') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const handleSuccessLogin = (email: string, name?: string) => {
    setUserEmail(email);
    if (name) setUserName(name);
    setIsLoggedIn(true);
    setView('user-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setUserName('');
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
  const handleProceedToCheckout = (params: any) => {
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
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
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
        notificationsCount={2}
        unreadNotifications={true}
        onOpenNotifications={() => {
          setView('user-dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuthModal={handleOpenAuthModal}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-28 pb-8 md:pb-12">
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
            onCancel={() => setView('details')}
            onSuccess={(booking) => {
              setView('user-dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {view === 'user-dashboard' && (
          <UserDashboard 
            userEmail={userEmail}
            setView={(v) => {
               setView(v);
               window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectListing={handleSelectListing}
            onSelectBooking={(booking) => {
              // Open checkout invoice receipt page again
              const listingRef = selectedListing || {
                id: booking.listingId,
                title: booking.listingTitle,
                image: booking.listingImage,
                location: booking.listingLocation,
                price: booking.totalPrice / booking.duration,
                rating: 5,
                reviewsCount: 1,
                type: booking.listingType,
                description: 'Secured alpine suite reservation.'
              } as Listing;
              setSelectedListing(listingRef);
              setBookingParams({
                listingId: booking.listingId,
                startDate: booking.startDate,
                endDate: booking.endDate,
                totalPrice: booking.totalPrice,
                guests: booking.guests || 2,
                duration: booking.duration,
                withDriver: booking.withDriver
              });
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
      </main>

      {/* Footer Details */}
      <Footer onNavigate={handleNavigation} />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        onSuccessLogin={handleSuccessLogin}
      />

    </div>
  );
}
