import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ExploreSection from './components/ExploreSection';
import ListingsSearch from './components/ListingsSearch';
import ListingDetails from './components/ListingDetails';
import CheckoutFlow from './components/CheckoutFlow';
import UserDashboard from './components/UserDashboard';
import VendorDashboard from './components/VendorDashboard';
import AiPlanner from './components/AiPlanner';
import SupportCentre from './components/SupportCentre';
import { Listing, Booking } from './types';
import { useLanguage } from './LanguageContext';

export default function App() {
  const { t, isRtl } = useLanguage();
  const [view, setView] = useState<string>('explore'); // 'explore' | 'search' | 'details' | 'checkout' | 'user-dashboard' | 'vendor-dashboard' | 'ai-planner' | 'support'
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  
  // Search parameters to carry from landing page search widget
  const [searchParams, setSearchParams] = useState({
    destination: 'Hunza Valley',
    dates: '',
    guests: 2,
    type: 'hotel' as 'hotel' | 'car' | 'tour'
  });

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

  const [userEmail, setUserEmail] = useState('ibtesaam0@gmail.com');

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

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation Bar */}
      <Navbar 
        currentView={
          view === 'user-dashboard' ? 'dashboard-user' :
          view === 'vendor-dashboard' ? 'dashboard-vendor' :
          view === 'search' && searchParams.type === 'hotel' ? 'hotels' :
          view === 'search' && searchParams.type === 'car' ? 'cars' :
          view === 'search' && searchParams.type === 'tour' ? 'tours' :
          view
        } 
        setView={(v) => {
          if (v === 'hotels') {
            setSearchParams(prev => ({ ...prev, type: 'hotel', destination: '' }));
            setView('search');
          } else if (v === 'cars') {
            setSearchParams(prev => ({ ...prev, type: 'car', destination: '' }));
            setView('search');
          } else if (v === 'tours') {
            setSearchParams(prev => ({ ...prev, type: 'tour', destination: '' }));
            setView('search');
          } else if (v === 'dashboard-user') {
            setView('user-dashboard');
          } else if (v === 'dashboard-vendor') {
            setView('vendor-dashboard');
          } else {
            setView(v);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
        userEmail={userEmail}
        notificationsCount={2}
        unreadNotifications={true}
        onOpenNotifications={() => {
          setView('user-dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8 md:py-12">
        {view === 'explore' && (
          <ExploreSection 
            setView={(newView) => {
              // Map browse-hotels, browse-cars, browse-tours to search type
              if (newView === 'browse-hotels') {
                setSearchParams(prev => ({ ...prev, type: 'hotel' }));
                setView('search');
              } else if (newView === 'browse-cars') {
                setSearchParams(prev => ({ ...prev, type: 'car' }));
                setView('search');
              } else if (newView === 'browse-tours') {
                setSearchParams(prev => ({ ...prev, type: 'tour' }));
                setView('search');
              } else {
                setView(newView);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            setSearchFilters={(filters) => {
              setSearchParams({
                destination: filters.destination,
                dates: filters.startDate,
                guests: Number(filters.extra?.guestCount || 2),
                type: searchParams.type
              });
            }}
            onSelectListing={handleSelectListing}
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
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-slate-400 text-xs flex-shrink-0 mt-auto">
        <div className="w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 space-y-3">
          <div className="flex justify-center items-center gap-1.5">
            <div className="relative flex items-center justify-center w-8 h-6">
              <svg className="w-full h-full" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="24" r="14" fill="#F97316" />
                <path d="M22 70 L52 28 L72 70 Z" fill="#1E40AF" opacity="0.9" />
                <path d="M42 70 L72 16 L98 70 Z" fill="#15803D" />
              </svg>
            </div>
            <span className="font-extrabold tracking-tight text-[#0F172A] text-sm">
              <span className="text-[#15803D]">GB</span>Bookings<span className="text-[#F97316]">.com</span>
            </span>
          </div>
          <p className={`text-slate-500 font-medium ${isRtl ? 'font-urdu text-sm' : 'text-xs'}`}>
            {t('footer.description')}
          </p>
        </div>
      </footer>

    </div>
  );
}
