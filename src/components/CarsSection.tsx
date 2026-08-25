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
      bgImage: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
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
      <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-8 md:-mt-12 overflow-hidden min-h-[300px] sm:min-h-[330px] lg:min-h-[350px] shadow-xl" id="car-hero-banner">
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 md:pt-16 pb-14 sm:pb-16 flex flex-col justify-start items-start h-full text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
            <div className="lg:col-span-10 space-y-3.5 text-left" id="car-left-content">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-white/20 text-white text-[11px] font-semibold backdrop-blur-md shadow-md">
                  <Car className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="tracking-tight text-white font-medium">Rugged 4x4 &amp; Luxury Chauffeur Fleet</span>
                </div>
              </div>

              <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug drop-shadow-md">
                Rent Premium 4x4 Vehicles in <span className="text-[#00A651] font-black">Gilgit Baltistan</span>
              </h1>
              <p className="text-slate-100/95 text-xs sm:text-sm font-medium max-w-xl leading-relaxed drop-shadow-xs">
                Explore Deosai, Khunjerab Pass &amp; Babusar Top with insured 4x4 SUVs, experienced mountain drivers &amp; zero hidden fees.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-6 pt-2 text-white" id="car-trust-factors">
                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">Expert Chauffeurs</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">Fully Insured</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Award className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">Zero Hidden Cost</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Headset className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight text-white">24/7 Roadside Care</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Overlapping Booking Console */}
      <section className="-mt-12 sm:-mt-14 relative z-20 w-full" id="car-search-console">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-visible">
          <div className="flex border-b border-[#F1F5F9] bg-[#FAFAFA] px-6 sm:px-8 gap-4 sm:gap-8 overflow-x-auto scrollbar-none rounded-t-3xl">
            <div className="flex items-center gap-2.5 py-4 px-1 border-b-2 border-[#006F3C] text-[#006F3C] font-bold text-[13px] uppercase tracking-wider">
              <Car className="w-4 h-4 text-[#006F3C]" />
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
                          <div className="w-7 h-7 rounded-lg bg-[#006F3C]/10 text-[#006F3C] flex items-center justify-center shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
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
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
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
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
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
                    <Car className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
                    <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap truncate">
                      {carType} • {withChauffeur ? 'With Driver' : 'Self Drive'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${showTypePicker ? 'rotate-180' : ''}`} />
                </div>

                {showTypePicker && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 sm:left-auto right-0 sm:right-auto mt-2 w-[calc(100vw-32px)] max-w-[320px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 space-y-4"
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
                              carType === type ? 'bg-[#006F3C]/10 text-[#006F3C] border-[#006F3C]/30' : 'bg-slate-50 text-slate-700 border-slate-200'
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
                          withChauffeur ? 'bg-[#006F3C]' : 'bg-slate-300'
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
                    {isRtl ? 'گاڑیاں تلاش کریں' : 'Search Cars'}
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
                  <User className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Experienced Drivers</h5>
                  <p className="text-[11px] text-slate-500 break-words">Karakoram terrain experts</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center text-[#006F3C] shrink-0">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Insured Fleet</h5>
                  <p className="text-[11px] text-slate-500 break-words">Complete trip coverage</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Gauge className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Unlimited Mileage</h5>
                  <p className="text-[11px] text-slate-500 break-words">Explore without caps</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Headset className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">24/7 Road Dispatch</h5>
                  <p className="text-[11px] text-slate-500 break-words">Backup vehicle standing by</p>
                </div>
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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006F3C] hover:text-[#005C32] hover:underline cursor-pointer"
          >
            <span>View all Vehicles</span>
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

      {/* 4. SECTION: HANDPICKED CARS GRID */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#006F3C]" /> Region:
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {carListings.map((car) => {
              const specs = car.carSpecs;

              return (
                <div
                  key={car.id}
                  onClick={() => onSelectListing(car)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#006F3C]/60 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={car.image}
                      alt={car.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                    />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#006F3C]/90 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
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

                  <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <p className="text-slate-500 font-medium flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#006F3C] shrink-0" />
                          <span className="truncate">{car.location}</span>
                        </p>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                          <span className="font-bold text-amber-900 text-xs">{car.rating}</span>
                          <span className="text-slate-400 text-[10px]">({car.reviewsCount})</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-[#006F3C] transition-colors leading-snug line-clamp-1 break-words">
                        {car.title}
                      </h4>

                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                        {car.description}
                      </p>
                    </div>

                    {specs && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#006F3C]" /> {specs.seats} Seats
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-[#006F3C]" /> {specs.transmission}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold flex items-center gap-1">
                          <Fuel className="w-3 h-3 text-[#006F3C]" /> {specs.fuelType}
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Per Day</p>
                        <p className="text-sm sm:text-base font-black text-slate-900">
                          PKR {car.price.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ day</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectListing(car);
                        }}
                        className="min-h-[42px] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#006F3C] hover:bg-[#005C32] text-white text-xs font-extrabold transition-all shadow-2xs group-hover:shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
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
              className="px-4 py-2 rounded-xl bg-[#006F3C] hover:bg-[#005C32] text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
