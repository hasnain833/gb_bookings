import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, ShieldCheck, User, Award, Headset, Search, Calendar, MapPin, 
  Star, Lock, ArrowRight, ChevronDown, Filter, Heart, Fuel, Gauge, Users, CheckCircle2
} from 'lucide-react';
import { Listing, handleImageError } from '../types';
import { INITIAL_LISTINGS } from '../data';
import { CalendarPickerDropdown } from './CalendarPickerDropdown';
import { useLanguage } from '../LanguageContext';

interface CarsSectionProps {
  onSelectListing: (listing: Listing) => void;
  onTriggerSearch?: (params: any) => void;
}

export default function CarsSection({ onSelectListing, onTriggerSearch }: CarsSectionProps) {
  const { t, isRtl } = useLanguage();

  // Search Form State
  const [pickupLocation, setPickupLocation] = useState('Skardu');
  const [locQuery, setLocQuery] = useState('Skardu');
  const [pickupDate, setPickupDate] = useState('2025-05-20');
  const [returnDate, setReturnDate] = useState('2025-05-23');
  const [carType, setCarType] = useState('4x4 SUV');
  const [withChauffeur, setWithChauffeur] = useState(true);

  // Dropdown toggles
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Category Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('All');

  const locRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const pickupRef = useRef<HTMLDivElement>(null);
  const returnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(event.target as Node)) {
        setShowLocDropdown(false);
      }
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setShowTypePicker(false);
      }
      if (pickupRef.current && !pickupRef.current.contains(event.target as Node)) {
        setShowPickupPicker(false);
      }
      if (returnRef.current && !returnRef.current.contains(event.target as Node)) {
        setShowReturnPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pickupLocations = [
    { name: 'Skardu Airport & City', region: 'Skardu', desc: 'Direct airport pickup & Deosai 4x4' },
    { name: 'Gilgit Airport & City', region: 'Gilgit', desc: 'Hunza & Karakoram Highway rental' },
    { name: 'Hunza Karimabad', region: 'Hunza', desc: 'Passu, Attabad & Khunjerab drives' },
    { name: 'Islamabad Airport', region: 'Islamabad', desc: 'Long-haul luxury highway cruisers' }
  ];

  const filteredLocations = pickupLocations.filter(item =>
    item.name.toLowerCase().includes((locQuery || pickupLocation).toLowerCase()) ||
    item.region.toLowerCase().includes((locQuery || pickupLocation).toLowerCase())
  );

  // Vehicle Categories
  const categories = [
    {
      id: 'suv-4x4',
      title: '4x4 Mountain SUVs',
      subtitle: 'Land Cruiser & Prado for rough terrain',
      icon: Car,
      bgImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40'
    },
    {
      id: 'fortuner',
      title: 'Fortuner Cruisers',
      subtitle: 'Comfortable power drives for families',
      icon: Gauge,
      bgImage: 'https://images.unsplash.com/photo-1606016159991-dfe4f974be5c?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-400/40'
    },
    {
      id: 'grand-cabin',
      title: 'Executive Vans',
      subtitle: 'Hiace Grand Cabin for group tours',
      icon: Users,
      bgImage: 'https://images.unsplash.com/photo-1520050206274-a1ae446cb3cc?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-purple-500/20 text-purple-400 border-purple-400/40'
    },
    {
      id: 'hatchback',
      title: 'Budget Hatchbacks',
      subtitle: 'Economical city & local road drives',
      icon: Fuel,
      bgImage: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-400/40'
    },
    {
      id: 'sedans',
      title: 'Highway Sedans',
      subtitle: 'Smooth, stylish Honda Civic & Corollas',
      icon: Car,
      bgImage: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=800&q=80',
      iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40'
    }
  ];

  // Filter car listings from INITIAL_LISTINGS
  const carListings = INITIAL_LISTINGS.filter(item => {
    if (item.type !== 'car') return false;
    if (selectedCategory !== 'All') {
      const category = item.carSpecs?.category;
      if (category && !category.toLowerCase().includes(selectedCategory.toLowerCase())) {
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
        type: 'car',
        destination: pickupLocation,
        dates: `${pickupDate} to ${returnDate}`,
        extra: { carType, withDriver: withChauffeur }
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
    <div className="space-y-12 pb-20 text-left" id="cars-page-container">
      
      {/* 1. Full-Bleed Hero Banner matching Homepage ratios */}
      <section className="relative -mx-4 sm:-mx-8 lg:-mx-12 xl:-mx-16 -mt-8 md:-mt-12 overflow-hidden min-h-[500px] lg:min-h-[540px] shadow-2xl" id="car-hero-banner">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=2000&q=80" 
            alt="Toyota Land Cruiser 4x4 Mountain Drive"
            className="w-full h-full object-cover object-center scale-105"
            referrerPolicy="no-referrer"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-slate-950/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-8 sm:pt-10 pb-28 sm:pb-32 flex flex-col justify-between h-full space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#062419]/80 border border-[#22c55e]/70 text-[#4ade80] text-xs font-bold backdrop-blur-md shadow-md">
              <Car className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
              <span className="tracking-tight text-white font-medium">Rugged 4x4 & Luxury Chauffeur Fleet</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mt-2">
            <div className="lg:col-span-8 space-y-4 text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-[1.12] drop-shadow-md">
                Rent Premium 4x4 Vehicles in <br />
                <span className="text-[#22c55e] font-black">Gilgit & Skardu</span>
              </h1>
              <p className="text-slate-100/95 text-sm sm:text-base md:text-lg font-medium max-w-xl leading-relaxed drop-shadow-xs">
                Explore Deosai, Khunjerab Pass & Babusar Top with insured 4x4 SUVs, experienced mountain drivers & zero hidden fees.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-white/15 divide-x-0 sm:divide-x divide-white/15" id="car-trust-factors">
                <div className="flex items-center gap-2.5 text-white pr-2">
                  <div className="w-9 h-9 rounded-full bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center shrink-0 shadow-inner">
                    <User className="w-4 h-4 text-[#4ade80]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold tracking-tight text-white block leading-tight">Expert Chauffeurs</span>
                    <span className="text-[11px] font-medium text-slate-200 block leading-tight">Mountain Skilled</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-white sm:pl-3 sm:pr-2">
                  <div className="w-9 h-9 rounded-full bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold tracking-tight text-white block leading-tight">Fully Insured</span>
                    <span className="text-[11px] font-medium text-slate-200 block leading-tight">Backup Vehicle</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-white sm:pl-3 sm:pr-2">
                  <div className="w-9 h-9 rounded-full bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center shrink-0 shadow-inner">
                    <Award className="w-4 h-4 text-[#4ade80]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold tracking-tight text-white block leading-tight">Zero Hidden Cost</span>
                    <span className="text-[11px] font-medium text-slate-200 block leading-tight">Transparent Fuel</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-white sm:pl-3">
                  <div className="w-9 h-9 rounded-full bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center shrink-0 shadow-inner">
                    <Headset className="w-4 h-4 text-[#4ade80]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12px] font-bold tracking-tight text-white block leading-tight">Roadside Care</span>
                    <span className="text-[11px] font-medium text-slate-200 block leading-tight">24/7 Dispatch</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 hidden lg:block">
              <div className="bg-gradient-to-br from-[#0B5D3E] via-[#0D6E4A] to-[#043E28] rounded-3xl p-5 border border-[#16A34A]/35 text-white shadow-2xl relative overflow-hidden flex justify-between gap-4 max-w-md ml-auto">
                <div className="flex flex-col justify-between z-10 py-1 space-y-3">
                  <div>
                    <span className="inline-block bg-gradient-to-r from-[#FF7D29] to-[#EA580C] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2 shadow-sm">
                      4X4 FLEET SPECIAL
                    </span>
                    <p className="text-white/80 text-[11px] font-bold tracking-widest uppercase">DISCOUNT UP TO</p>
                    <h3 className="text-4xl font-black text-white tracking-tighter leading-none mt-0.5">25% OFF</h3>
                    <p className="text-white/80 text-xs font-semibold mt-1.5">on Land Cruiser weekly hires</p>
                  </div>
                </div>
                <div className="relative w-36 h-32 shrink-0 rounded-2xl overflow-hidden shadow-lg border border-white/15 z-10 self-center">
                  <img 
                    src="https://images.unsplash.com/photo-1606016159991-dfe4f974be5c?auto=format&fit=crop&w=400&q=80" 
                    alt="Car rental promo" 
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

      {/* 2. Overlapping Booking Console */}
      <section className="-mt-20 sm:-mt-24 relative z-20 max-w-7xl mx-auto px-2 sm:px-4" id="car-search-console">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-visible">
          <div className="flex border-b border-[#F1F5F9] bg-[#FAFAFA] px-6 sm:px-8 gap-4 sm:gap-8 overflow-x-auto scrollbar-none rounded-t-3xl">
            <div className="flex items-center gap-2.5 py-4 px-1 border-b-2 border-[#047857] text-[#047857] font-bold text-[13px] uppercase tracking-wider">
              <Car className="w-4 h-4 text-[#047857]" />
              <span>Find & Reserve 4x4 Vehicles</span>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="p-4 sm:p-6 bg-slate-50/50 rounded-b-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-3.5 items-stretch relative">
              
              {/* Pickup Location */}
              <div ref={locRef} className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-3 xl:col-span-3 relative">
                <label className="text-[11px] font-bold text-slate-700 tracking-tight">Pick-up Location</label>
                <div className="flex items-center gap-2 relative">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={showLocDropdown ? locQuery : pickupLocation}
                    onChange={(e) => {
                      setLocQuery(e.target.value);
                      setPickupLocation(e.target.value);
                      setShowLocDropdown(true);
                    }}
                    onFocus={() => {
                      setLocQuery(pickupLocation === 'Skardu' ? '' : pickupLocation);
                      setShowLocDropdown(true);
                    }}
                    placeholder="Airport or city pickup"
                    className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 focus:outline-none p-0 cursor-text placeholder-slate-400"
                  />
                </div>

                {showLocDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-72 overflow-y-auto p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Popular Pick-up Locations
                    </div>
                    {filteredLocations.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setPickupLocation(item.name);
                          setLocQuery(item.name);
                          setShowLocDropdown(false);
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
                    ))}
                  </div>
                )}
              </div>

              {/* Pickup Date */}
              <div 
                ref={pickupRef}
                onClick={() => {
                  setShowPickupPicker(!showPickupPicker);
                  setShowReturnPicker(false);
                  setShowTypePicker(false);
                  setShowLocDropdown(false);
                }}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-2 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">Pick-up Date</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-[#047857] transition-colors shrink-0" />
                  <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap">
                    {formatDateDisplay(pickupDate)}
                  </span>
                </div>

                {showPickupPicker && (
                  <CalendarPickerDropdown
                    title="Pick-up Date"
                    selectedDate={pickupDate}
                    minDate={new Date().toISOString().split('T')[0]}
                    onChange={(newDate) => {
                      setPickupDate(newDate);
                      if (newDate > returnDate) {
                        setReturnDate(newDate);
                      }
                    }}
                    onClose={() => setShowPickupPicker(false)}
                  />
                )}
              </div>

              {/* Drop-off Date */}
              <div 
                ref={returnRef}
                onClick={() => {
                  setShowReturnPicker(!showReturnPicker);
                  setShowPickupPicker(false);
                  setShowTypePicker(false);
                  setShowLocDropdown(false);
                }}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-2 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">Return Date</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-[#047857] transition-colors shrink-0" />
                  <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap">
                    {formatDateDisplay(returnDate)}
                  </span>
                </div>

                {showReturnPicker && (
                  <CalendarPickerDropdown
                    title="Return Date"
                    selectedDate={returnDate}
                    minDate={pickupDate}
                    onChange={(newDate) => setReturnDate(newDate)}
                    onClose={() => setShowReturnPicker(false)}
                  />
                )}
              </div>

              {/* Vehicle Type & Chauffeur */}
              <div 
                ref={typeRef} 
                onClick={() => {
                  setShowTypePicker(!showTypePicker);
                  setShowPickupPicker(false);
                  setShowReturnPicker(false);
                  setShowLocDropdown(false);
                }}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-3 xl:col-span-3 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">Vehicle & Driver Option</label>
                <div className="flex items-center justify-between gap-1 cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <Car className="w-4 h-4 text-slate-500 group-hover:text-[#047857] transition-colors shrink-0" />
                    <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap truncate">
                      {carType} • {withChauffeur ? 'With Driver' : 'Self Drive'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${showTypePicker ? 'rotate-180' : ''}`} />
                </div>

                {showTypePicker && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 space-y-4"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 mb-2">Select Vehicle Type</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['4x4 SUV', 'Prado', 'Van', 'Sedan', 'Hatchback'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setCarType(type)}
                            className={`p-2 rounded-xl text-xs font-bold text-left border ${
                              carType === type ? 'bg-emerald-50 text-[#047857] border-emerald-300' : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Chauffeur Service</p>
                        <p className="text-[10px] text-slate-500">Includes experienced local driver</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWithChauffeur(!withChauffeur)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          withChauffeur ? 'bg-[#047857]' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          withChauffeur ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowTypePicker(false)}
                        className="bg-[#047857] hover:bg-[#065f46] text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
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
                  className="w-full h-full min-h-[50px] bg-gradient-to-r from-[#047857] to-[#059669] hover:from-[#065f46] hover:to-[#047857] text-white font-bold rounded-xl flex items-center justify-center gap-2 px-6 py-3.5 transition-all hover:scale-[1.01] active:scale-[0.99] text-[14px] cursor-pointer shadow-sm"
                >
                  <Search className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span className="whitespace-nowrap font-extrabold text-[14px]">
                    Search Cars
                  </span>
                </button>
              </div>

            </div>
          </form>
        </div>

        {/* 4-Column Trust Assurance Bar */}
        <div className="mt-5 bg-[#F8FAFC] border border-slate-200/70 rounded-2xl p-2 sm:p-3 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-200/80 items-center">
            <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#047857] shrink-0">
                <User className="w-5 h-5 shrink-0 text-[#047857]" />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Experienced Drivers</h5>
                <p className="text-[11px] text-slate-500 break-words">Karakoram terrain experts</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#047857] shrink-0">
                <ShieldCheck className="w-5 h-5 shrink-0 text-[#047857]" />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Insured Fleet</h5>
                <p className="text-[11px] text-slate-500 break-words">Complete trip coverage</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#047857] shrink-0">
                <Gauge className="w-5 h-5 shrink-0 text-[#047857]" />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Unlimited Mileage</h5>
                <p className="text-[11px] text-slate-500 break-words">Explore without caps</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#047857] shrink-0">
                <Headset className="w-5 h-5 shrink-0 text-[#047857]" />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-[13px] text-slate-800 leading-snug">24/7 Road Dispatch</h5>
                <p className="text-[11px] text-slate-500 break-words">Backup vehicle standing by</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: EXPLORE CARS BY CATEGORY */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Explore Vehicles by Category
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Select rugged 4x4 Land Cruisers, group vans, or economical sedans
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] hover:text-[#065f46] hover:underline cursor-pointer"
          >
            <span>View all Vehicles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.title;
            const Icon = cat.icon;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? 'All' : cat.title)}
                className={`relative h-48 sm:h-52 rounded-2xl overflow-hidden cursor-pointer group shadow-2xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 ${
                  isSelected ? 'border-[#047857] ring-4 ring-emerald-500/20' : 'border-transparent'
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
                    <div className="self-start px-2.5 py-1 rounded-full bg-[#047857] text-white text-[10px] font-bold shadow-md">
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

      {/* 4. SECTION: HANDPICKED CARS GRID */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#047857]" /> Region:
            </span>
            {['All', 'Skardu', 'Gilgit', 'Hunza', 'Islamabad'].map((loc) => (
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
            Showing <span className="font-bold text-slate-900">{carListings.length}</span> verified vehicles
          </p>
        </div>

        {carListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carListings.map((car) => {
              const specs = car.carSpecs;

              return (
                <div
                  key={car.id}
                  onClick={() => onSelectListing(car)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative h-52 sm:h-56 overflow-hidden bg-slate-100">
                    <img
                      src={car.image}
                      alt={car.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                    />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#047857]/90 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
                        <Car className="w-3 h-3" />
                        <span>{specs?.category || '4x4 Vehicle'}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-red-500 transition-colors shadow-md pointer-events-auto"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 border border-white/20">
                      <User className="w-3 h-3 text-[#4ade80]" />
                      <span>{specs?.withDriver ? 'Driver Included' : 'Self-Drive Option'}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <p className="text-slate-500 font-medium flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                          <span className="truncate">{car.location}</span>
                        </p>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                          <span className="font-bold text-amber-900 text-xs">{car.rating}</span>
                          <span className="text-slate-400 text-[10px]">({car.reviewsCount})</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-lg group-hover:text-[#047857] transition-colors leading-snug line-clamp-1">
                        {car.title}
                      </h4>

                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                        {car.description}
                      </p>
                    </div>

                    {specs && (
                      <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                        <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-semibold">Capacity</span>
                          <span className="text-xs font-bold text-slate-800">{specs.seats} Seats</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-semibold">Gear</span>
                          <span className="text-xs font-bold text-slate-800">{specs.transmission}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-semibold">Fuel</span>
                          <span className="text-xs font-bold text-slate-800">{specs.fuelType}</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Per Day</p>
                        <p className="text-base font-black text-slate-900">
                          PKR {car.price.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ day</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectListing(car);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065f46] text-white text-xs font-extrabold transition-all shadow-2xs group-hover:shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Reserve Car</span>
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
            <Car className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">No vehicles found for this filter</h4>
            <p className="text-xs text-slate-500">Try changing your location or category selection above.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
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
