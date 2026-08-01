import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, ShieldCheck, User, Award, Headset, Search, Calendar, Users, MapPin, 
  CheckCircle2, Star, Lock, Mountain, Waves, Wallet, ArrowRight, 
  ChevronDown, Filter, Heart, Check, ChevronLeft, ChevronRight, Quote,
  Smartphone, QrCode, Sparkles, Percent, Send, ThumbsUp
} from 'lucide-react';
import { Listing, handleImageError } from '../types';
import { INITIAL_LISTINGS } from '../data';
import { CalendarPickerDropdown } from './CalendarPickerDropdown';
import { useLanguage } from '../LanguageContext';

interface HomestaysSectionProps {
  onSelectListing: (listing: Listing) => void;
  onTriggerSearch?: (params: any) => void;
}

export default function HomestaysSection({ onSelectListing, onTriggerSearch }: HomestaysSectionProps) {
  const { t, isRtl } = useLanguage();

  // Search Form State
  const [destination, setDestination] = useState('Hunza Valley');
  const [destQuery, setDestQuery] = useState('Hunza Valley');
  const [checkIn, setCheckIn] = useState('2025-05-20');
  const [checkOut, setCheckOut] = useState('2025-05-23');
  const [guestCount, setGuestCount] = useState(2);
  const [roomCount, setRoomCount] = useState(1);

  // Dropdown toggles
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  // Experience Filter State
  const [selectedExperience, setSelectedExperience] = useState<string>('All');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('All');

  const destRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const checkInRef = useRef<HTMLDivElement>(null);
  const checkOutRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDestDropdown(false);
      }
      if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
        setShowGuestPicker(false);
      }
      if (checkInRef.current && !checkInRef.current.contains(event.target as Node)) {
        setShowCheckInPicker(false);
      }
      if (checkOutRef.current && !checkOutRef.current.contains(event.target as Node)) {
        setShowCheckOutPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const destinationsList = [
    { name: 'Hunza Valley', region: 'Gilgit-Baltistan', desc: 'Karimabad, Attabad Lake, Passu Cones' },
    { name: 'Skardu', region: 'Gilgit-Baltistan', desc: 'Shangrila Lake, Cold Desert, Deosai' },
    { name: 'Karimabad', region: 'Hunza', desc: 'Baltit Fort, Altit Fort & Local Bazaar' },
    { name: 'Shigar Valley', region: 'Baltistan', desc: 'Historic Shigar Fort & Orchards' },
    { name: 'Passu & Gojal', region: 'Upper Hunza', desc: 'Passu Cones & Glacier Views' },
    { name: 'Ghanche & Khaplu', region: 'Baltistan', desc: 'Khaplu Palace & Organic Farms' },
    { name: 'Gilgit City', region: 'Capital District', desc: 'Gilgit River & Naltar Valley Access' },
    { name: 'Attabad Lake', region: 'Hunza', desc: 'Turquoise Water Resorts & Chalets' }
  ];

  const filteredDestinations = destinationsList.filter(item =>
    item.name.toLowerCase().includes((destQuery || destination).toLowerCase()) ||
    item.region.toLowerCase().includes((destQuery || destination).toLowerCase()) ||
    item.desc.toLowerCase().includes((destQuery || destination).toLowerCase())
  );

  // Experiences List (5 Cards)
  const experiences = [
    {
      id: 'mountain-view',
      title: 'Mountain View',
      subtitle: 'Wake up to stunning mountain views',
      icon: Mountain,
      bgImage: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40'
    },
    {
      id: 'family-friendly',
      title: 'Family Friendly',
      subtitle: 'Perfect stays for you and your family',
      icon: Users,
      bgImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-400/40'
    },
    {
      id: 'lakeside-stays',
      title: 'Lakeside Stays',
      subtitle: 'Relax by the serene lakes and rivers',
      icon: Waves,
      bgImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40'
    },
    {
      id: 'local-culture',
      title: 'Local Culture',
      subtitle: 'Immerse in local life and traditions',
      icon: Home,
      bgImage: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-400/40'
    },
    {
      id: 'budget-friendly',
      title: 'Budget Friendly',
      subtitle: 'Comfortable stays that fit your budget',
      icon: Wallet,
      bgImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-purple-500/20 text-purple-400 border-purple-400/40'
    }
  ];

  // Filter homestays from INITIAL_LISTINGS
  const homestayListings = INITIAL_LISTINGS.filter(item => {
    if (item.type !== 'homestay') return false;
    if (selectedExperience !== 'All') {
      const expType = item.homestaySpecs?.experienceType;
      if (expType && expType.toLowerCase() !== selectedExperience.toLowerCase()) {
        return false;
      }
    }
    if (selectedLocationFilter !== 'All') {
      if (!item.location.toLowerCase().includes(selectedLocationFilter.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onTriggerSearch) {
      onTriggerSearch({
        type: 'homestay',
        destination,
        dates: `${checkIn} to ${checkOut}`,
        guests: guestCount
      });
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-12 pb-20 text-left" id="homestays-page-container">
      
      {/* 1. Full-Bleed Sweeping Hero Banner matching Homepage ratios */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 md:-mt-12 overflow-hidden min-h-[500px] lg:min-h-[540px] shadow-2xl" id="homestay-hero-banner">
        {/* Background Image with Twilight Mountain Chalet */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=2000&q=80" 
            alt="Authentic Homestay Chalet in Gilgit Baltistan"
            className="w-full h-full object-cover object-center scale-105"
            referrerPolicy="no-referrer"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-slate-950/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
        </div>

        {/* Inner Content Container matching Homepage padding */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-24 sm:pb-28 flex flex-col justify-start items-start h-full text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            {/* Left Texts */}
            <div className="lg:col-span-10 space-y-4 text-left">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-white/20 text-white text-xs font-semibold backdrop-blur-md shadow-md">
                  <Home className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="tracking-tight text-white font-medium">Stay Local. Feel at Home.</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-[1.12] drop-shadow-md">
                Authentic Homestays in <br />
                <span className="text-[#00A651] font-black">Gilgit Baltistan</span>
              </h1>
              <p className="text-slate-100/95 text-sm sm:text-base md:text-lg font-medium max-w-2xl leading-relaxed drop-shadow-xs">
                Experience warm hospitality, local culture, and breathtaking views with our handpicked homestays.
              </p>

              {/* 4 Feature Bullets Row matching screenshot */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 text-white" id="homestay-trust-factors">
                <div className="flex items-center gap-2 text-white">
                  <div className="w-7 h-7 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold tracking-tight text-white">Verified Homestays</span>
                </div>

                <div className="flex items-center gap-2 text-white">
                  <div className="w-7 h-7 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold tracking-tight text-white">Local Hosts</span>
                </div>

                <div className="flex items-center gap-2 text-white">
                  <div className="w-7 h-7 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Award className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold tracking-tight text-white">Best Price Guarantee</span>
                </div>

                <div className="flex items-center gap-2 text-white">
                  <div className="w-7 h-7 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Headset className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold tracking-tight text-white">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Overlapping Booking / Search Widget Console (Identical proportions & layout to screenshot) */}
      <section className="-mt-20 sm:-mt-24 relative z-20 w-full" id="homestay-search-console">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-visible">
          
          {/* Form Fields Section matching Homepage 5-Box structure */}
          <form onSubmit={handleSearchSubmit} className="p-4 sm:p-6 bg-white rounded-t-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-3.5 items-stretch relative">
              
              {/* Box 1: Where are you going? */}
              <div ref={destRef} className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-3 xl:col-span-3 relative">
                <label className="text-[11px] font-bold text-slate-700 tracking-tight">{isRtl ? 'کہاں جانا چاہتے ہیں؟' : 'Where are you going?'}</label>
                <div className="flex items-center gap-2 relative">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={showDestDropdown ? destQuery : destination}
                    onChange={(e) => {
                      setDestQuery(e.target.value);
                      setDestination(e.target.value);
                      setShowDestDropdown(true);
                    }}
                    onFocus={() => {
                      setDestQuery(destination === 'Hunza Valley' ? '' : destination);
                      setShowDestDropdown(true);
                    }}
                    placeholder={isRtl ? 'منزل یا علاقہ تلاش کریں' : 'Search destination, city or area'}
                    className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 focus:outline-none p-0 cursor-text placeholder-slate-400"
                  />
                </div>

                {/* Dropdown Menu BELOW the field */}
                {showDestDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-72 overflow-y-auto p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Popular Homestay Locations
                    </div>
                    {filteredDestinations.length > 0 ? (
                      filteredDestinations.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setDestination(item.name);
                            setDestQuery(item.name);
                            setShowDestDropdown(false);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006F3C] flex items-center justify-center shrink-0">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{item.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{item.region}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No locations found matching &quot;{destQuery}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Box 2: Check-in */}
              <div 
                ref={checkInRef}
                onClick={() => {
                  setShowCheckInPicker(!showCheckInPicker);
                  setShowCheckOutPicker(false);
                  setShowGuestPicker(false);
                  setShowDestDropdown(false);
                }}
                className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-2 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">{isRtl ? 'چیک ان' : 'Check-in'}</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
                  <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap">
                    {formatDateDisplay(checkIn)}
                  </span>
                </div>

                {showCheckInPicker && (
                  <CalendarPickerDropdown
                    title="Check-in Date"
                    selectedDate={checkIn}
                    minDate={new Date().toISOString().split('T')[0]}
                    onChange={(newDate) => {
                      setCheckIn(newDate);
                      if (newDate > checkOut) {
                        setCheckOut(newDate);
                      }
                    }}
                    onClose={() => setShowCheckInPicker(false)}
                  />
                )}
              </div>

              {/* Box 3: Check-out */}
              <div 
                ref={checkOutRef}
                onClick={() => {
                  setShowCheckOutPicker(!showCheckOutPicker);
                  setShowCheckInPicker(false);
                  setShowGuestPicker(false);
                  setShowDestDropdown(false);
                }}
                className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-2 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">{isRtl ? 'چیک آؤٹ' : 'Check-out'}</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
                  <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap">
                    {formatDateDisplay(checkOut)}
                  </span>
                </div>

                {showCheckOutPicker && (
                  <CalendarPickerDropdown
                    title="Check-out Date"
                    selectedDate={checkOut}
                    minDate={checkIn}
                    onChange={(newDate) => setCheckOut(newDate)}
                    onClose={() => setShowCheckOutPicker(false)}
                  />
                )}
              </div>

              {/* Box 4: Guests & Rooms */}
              <div 
                ref={guestRef} 
                onClick={() => {
                  setShowGuestPicker(!showGuestPicker);
                  setShowCheckInPicker(false);
                  setShowCheckOutPicker(false);
                  setShowDestDropdown(false);
                }}
                className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-3 xl:col-span-3 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">{t('search.guests')}</label>
                <div className="flex items-center justify-between gap-1 cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
                    <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap truncate">
                      {guestCount} Guests, {roomCount} Room
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${showGuestPicker ? 'rotate-180' : ''}`} />
                </div>

                {showGuestPicker && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Guests</p>
                        <p className="text-[10px] text-slate-500">Ages 13 or above</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{guestCount}</span>
                        <button
                          type="button"
                          onClick={() => setGuestCount(Math.min(20, guestCount + 1))}
                          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Rooms</p>
                        <p className="text-[10px] text-slate-500 font-medium">Number of rooms</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setRoomCount(Math.max(1, roomCount - 1))}
                          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{roomCount}</span>
                        <button
                          type="button"
                          onClick={() => setRoomCount(Math.min(10, roomCount + 1))}
                          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowGuestPicker(false)}
                        className="bg-[#006F3C] hover:bg-[#005C32] text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Box 5: Unified Search Button */}
              <div className="lg:col-span-2 flex items-stretch">
                <button
                  type="submit"
                  className="w-full h-full min-h-[50px] bg-[#006F3C] hover:bg-[#005C32] text-white font-bold rounded-2xl flex items-center justify-center gap-2 px-6 py-3.5 transition-all text-[14px] cursor-pointer shadow-md"
                >
                  <Search className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span className="whitespace-nowrap font-extrabold text-[14px]">
                    Search Homestays
                  </span>
                </button>
              </div>

            </div>
          </form>

          {/* Divider Line */}
          <div className="border-t border-slate-200/80" />

          {/* 5-Column Trust Assurance Bar matching screenshot */}
          <div className="bg-[#F8FAFC]/90 p-3 sm:p-4 rounded-b-3xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-center">
              
              <div className="flex items-center gap-3 text-slate-700 px-2 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-100/80 flex items-center justify-center text-[#006F3C] shrink-0">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-xs text-slate-900 leading-snug truncate">Best Price Guarantee</h5>
                  <p className="text-[10px] text-slate-500 truncate">We ensure you get the best price</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-2 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-100/80 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Calendar className="w-4 h-4 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-xs text-slate-900 leading-snug truncate">Free Cancellation</h5>
                  <p className="text-[10px] text-slate-500 truncate">Cancel up to 24 hours</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-2 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-100/80 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Star className="w-4 h-4 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-xs text-slate-900 leading-snug truncate">Instant Confirmation</h5>
                  <p className="text-[10px] text-slate-500 truncate">Book &amp; get confirmed</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-2 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-100/80 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Lock className="w-4 h-4 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-xs text-slate-900 leading-snug truncate">Secure Payments</h5>
                  <p className="text-[10px] text-slate-500 truncate">100% safe &amp; secure</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-2 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-100/80 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Headset className="w-4 h-4 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-xs text-slate-900 leading-snug truncate">24/7 Support</h5>
                  <p className="text-[10px] text-slate-500 truncate">We&apos;re here to help</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 3. EXPLORE HOMESTAYS BY EXPERIENCE SECTION (Matching screenshot exact layout) */}
      <section className="space-y-5 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Explore Homestays by Experience
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Find the perfect stay that matches your travel style
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onTriggerSearch) {
                onTriggerSearch({ type: 'homestay' });
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#006F3C] hover:text-[#005C32] hover:underline cursor-pointer group shrink-0"
          >
            <span>View all Homestays</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 5 Experience Cards Grid matching screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {experiences.map((exp) => {
            const IconComp = exp.icon;
            return (
              <div
                key={exp.id}
                onClick={() => {
                  setSelectedExperience(exp.title);
                  if (onTriggerSearch) {
                    onTriggerSearch({ type: 'homestay', experience: exp.title });
                  }
                }}
                className="relative h-56 rounded-3xl overflow-hidden cursor-pointer group shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between p-4"
              >
                {/* Image Background */}
                <img
                  src={exp.bgImage}
                  alt={exp.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/10" />

                <div className="relative z-10" />

                {/* Bottom Content: Left texts, Right icon badge */}
                <div className="relative z-10 flex items-end justify-between gap-2">
                  <div className="min-w-0 space-y-0.5 text-white">
                    <h4 className="font-extrabold text-sm text-white leading-tight">
                      {exp.title}
                    </h4>
                    <p className="text-[11px] text-slate-200 font-medium line-clamp-2 leading-tight">
                      {exp.subtitle}
                    </p>
                  </div>

                  <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 group-hover:bg-[#00A651] group-hover:border-[#00A651] transition-colors">
                    <IconComp className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SECTION: FEATURED HOMESTAYS CAROUSEL */}
      <section className="space-y-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span>Featured</span>
              <span className="text-[#006F3C]">Homestays</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Handpicked homestays for a comfortable and memorable stay
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onTriggerSearch) {
                onTriggerSearch({ type: 'homestay', destination: 'Gilgit-Baltistan' });
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#006F3C] hover:text-[#005C32] hover:underline cursor-pointer group shrink-0"
          >
            <span>View all Homestays</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Featured Homestays Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              id: 'hs-ft-1',
              title: 'Baltistan View Homestay',
              location: 'Skardu, Gilgit Baltistan',
              rating: 4.8,
              reviewsCount: 156,
              price: 6000,
              badge: 'Top Rated',
              badgeColor: 'bg-[#006F3C] text-white',
              image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80'
            },
            {
              id: 'hs-ft-2',
              title: 'Hunza Cozy Home',
              location: 'Hunza Valley, Gilgit Baltistan',
              rating: 4.7,
              reviewsCount: 128,
              price: 5500,
              badge: 'Best Seller',
              badgeColor: 'bg-amber-500 text-white',
              image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
            },
            {
              id: 'hs-ft-3',
              title: "Eagle's Nest Homestay",
              location: "Eagle's Nest, Hunza",
              rating: 4.9,
              reviewsCount: 112,
              price: 7000,
              badge: 'Family Friendly',
              badgeColor: 'bg-blue-600 text-white',
              image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80'
            },
            {
              id: 'hs-ft-4',
              title: 'Ganish Valley Stay',
              location: 'Ganish Valley, Skardu',
              rating: 4.6,
              reviewsCount: 98,
              price: 4000,
              badge: 'Popular',
              badgeColor: 'bg-[#006F3C] text-white',
              image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80'
            },
            {
              id: 'hs-ft-5',
              title: 'Khaplu Heritage Home',
              location: 'Khaplu, Gilgit Baltistan',
              rating: 4.7,
              reviewsCount: 87,
              price: 5000,
              badge: 'New',
              badgeColor: 'bg-sky-500 text-white',
              image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
            }
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => {
                const matched = INITIAL_LISTINGS.find(l => l.type === 'homestay') || {
                  id: item.id,
                  type: 'homestay',
                  title: item.title,
                  location: item.location,
                  price: item.price,
                  rating: item.rating,
                  reviewsCount: item.reviewsCount,
                  image: item.image,
                  images: [item.image],
                  description: `Authentic homestay experience in ${item.location} with local home-cooked meals and mountain views.`,
                  featured: true
                };
                onSelectListing(matched as Listing);
              }}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
            >
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-md ${item.badgeColor}`}>
                  {item.badge}
                </span>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-red-500 transition-colors shadow-md"
                >
                  <Heart className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#006F3C] transition-colors leading-snug line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-[11px] font-medium flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-[#006F3C] shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </p>

                  <div className="flex items-center gap-1 mt-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                    <span className="font-extrabold text-slate-900 text-xs">{item.rating}</span>
                    <span className="text-slate-400 text-[10px] font-medium">({item.reviewsCount} Reviews)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">
                    PKR {item.price.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">/night</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. VALUE PROPOSITION BAR BELOW FEATURED LISTINGS */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-100">
          <div className="flex items-center gap-3 pr-2 pt-2 sm:pt-0">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#006F3C] shrink-0">
              <Home className="w-5 h-5 text-[#006F3C]" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-slate-900 leading-snug">Local Hospitality</h5>
              <p className="text-[11px] text-slate-500">Feel like home with local families</p>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:pl-4 pr-2 pt-2 sm:pt-0">
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-slate-900 leading-snug">Authentic Experience</h5>
              <p className="text-[11px] text-slate-500">Live local, explore the real culture</p>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:pl-4 pr-2 pt-2 sm:pt-0">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#006F3C] shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#006F3C]" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-slate-900 leading-snug">Safe & Secure</h5>
              <p className="text-[11px] text-slate-500">Verified homestays for your safety</p>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:pl-4 pr-2 pt-2 sm:pt-0">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#006F3C] shrink-0">
              <Award className="w-5 h-5 text-[#006F3C]" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-slate-900 leading-snug">Best Price Guarantee</h5>
              <p className="text-[11px] text-slate-500">Get the best value for your stay</p>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:pl-4 pt-2 sm:pt-0">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Headset className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-slate-900 leading-snug">24/7 Assistance</h5>
              <p className="text-[11px] text-slate-500">We&apos;re here to help you anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TOP DESTINATIONS FOR HOMESTAYS */}
      <section className="space-y-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span>Top Destinations for</span>
              <span className="text-[#006F3C]">Homestays</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Stay close to nature and explore the beauty of Gilgit Baltistan
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onTriggerSearch) {
                onTriggerSearch({ type: 'destination' });
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#006F3C] hover:text-[#005C32] hover:underline cursor-pointer group shrink-0"
          >
            <span>View all Destinations</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 6 Destination Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { name: 'Hunza Valley', count: '120+ Homestays', img: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=600&q=80' },
            { name: 'Skardu', count: '140+ Homestays', img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80' },
            { name: 'Khaplu', count: '50+ Homestays', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
            { name: 'Astore Valley', count: '35+ Homestays', img: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80' },
            { name: 'Shigar Valley', count: '40+ Homestays', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80' },
            { name: 'Gojal Valley', count: '30+ Homestays', img: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=600&q=80' }
          ].map((dest, i) => (
            <div
              key={i}
              onClick={() => {
                setDestination(dest.name);
                setDestQuery(dest.name);
                if (onTriggerSearch) {
                  onTriggerSearch({ type: 'homestay', destination: dest.name });
                }
              }}
              className="relative h-44 rounded-2xl overflow-hidden cursor-pointer group shadow-2xs hover:shadow-xl transition-all duration-300"
            >
              <img
                src={dest.img}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h4 className="font-extrabold text-sm text-white leading-tight flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#4ade80] shrink-0" />
                  <span>{dest.name}</span>
                </h4>
                <p className="text-[10px] text-slate-200 font-medium mt-0.5 ml-4">
                  {dest.count}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. WHAT OUR GUESTS SAY (TESTIMONIALS) */}
      <section className="space-y-5 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              What Our <span className="text-[#006F3C]">Guests</span> Say
            </h3>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-bold text-[#006F3C]">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
              <span>4.8</span>
              <span className="text-slate-500 text-[10px] font-normal">Based on 2,348+ reviews</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="p-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: 'Ahmad Raza',
              location: 'Lahore, Pakistan',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
              text: 'The homestay was amazing! The family was incredibly welcoming and the home-cooked food was delicious. Felt like a home away from home.'
            },
            {
              name: 'Sara Khan',
              location: 'Islamabad, Pakistan',
              avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
              text: 'Staying with a local family gave us a true insight into the culture and lifestyle. Highly recommended for anyone visiting GB!'
            },
            {
              name: 'Omar Ali',
              location: 'Karachi, Pakistan',
              avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
              text: 'Beautiful location, peaceful environment and very supportive hosts. Will definitely visit again!'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3 relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{item.name}</h5>
                      <p className="text-[11px] text-slate-500">{item.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal italic">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>

              <div className="self-end pt-2 text-[#006F3C]/20">
                <Quote className="w-6 h-6 rotate-180" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. STAY LONGER, SAVE MORE PROMO BANNER */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-[#004d2a] to-[#006F3C] text-white shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-5 z-10">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Stay Longer, <span className="text-[#4ade80]">Save More!</span>
              </h3>
              <p className="text-slate-200 text-xs sm:text-sm max-w-lg font-medium">
                Get exclusive discounts on extended homestay bookings.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-xs font-bold">
                <Percent className="w-4 h-4 text-[#4ade80]" />
                <span><strong className="text-[#4ade80]">10% OFF</strong> on 3+ Nights</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-xs font-bold">
                <Percent className="w-4 h-4 text-[#4ade80]" />
                <span><strong className="text-[#4ade80]">15% OFF</strong> on 7+ Nights</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-xs font-bold">
                <Percent className="w-4 h-4 text-[#4ade80]" />
                <span><strong className="text-[#4ade80]">20% OFF</strong> on 14+ Nights</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onTriggerSearch) {
                    onTriggerSearch({ type: 'offer' });
                  }
                }}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Deals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 h-48 lg:h-full relative overflow-hidden min-h-[220px]">
            <img
              src="https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1000&q=80"
              alt="Mountain Balcony Homestay View"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#004d2a] via-transparent to-transparent lg:block hidden" />
          </div>
        </div>
      </section>

      {/* 8. NEWSLETTER & APP DOWNLOAD CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subscribe to Newsletter */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006F3C] flex items-center justify-center">
              <Send className="w-6 h-6 text-[#006F3C]" />
            </div>
            <h4 className="text-xl font-extrabold text-slate-900">
              Subscribe to Our <span className="text-[#006F3C]">Newsletter</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Get the latest homestay deals, travel tips &amp; updates delivered straight to your inbox.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="Enter your email address"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-[#006F3C]"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-[#006F3C] hover:bg-[#005C32] text-white rounded-xl text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Download App */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-4 shadow-2xs flex items-center justify-between gap-4 overflow-hidden relative">
          <div className="space-y-3 max-w-xs z-10">
            <h4 className="text-xl font-extrabold text-slate-900 leading-tight">
              Download the <span className="text-[#006F3C]">GBBookings</span> App
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Book homestays on the go, anytime, anywhere!
            </p>

            <div className="flex items-center gap-3 pt-1">
              <div className="p-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <QrCode className="w-10 h-10 text-slate-800" />
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-200">
                  Google Play
                </span>
                <span className="block text-[10px] font-bold text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-200">
                  App Store
                </span>
              </div>
            </div>
          </div>

          <div className="w-28 sm:w-36 shrink-0 z-10">
            <div className="bg-slate-900 rounded-2xl p-2 shadow-xl border-2 border-slate-800">
              <div className="bg-emerald-700 h-32 rounded-lg p-2 text-white text-[8px] space-y-1 flex flex-col justify-between">
                <span className="font-bold">GBBookings</span>
                <span className="text-[7px]">Find Perfect Stay in GB</span>
                <div className="bg-white/20 rounded p-1">
                  Homestays ⭐ 4.8
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
