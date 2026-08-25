import React, { useState, useEffect, useRef } from 'react';
import { Listing, Review, handleImageError } from '../types';
import { useLanguage, tListing, tReview } from '../LanguageContext';
import { DetailsSkeleton } from './SkeletonLoader';
import { 
  ArrowLeft, Star, MapPin, Calendar, Users, ShieldCheck, Heart, Share2, 
  Sparkles, Send, MessageSquare, AlertCircle, Check, Shield, Tag, Gift, 
  HelpCircle, Sparkle, Info, X, ChevronRight, UserCheck
} from 'lucide-react';

interface ListingDetailsProps {
  listingId: string;
  onBack: () => void;
  onProceedToCheckout: (bookingParams: {
    listingId: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    guests: number;
    duration: number;
    withDriver?: boolean;
    upgradeOption?: string;
    cancellationPolicy?: string;
    payAtHotel?: boolean;
    appliedPromo?: string;
    discountAmount?: number;
  }) => void;
}

export default function ListingDetails({ listingId, onBack, onProceedToCheckout }: ListingDetailsProps) {
  const { language, t, isRtl } = useLanguage();
  const [rawListing, setRawListing] = useState<Listing | null>(null);
  const [rawReviews, setRawReviews] = useState<Review[]>([]);
  const listing = rawListing ? tListing(rawListing, isRtl) : null;
  const reviews = rawReviews.map(r => tReview(r, isRtl));
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');

  // Booking Card Inputs
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [withDriver, setWithDriver] = useState(false);
  const [isWishlist, setIsWishlist] = useState(false);

  // Booking.com / Oyo Features State
  const [upgradeOption, setUpgradeOption] = useState<'standard' | 'deluxe' | 'premium'>('standard');
  const [cancellationPolicy, setCancellationPolicy] = useState<'flexible' | 'nonRefundable'>('flexible');
  const [payAtHotel, setPayAtHotel] = useState<boolean>(false);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Airbnb Host Live Chat State
  const [showHostChat, setShowHostChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    id: string;
    sender: 'user' | 'host';
    text: string;
    time: string;
    authorName?: string;
  }>>([]);
  const [isHostTyping, setIsHostTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Review Form Inputs
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`);
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        setRawListing(data);
        setRawReviews(data.reviews || []);
        if (data.images && data.images.length > 0) {
          setActiveImage(data.images[0]);
        } else {
          setActiveImage(data.image);
        }
      }
    } catch (err) {
      console.error('Error fetching listing details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    
    // Check if item is in wishlist
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsWishlist(wishlist.includes(listingId));
  }, [listingId]);

  // Scroll to bottom of chat history when active
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isHostTyping, showHostChat]);

  // Duration Calculations
  const calculateDuration = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const duration = calculateDuration();

  // Pricing calculations incorporating upgrades, policies, and discounts
  const getUpgradeSurcharge = () => {
    if (!listing) return 0;
    if (upgradeOption === 'standard') return 0;
    
    if (listing.type === 'hotel' || listing.type === 'homestay') {
      return upgradeOption === 'deluxe' ? 7500 : 16000;
    } else if (listing.type === 'car') {
      return upgradeOption === 'deluxe' ? 4000 : 9000;
    } else { // tour
      return upgradeOption === 'deluxe' ? 6000 : 13500;
    }
  };

  const baseRatePerNight = listing ? listing.price : 0;
  const surchargePerUnit = getUpgradeSurcharge();
  
  // Base stay calculations
  let basePrice = (baseRatePerNight + surchargePerUnit) * duration;
  if (listing?.type === 'tour') {
    // Tours are typically per guest
    basePrice = (baseRatePerNight + surchargePerUnit) * duration * Math.max(1, guests / 2);
  }

  const driverCharge = withDriver ? 3000 * duration : 0;
  
  // Subtotal before cancellation policy discount
  const subtotalBeforePolicy = basePrice + driverCharge;
  
  // Non-refundable discount (8% off subtotal)
  const policyDiscount = cancellationPolicy === 'nonRefundable' ? Math.round(subtotalBeforePolicy * 0.08) : 0;
  const subtotalAfterPolicy = subtotalBeforePolicy - policyDiscount;
  
  // Promo Coupon Discount
  const couponDiscount = Math.round(subtotalAfterPolicy * (discountPercentage / 100));
  
  // Oyo Certified Stay / Sanitization fee (fixed at PKR 1,500)
  const sanitizationFee = listing?.type === 'hotel' ? 1500 : 0;
  
  // Regional Tourism Tax (5%)
  const regionalTax = Math.round(subtotalAfterPolicy * 0.05);
  
  // Grand Total calculation
  const totalPricing = subtotalAfterPolicy - couponDiscount + sanitizationFee + regionalTax;

  // Toggle Wishlist Handler
  const handleToggleWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    let updatedWishlist;
    if (wishlist.includes(listingId)) {
      updatedWishlist = wishlist.filter((id: string) => id !== listingId);
      setIsWishlist(false);
    } else {
      updatedWishlist = [...wishlist, listingId];
      setIsWishlist(true);
    }
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
  };

  // Chat message submission to host (Airbnb feature)
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !listing) return;

    const userMsgText = chatMessage.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message to state
    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text: userMsgText,
      time: timestamp
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsHostTyping(true);

    try {
      const res = await fetch('/api/host/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          message: userMsgText
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Delay response slightly to feel extremely natural/real
        setTimeout(() => {
          setIsHostTyping(false);
          setChatHistory(prev => [...prev, {
            id: `hst-${Date.now()}`,
            sender: 'host',
            text: data.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            authorName: data.authorName
          }]);
        }, 1200);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      console.error(err);
      setTimeout(() => {
        setIsHostTyping(false);
        const fallbackName = listing.type === 'car' ? 'Mr. Tariq Shah' : 'Karim Balti';
        setChatHistory(prev => [...prev, {
          id: `hst-err-${Date.now()}`,
          sender: 'host',
          text: `Hello! Yes, regarding "${listing.title}", we can definitely coordinate that request for you. Please let us know if there is anything else we can arrange for your northern journey. We look forward to greeting you!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          authorName: fallbackName
        }]);
      }, 1000);
    }
  };

  // Open host chat modal & seed initial welcoming message
  const handleOpenHostChat = () => {
    if (!listing) return;
    setShowHostChat(true);
    
    if (chatHistory.length === 0) {
      const hostName = listing.type === 'car' ? 'Mr. Tariq Shah (Fleet Expert)' : 'Karim Balti (Local Stay Host)';
      setChatHistory([
        {
          id: 'init-msg',
          sender: 'host',
          text: `AoA! Warm greetings from GBBookings! I am ${hostName}, your primary local coordinator for ${listing.title} here in ${listing.location}. Do you have any questions regarding check-in times, amenities, road guidelines, or custom services? I am here to assist you instantly.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          authorName: hostName
        }
      ]);
    }
  };

  // Apply Coupon Handler
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) return;

    if (cleanCode === 'WELCOME10') {
      setDiscountPercentage(10);
      setAppliedPromo('WELCOME10');
      setCouponSuccess('Success! WELCOME10 coupon has applied a 10% discount on your stay.');
    } else if (cleanCode === 'GILGIT2026') {
      setDiscountPercentage(15);
      setAppliedPromo('GILGIT2026');
      setCouponSuccess('Success! GILGIT2026 coupon has applied a premium 15% discount on your stay.');
    } else if (cleanCode === 'OYO50') {
      setDiscountPercentage(50);
      setAppliedPromo('OYO50');
      setCouponSuccess('Incredible! OYO50 extreme sanitizer promo has unlocked a 50% discount!');
    } else {
      setCouponError('Invalid promo code. Try WELCOME10 or GILGIT2026.');
    }
  };

  // Submit Review Handler
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor || !newComment) return;

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          author: newAuthor,
          rating: newRating,
          comment: newComment
        })
      });

      if (res.ok) {
        const review = await res.json();
        setRawReviews([review, ...rawReviews]);
        // Reset
        setNewAuthor('');
        setNewComment('');
        setNewRating(5);
      }
    } catch (err) {
      console.error('Error adding review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBookingSubmit = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end reservation dates.');
      return;
    }
    
    // Check for valid date ranges
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      alert('End date cannot precede the start date. Please choose a valid date range.');
      return;
    }

    onProceedToCheckout({
      listingId,
      startDate,
      endDate,
      totalPrice: totalPricing,
      guests,
      duration,
      withDriver: listing?.type === 'car' ? withDriver : undefined,
      upgradeOption,
      cancellationPolicy,
      payAtHotel,
      appliedPromo: appliedPromo || undefined,
      discountAmount: couponDiscount + policyDiscount
    });
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

  // Define host details based on listing
  const hostName = listing.type === 'homestay' && listing.homestaySpecs ? listing.homestaySpecs.hostName : (listing.type === 'car' ? 'Mr. Tariq Shah' : 'Karim Balti');
  const hostAvatar = listing.type === 'homestay' && listing.homestaySpecs ? listing.homestaySpecs.hostImage : (listing.type === 'car' ? 'TS' : 'KB');
  const hostDesc = listing.type === 'homestay' && listing.homestaySpecs 
    ? `Local host of ${listing.title}. Dedicated to sharing local mountain traditions, organic farm secrets, and traditional Balti meals.`
    : (listing.type === 'car' 
      ? 'Senior Fleet Logistics coordinator. 200+ verified mountain routes managed across Karakoram & Babusar Pass.'
      : 'Superhost & native Balti cultural enthusiast. Dedicated to making your Northern Pakistan escape absolutely pristine.');

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
              navigator.clipboard.writeText(window.location.href);
              alert('Copied listing details link to clipboard!');
            }}
            className="p-2.5 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all cursor-pointer"
          >
            <Share2 className="w-4.5 h-4.5" />
          </button>
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
              {listing.type === 'hotel' && (
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> OYO CLEAN & HYGIENIC CERTIFIED
                </span>
              )}
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

          {/* Oyo Certified Sanitized Stay Guarantees Badge (Oyo Rooms Feature) */}
          {listing.type === 'hotel' && (
            <div className="bg-[#006F3C]/10 border border-[#006F3C]/25 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs" id="oyo-guarantee-badge">
              <div className="space-y-1.5 max-w-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#006F3C] flex items-center justify-center text-white text-xs font-black">
                    ✓
                  </div>
                  <h4 className="text-sm font-extrabold text-[#006F3C] uppercase tracking-wider">Oyo Quality & Cleanliness Guaranteed</h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  We check this hotel room against a strict 5-point quality checklist before check-in. Rest assured with native comfort standards.
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
                  {[
                    '100% Sanitized Linens & Towels',
                    'Assured AC & Backup Heating',
                    'Hot Water Geyser on demand',
                    'Free High-Speed Wi-Fi Support'
                  ].map((g, idx) => (
                    <span key={idx} className="text-[10px] text-[#006F3C] font-bold flex items-center gap-1">
                      <Sparkle className="w-3 h-3 fill-[#006F3C] stroke-none shrink-0" /> {g}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-[#006F3C]/20 px-4 py-3 rounded-xl text-center shrink-0 w-full md:w-auto shadow-xs">
                <span className="text-[9px] font-extrabold text-[#006F3C] uppercase tracking-widest block">GB CERTIFICATION ID</span>
                <span className="text-sm font-mono font-bold text-slate-800 block mt-0.5">GB-OYO-98442</span>
                <span className="text-[9.5px] text-slate-400 block mt-0.5">Checked today • Active</span>
              </div>
            </div>
          )}

          {/* Airbnb Superhost Guarantee Badge (Airbnb Feature) */}
          {listing.type === 'homestay' && (
            <div className="bg-[#006F3C]/10 border border-[#006F3C]/25 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs" id="homestay-guarantee-badge">
              <div className="space-y-1.5 max-w-lg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#006F3C] flex items-center justify-center text-white text-xs font-black">
                    ✓
                  </div>
                  <h4 className="text-sm font-extrabold text-[#006F3C] uppercase tracking-wider">Superhost Certified Homestay</h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  This stay has been personally verified for authentic hospitality, clean local linens, and home-cooked culinary safety.
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
                  {[
                    '100% Native Welcoming Hosts',
                    'Traditional Organic Breakfast Included',
                    'Cultural & Village Tour Guides',
                    'Safe & Secure Family Environment'
                  ].map((g, idx) => (
                    <span key={idx} className="text-[10px] text-[#006F3C] font-bold flex items-center gap-1">
                      <Sparkle className="w-3 h-3 fill-[#006F3C] stroke-none shrink-0" /> {g}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-[#006F3C]/20 px-4 py-3 rounded-xl text-center shrink-0 w-full md:w-auto shadow-xs">
                <span className="text-[9px] font-extrabold text-[#006F3C] uppercase tracking-widest block">GB HOMESTAY VERIFIED</span>
                <span className="text-sm font-mono font-bold text-slate-800 block mt-0.5">GB-HOST-{(listing.homestaySpecs?.hostName || 'karim').substring(0,3).toUpperCase()}-2025</span>
                <span className="text-[9.5px] text-slate-400 block mt-0.5">Superhost badge • Active</span>
              </div>
            </div>
          )}

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

          {/* Airbnb Style House Rules & Policies Section (Airbnb Feature) */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4" id="house-rules-section">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Stay Rules & Policies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 font-medium">
              <div className="space-y-3">
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Check-in: 2:00 PM – 10:00 PM</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Check-out: 11:00 AM</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Max overnight occupancy respected strictly</p>
              </div>
              <div className="space-y-3">
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Eco-friendly energy measures in place</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Quiet hours active after 10:00 PM</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Free parking guaranteed on the premises</p>
              </div>
            </div>
          </section>

          {/* Airbnb Local Host Card & Contact Messenger (Airbnb Feature) */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6" id="host-profile-card">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-xs shrink-0">
                {hostAvatar}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">{hostName}</h4>
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">Superhost</span>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Response Rate: 100% within 10 minutes</p>
                <p className="text-xs text-slate-500 max-w-md font-medium leading-relaxed">{hostDesc}</p>
              </div>
            </div>

            <button
              id="btn-trigger-host-chat"
              onClick={handleOpenHostChat}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-xl text-xs sm:text-sm min-h-[44px] flex items-center justify-center space-x-1.5 cursor-pointer uppercase tracking-wider shadow-xs w-full md:w-auto"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message Host</span>
            </button>
          </section>

          {/* Detailed Airbnb-style Sub-ratings Breakdown Component */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5" id="ratings-breakdown-panel">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Guest Trust Rating Breakdown</h3>
              <p className="text-[11px] text-slate-500 font-medium">Ratings derived from 100% verified stay receipts registered since last year.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: 'Cleanliness', score: '4.9', width: 'w-[98%]' },
                { label: 'Communication', score: '5.0', width: 'w-[100%]' },
                { label: 'Check-In Handshake', score: '4.8', width: 'w-[96%]' },
                { label: 'Listing Accuracy', score: '4.8', width: 'w-[96%]' },
                { label: 'Geographic Location', score: '4.9', width: 'w-[98%]' },
                { label: 'Value for Money', score: '4.9', width: 'w-[98%]' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-4 text-xs font-medium">
                  <span className="text-slate-600 w-32 shrink-0">{item.label}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-slate-900 rounded-full ${item.width}`} />
                  </div>
                  <span className="text-slate-900 font-mono font-bold shrink-0">{item.score}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Live Reviews List */}
          <section className="space-y-6" id="details-reviews-block">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Guest Reviews & Verification</h3>
              <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-500 stroke-none" />
                <span>{listing.rating} average</span>
                <span className="text-slate-400 font-normal">({reviews.length} reviews)</span>
              </div>
            </div>

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

            {/* Review Submission Form */}
            <form onSubmit={handleAddReview} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4" id="form-submit-review">
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" /> Write a Review
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                  <input
                    type="text"
                    required
                    id="input-review-name"
                    placeholder="e.g. Ahmad Raza"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full min-h-[44px] bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0F172A]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rating (Out of 5)</label>
                  <select
                    id="input-review-rating"
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="w-full min-h-[44px] bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-[#0F172A] cursor-pointer"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                    <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                    <option value="3">⭐⭐⭐ 3 Stars</option>
                    <option value="2">⭐⭐ 2 Stars</option>
                    <option value="1">⭐ 1 Star</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Your Comment</label>
                <textarea
                  required
                  id="input-review-comment"
                  rows={3}
                  placeholder="Tell us about the facilities, scenic views, and hospitality..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0F172A] resize-none"
                />
              </div>

              <button
                type="submit"
                id="btn-post-review"
                disabled={submittingReview}
                className="w-full sm:w-auto min-h-[44px] bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider transition-colors shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>{submittingReview ? 'Submitting...' : 'Post Review'}</span>
              </button>
            </form>
          </section>
        </div>

        {/* Right Column (4 cols): Live Booking Reservation Widget (Booking.com style) */}
        <div className="lg:col-span-4" id="details-booking-column">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 md:p-6 space-y-5 sm:space-y-6 sticky top-24 shadow-sm">
            <div>
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Prices start from</span>
              <div className="flex items-baseline flex-wrap gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">PKR {listing.price.toLocaleString()}</span>
                <span className="text-xs text-slate-500 font-medium">/{listing.type === 'hotel' ? 'night' : listing.type === 'car' ? 'day' : 'tour'}</span>
              </div>
            </div>

            {/* Date and Guest Pickers */}
            <div className="space-y-4" id="form-booking-dates">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Start Date
                  </label>
                  <input
                    type="date"
                    required
                    id="booking-start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white font-medium cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> End Date
                  </label>
                  <input
                    type="date"
                    required
                    id="booking-end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white font-medium cursor-pointer"
                  />
                </div>
              </div>

              {listing.type !== 'car' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-600" /> Total Guests
                  </label>
                  <select
                    id="booking-guests-count"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white cursor-pointer"
                  >
                    {[1, 2, 3, 4, 6, 8, 12].map((g) => (
                      <option key={g} value={g}>{g} {g === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Car Specific: Driver Selection */}
              {listing.type === 'car' && listing.carSpecs?.withDriver && (
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl min-h-[44px]">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Request Local Driver</p>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">+PKR 3,000/day guides</p>
                  </div>
                  <input
                    type="checkbox"
                    id="booking-checkbox-driver"
                    checked={withDriver}
                    onChange={(e) => setWithDriver(e.target.checked)}
                    className="w-5 h-5 rounded text-indigo-600 bg-white border-slate-300 accent-indigo-600 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Room / Vehicle Category Selection (Booking.com style) */}
            <div className="space-y-2.5 border-t border-slate-100 pt-4" id="room-selection-block">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-indigo-600" /> Choose Category
              </label>
              
              <div className="space-y-2">
                {[
                  { 
                    id: 'standard', 
                    title: listing.type === 'car' ? 'Standard SUV' : listing.type === 'tour' ? 'Standard Tier' : 'Standard Room', 
                    sub: 'Base comfort package', 
                    cost: 'Included' 
                  },
                  { 
                    id: 'deluxe', 
                    title: listing.type === 'car' ? 'Deluxe Auto SUV' : listing.type === 'tour' ? 'Deluxe Gourmet Tour' : 'Deluxe Scenic View', 
                    sub: listing.type === 'car' ? 'Automatic transmission' : 'Panoramic vistas & central heating', 
                    cost: `+PKR ${listing.type === 'car' ? '4,000' : listing.type === 'tour' ? '6,000' : '7,500'}/u` 
                  },
                  { 
                    id: 'premium', 
                    title: listing.type === 'car' ? 'Luxury V8 Flagship' : listing.type === 'tour' ? 'Elite Helicopter Tour' : 'Premium Presidential Suite', 
                    sub: 'All VIP services included', 
                    cost: `+PKR ${listing.type === 'car' ? '9,000' : listing.type === 'tour' ? '13,500' : '16,000'}/u` 
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    id={`btn-select-room-${opt.id}`}
                    onClick={() => setUpgradeOption(opt.id as any)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      upgradeOption === opt.id 
                        ? 'border-[#0F172A] bg-slate-50 shadow-xs' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block leading-tight">{opt.title}</span>
                      <span className="text-[9.5px] text-slate-400 block mt-0.5 leading-tight">{opt.sub}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 shrink-0">{opt.cost}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cancellation Policy Choices (Booking.com Style) */}
            <div className="space-y-2.5 border-t border-slate-100 pt-4" id="cancellation-policy-block">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-600" /> Refund Cancellation Policy
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'flexible', label: 'Flexible Refund', desc: 'Cancel anytime up to 24 hours' },
                  { id: 'nonRefundable', label: 'Non-Refundable', desc: 'Save 8% on subtotal' }
                ].map((p) => (
                  <button
                    key={p.id}
                    id={`btn-policy-${p.id}`}
                    onClick={() => setCancellationPolicy(p.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      cancellationPolicy === p.id 
                        ? 'border-indigo-600 bg-indigo-50/20 text-indigo-600 shadow-xs font-bold' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs block leading-tight">{p.label}</span>
                    <span className="text-[8.5px] text-slate-400 block mt-0.5 leading-normal">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Promo Coupon Form */}
            <div className="space-y-2 border-t border-slate-100 pt-4" id="promo-coupon-block">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-600" /> Apply Promo Code
              </label>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs text-slate-800 font-bold focus:outline-none focus:border-[#0F172A] focus:bg-white flex-1 placeholder:font-normal"
                />
                <button
                  type="submit"
                  id="btn-apply-promo"
                  className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold px-4 py-2.5 min-h-[44px] rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors shrink-0"
                >
                  Apply
                </button>
              </form>

              {couponError && <p className="text-[9.5px] font-bold text-rose-600">{couponError}</p>}
              {couponSuccess && <p className="text-[9.5px] font-bold text-emerald-600">{couponSuccess}</p>}
            </div>

            {/* Pay At Hotel Toggle (Oyo / Booking.com Feature) */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5" id="pay-at-hotel-toggle-block">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-indigo-600" /> Reservation Payment Scheme
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  id="btn-pay-online"
                  onClick={() => setPayAtHotel(false)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    !payAtHotel 
                      ? 'border-[#0F172A] bg-slate-50 text-[#0F172A] font-bold' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-[11px] block uppercase tracking-wider">Pay Online</span>
                  <span className="text-[8px] text-slate-400 block mt-0.5">Secure Credit/Wallets</span>
                </button>

                <button
                  id="btn-pay-at-hotel"
                  onClick={() => setPayAtHotel(true)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    payAtHotel 
                      ? 'border-[#0F172A] bg-slate-50 text-[#0F172A] font-bold' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-[11px] block uppercase tracking-wider">Pay At Stay</span>
                  <span className="text-[8px] text-slate-400 block mt-0.5">Oyo PKR 0 due today</span>
                </button>
              </div>
            </div>

            {/* Calculations Breakdown (Booking.com detailed breakdown) */}
            {startDate && endDate && (
              <div className="space-y-2 border-t border-slate-100 pt-4 text-xs" id="booking-price-breakdown">
                
                {/* Stay pricing itemized */}
                <div className="flex justify-between text-slate-500">
                  <span>
                    Stay rate {upgradeOption !== 'standard' ? `(${upgradeOption})` : ''} 
                    × {duration} {listing.type === 'hotel' ? 'Nights' : 'Days'}
                  </span>
                  <span className="font-bold text-slate-800">PKR {basePrice.toLocaleString()}</span>
                </div>

                {/* Optional driver charge */}
                {withDriver && (
                  <div className="flex justify-between text-slate-500">
                    <span>Mountain Driver Guide</span>
                    <span className="font-bold text-slate-800">PKR {driverCharge.toLocaleString()}</span>
                  </div>
                )}

                {/* Oyo Sanitization fee */}
                {listing.type === 'hotel' && (
                  <div className="flex justify-between text-slate-500">
                    <span className="flex items-center gap-0.5">Oyo Quality Assurance Fee <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" title="Sanitization and guaranteed heating levy" /></span>
                    <span className="font-bold text-slate-800">PKR 1,500</span>
                  </div>
                )}

                {/* Regional Tourist Tax */}
                <div className="flex justify-between text-slate-500">
                  <span>Tourism Development Tax (5%)</span>
                  <span className="font-bold text-slate-800">PKR {regionalTax.toLocaleString()}</span>
                </div>

                {/* Non-refundable Policy Discount */}
                {policyDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Non-Refundable Discount (-8%)</span>
                    <span>-PKR {policyDiscount.toLocaleString()}</span>
                  </div>
                )}

                {/* Applied Promo discount */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Promo Coupon Discount ({discountPercentage}%)</span>
                    <span>-PKR {couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                {/* Grand due today vs pay at hotel */}
                {payAtHotel ? (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-slate-500 font-bold">
                      <span>Due Today Online</span>
                      <span className="text-emerald-600 font-mono text-xs uppercase tracking-wider">PKR 0 (Advance Free)</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900">
                      <span>Due at Check-in</span>
                      <span className="text-indigo-600">PKR {totalPricing.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                    <span>Grand Total Due</span>
                    <span className="text-indigo-600 font-extrabold">PKR {totalPricing.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Booking Trigger Button */}
            <button
              onClick={handleBookingSubmit}
              id="btn-checkout-proceed"
              className="w-full min-h-[46px] bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-xs transition-all text-xs sm:text-sm flex items-center justify-center space-x-1.5 cursor-pointer uppercase tracking-wider"
            >
              <span>{payAtHotel ? 'Book via Pay At Stay' : 'Proceed to Checkout'}</span>
            </button>

            {/* Policy highlights */}
            <div className="flex items-start space-x-2 text-[10px] text-slate-500 leading-normal" id="booking-widget-footer">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                {cancellationPolicy === 'flexible' 
                  ? 'Flexible Reservation. Cancel up to 24 hours prior for a full instant wallet refund.'
                  : 'Non-Refundable Stay reservation. Covered by our 100% room availability assurance guarantee.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Airbnb Interactive Host Live Chat Modal overlay drawer (Airbnb Feature) */}
      {showHostChat && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-fadeIn" 
          id="host-chat-drawer-overlay"
          onClick={() => setShowHostChat(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slideLeft border-l border-slate-200" 
            id="host-chat-drawer-container"
          >
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-sm shrink-0">
                  {hostAvatar}
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">{hostName}</h4>
                  <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Host online</p>
                </div>
              </div>
              <button 
                id="btn-close-host-chat"
                aria-label="Close host chat"
                onClick={() => setShowHostChat(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat History Pane */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" id="chat-messages-scroll-pane">
              {chatHistory.map((msg) => {
                const isHost = msg.sender === 'host';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex items-start gap-2.5 max-w-[85%] ${isHost ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    {isHost && (
                      <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center font-bold text-white text-[10px] shrink-0 mt-1">
                        {hostAvatar}
                      </div>
                    )}
                    <div className="space-y-1">
                      {isHost && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">
                          {msg.authorName || 'Host'}
                        </span>
                      )}
                      <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                        isHost 
                          ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' 
                          : 'bg-indigo-600 text-white rounded-tr-none shadow-xs'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-slate-400 font-bold block text-right">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Host is typing animation indicator */}
              {isHostTyping && (
                <div className="flex items-start gap-2.5 mr-auto max-w-[85%]">
                  <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center font-bold text-white text-[10px] shrink-0 mt-1 animate-bounce">
                    {hostAvatar}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">{hostName}</span>
                    <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Field */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-100 flex gap-2 bg-white" id="chat-submit-input-form">
              <input
                type="text"
                required
                id="host-chat-input-field"
                placeholder={`Ask ${hostName} anything...`}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white flex-1 min-h-[44px]"
              />
              <button
                type="submit"
                id="btn-send-host-chat"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl cursor-pointer shadow-xs shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
