import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, ShieldCheck, User, Award, Headset, Search, Calendar, Users, MapPin, 
  Star, Lock, Mountain, Waves, Sparkles, ArrowRight, ChevronDown, Filter, Heart, Bed, Coffee
} from 'lucide-react';
import { Listing, handleImageError } from '../types';
import { INITIAL_LISTINGS } from '../data';
import { CalendarPickerDropdown } from './CalendarPickerDropdown';
import { useLanguage } from '../LanguageContext';

interface HotelsSectionProps {
  onSelectListing: (listing: Listing) => void;
  onTriggerSearch?: (params: any) => void;
}

export default function HotelsSection({ onSelectListing, onTriggerSearch }: HotelsSectionProps) {
  const { t, isRtl } = useLanguage();

  // Search Form State
  const [destination, setDestination] = useState('Skardu');
  const [destQuery, setDestQuery] = useState('Skardu');
  const [checkIn, setCheckIn] = useState('2025-05-20');
  const [checkOut, setCheckOut] = useState('2025-05-23');
  const [guestCount, setGuestCount] = useState(2);
  const [roomCount, setRoomCount] = useState(1);

  // Dropdown toggles
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  // Category Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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
    { name: 'Attabad Lake', region: 'Hunza Valley', desc: 'Luxury lakeside resorts & cliffside views' },
    { name: 'Skardu', region: 'Gilgit-Baltistan', desc: 'Shangrila, Lower Kachura & Deosai access' },
    { name: 'Karimabad', region: 'Hunza', desc: 'Heritage hotels & Eagle Nest viewpoints' },
    { name: 'Islamabad', region: 'Capital District', desc: '5-Star luxury & Margalla Hills views' },
    { name: 'Malam Jabba', region: 'Swat Valley', desc: 'Alpine ski resorts & chairlift access' },
    { name: 'Shigar Valley', region: 'Baltistan', desc: 'Fort resorts & historic stone architecture' }
  ];

  const filteredDestinations = destinationsList.filter(item =>
    item.name.toLowerCase().includes((destQuery || destination).toLowerCase()) ||
    item.region.toLowerCase().includes((destQuery || destination).toLowerCase()) ||
    item.desc.toLowerCase().includes((destQuery || destination).toLowerCase())
  );

  // Hotel Categories
  const categories = [
    {
      id: 'luxury-resorts',
      title: 'Luxury Resorts',
      subtitle: '5-Star world-class amenities & views',
      icon: Sparkles,
      bgImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40'
    },
    {
      id: 'lakeside-resorts',
      title: 'Lakeside Lodges',
      subtitle: 'Direct water edge & private boating',
      icon: Waves,
      bgImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40'
    },
    {
      id: 'alpine-lodges',
      title: 'Alpine Ski Lodges',
      subtitle: 'Ski-in / ski-out with fireside lounges',
      icon: Mountain,
      bgImage: 'https://images.unsplash.com/photo-1518098268026-4e43a1a009de?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-400/40'
    },
    {
      id: 'heritage-hotels',
      title: 'Heritage Forts',
      subtitle: 'Restored royal castles & fort suites',
      icon: Building2,
      bgImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-400/40'
    },
    {
      id: 'boutique-stays',
      title: 'Boutique Stays',
      subtitle: 'Cozy, personalized mountain hospitality',
      icon: Bed,
      bgImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-purple-500/20 text-purple-400 border-purple-400/40'
    }
  ];

  // Filter hotel listings from INITIAL_LISTINGS
  const hotelListings = INITIAL_LISTINGS.filter(item => {
    if (item.type !== 'hotel') return false;
    if (selectedCategory !== 'All') {
      const hType = item.hotelSpecs?.hotelType;
      if (hType && !hType.toLowerCase().includes(selectedCategory.toLowerCase())) {
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
        type: 'hotel',
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
    <div className="space-y-12 pb-20 text-left" id="hotels-page-container">
      
      {/* 1. Full-Bleed Hero Banner matching Homepage ratios */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-8 md:-mt-12 overflow-hidden min-h-[300px] sm:min-h-[330px] lg:min-h-[350px] shadow-xl" id="hotel-hero-banner">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80" 
            alt="Luxury Resort in Hunza Valley"
            className="w-full h-full object-cover object-center scale-105"
            referrerPolicy="no-referrer"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-slate-950/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 md:pt-16 pb-14 sm:pb-16 flex flex-col justify-start items-start h-full text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
            <div className="lg:col-span-10 space-y-3.5 text-left" id="hotel-left-content">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-white/20 text-white text-[11px] font-semibold backdrop-blur-md shadow-md">
                  <Building2 className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="tracking-tight text-white font-medium">World-Class Alpine Hospitality</span>
                </div>
              </div>

              <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug drop-shadow-md">
                Luxury Hotels &amp; Resorts in <span className="text-[#00A651] font-black">Gilgit Baltistan</span>
              </h1>
              <p className="text-slate-100/95 text-xs sm:text-sm font-medium max-w-xl leading-relaxed drop-shadow-xs">
                From heated infinity pools on turquoise lake edges to alpine ski lodges and heritage fort hotels.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-6 pt-2 text-white" id="hotel-trust-factors">
                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">Best Rate Guaranteed</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Award className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">5-Star Standards</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Calendar className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">Free Cancellation</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Headset className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Overlapping Booking Console */}
      <section className="-mt-12 sm:-mt-14 relative z-20 w-full" id="hotel-search-console">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-visible">
          <div className="flex border-b border-[#F1F5F9] bg-[#FAFAFA] px-6 sm:px-8 gap-4 sm:gap-8 overflow-x-auto scrollbar-none rounded-t-3xl">
            <div className="flex items-center gap-2.5 py-4 px-1 border-b-2 border-[#006F3C] text-[#006F3C] font-bold text-[13px] uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-[#006F3C]" />
              <span>Search Luxury Hotels & Resorts</span>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="p-4 sm:p-6 bg-slate-50/50 rounded-b-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-3.5 items-stretch relative">
              
              {/* Destination */}
              <div ref={destRef} className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-3 xl:col-span-3 relative">
                <label className="text-[11px] font-bold text-slate-700 tracking-tight">{isRtl ? 'کہاں جانا چاہتے ہیں؟' : 'Where are you staying?'}</label>
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
                      setDestQuery(destination === 'Skardu' ? '' : destination);
                      setShowDestDropdown(true);
                    }}
                    placeholder="Search city, lake or valley"
                    className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 focus:outline-none p-0 cursor-text placeholder-slate-400"
                  />
                </div>

                {showDestDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-72 overflow-y-auto p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Popular Hotel Locations
                    </div>
                    {filteredDestinations.map((item, idx) => (
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
                    ))}
                  </div>
                )}
              </div>

              {/* Check-in */}
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
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">Check-in Date</label>
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

              {/* Check-out */}
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
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">Check-out Date</label>
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

              {/* Guests & Rooms */}
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
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">Guests & Rooms</label>
                <div className="flex items-center justify-between gap-1 cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
                    <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap truncate">
                      {guestCount} Guest{guestCount > 1 ? 's' : ''}, {roomCount} Room{roomCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${showGuestPicker ? 'rotate-180' : ''}`} />
                </div>

                {showGuestPicker && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 sm:left-auto right-0 sm:right-auto mt-2 w-[calc(100vw-32px)] max-w-[320px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Guests</p>
                        <p className="text-[10px] text-slate-500">Adults & Children</p>
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
                        <p className="text-[10px] text-slate-500">Suites / Rooms</p>
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

              {/* Button */}
              <div className="lg:col-span-2 flex items-stretch">
                <button
                  type="submit"
                  className="w-full h-full min-h-[50px] bg-gradient-to-r from-[#006F3C] to-[#005C32] hover:from-[#005C32] hover:to-[#006F3C] text-white font-bold rounded-xl flex items-center justify-center gap-2 px-6 py-3.5 transition-all hover:scale-[1.01] active:scale-[0.99] text-[14px] cursor-pointer shadow-sm"
                >
                  <Search className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span className="whitespace-nowrap font-extrabold text-[14px]">
                    {isRtl ? 'ہوٹل تلاش کریں' : 'Search Hotels'}
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
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Best Rate Guarantee</h5>
                  <p className="text-[11px] text-slate-500 break-words">No booking markup fees</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Calendar className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Instant Confirmation</h5>
                  <p className="text-[11px] text-slate-500 break-words">Guaranteed room availability</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Award className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Verified Luxury</h5>
                  <p className="text-[11px] text-slate-500 break-words">Inspected & certified stays</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Headset className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">24/7 Concierge</h5>
                  <p className="text-[11px] text-slate-500 break-words">Personalized travel desk</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: EXPLORE HOTELS BY CATEGORY */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Explore Hotels by Category
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Choose from luxury resorts, lakeside lodges & historic castle stays
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006F3C] hover:text-[#005C32] hover:underline cursor-pointer"
          >
            <span>View all Hotels</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.title;
            const Icon = cat.icon;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? 'All' : cat.title)}
                className={`relative h-44 sm:h-52 rounded-2xl overflow-hidden cursor-pointer group shadow-2xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 ${
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

                <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between text-white z-10">
                  {isSelected && (
                    <div className="self-start px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#006F3C] text-white text-[9px] sm:text-[10px] font-bold shadow-md">
                      Filtered
                    </div>
                  )}

                  <div className="mt-auto flex items-end justify-between gap-1.5 sm:gap-2">
                    <div className="space-y-0.5 pr-1 min-w-0">
                      <h4 className="font-extrabold text-white text-sm sm:text-base lg:text-lg leading-snug truncate">
                        {cat.title}
                      </h4>
                      <p className="text-slate-200 text-[10px] sm:text-[11px] font-normal leading-tight line-clamp-2">
                        {cat.subtitle}
                      </p>
                    </div>

                    <div className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md border shrink-0 ${cat.iconBg}`}>
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SECTION: HANDPICKED HOTELS GRID */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#006F3C]" /> Location:
            </span>
            {['All', 'Attabad Lake', 'Skardu', 'Islamabad', 'Swat'].map((loc) => (
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
            Showing <span className="font-bold text-slate-900">{hotelListings.length}</span> luxury hotels & resorts
          </p>
        </div>

        {hotelListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {hotelListings.map((hotel) => {
              const specs = hotel.hotelSpecs;

              return (
                <div
                  key={hotel.id}
                  onClick={() => onSelectListing(hotel)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={hotel.image}
                      alt={hotel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                    />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#006F3C]/90 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
                        <Building2 className="w-3 h-3" />
                        <span>{specs?.hotelType || 'Luxury Hotel'}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-red-500 transition-colors shadow-md pointer-events-auto"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>

                    {specs?.roomsAvailable && (
                      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 border border-white/20">
                        <Bed className="w-3 h-3 text-[#4ade80]" />
                        <span>{specs.roomsAvailable} Rooms Left</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <p className="text-slate-500 font-medium flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#006F3C] shrink-0" />
                          <span className="truncate">{hotel.location}</span>
                        </p>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                          <span className="font-bold text-amber-900 text-xs">{hotel.rating}</span>
                          <span className="text-slate-400 text-[10px]">({hotel.reviewsCount})</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-[#006F3C] transition-colors leading-snug line-clamp-1 break-words">
                        {hotel.title}
                      </h4>

                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                        {hotel.description}
                      </p>
                    </div>

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

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Per Night</p>
                        <p className="text-sm sm:text-base font-black text-slate-900">
                          PKR {hotel.price.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ night</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectListing(hotel);
                        }}
                        className="min-h-[42px] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#006F3C] hover:bg-[#005C32] text-white text-xs font-extrabold transition-all shadow-2xs group-hover:shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>Book Room</span>
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
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">No hotels found for this filter</h4>
            <p className="text-xs text-slate-500">Try changing your location or category selection above.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedLocationFilter('All');
              }}
              className="px-4 py-2 rounded-xl bg-[#006F3C] text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
