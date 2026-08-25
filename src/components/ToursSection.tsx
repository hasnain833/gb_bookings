import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass as TourIcon, ShieldCheck, User, Award, Headset, Search, Calendar, MapPin, 
  Star, Lock, ArrowRight, ChevronDown, Filter, Heart, Clock, Users, Check, Sparkles, Mountain
} from 'lucide-react';
import { Listing, handleImageError } from '../types';
import { INITIAL_LISTINGS } from '../data';
import { CalendarPickerDropdown } from './CalendarPickerDropdown';
import { useLanguage } from '../LanguageContext';

interface ToursSectionProps {
  onSelectListing: (listing: Listing) => void;
  onTriggerSearch?: (params: any) => void;
}

export default function ToursSection({ onSelectListing, onTriggerSearch }: ToursSectionProps) {
  const { t, isRtl } = useLanguage();

  // Search Form State
  const [region, setRegion] = useState('Hunza & Skardu');
  const [regionQuery, setRegionQuery] = useState('Hunza & Skardu');
  const [departureDate, setDepartureDate] = useState('2025-05-20');
  const [durationDays, setDurationDays] = useState('7 Days');
  const [travelersCount, setTravelersCount] = useState(2);

  // Dropdown toggles
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showTravelerPicker, setShowTravelerPicker] = useState(false);

  // Category Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('All');

  const regionRef = useRef<HTMLDivElement>(null);
  const travelerRef = useRef<HTMLDivElement>(null);
  const departureRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (regionRef.current && !regionRef.current.contains(event.target as Node)) {
        setShowRegionDropdown(false);
      }
      if (travelerRef.current && !travelerRef.current.contains(event.target as Node)) {
        setShowTravelerPicker(false);
      }
      if (departureRef.current && !departureRef.current.contains(event.target as Node)) {
        setShowDeparturePicker(false);
      }
      if (durationRef.current && !durationRef.current.contains(event.target as Node)) {
        setShowDurationPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tourRegions = [
    { name: 'Hunza & Skardu Expedition', region: 'Gilgit-Baltistan', desc: 'Autumn poplars, lakes & Karakoram forts' },
    { name: 'Deosai Plateau Wilderness', region: 'Skardu', desc: 'Brown bear safari & high-altitude stargazing' },
    { name: 'Khunjerab & Upper Hunza', region: 'Gojal', desc: 'China border, Passu Cones & Attabad lake' },
    { name: 'Cherry Blossom Special', region: 'Hunza Valley', desc: 'Spring blooms, Karimabad & Altit orchard walks' }
  ];

  const filteredRegions = tourRegions.filter(item =>
    item.name.toLowerCase().includes((regionQuery || region).toLowerCase()) ||
    item.region.toLowerCase().includes((regionQuery || region).toLowerCase())
  );

  // Tour Style Categories
  const categories = [
    {
      id: 'autumn-tours',
      title: 'Autumn Odyssey',
      subtitle: 'Golden poplars & red foliage landscapes',
      icon: Sparkles,
      bgImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-[#FF7D29]/20 text-[#FF7D29] border-[#FF7D29]/40'
    },
    {
      id: 'deosai-safari',
      title: 'Deosai Safari',
      subtitle: 'Land of Giants plateau & star glamping',
      icon: Mountain,
      bgImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40'
    },
    {
      id: 'blossom-tours',
      title: 'Spring Blossom',
      subtitle: 'Pink & white cherry blooms across Hunza',
      icon: TourIcon,
      bgImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-pink-500/20 text-pink-400 border-pink-400/40'
    },
    {
      id: 'luxury-expeditions',
      title: '5-Star Expeditions',
      subtitle: 'Luxury hotels, private 4x4 & flight tickets',
      icon: Award,
      bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-400/40'
    },
    {
      id: 'cultural-heritage',
      title: 'Heritage & Forts',
      subtitle: 'Baltit, Altit & Shigar royal heritage',
      icon: User,
      bgImage: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-400/40'
    }
  ];

  // Filter tour listings from INITIAL_LISTINGS
  const tourListings = INITIAL_LISTINGS.filter(item => {
    if (item.type !== 'tour') return false;
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
        type: 'tour',
        destination: region,
        dates: departureDate,
        guests: travelersCount
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
    <div className="space-y-12 pb-20 text-left" id="tours-page-container">
      
      {/* 1. Full-Bleed Hero Banner matching Homepage ratios */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-8 md:-mt-12 overflow-hidden min-h-[300px] sm:min-h-[330px] lg:min-h-[350px] shadow-xl" id="tour-hero-banner">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80" 
            alt="Autumn Odyssey in Hunza Valley"
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
            <div className="lg:col-span-10 space-y-3.5 text-left" id="tour-left-content">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-white/20 text-white text-[11px] font-semibold backdrop-blur-md shadow-md">
                  <TourIcon className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="tracking-tight text-white font-medium">All-Inclusive Tailored Mountain Expeditions</span>
                </div>
              </div>

              <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug drop-shadow-md">
                Guided Tour Packages in <span className="text-[#00A651] font-black">Gilgit Baltistan</span>
              </h1>
              <p className="text-slate-100/95 text-xs sm:text-sm font-medium max-w-xl leading-relaxed drop-shadow-xs">
                Handcrafted itineraries with stays at luxury resorts, private 4x4 Prado transportation, expert local guides &amp; fort entry permits included.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-6 pt-2 text-white" id="tour-trust-factors">
                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">All-Inclusive</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">Licensed Local Guides</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Award className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">Luxury Stays &amp; Meals</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Headset className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">24/7 Trip Manager</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Overlapping Booking Console */}
      <section className="-mt-12 sm:-mt-14 relative z-20 w-full" id="tour-search-console">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-visible">
          <div className="flex border-b border-[#F1F5F9] bg-[#FAFAFA] px-6 sm:px-8 gap-4 sm:gap-8 overflow-x-auto scrollbar-none rounded-t-3xl">
            <div className="flex items-center gap-2.5 py-4 px-1 border-b-2 border-[#006F3C] text-[#006F3C] font-bold text-[13px] uppercase tracking-wider">
              <TourIcon className="w-4 h-4 text-[#006F3C]" />
              <span>Search Guided Packages & Expeditions</span>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="p-4 sm:p-6 bg-slate-50/50 rounded-b-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-3.5 items-stretch relative">
              
              {/* Region */}
              <div ref={regionRef} className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-3 xl:col-span-3 relative">
                <label className="text-[11px] font-bold text-slate-700 tracking-tight">Destination Region</label>
                <div className="flex items-center gap-2 relative">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={showRegionDropdown ? regionQuery : region}
                    onChange={(e) => {
                      setRegionQuery(e.target.value);
                      setRegion(e.target.value);
                      setShowRegionDropdown(true);
                    }}
                    onFocus={() => {
                      setRegionQuery(region === 'Hunza & Skardu' ? '' : region);
                      setShowRegionDropdown(true);
                    }}
                    placeholder="Search Hunza, Skardu or Deosai"
                    className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 focus:outline-none p-0 cursor-text placeholder-slate-400"
                  />
                </div>

                {showRegionDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-72 overflow-y-auto p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Popular Tour Expeditions
                    </div>
                    {filteredRegions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setRegion(item.name);
                          setRegionQuery(item.name);
                          setShowRegionDropdown(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#006F3C]/10 text-[#006F3C] flex items-center justify-center shrink-0">
                            <TourIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{item.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#006F3C] bg-[#006F3C]/10 px-2 py-0.5 rounded-full">{item.region}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Departure Date */}
              <div 
                ref={departureRef}
                onClick={() => {
                  setShowDeparturePicker(!showDeparturePicker);
                  setShowDurationPicker(false);
                  setShowTravelerPicker(false);
                  setShowRegionDropdown(false);
                }}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-2 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">Departure Date</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
                  <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap">
                    {formatDateDisplay(departureDate)}
                  </span>
                </div>

                {showDeparturePicker && (
                  <CalendarPickerDropdown
                    title="Departure Date"
                    selectedDate={departureDate}
                    minDate={new Date().toISOString().split('T')[0]}
                    onChange={(newDate) => setDepartureDate(newDate)}
                    onClose={() => setShowDeparturePicker(false)}
                  />
                )}
              </div>

              {/* Duration */}
              <div 
                ref={durationRef}
                onClick={() => {
                  setShowDurationPicker(!showDurationPicker);
                  setShowDeparturePicker(false);
                  setShowTravelerPicker(false);
                  setShowRegionDropdown(false);
                }}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-2 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">Tour Duration</label>
                <div className="flex items-center justify-between gap-1 cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
                    <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap truncate">
                      {durationDays}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${showDurationPicker ? 'rotate-180' : ''}`} />
                </div>

                {showDurationPicker && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 sm:left-auto right-0 sm:right-auto mt-2 w-[calc(100vw-32px)] max-w-[240px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 space-y-1"
                  >
                    {['3 Days / 2 Nights', '5 Days / 4 Nights', '7 Days / 6 Nights', '10 Days / 9 Nights'].map((dur) => (
                      <div
                        key={dur}
                        onClick={() => {
                          setDurationDays(dur);
                          setShowDurationPicker(false);
                        }}
                        className={`p-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                          durationDays === dur ? 'bg-[#006F3C]/10 text-[#006F3C]' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {dur}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Travelers */}
              <div 
                ref={travelerRef} 
                onClick={() => {
                  setShowTravelerPicker(!showTravelerPicker);
                  setShowDeparturePicker(false);
                  setShowDurationPicker(false);
                  setShowRegionDropdown(false);
                }}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-3 xl:col-span-3 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">Travelers</label>
                <div className="flex items-center justify-between gap-1 cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
                    <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap truncate">
                      {travelersCount} Person{travelersCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${showTravelerPicker ? 'rotate-180' : ''}`} />
                </div>

                {showTravelerPicker && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 sm:left-auto right-0 sm:right-auto mt-2 w-[calc(100vw-32px)] max-w-[320px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Total Travelers</p>
                        <p className="text-[10px] text-slate-500">Group members & family</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setTravelersCount(Math.max(1, travelersCount - 1))}
                          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{travelersCount}</span>
                        <button
                          type="button"
                          onClick={() => setTravelersCount(Math.min(20, travelersCount + 1))}
                          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowTravelerPicker(false)}
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
                  className="w-full h-full min-h-[50px] bg-[#006F3C] hover:bg-[#005C32] text-white font-bold rounded-xl flex items-center justify-center gap-2 px-6 py-3.5 transition-all hover:scale-[1.01] active:scale-[0.99] text-[14px] cursor-pointer shadow-sm"
                >
                  <Search className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span className="whitespace-nowrap font-extrabold text-[14px]">
                    {isRtl ? 'ٹورز تلاش کریں' : 'Search Tours'}
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
                <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center text-[#006F3C] shrink-0">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">All-Inclusive Packages</h5>
                  <p className="text-[11px] text-slate-500 break-words">Hotels, meals & 4x4 included</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center text-[#006F3C] shrink-0">
                  <User className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Licensed Local Guides</h5>
                  <p className="text-[11px] text-slate-500 break-words">English & Urdu speaking</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Award className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Private & Group Options</h5>
                  <p className="text-[11px] text-slate-500 break-words">Tailored to your needs</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Headset className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">On-Ground Support</h5>
                  <p className="text-[11px] text-slate-500 break-words">Dedicated trip director</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: EXPLORE TOURS BY STYLE */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Explore Tour Packages by Style
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Autumn foliage, Deosai safari expeditions & cherry blossom group tours
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006F3C] hover:text-[#005C32] hover:underline cursor-pointer"
          >
            <span>View all Tour Packages</span>
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
                  isSelected ? 'border-[#006F3C] ring-4 ring-[#006F3C]/20' : 'border-transparent'
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

      {/* 4. SECTION: HANDPICKED TOURS GRID */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#006F3C]" /> Destination:
            </span>
            {['All', 'Hunza', 'Skardu', 'Deosai', 'Passu'].map((loc) => (
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
            Showing <span className="font-bold text-slate-900">{tourListings.length}</span> guided tour packages
          </p>
        </div>

        {tourListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {tourListings.map((tour) => {
              const specs = tour.tourSpecs;

              return (
                <div
                  key={tour.id}
                  onClick={() => onSelectListing(tour)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#006F3C]/60 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  {/* Top Image + Badges */}
                  <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={tour.image}
                      alt={tour.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                    />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#006F3C]/90 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
                        <Clock className="w-3 h-3" />
                        <span>{specs?.durationDays ? `${specs.durationDays} Days / ${specs.durationDays - 1} Nights` : 'All Inclusive'}</span>
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

                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 border border-white/20">
                      <Users className="w-3 h-3 text-[#006F3C]" />
                      <span>Max Group: {specs?.maxGroupSize || 12} People</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <p className="text-slate-500 font-medium flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#006F3C] shrink-0" />
                          <span className="truncate">{tour.location}</span>
                        </p>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                          <span className="font-bold text-amber-900 text-xs">{tour.rating}</span>
                          <span className="text-slate-400 text-[10px]">({tour.reviewsCount})</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-[#006F3C] transition-colors leading-snug line-clamp-1 break-words">
                        {tour.title}
                      </h4>

                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                        {tour.description}
                      </p>
                    </div>

                    {specs?.included && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {specs.included.slice(0, 3).map((inc, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold flex items-center gap-1 truncate max-w-[160px]"
                          >
                            <Check className="w-3 h-3 text-[#006F3C] shrink-0" />
                            <span className="truncate">{inc}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Package Price</p>
                        <p className="text-sm sm:text-base font-black text-slate-900">
                          PKR {tour.price.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ traveler</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectListing(tour);
                        }}
                        className="min-h-[42px] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#006F3C] hover:bg-[#005C32] text-white text-xs font-extrabold transition-all shadow-2xs group-hover:shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>Book Expedition</span>
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
            <TourIcon className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">No tour packages found for this filter</h4>
            <p className="text-xs text-slate-500">Try changing your location selection above.</p>
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
