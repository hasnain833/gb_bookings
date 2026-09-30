import { useState, useEffect } from 'react';
import { Listing, Review, handleImageError } from '../../types';
import { useLanguage, tListing, tReview } from '../../app/LanguageContext';
import { DetailsSkeleton } from '../../shared/components/SkeletonLoader';
import { api } from '../../shared/api/api';
import RoomBookingPanel from '../booking/RoomBookingPanel';
import type { CheckoutParams } from '../booking/CheckoutFlow';
import { ArrowLeft, ArrowRight, Star, MapPin, Heart, Share2, Check, Clock, Info } from 'lucide-react';

interface ListingDetailsProps {
  listingId: string;
  onBack: () => void;
  onProceedToCheckout: (bookingParams: CheckoutParams) => void;
}

export default function ListingDetails({ listingId, onBack, onProceedToCheckout }: ListingDetailsProps) {
  const { isRtl } = useLanguage();
  const [rawListing, setRawListing] = useState<Listing | null>(null);
  const [rawReviews, setRawReviews] = useState<Review[]>([]);
  const listing = rawListing ? tListing(rawListing, isRtl) : null;
  const reviews = rawReviews.map(r => tReview(r, isRtl));
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [isWishlist, setIsWishlist] = useState(false);
  const [shareNote, setShareNote] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getListing(listingId)
      .then((data) => {
        if (!active) return;
        setRawListing(data);
        setRawReviews((data.reviews || []) as Review[]);
        setActiveImage(data.images?.[0] ?? data.image);
      })
      .catch((err) => console.error('Error fetching listing details:', err))
      .finally(() => active && setLoading(false));
    api.getWishlist()
      .then((wishlist) => active && setIsWishlist(wishlist.some((item) => item.id === listingId)))
      .catch(() => active && setIsWishlist(false));
    return () => {
      active = false;
    };
  }, [listingId]);

  const handleToggleWishlist = async () => {
    try {
      if (isWishlist) {
        await api.removeWishlistItem(listingId);
        setIsWishlist(false);
      } else {
        await api.addWishlistItem(listingId);
        setIsWishlist(true);
      }
    } catch (reason) {
      console.error(reason);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8" id="listing-details-loading">
        <DetailsSkeleton />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4" id="listing-details-notfound">
        <h4 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Listing not found.</h4>
        <button onClick={onBack} className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold px-6 py-2 rounded-xl text-xs uppercase tracking-wider">Back to Explore</button>
      </div>
    );
  }

  const bookable = listing.type === 'hotel' || listing.type === 'homestay';
  const unit = bookable ? 'night' : listing.type === 'car' ? 'day' : 'person';
  const specs = listing.hotelSpecs;
  // Only rules the vendor actually entered are shown.
  const rules = [
    ...(specs?.checkInTime ? [`Check-in from ${specs.checkInTime}`] : []),
    ...(specs?.checkOutTime ? [`Check-out by ${specs.checkOutTime}`] : []),
    ...(listing.homestaySpecs?.houseRules ?? specs?.policies ?? []),
  ];
  const facilities = specs?.facilities ?? [];
  const hostName = listing.homestaySpecs?.hostName;

  return (
    <div id="listing-details-view" className="space-y-8 animate-fadeIn max-w-7xl mx-auto">

      {/* Top action header */}
      <div className="flex items-center justify-between" id="listing-details-header">
        <button 
          id="btn-back-to-listings"
          onClick={onBack} 
          className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> <span>Back to listings search</span>
        </button>

        <div className="flex space-x-3">
          <button 
            id="btn-wishlist-toggle"
            onClick={handleToggleWishlist}
            className={`p-2.5 rounded-full border transition-all cursor-pointer ${
              isWishlist 
                ? 'bg-rose-50 border-rose-100 text-rose-600 shadow-xs' 
                : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:border-slate-300'
            }`}
          >
            <Heart className={`w-4.5 h-4.5 ${isWishlist ? 'fill-rose-500 stroke-none' : ''}`} />
          </button>
          <button 
            id="btn-share-listing"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
                .then(() => setShareNote('Link copied'))
                .catch(() => setShareNote('Copy failed'));
              setTimeout(() => setShareNote(''), 2500);
            }}
            className="p-2.5 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all cursor-pointer"
          >
            <Share2 className="w-4.5 h-4.5" />
          </button>
          {shareNote && <span role="status" className="self-center text-xs font-semibold text-slate-600">{shareNote}</span>}
        </div>
      </div>

      {/* Main Grid: Left details column, right booking sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8" id="details-cols-container">
        
        {/* Left Column (8 cols): Photo Gallery & Core Details */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8" id="details-content-column">
          
          {/* Header Metadata */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                {listing.type}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-950 uppercase tracking-tight leading-tight break-words">{listing.title}</h1>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center font-medium"><MapPin className="w-4 h-4 mr-1 text-rose-500 shrink-0" /> {listing.location}</p>
          </div>

          {/* Interactive Photo Gallery Component */}
          <div className="space-y-3" id="gallery-container">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative">
              <img 
                src={activeImage} 
                alt={listing.title} 
                className="w-full h-full object-cover rounded-2xl"
                referrerPolicy="no-referrer"
                onError={handleImageError}
              />
            </div>
            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none" id="gallery-thumbnails">
                {listing.images.map((img, i) => (
                  <button
                    key={i}
                    id={`thumb-btn-${i}`}
                    onClick={() => setActiveImage(img)}
                    className={`relative rounded-xl overflow-hidden w-24 aspect-[4/3] border-2 transition-all cursor-pointer shrink-0 ${
                      activeImage === img ? 'border-indigo-600 scale-103 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" onError={handleImageError} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Description */}
          <section className="space-y-3" id="details-description">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">About the {listing.type === 'hotel' || listing.type === 'homestay' ? 'Property' : listing.type === 'car' ? 'Vehicle' : 'Expedition'}</h3>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed font-normal">{listing.description}</p>
          </section>

          {/* Technical Specifications / Itinerary based on listing type */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4" id="details-specifications">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Specifications & Offerings
            </h3>

            {/* Hotel Specs */}
            {listing.type === 'hotel' && listing.hotelSpecs && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4" id="hotel-amenities-grid">
                {listing.hotelSpecs.amenities.map((item) => (
                  <div key={item} className="flex items-center space-x-2 text-slate-700 text-xs md:text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Homestay Specs */}
            {listing.type === 'homestay' && listing.homestaySpecs && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4" id="homestay-amenities-grid">
                {listing.homestaySpecs.amenities.map((item) => (
                  <div key={item} className="flex items-center space-x-2 text-slate-700 text-xs md:text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Car Specs */}
            {listing.type === 'car' && listing.carSpecs && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="car-specs-grid">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Category</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">{listing.carSpecs.category}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Gearbox</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">{listing.carSpecs.transmission}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Seats Capacity</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">{listing.carSpecs.seats} Passengers</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Fuel Type</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">{listing.carSpecs.fuelType}</span>
                </div>
              </div>
            )}

            {/* Tour Specs */}
            {listing.type === 'tour' && listing.tourSpecs && (
              <div className="space-y-6" id="tour-itinerary-component">
                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Duration</span>
                    <span className="text-sm font-bold text-indigo-600 mt-0.5 block">{listing.tourSpecs.durationDays} Days</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Difficulty</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block capitalize">{listing.tourSpecs.difficulty}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Group Capacity</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 block">Max {listing.tourSpecs.maxGroupSize} People</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Day-by-Day Expedition Itinerary</h4>
                  <div className="relative border-l border-indigo-200 pl-4 ml-2.5 space-y-6">
                    {listing.tourSpecs.itinerary.map((day) => (
                      <div key={day.day} className="relative" id={`itinerary-day-${day.day}`}>
                        {/* Dot marker */}
                        <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white" />
                        <h5 className="font-bold text-sm text-slate-800">Day {day.day}: {day.title}</h5>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{day.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {facilities.length > 0 && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4" id="facilities-section">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Facilities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs md:text-sm text-slate-700 font-medium">
                {facilities.map((item) => <p key={item} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> {item}</p>)}
              </div>
            </section>
          )}

          {rules.length > 0 && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4" id="house-rules-section">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{listing.type === 'homestay' ? 'House Rules' : 'Stay Rules & Policies'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm text-slate-600 font-medium">
                {rules.map((rule) => <p key={rule} className="flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-600 shrink-0" /> {rule}</p>)}
              </div>
            </section>
          )}

          {hostName && (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center gap-4" id="host-profile-card">
              <div className="w-14 h-14 bg-[#006F3C] rounded-xl flex items-center justify-center font-bold text-white text-xl shrink-0" aria-hidden="true">
                {hostName.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Hosted by</p>
                <h4 className="text-base font-extrabold text-slate-900">{hostName}</h4>
              </div>
            </section>
          )}

          <section className="space-y-6" id="details-reviews-block">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Guest Reviews</h3>
              {listing.reviewsCount > 0 && (
                <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-500 stroke-none" />
                  <span>{listing.rating} average</span>
                  <span className="text-slate-400 font-normal">({listing.reviewsCount} reviews)</span>
                </div>
              )}
            </div>
            {reviews.length === 0 && <p className="text-sm text-slate-500">No written reviews yet. Guests can review a stay after it is completed.</p>}
            <div className="space-y-4" id="reviews-list">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs" id={`review-item-${rev.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{rev.author}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{rev.createdAt}</p>
                    </div>
                    <div className="flex space-x-0.5 text-amber-500 font-mono text-xs">
                      {Array(rev.rating).fill(0).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-500 stroke-none" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-light">{rev.comment}</p>
                </div>
              ))}
            </div>

          </section>
        </div>

        {/* Right Column (4 cols): Live Booking Reservation Widget (Booking.com style) */}
        <div className="lg:col-span-4" id="details-booking-column">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 md:p-6 space-y-5 sm:space-y-6 sticky top-24 shadow-sm">
            <div>
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Prices start from</span>
              <div className="flex items-baseline flex-wrap gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">PKR {listing.price.toLocaleString()}</span>
                <span className="text-xs text-slate-500 font-medium">/{unit}</span>
              </div>
            </div>

            {bookable ? (
              <RoomBookingPanel listingId={listingId} onProceed={onProceedToCheckout} />
            ) : (
              <p className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600" id="booking-coming-soon">
                <Info className="w-4 h-4 text-[#006F3C] shrink-0 mt-0.5" />
                Online booking for {listing.type === 'car' ? 'vehicles' : 'tours'} is coming soon. Contact support to arrange this {listing.type === 'car' ? 'rental' : 'trip'}.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-Native Sticky Bottom Book Now Bar (Pinned above bottom tab navigation) */}
      <div 
        id="mobile-sticky-book-bar"
        className="lg:hidden fixed bottom-[68px] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-lg flex items-center justify-between gap-3"
      >
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-slate-900 font-mono">
              PKR {(listing.price || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">/ {unit}</span>
          </div>
          {listing.reviewsCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
              <span>★ {listing.rating}</span>
              <span className="text-slate-400">({listing.reviewsCount})</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            document.getElementById('details-booking-column')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="bg-[#006F3C] hover:bg-[#005C32] active:bg-[#004827] text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 app-tap"
        >
          <span>Book Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
