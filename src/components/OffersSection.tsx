import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Tag, Gift, Sparkles, Clock, ShieldCheck, Award, Headset, Search, 
  Calendar, Users, MapPin, Star, Copy, Check, ArrowRight, ChevronDown, 
  Filter, Heart, Percent, Zap, Building2, Ticket, CheckCircle2
} from 'lucide-react';
import { Listing, handleImageError } from '../types';
import { INITIAL_LISTINGS } from '../data';
import { useLanguage } from '../LanguageContext';

interface OffersSectionProps {
  onSelectListing: (listing: Listing) => void;
  onTriggerSearch?: (params: any) => void;
}

export interface OfferItem {
  id: string;
  title: string;
  category: 'Flash Deals' | 'Seasonal Packs' | 'VIP Perks' | 'Last Minute' | 'Early Bird Stays';
  discount: string;
  promoCode: string;
  image: string;
  location: string;
  originalPrice: number;
  discountedPrice: number;
  rating: number;
  reviewsCount: number;
  description: string;
  perks: string[];
  expiresIn: string;
  isExclusive: boolean;
  targetListingId?: string;
}

export default function OffersSection({ onSelectListing, onTriggerSearch }: OffersSectionProps) {
  const { t, isRtl } = useLanguage();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('All');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Dropdown controls
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const offersList: OfferItem[] = [
    {
      id: 'offer-autumn-hunza',
      title: 'Early Bird Autumn Hunza Expedition Pack',
      category: 'Seasonal Packs',
      discount: '30% OFF',
      promoCode: 'HUNZAAUTUMN30',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      location: 'Hunza Valley',
      originalPrice: 185000,
      discountedPrice: 129500,
      rating: 4.95,
      reviewsCount: 148,
      description: 'Save big on our most coveted Autumn tours in Hunza. Admire golden apricot groves and the reflective Attabad Lake with private local guides.',
      perks: ['Private Prado 4x4 included', 'Free Attabad Lake boating', 'Room upgrade on availability'],
      expiresIn: '7 Days Left',
      isExclusive: true,
      targetListingId: 'hunza-autumn-expedition'
    },
    {
      id: 'offer-ski-swat',
      title: 'Winter Ski Malam Jabba Resort Special',
      category: 'Seasonal Packs',
      discount: '20% OFF',
      promoCode: 'MALAMSKI20',
      image: 'https://images.unsplash.com/photo-1518098268026-4e43a1a009de?auto=format&fit=crop&w=800&q=80',
      location: 'Swat Valley',
      originalPrice: 120000,
      discountedPrice: 96000,
      rating: 4.88,
      reviewsCount: 92,
      description: 'Unleash your winter spirit in Malam Jabba ski resort. Bundle lodging and full ski gear rentals together to save maximum.',
      perks: ['Free 1-Day Chairlift Pass', '20% Off Ski gear rental', 'Fireside hot chocolate'],
      expiresIn: 'Ends Dec 15',
      isExclusive: false,
      targetListingId: 'malam-jabba-ski-resort'
    },
    {
      id: 'offer-skardu-desert',
      title: 'Skardu Cold Desert Escape Flash Deal',
      category: 'Flash Deals',
      discount: 'FLAT 25%',
      promoCode: 'DESERTFLASH25',
      image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      location: 'Skardu',
      originalPrice: 140000,
      discountedPrice: 105000,
      rating: 4.92,
      reviewsCount: 110,
      description: 'Valid for 48 hours only! Explore Katpana Cold Desert and stay at boutique Lakeside Resorts with unparalleled luxury rates.',
      perks: ['Free airport transfer both ways', 'Complimentary 4x4 dune safari', 'High-tea session on lake shore'],
      expiresIn: '2 Days Left',
      isExclusive: true,
      targetListingId: 'shangrila-resort-skardu'
    },
    {
      id: 'offer-lahore-heritage',
      title: 'Cultural Lahore Heritage Pass',
      category: 'Last Minute',
      discount: 'BUY 1 GET 1 HALF',
      promoCode: 'LAHOREHERITAGE',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
      location: 'Lahore',
      originalPrice: 60000,
      discountedPrice: 45000,
      rating: 4.85,
      reviewsCount: 76,
      description: 'Discover Mughal masterpieces like Lahore Fort and Badshahi Mosque. Enjoy flat half-price discounts on your second night\'s booking.',
      perks: ['Free Walled City food tour', 'Late 4:00 PM checkout guaranteed', 'Historical map & guide kit'],
      expiresIn: 'Limited Space',
      isExclusive: false,
      targetListingId: 'serena-hotel-gilgit'
    },
    {
      id: 'offer-naran-family',
      title: 'Naran Valley Family Retreat Pack',
      category: 'VIP Perks',
      discount: '15% + FREE SUV',
      promoCode: 'NARANFAMILY15',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
      location: 'Naran',
      originalPrice: 110000,
      discountedPrice: 93500,
      rating: 4.89,
      reviewsCount: 134,
      description: 'Perfect for families exploring Saif-ul-Muluk lake. Get 15% discount on 4-star hotels plus a free driver-driven SUV upgrade.',
      perks: ['Free driver-driven SUV upgrade', 'Lakeside bonfire setup with tea', 'Kids adventure activity kit'],
      expiresIn: 'Active Seasonal',
      isExclusive: true,
      targetListingId: 'luxus-hunza'
    },
    {
      id: 'offer-karachi-beach',
      title: 'Karachi Beachfront VIP Escape',
      category: 'VIP Perks',
      discount: '20% OFF VIP',
      promoCode: 'BEACHVIP20',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      location: 'Karachi',
      originalPrice: 95000,
      discountedPrice: 76000,
      rating: 4.91,
      reviewsCount: 88,
      description: 'Bask in premium Arabian sea breezes. Get 20% discount on luxury stays plus a complimentary private candlelit beach dinner.',
      perks: ['Private candlelit beach dinner', 'Free spa voucher for two', 'Late check-out till 6 PM'],
      expiresIn: 'Ends Oct 30',
      isExclusive: true
    },
    {
      id: 'offer-passu-trekker',
      title: 'Passu Cones High-Altitude Trekker Deal',
      category: 'Flash Deals',
      discount: '15% OFF',
      promoCode: 'PASSUTREK15',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
      location: 'Hunza Valley',
      originalPrice: 85000,
      discountedPrice: 72250,
      rating: 4.87,
      reviewsCount: 64,
      description: 'The ultimate trekker experience around the iconic Passu Cones. Save 15% on high-altitude equipment rentals and guided treks.',
      perks: ['Professional mountain guide', 'Free basecamp tent setup', 'Warm sleeping bag rentals included'],
      expiresIn: '4 Days Left',
      isExclusive: false
    },
    {
      id: 'offer-islamabad-boutique',
      title: 'Margalla Hills Boutique Getaway',
      category: 'Last Minute',
      discount: 'FLAT 10%',
      promoCode: 'ISLBOOT10',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      location: 'Islamabad',
      originalPrice: 55000,
      discountedPrice: 49500,
      rating: 4.86,
      reviewsCount: 52,
      description: 'Escape to boutique retreats nestled inside the Margalla Hills. Wake up to crisp woodland air and enjoy panoramic city views.',
      perks: ['Daily organic hilltop breakfast', 'Free mountain hiking trail kit', 'Complimentary evening mocktails'],
      expiresIn: 'Active Now',
      isExclusive: false
    },
    {
      id: 'offer-shigar-royal',
      title: 'Shigar Fort Royal Heritage Pack',
      category: 'Early Bird Stays',
      discount: '30% OFF',
      promoCode: 'ROYALSHIGAR30',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
      location: 'Skardu',
      originalPrice: 160000,
      discountedPrice: 112000,
      rating: 4.96,
      reviewsCount: 118,
      description: 'Stay like Balti royalty in restored 17th-century fort suites. Enjoy a 30% discount on advance bookings for 3+ night stays.',
      perks: ['Royal welcome ceremony with music', 'Free museum guided tour', 'Traditional Balti dinner feast'],
      expiresIn: '5 Days Left',
      isExclusive: true
    }
  ];

  // Offer Categories
  const categories = [
    {
      id: 'flash-deals',
      title: 'Flash Deals',
      subtitle: '24-48 Hour Deep Price Drops',
      icon: Flame,
      bgImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-rose-500/20 text-rose-400 border-rose-400/40'
    },
    {
      id: 'seasonal-packs',
      title: 'Seasonal Packs',
      subtitle: 'Autumn Foliage & Ski Getaways',
      icon: Sparkles,
      bgImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-400/40'
    },
    {
      id: 'vip-perks',
      title: 'VIP Perks',
      subtitle: 'Free SUV Upgrades & Spa Dinners',
      icon: Award,
      bgImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40'
    },
    {
      id: 'last-minute',
      title: 'Last Minute',
      subtitle: 'Instant Availability Discounts',
      icon: Clock,
      bgImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-400/40'
    },
    {
      id: 'early-bird',
      title: 'Early Bird Stays',
      subtitle: 'Advance Booking Bonus Savings',
      icon: Gift,
      bgImage: 'https://images.unsplash.com/photo-1518098268026-4e43a1a009de?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-purple-500/20 text-purple-400 border-purple-400/40'
    }
  ];

  // Filtering Logic
  const filteredOffers = offersList.filter((offer) => {
    // 1. Search Query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = offer.title.toLowerCase().includes(q);
      const matchLocation = offer.location.toLowerCase().includes(q);
      const matchCode = offer.promoCode.toLowerCase().includes(q);
      const matchDesc = offer.description.toLowerCase().includes(q);
      if (!matchTitle && !matchLocation && !matchCode && !matchDesc) return false;
    }

    // 2. Category filter
    if (selectedCategory !== 'All') {
      if (offer.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    }

    // 3. Location Filter
    if (selectedLocationFilter !== 'All') {
      if (!offer.location.toLowerCase().includes(selectedLocationFilter.toLowerCase())) return false;
    }

    return true;
  });

  // Handle clicking an offer to view/book it
  const handleOfferClick = (offer: OfferItem) => {
    // Look up target listing from INITIAL_LISTINGS or construct a temporary listing object
    let matchedListing = INITIAL_LISTINGS.find((l) => l.id === offer.targetListingId);
    if (!matchedListing) {
      matchedListing = {
        id: offer.id,
        type: 'offer',
        title: offer.title,
        location: offer.location,
        price: offer.discountedPrice,
        rating: offer.rating,
        reviewsCount: offer.reviewsCount,
        image: offer.image,
        images: [offer.image],
        description: offer.description,
        featured: true,
        tourSpecs: {
          durationDays: 5,
          maxGroupSize: 10,
          difficulty: 'Easy',
          included: offer.perks,
          itinerary: [
            { day: 1, title: 'Arrival & Welcome', desc: 'Arrive at destination with special VIP welcome and transfer.' },
            { day: 2, title: 'Guided Tour & Experiences', desc: 'Enjoy inclusive perks, boating, or outdoor activities.' },
            { day: 3, title: 'Leisure & Checkout', desc: 'Relax and checkout with guaranteed late check-out.' }
          ]
        }
      };
    }
    onSelectListing(matchedListing);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onTriggerSearch) {
      onTriggerSearch({
        type: 'offer',
        destination: searchQuery,
        dates: 'Seasonal Deals',
        guests: 2
      });
    }
  };

  return (
    <div className="space-y-12 pb-20 text-left" id="offers-page-container">
      
      {/* 1. Full-Bleed Hero Banner matching Hotels Section Ratios */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-8 md:-mt-12 overflow-hidden min-h-[300px] sm:min-h-[330px] lg:min-h-[350px] shadow-xl" id="offers-hero-banner">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80" 
            alt="Exclusive Travel Offers in Gilgit Baltistan"
            className="w-full h-full object-cover object-center scale-105"
            referrerPolicy="no-referrer"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-slate-950/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 md:pt-16 pb-14 sm:pb-16 flex flex-col justify-start items-start h-full text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
            <div className="lg:col-span-10 space-y-3.5 text-left" id="offers-left-content">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-white/20 text-white text-[11px] font-semibold backdrop-blur-md shadow-md">
                  <Flame className="w-3.5 h-3.5 text-white shrink-0 fill-white/20" />
                  <span className="tracking-tight text-white font-medium">Limited-Time Exclusive Travel Vouchers &amp; Deals</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug drop-shadow-md">
                Exclusive Travel Offers &amp; Deals in <span className="text-[#00A651] font-black">Gilgit Baltistan</span>
              </h1>
              <p className="text-slate-100/95 text-xs sm:text-sm font-medium max-w-xl leading-relaxed drop-shadow-xs">
                Unlock seasonal price drops, exclusive promo vouchers, free 4x4 vehicle upgrades, and luxury stay discounts.
              </p>

              {/* 4-Column Hero Trust Factors */}
              <div className="flex flex-wrap items-center gap-3.5 sm:gap-6 pt-2 text-white" id="offers-trust-factors">
                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Percent className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white">Up to 35% Off</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Gift className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white">Bonus VIP Perks</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Ticket className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white">Instant Vouchers</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Headset className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white">24/7 Deal Desk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Overlapping Booking / Search Console */}
      <section className="-mt-12 sm:-mt-14 relative z-20 w-full" id="offers-search-console">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-visible">
          <div className="flex border-b border-[#F1F5F9] bg-[#FAFAFA] px-6 sm:px-8 gap-4 sm:gap-8 overflow-x-auto scrollbar-none rounded-t-3xl">
            <div className="flex items-center gap-2.5 py-4 px-1 border-b-2 border-[#006F3C] text-[#006F3C] font-bold text-[13px] uppercase tracking-wider">
              <Flame className="w-4 h-4 text-[#006F3C]" />
              <span>Search Promotional Deals & Voucher Codes</span>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="p-4 sm:p-6 bg-slate-50/50 rounded-b-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-3.5 items-stretch relative">
              
              {/* Search Query Input */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-5 relative">
                <label className="text-[11px] font-bold text-slate-700 tracking-tight">Search Deal, City or Voucher Code</label>
                <div className="flex items-center gap-2 relative">
                  <Search className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Hunza, MALAMSKI20, Autumn..."
                    className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 focus:outline-none p-0 cursor-text placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Offer Category Selector */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-3 relative">
                <label className="text-[11px] font-bold text-slate-700 tracking-tight">Deal Category</label>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-500 shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 focus:outline-none p-0 cursor-pointer"
                  >
                    <option value="All">All Promo Deals</option>
                    <option value="Flash Deals">Flash Deals</option>
                    <option value="Seasonal Packs">Seasonal Packs</option>
                    <option value="VIP Perks">VIP Perks</option>
                    <option value="Last Minute">Last Minute</option>
                    <option value="Early Bird Stays">Early Bird Stays</option>
                  </select>
                </div>
              </div>

              {/* Location Selector */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-2 relative">
                <label className="text-[11px] font-bold text-slate-700 tracking-tight">Location</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <select
                    value={selectedLocationFilter}
                    onChange={(e) => setSelectedLocationFilter(e.target.value)}
                    className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 focus:outline-none p-0 cursor-pointer"
                  >
                    <option value="All">All Locations</option>
                    <option value="Hunza">Hunza Valley</option>
                    <option value="Skardu">Skardu</option>
                    <option value="Swat">Swat Valley</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Naran">Naran</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="lg:col-span-2 flex items-stretch">
                <button
                  type="submit"
                  className="w-full h-full min-h-[50px] bg-gradient-to-r from-[#006F3C] to-[#005C32] hover:from-[#005C32] hover:to-[#006F3C] text-white font-bold rounded-xl flex items-center justify-center gap-2 px-6 py-3.5 transition-all hover:scale-[1.01] active:scale-[0.99] text-[14px] cursor-pointer shadow-sm"
                >
                  <Search className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span className="whitespace-nowrap font-extrabold text-[14px]">
                    Search Offers
                  </span>
                </button>
              </div>

            </div>
          </form>

          {/* Divider Line */}
          <div className="border-t border-slate-200/80" />

          {/* 4-Column Trust Assurance Bar */}
          <div className="bg-[#F8FAFC]/80 p-2 sm:p-3 rounded-b-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-200/80 items-center">
              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#006F3C] shrink-0">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Instant Voucher Apply</h5>
                  <p className="text-[11px] text-slate-500 break-words">Automated at checkout</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Calendar className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Flexible Travel Dates</h5>
                  <p className="text-[11px] text-slate-500 break-words">Valid through 2025/2026</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Award className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Verified Hotel Partners</h5>
                  <p className="text-[11px] text-slate-500 break-words">Guaranteed genuine deals</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Headset className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Best Savings Promise</h5>
                  <p className="text-[11px] text-slate-500 break-words">Direct price match</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: EXPLORE OFFERS BY CATEGORY */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Explore Offers by Category
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Filter by flash price drops, seasonal packages, VIP perks & early bird specials
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSelectedLocationFilter('All');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006F3C] hover:text-[#005C32] hover:underline cursor-pointer"
          >
            <span>View all Offers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.title.toLowerCase();
            const Icon = cat.icon;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? 'All' : cat.title)}
                className={`relative h-48 sm:h-52 rounded-2xl overflow-hidden cursor-pointer group shadow-2xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 ${
                  isSelected ? 'border-[#006F3C] ring-4 ring-emerald-500/20' : 'border-transparent'
                }`}
              >
                <img
                  src={cat.bgImage}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />

                <div className="absolute inset-0 p-4 flex flex-col justify-between text-white z-10">
                  {isSelected && (
                    <div className="self-start px-2.5 py-1 rounded-full bg-[#006F3C] text-white text-[10px] font-bold shadow-md">
                      Filtered
                    </div>
                  )}

                  <div className="mt-auto flex items-end justify-between gap-2">
                    <div className="space-y-0.5 pr-2">
                      <h4 className="font-extrabold text-white text-base sm:text-lg leading-snug">
                        {cat.title}
                      </h4>
                      <p className="text-slate-200 text-[11px] font-normal leading-tight line-clamp-2">
                        {cat.subtitle}
                      </p>
                    </div>

                    <div className={`p-2 rounded-full backdrop-blur-md border shrink-0 ${cat.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SECTION: HANDPICKED OFFERS GRID */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#006F3C]" /> Location:
            </span>
            {['All', 'Hunza', 'Skardu', 'Swat', 'Islamabad', 'Lahore', 'Naran'].map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setSelectedLocationFilter(loc)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedLocationFilter === loc
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>

          <p className="text-xs font-semibold text-slate-500 shrink-0">
            Showing <span className="font-bold text-slate-900">{filteredOffers.length}</span> promotional deals & promo vouchers
          </p>
        </div>

        {filteredOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => {
              const isCopied = copiedCode === offer.promoCode;

              return (
                <div
                  key={offer.id}
                  onClick={() => handleOfferClick(offer)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative h-52 sm:h-56 overflow-hidden bg-slate-100">
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                    />

                    {/* Top Overlay Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      {/* Discount Badge */}
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 text-white text-[11px] font-black uppercase shadow-lg tracking-wider">
                        <Flame className="w-3 h-3 fill-white" />
                        <span>{offer.discount}</span>
                      </span>

                      {/* Promo Code Copy Button */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(offer.promoCode, e)}
                        className={`pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold shadow-md transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/95 hover:bg-white text-slate-900 border border-slate-200 hover:scale-105'
                        }`}
                        title="Copy Promo Code"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-white stroke-[3]" />
                            <span>COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>{offer.promoCode}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Expiry Badge */}
                    <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border border-white/20">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{offer.expiresIn}</span>
                    </div>

                    {/* Category Pill */}
                    <div className="absolute bottom-3 right-3 bg-[#006F3C]/90 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                      {offer.category}
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <p className="text-slate-500 font-medium flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#006F3C] shrink-0" />
                          <span className="truncate">{offer.location}</span>
                        </p>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                          <span className="font-bold text-amber-900 text-xs">{offer.rating}</span>
                          <span className="text-slate-400 text-[10px]">({offer.reviewsCount})</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-lg group-hover:text-[#006F3C] transition-colors leading-snug line-clamp-1">
                        {offer.title}
                      </h4>

                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                        {offer.description}
                      </p>
                    </div>

                    {/* Perks Checklist */}
                    {offer.perks && offer.perks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {offer.perks.map((perk, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-[10px] font-semibold flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-[#006F3C]" />
                            <span>{perk}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400 line-through">
                            PKR {offer.originalPrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            Save PKR {(offer.originalPrice - offer.discountedPrice).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-base font-black text-slate-900">
                          PKR {offer.discountedPrice.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ package</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOfferClick(offer);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#006F3C] hover:bg-[#005C32] text-white text-xs font-extrabold transition-all shadow-2xs group-hover:shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>Claim Deal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-left py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <Flame className="w-12 h-12 text-slate-300" />
            <h4 className="font-bold text-slate-800 text-base">No promotional offers match your filter</h4>
            <p className="text-xs text-slate-500">Try changing your location or category selection above.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedLocationFilter('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-[#006F3C] text-white text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
