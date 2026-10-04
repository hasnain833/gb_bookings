import { useState, useEffect } from 'react';
import { Listing, Review, handleImageError } from '../../types';
import { useLanguage, tListing, tReview } from '../../app/LanguageContext';
import { DetailsSkeleton } from '../../shared/components/SkeletonLoader';
import { api, ApiError } from '../../shared/api/api';
import { OPEN_SIGN_IN_EVENT } from '../../shared/hooks/useWishlist';
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
      if (reason instanceof ApiError && reason.status === 401) window.dispatchEvent(new Event(OPEN_SIGN_IN_EVENT));
      else console.error(reason);
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
        <h1 className="text-xl font-bold text-slate-900">Listing not found</h1>
        <button onClick={onBack} className="rounded-lg bg-[#006F3C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#005C32]">Back to results</button>
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

  const sectionClass = 'border-t border-slate-200 pt-6 space-y-4';
  const headingClass = 'text-lg font-semibold text-slate-900';
  const statClass = 'rounded-lg border border-slate-200 bg-white p-3';
  const statLabel = 'block text-xs text-slate-500';
  const statValue = 'mt-0.5 block text-sm font-semibold text-slate-900';
  const amenities = listing.hotelSpecs?.amenities ?? listing.homestaySpecs?.amenities ?? [];

  return (
    <div id="listing-details-view" className="space-y-6 animate-fadeIn max-w-6xl mx-auto">

      <button
        id="btn-back-to-listings"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" /> Back to results
      </button>

      {/* Title row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" id="listing-details-header">
        <div className="space-y-1.5 min-w-0">
          <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium capitalize text-[#006F3C]">{listing.type}</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 leading-tight break-words">{listing.title}</h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {listing.location}</span>
            {listing.reviewsCount > 0 ? (
              <span className="inline-flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> <strong className="font-semibold text-slate-900">{listing.rating}</strong> ({listing.reviewsCount} reviews)</span>
            ) : (
              <span className="font-medium text-[#006F3C]">New listing</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {shareNote && <span role="status" className="text-xs font-medium text-slate-600">{shareNote}</span>}
          <button
            id="btn-share-listing"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
                .then(() => setShareNote('Link copied'))
                .catch(() => setShareNote('Copy failed'));
              setTimeout(() => setShareNote(''), 2500);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button
            id="btn-wishlist-toggle"
            onClick={handleToggleWishlist}
            aria-pressed={isWishlist}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Heart className={`w-4 h-4 ${isWishlist ? 'fill-rose-500 text-rose-500' : ''}`} /> {isWishlist ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="space-y-2" id="gallery-container">
        <div className="aspect-[16/9] max-h-[460px] w-full overflow-hidden rounded-xl bg-slate-100">
          <img src={activeImage} alt={listing.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleImageError} />
        </div>
        {listing.images && listing.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" id="gallery-thumbnails">
            {listing.images.map((img, i) => (
              <button
                key={i}
                id={`thumb-btn-${i}`}
                onClick={() => setActiveImage(img)}
                aria-label={`Show photo ${i + 1}`}
                className={`w-20 aspect-[4/3] shrink-0 overflow-hidden rounded-lg border-2 ${activeImage === img ? 'border-[#006F3C]' : 'border-transparent opacity-80 hover:opacity-100'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleImageError} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8" id="details-cols-container">

        {/* Details column */}
        <div className="space-y-6" id="details-content-column">
          <section className="space-y-2" id="details-description">
            <h2 className={headingClass}>About this {bookable ? 'place' : listing.type === 'car' ? 'vehicle' : 'trip'}</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">{listing.description}</p>
          </section>

          {amenities.length > 0 && (
            <section className={sectionClass} id="details-specifications">
              <h2 className={headingClass}>What this place offers</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-slate-700">
                {amenities.map((item) => <li key={item} className="flex items-center gap-2"><Check className="w-4 h-4 text-[#006F3C] shrink-0" /> {item}</li>)}
              </ul>
            </section>
          )}

          {listing.type === 'car' && listing.carSpecs && (
            <section className={sectionClass} id="car-specs-section">
              <h2 className={headingClass}>Vehicle details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3" id="car-specs-grid">
                <div className={statClass}><span className={statLabel}>Category</span><span className={statValue}>{listing.carSpecs.category}</span></div>
                <div className={statClass}><span className={statLabel}>Gearbox</span><span className={statValue}>{listing.carSpecs.transmission}</span></div>
                <div className={statClass}><span className={statLabel}>Seats</span><span className={statValue}>{listing.carSpecs.seats} passengers</span></div>
                <div className={statClass}><span className={statLabel}>Fuel</span><span className={statValue}>{listing.carSpecs.fuelType}</span></div>
              </div>
            </section>
          )}

          {listing.type === 'tour' && listing.tourSpecs && (
            <section className={sectionClass} id="tour-itinerary-component">
              <h2 className={headingClass}>Trip details</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className={statClass}><span className={statLabel}>Duration</span><span className={statValue}>{listing.tourSpecs.durationDays} days</span></div>
                <div className={statClass}><span className={statLabel}>Difficulty</span><span className={`${statValue} capitalize`}>{listing.tourSpecs.difficulty}</span></div>
                <div className={statClass}><span className={statLabel}>Group size</span><span className={statValue}>Up to {listing.tourSpecs.maxGroupSize}</span></div>
              </div>
              <h3 className="pt-2 text-sm font-semibold text-slate-900">Itinerary</h3>
              <ol className="relative ml-2 space-y-5 border-l border-slate-200 pl-5">
                {listing.tourSpecs.itinerary.map((day) => (
                  <li key={day.day} className="relative" id={`itinerary-day-${day.day}`}>
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#006F3C]" />
                    <p className="text-sm font-semibold text-slate-900">Day {day.day}: {day.title}</p>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">{day.desc}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {facilities.length > 0 && (
            <section className={sectionClass} id="facilities-section">
              <h2 className={headingClass}>Facilities</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-slate-700">
                {facilities.map((item) => <li key={item} className="flex items-center gap-2"><Check className="w-4 h-4 text-[#006F3C] shrink-0" /> {item}</li>)}
              </ul>
            </section>
          )}

          {rules.length > 0 && (
            <section className={sectionClass} id="house-rules-section">
              <h2 className={headingClass}>{listing.type === 'homestay' ? 'House rules' : 'Policies'}</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-slate-700">
                {rules.map((rule) => <li key={rule} className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400 shrink-0" /> {rule}</li>)}
              </ul>
            </section>
          )}

          {hostName && (
            <section className="border-t border-slate-200 pt-6 flex items-center gap-3" id="host-profile-card">
              <div className="w-11 h-11 rounded-full bg-[#006F3C] flex items-center justify-center text-sm font-semibold text-white shrink-0" aria-hidden="true">
                {hostName.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-slate-500">Hosted by</p>
                <p className="text-base font-semibold text-slate-900">{hostName}</p>
              </div>
            </section>
          )}

          <section className={sectionClass} id="details-reviews-block">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className={headingClass}>Guest reviews</h2>
              {listing.reviewsCount > 0 && (
                <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> <strong className="font-semibold text-slate-900">{listing.rating}</strong> · {listing.reviewsCount} reviews
                </span>
              )}
            </div>
            {reviews.length === 0 && <p className="text-sm text-slate-500">No written reviews yet. Guests can review a stay after it is completed.</p>}
            <div className="space-y-3" id="reviews-list">
              {reviews.map((rev) => (
                <div key={rev.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-1.5" id={`review-item-${rev.id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{rev.author} <span className="font-normal text-slate-400">· {rev.createdAt}</span></p>
                    <span className="flex gap-0.5" aria-label={`${rev.rating} out of 5`}>
                      {Array(rev.rating).fill(0).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Booking column */}
        <div id="details-booking-column">
          <div className="sticky top-40 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
            <p className="text-sm text-slate-500">
              From <span className="text-2xl font-bold text-slate-950">PKR {listing.price.toLocaleString()}</span> / {unit}
            </p>

            {bookable ? (
              <RoomBookingPanel listingId={listingId} onProceed={onProceedToCheckout} />
            ) : (
              <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-600" id="booking-coming-soon">
                <Info className="w-4 h-4 text-[#006F3C] shrink-0 mt-0.5" />
                Online booking for {listing.type === 'car' ? 'vehicles' : 'tours'} is coming soon. Contact support to arrange this {listing.type === 'car' ? 'rental' : 'trip'}.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile book bar (above the bottom tab navigation) */}
      <div
        id="mobile-sticky-book-bar"
        className="lg:hidden fixed bottom-[68px] left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-2.5 shadow-lg flex items-center justify-between gap-3"
      >
        <div>
          <p className="text-sm text-slate-600"><span className="text-base font-bold text-slate-950">PKR {(listing.price || 0).toLocaleString()}</span> / {unit}</p>
          {listing.reviewsCount > 0 && (
            <p className="flex items-center gap-1 text-xs text-slate-600"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {listing.rating} ({listing.reviewsCount})</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => document.getElementById('details-booking-column')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#006F3C] px-5 text-sm font-semibold text-white hover:bg-[#005C32]"
        >
          {bookable ? 'Check availability' : 'Details'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
