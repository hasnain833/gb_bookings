import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, ShieldCheck, User, Award, Headset, Search, Calendar, Users, MapPin, 
  CheckCircle2, Star, Lock, Mountain, Waves, Wallet, ArrowRight, 
  ChevronDown, Filter, Heart, Check
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
      <section className="relative -mx-4 sm:-mx-8 lg:-mx-12 xl:-mx-16 -mt-8 md:-mt-12 overflow-hidden min-h-[500px] lg:min-h-[540px] shadow-2xl" id="homestay-hero-banner">
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
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-8 sm:pt-10 pb-28 sm:pb-32 flex flex-col justify-between h-full space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#062419]/80 border border-[#22c55e]/70 text-[#4ade80] text-xs font-bold backdrop-blur-md shadow-md">
              <Home className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
              <span className="tracking-tight text-white font-medium">Stay Local. Feel at Home.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mt-2">
            {/* Left Texts */}
            <div className="lg:col-span-8 space-y-4 text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-[1.12] drop-shadow-md">
                Authentic Homestays in <br />
                <span className="text-[#22c55e] font-black">Gilgit Baltistan</span>
              </h1>
              <p className="text-slate-100/95 text-sm sm:text-base md:text-lg font-medium max-w-xl leading-relaxed drop-shadow-xs">
                Experience warm hospitality, local culture, and breathtaking mountain views with our handpicked homestays.
              </p>

              {/* Trust Factors Row with Subtle Vertical Dividers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-white/15 divide-x-0 sm:divide-x divide-white/15" id="homestay-trust-factors">
                <div className="flex items-center gap-2.5 text-white pr-2">
                  <div className="w-9 h-9 rounded-full bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold tracking-tight text-white block leading-tight">Verified Stays</span>
                    <span className="text-[11px] font-medium text-slate-200 block leading-tight">Handpicked</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-white sm:pl-3 sm:pr-2">
                  <div className="w-9 h-9 rounded-full bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center shrink-0 shadow-inner">
                    <User className="w-4 h-4 text-[#4ade80]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold tracking-tight text-white block leading-tight">Local Hosts</span>
                    <span className="text-[11px] font-medium text-slate-200 block leading-tight">Warm Welcome</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-white sm:pl-3 sm:pr-2">
                  <div className="w-9 h-9 rounded-full bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center shrink-0 shadow-inner">
                    <Award className="w-4 h-4 text-[#4ade80]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold tracking-tight text-white block leading-tight">Best Rates</span>
                    <span className="text-[11px] font-medium text-slate-200 block leading-tight">Direct Pricing</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-white sm:pl-3">
                  <div className="w-9 h-9 rounded-full bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center shrink-0 shadow-inner">
                    <Headset className="w-4 h-4 text-[#4ade80]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold tracking-tight text-white block leading-tight">24/7 Support</span>
                    <span className="text-[11px] font-medium text-slate-200 block leading-tight">Always Available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Promo Card */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="bg-gradient-to-br from-[#0B5D3E] via-[#0D6E4A] to-[#043E28] rounded-3xl p-5 border border-[#16A34A]/35 text-white shadow-2xl relative overflow-hidden flex justify-between gap-4 max-w-md ml-auto">
                <div className="flex flex-col justify-between z-10 py-1 space-y-3">
                  <div>
                    <span className="inline-block bg-gradient-to-r from-[#FF7D29] to-[#EA580C] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2 shadow-sm">
                      SPECIAL HOMESTAY OFFERS
                    </span>
                    <p className="text-white/80 text-[11px] font-bold tracking-widest uppercase">UP TO</p>
                    <h3 className="text-4xl font-black text-white tracking-tighter leading-none mt-0.5">35% OFF</h3>
                    <p className="text-white/80 text-xs font-semibold mt-1.5">on local village stays</p>
                  </div>
                </div>
                <div className="relative w-36 h-32 shrink-0 rounded-2xl overflow-hidden shadow-lg border border-white/15 z-10 self-center">
                  <img 
                    src="https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=400&q=80" 
                    alt="Homestay promo" 
                    className="w-full h-full object-cover rounded-2xl"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Overlapping Booking / Search Widget Console (Identical proportions & layout to Homepage) */}
      <section className="-mt-20 sm:-mt-24 relative z-20 max-w-7xl mx-auto px-2 sm:px-4" id="homestay-search-console">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-visible">
          
          {/* Header Tab */}
          <div className="flex border-b border-[#F1F5F9] bg-[#FAFAFA] px-6 sm:px-8 gap-4 sm:gap-8 overflow-x-auto scrollbar-none rounded-t-3xl">
            <div className="flex items-center gap-2.5 py-4 px-1 border-b-2 border-[#047857] text-[#047857] font-bold text-[13px] uppercase tracking-wider">
              <Home className="w-4 h-4 text-[#047857]" />
              <span>Find Authentic Homestays</span>
            </div>
          </div>

          {/* Form Fields Section matching Homepage 5-Box structure */}
          <form onSubmit={handleSearchSubmit} className="p-4 sm:p-6 bg-slate-50/50 rounded-b-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-3.5 items-stretch relative">
              
              {/* Box 1: Where are you going? */}
              <div ref={destRef} className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-3 xl:col-span-3 relative">
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
                    placeholder={isRtl ? 'منزل یا علاقہ تلاش کریں' : 'Search destination or area'}
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
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#047857] flex items-center justify-center shrink-0">
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
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-2 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">{isRtl ? 'چیک ان' : 'Check-in'}</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-[#047857] transition-colors shrink-0" />
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
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-2 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">{isRtl ? 'چیک آؤٹ' : 'Check-out'}</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-[#047857] transition-colors shrink-0" />
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
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-3 xl:col-span-3 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">{t('search.guests')}</label>
                <div className="flex items-center justify-between gap-1 cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-4 h-4 text-slate-500 group-hover:text-[#047857] transition-colors shrink-0" />
                    <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap truncate">
                      {guestCount} Guest{guestCount > 1 ? 's' : ''}, {roomCount} Room{roomCount > 1 ? 's' : ''}
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
                        className="bg-[#047857] hover:bg-[#065f46] text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
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
                  className="w-full h-full min-h-[50px] bg-gradient-to-r from-[#047857] to-[#059669] hover:from-[#065f46] hover:to-[#047857] text-white font-bold rounded-xl flex items-center justify-center gap-2 px-6 py-3.5 transition-all hover:scale-[1.01] active:scale-[0.99] text-[14px] cursor-pointer shadow-sm"
                >
                  <Search className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span className="whitespace-nowrap font-extrabold text-[14px]">
                    Search Now
                  </span>
                </button>
              </div>

            </div>
          </form>
        </div>

        {/* 4-Column Trust Assurance Bar matching Homepage */}
        <div className="mt-5 bg-[#F8FAFC] border border-slate-200/70 rounded-2xl p-2 sm:p-3 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-200/80 items-center">
            
            <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#047857] shrink-0">
                <ShieldCheck className="w-5 h-5 shrink-0 text-[#047857]" />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Best Price Guarantee</h5>
                <p className="text-[11px] text-slate-500 break-words">We ensure you get the best price</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#047857] shrink-0">
                <Calendar className="w-5 h-5 shrink-0 text-[#047857]" />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Free Cancellation</h5>
                <p className="text-[11px] text-slate-500 break-words">Cancel up to 24 hours prior</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#047857] shrink-0">
                <Lock className="w-5 h-5 shrink-0 text-[#047857]" />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Verified Local Hosts</h5>
                <p className="text-[11px] text-slate-500 break-words">Direct local hospitality</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#047857] shrink-0">
                <Headset className="w-5 h-5 shrink-0 text-[#047857]" />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-[13px] text-slate-800 leading-snug">24/7 Local Support</h5>
                <p className="text-[11px] text-slate-500 break-words">Dedicated support team</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. SECTION: EXPLORE HOMESTAYS BY EXPERIENCE */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Explore Homestays by Experience
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Find the perfect stay that matches your travel style
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedExperience('All')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] hover:text-[#065f46] hover:underline cursor-pointer"
          >
            <span>View all Homestays</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5 Experience Cards Grid matching bento card height and proportions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {experiences.map((exp) => {
            const isSelected = selectedExperience === exp.title;
            const Icon = exp.icon;

            return (
              <div
                key={exp.id}
                onClick={() => setSelectedExperience(isSelected ? 'All' : exp.title)}
                className={`relative h-48 sm:h-52 rounded-2xl overflow-hidden cursor-pointer group shadow-2xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 ${
                  isSelected ? 'border-[#047857] ring-4 ring-emerald-500/20' : 'border-transparent'
                }`}
              >
                <img
                  src={exp.bgImage}
                  alt={exp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />

                <div className="absolute inset-0 p-4 flex flex-col justify-between text-white z-10">
                  {isSelected && (
                    <div className="self-start px-2.5 py-1 rounded-full bg-[#047857] text-white text-[10px] font-bold shadow-md">
                      Filtered
                    </div>
                  )}

                  <div className="mt-auto flex items-end justify-between gap-2">
                    <div className="space-y-0.5 pr-2">
                      <h4 className="font-extrabold text-white text-base sm:text-lg leading-snug">
                        {exp.title}
                      </h4>
                      <p className="text-slate-200 text-[11px] font-normal leading-tight line-clamp-2">
                        {exp.subtitle}
                      </p>
                    </div>

                    <div className={`p-2 rounded-full backdrop-blur-md border shrink-0 ${exp.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SECTION: HANDPICKED HOMESTAYS LISTING GRID */}
      <section className="space-y-6 pt-4">
        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#047857]" /> Filter:
            </span>
            {['All', 'Hunza Valley', 'Skardu', 'Shigar Valley', 'Passu', 'Altit'].map((loc) => (
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
            Showing <span className="font-bold text-slate-900">{homestayListings.length}</span> authentic homestays
          </p>
        </div>

        {/* Homestays Grid with Card Proportions, Badges & Buttons matching Homepage */}
        {homestayListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homestayListings.map((stay) => {
              const specs = stay.homestaySpecs;

              return (
                <div
                  key={stay.id}
                  onClick={() => onSelectListing(stay)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  {/* Top Image + Badges */}
                  <div className="relative h-52 sm:h-56 overflow-hidden bg-slate-100">
                    <img
                      src={stay.image}
                      alt={stay.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                    />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#047857]/90 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
                        <Home className="w-3 h-3" />
                        <span>{specs?.experienceType || 'Authentic Stay'}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-red-500 transition-colors shadow-md pointer-events-auto"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Host Badge */}
                    {specs?.hostName && (
                      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 border border-white/20">
                        <User className="w-3 h-3 text-[#4ade80]" />
                        <span>Host: {specs.hostName}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      {/* Location + Rating */}
                      <div className="flex items-center justify-between text-xs">
                        <p className="text-slate-500 font-medium flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                          <span className="truncate">{stay.location}</span>
                        </p>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                          <span className="font-bold text-amber-900 text-xs">{stay.rating}</span>
                          <span className="text-slate-400 text-[10px]">({stay.reviewsCount})</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-slate-900 text-lg group-hover:text-[#047857] transition-colors leading-snug line-clamp-1">
                        {stay.title}
                      </h4>

                      {/* Description */}
                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                        {stay.description}
                      </p>
                    </div>

                    {/* Amenities tags */}
                    {specs?.amenities && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {specs.amenities.slice(0, 3).map((am, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                          >
                            ✓ {am}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer: Price + Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Per Night</p>
                        <p className="text-base font-black text-slate-900">
                          PKR {stay.price.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ night</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectListing(stay);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065f46] text-white text-xs font-extrabold transition-all shadow-2xs group-hover:shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Book Stay</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <Home className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">No homestays found for this filter</h4>
            <p className="text-xs text-slate-500">Try changing your location or experience selection above.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedExperience('All');
                setSelectedLocationFilter('All');
              }}
              className="px-4 py-2 rounded-xl bg-[#047857] text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
