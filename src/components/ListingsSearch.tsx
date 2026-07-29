import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Listing, ListingType, handleImageError } from '../types';
import { 
  Search, MapPin, Star, SlidersHorizontal, Key, Calendar, Map, Check, RefreshCw, 
  ChevronUp, ChevronDown, Car, Shield, Tag, Sparkles, Phone, Zap, Heart, 
  Percent, Wrench, Flame, Wind, Users, Settings, Headphones, DollarSign, Edit3,
  Clock, ShieldCheck, FileText, ArrowRight, Home, Mountain, Waves, Wallet, Lock,
  Building, Building2, Coffee, Compass
} from 'lucide-react';
import { useLanguage, tListing } from '../LanguageContext';
import { PAKISTAN_FAQ, INITIAL_LISTINGS } from '../data';
import { CardSkeleton } from './SkeletonLoader';

interface ListingsSearchProps {
  type: ListingType;
  initialFilters: { destination: string; startDate: string; endDate: string; extra: any };
  onSelectListing: (listing: Listing) => void;
}

export default function ListingsSearch({ type, initialFilters, onSelectListing }: ListingsSearchProps) {
  const { language, t, isRtl } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States (Hotels & Tours)
  const [searchQuery, setSearchQuery] = useState(initialFilters.destination || '');
  const [priceMax, setPriceMax] = useState<number>(100000);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(initialFilters.extra?.experience || null);
  
  // Specific States (Hotels & Tours)
  const [selectedTransmission, setSelectedTransmission] = useState<'All' | 'Automatic' | 'Manual'>('All');
  const [requireDriver, setRequireDriver] = useState<boolean | null>(null);
  const [tourDays, setTourDays] = useState<number | null>(null);

  // Map state (Hotels & Tours)
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [selectedMapListing, setSelectedMapListing] = useState<Listing | null>(null);
  const [selectedDestinationItem, setSelectedDestinationItem] = useState<any>(null);
  const [selectedOfferCategory, setSelectedOfferCategory] = useState<string>('All');
  const [copiedOfferCode, setCopiedOfferCode] = useState<string | null>(null);
  const [calculatedSavings, setCalculatedSavings] = useState<Record<string, number>>({});
  const [offerBudgets, setOfferBudgets] = useState<Record<string, number>>({});
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // --- CAR SPECIFIC FILTER STATES (matching uploaded image) ---
  const [carSearchName, setCarSearchName] = useState('');
  const [selectedCarTypes, setSelectedCarTypes] = useState<string[]>(['All Cars']); // default
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['AC', 'Automatic', 'Bluetooth', 'GPS', 'Backup Camera']);
  const [activePill, setActivePill] = useState<string>('All Cars');
  const [carSortBy, setCarSortBy] = useState<string>('Recommended');
  const [carPriceMax, setCarPriceMax] = useState<number>(40000); // 3,000 to 40,000+
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // --- CAR LANDING WIDGET STATES (cloning uploaded image) ---
  const [carPickupLocation, setCarPickupLocation] = useState('Skardu, Gilgit Baltistan');
  const [carPickupDate, setCarPickupDate] = useState('2025-05-20');
  const [carPickupTime, setCarPickupTime] = useState('10:00 AM');
  const [carReturnDate, setCarReturnDate] = useState('2025-05-23');
  const [carReturnTime, setCarReturnTime] = useState('10:00 AM');
  const [carSelectedCategory, setCarSelectedCategory] = useState('All Cars');
  const [differentReturnLocation, setDifferentReturnLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showCarCategoryDropdown, setShowCarCategoryDropdown] = useState(false);

  // Fetch from Express API with fallback
  const fetchListings = async () => {
    setLoading(true);
    try {
      const url = `/api/listings?type=${type}&search=${type === 'car' ? '' : searchQuery}`;
      const res = await fetch(url);
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        setListings(data);
      } else {
        let fallback = [...INITIAL_LISTINGS];
        if (type && type !== 'offer') {
          fallback = fallback.filter((l) => l.type === type);
        }
        setListings(fallback);
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      let fallback = [...INITIAL_LISTINGS];
      if (type && type !== 'offer') {
        fallback = fallback.filter((l) => l.type === type);
      }
      setListings(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [type, searchQuery]);

  // General Filtered List for Hotels & Tours
  const filteredListings = listings.filter((l) => {
    if (l.price > priceMax) return false;
    if (selectedRating && l.rating < selectedRating) return false;

    if (type === 'homestay' && selectedExperience) {
      const exp = selectedExperience.toLowerCase();
      const title = l.title.toLowerCase();
      const desc = l.description.toLowerCase();
      const matches = title.includes(exp) || desc.includes(exp) || 
                      (exp.includes('mountain') && (desc.includes('mountain') || desc.includes('view') || desc.includes('peak'))) ||
                      (exp.includes('family') && (desc.includes('family') || desc.includes('children') || desc.includes('group'))) ||
                      (exp.includes('lake') && (desc.includes('lake') || desc.includes('river') || desc.includes('stream') || desc.includes('water'))) ||
                      (exp.includes('culture') && (desc.includes('local') || desc.includes('culture') || desc.includes('traditional') || desc.includes('heritage'))) ||
                      (exp.includes('budget') && (l.price <= 15000 || desc.includes('budget') || desc.includes('affordable')));
      if (!matches) return false;
    }

    if (type === 'hotel' && selectedExperience) {
      const exp = selectedExperience.toLowerCase();
      const title = l.title.toLowerCase();
      const desc = l.description.toLowerCase();
      const matches = title.includes(exp) || desc.includes(exp) || 
                      (exp.includes('mountain') && (desc.includes('mountain') || desc.includes('resort') || desc.includes('peak') || desc.includes('view') || desc.includes('scenic'))) ||
                      (exp.includes('luxury') && (desc.includes('luxury') || desc.includes('suite') || desc.includes('5 star') || desc.includes('five star') || desc.includes('boutique') || desc.includes('premium'))) ||
                      (exp.includes('riverfront') && (desc.includes('river') || desc.includes('lake') || desc.includes('lakeside') || desc.includes('stream') || desc.includes('water') || desc.includes('riverfront') || desc.includes('creek'))) ||
                      (exp.includes('heritage') && (desc.includes('heritage') || desc.includes('history') || desc.includes('traditional') || desc.includes('palace') || desc.includes('shigar') || desc.includes('khaplu'))) ||
                      (exp.includes('budget') && (l.price <= 15000 || desc.includes('budget') || desc.includes('affordable') || desc.includes('economical')));
      if (!matches) return false;
    }

    if (type === 'tour' && selectedExperience) {
      const exp = selectedExperience.toLowerCase();
      const title = l.title.toLowerCase();
      const desc = l.description.toLowerCase();
      const matches = title.includes(exp) || desc.includes(exp) || 
                      (exp.includes('autumn') && (title.includes('autumn') || desc.includes('autumn') || desc.includes('fall') || desc.includes('foliage'))) ||
                      (exp.includes('safari') && (title.includes('safari') || desc.includes('safari') || desc.includes('deosai') || desc.includes('national park') || desc.includes('plateau') || desc.includes('wildlife'))) ||
                      (exp.includes('heritage') && (title.includes('heritage') || desc.includes('heritage') || desc.includes('culture') || desc.includes('fort') || desc.includes('historical') || desc.includes('shigar') || desc.includes('baltit'))) ||
                      (exp.includes('glacier') && (title.includes('glacier') || desc.includes('glacier') || desc.includes('hike') || desc.includes('trekking') || desc.includes('climbing') || desc.includes('mountain') || desc.includes('peak'))) ||
                      (exp.includes('getaways') && ((l.tourSpecs?.durationDays && l.tourSpecs.durationDays <= 3) || title.includes('short') || desc.includes('excursion') || desc.includes('day trip')));
      if (!matches) return false;
    }

    if (type === 'car' && l.carSpecs) {
      if (selectedTransmission !== 'All' && l.carSpecs.transmission !== selectedTransmission) return false;
      if (requireDriver !== null && l.carSpecs.withDriver !== requireDriver) return false;
    }

    if (type === 'tour' && l.tourSpecs && tourDays) {
      if (l.tourSpecs.durationDays !== tourDays) return false;
    }

    return true;
  });

  // CAR-SPECIFIC Filtered List with exact logic to match image filters
  const carFilteredListings = listings.filter((l) => {
    if (l.type !== 'car') return false;

    // Search by Pick-up Location from landing widget
    if (carPickupLocation) {
      const locKey = carPickupLocation.split(',')[0].trim().toLowerCase();
      // If it is 'all' or similar we can skip, else filter
      if (locKey && locKey !== 'all' && !l.location.toLowerCase().includes(locKey)) {
        return false;
      }
    }

    // Car Type Category from Landing Widget selector
    if (carSelectedCategory && carSelectedCategory !== 'All Cars') {
      const cat = carSelectedCategory;
      const categoryMatch = (
        (cat === 'SUVs' && l.carSpecs?.category === 'SUV') ||
        (cat === 'Sedans' && l.carSpecs?.category === 'Sedan') ||
        (cat === 'Vans' && (l.carSpecs?.category === 'Van' || l.carSpecs?.category === 'Luxury Coach')) ||
        (cat === 'Hatchbacks' && l.carSpecs?.category === 'Hatchback') ||
        (cat === 'Luxury Cars' && l.price >= 20000)
      );
      if (!categoryMatch) return false;
    }

    // Search by Car Name keyword
    if (carSearchName && !l.title.toLowerCase().includes(carSearchName.toLowerCase())) {
      return false;
    }

    // Car Type checkboxes: e.g., 'All Cars', 'SUVs', 'Sedans', 'Vans', 'Luxury Cars', 'Hatchbacks'
    if (selectedCarTypes.length > 0 && !selectedCarTypes.includes('All Cars')) {
      const categoryMatch = selectedCarTypes.some(cat => {
        if (cat === 'SUVs') return l.carSpecs?.category === 'SUV';
        if (cat === 'Sedans') return l.carSpecs?.category === 'Sedan';
        if (cat === 'Vans') return l.carSpecs?.category === 'Van' || l.carSpecs?.category === 'Luxury Coach';
        if (cat === 'Hatchbacks') return l.carSpecs?.category === 'Hatchback';
        if (cat === 'Luxury Cars') return l.price >= 20000;
        return false;
      });
      if (!categoryMatch) return false;
    }

    // Price range Max check
    if (l.price > carPriceMax) {
      // If priceMax is at the upper bound of 40000, treat it as 40000+
      if (carPriceMax < 40000) return false;
    }

    // Features check
    if (selectedFeatures.length > 0) {
      // Automatic feature filter
      if (selectedFeatures.includes('Automatic') && !selectedFeatures.includes('Manual')) {
        if (l.carSpecs?.transmission !== 'Automatic') return false;
      }
      // Manual feature filter
      if (selectedFeatures.includes('Manual') && !selectedFeatures.includes('Automatic')) {
        if (l.carSpecs?.transmission !== 'Manual') return false;
      }
    }

    // Pill Tab Category checks
    if (activePill !== 'All Cars') {
      if (activePill === 'Best Seller' && l.rating < 4.9) return false;
      if (activePill === 'Luxury' && l.price < 20000) return false;
      if (activePill === 'Economy' && l.price > 10000) return false;
      if (activePill === 'SUV' && l.carSpecs?.category !== 'SUV') return false;
      if (activePill === 'Van' && l.carSpecs?.category !== 'Van' && l.carSpecs?.category !== 'Luxury Coach') return false;
    }

    return true;
  });

  const displayListings = filteredListings.map(l => tListing(l, isRtl));

  // Mock map coordinates generator for Pakistani listings
  const getCoordinates = (id: string) => {
    const coords: Record<string, { x: number; y: number }> = {
      'h-1': { x: 38, y: 22 }, // Hunza
      'h-2': { x: 55, y: 35 }, // Skardu
      'h-3': { x: 42, y: 55 }, // Islamabad
      'h-4': { x: 34, y: 44 }, // Swat Malam Jabba
      'c-1': { x: 45, y: 30 },
      'c-2': { x: 40, y: 56 },
      'c-3': { x: 48, y: 65 },
      't-1': { x: 35, y: 25 },
      't-2': { x: 52, y: 38 }
    };
    return coords[id] || { x: 30 + Math.random() * 40, y: 20 + Math.random() * 50 };
  };

  const handleCarTypeToggle = (type: string) => {
    if (type === 'All Cars') {
      setSelectedCarTypes(['All Cars']);
    } else {
      let updated = selectedCarTypes.filter(x => x !== 'All Cars');
      if (updated.includes(type)) {
        updated = updated.filter(x => x !== type);
        if (updated.length === 0) updated = ['All Cars'];
      } else {
        updated.push(type);
      }
      setSelectedCarTypes(updated);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(x => x !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ---------------- CAR SPECIAL RENDERING ENGINE (CLONING IMAGE) ----------------
  if (type === 'car') {
    return (
      <div id="listings-search-view" className="space-y-10 pb-16 text-left -mt-4">
        
        {/* 1. GORGEOUS MOUNTAIN HERO BLOCK WITH PARALLAX SCENIC ROAD & PREMIUM SUV */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl min-h-[540px] md:min-h-[580px] flex flex-col justify-between p-6 sm:p-10 lg:p-12">
          {/* Panoramic Karakoram Mountain Background */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80" 
              alt="Karakoram Mountain Highway Gilgit Baltistan" 
              className="w-full h-full object-cover opacity-50"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/20" />
          </div>

          {/* Hero Content Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-3">
              {/* Reliable Cars Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-white/20 uppercase tracking-widest">
                <Car className="w-3.5 h-3.5 text-white" />
                <span>Reliable Cars. Unforgettable Journeys.</span>
              </div>

              {/* Find Your Perfect Ride Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Find Your Perfect Ride in <br />
                <span className="text-[#006F3C] drop-shadow-sm font-black">Gilgit Baltistan</span>
              </h1>

              {/* Subheading */}
              <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed font-sans">
                Choose from a wide range of vehicles and explore the breathtaking beauty of Northern Pakistan with comfort and ease.
              </p>

              {/* 5 Small Hero Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {[
                  { label: 'Verified Vehicles', icon: ShieldCheck },
                  { label: 'Best Price Guarantee', icon: Tag },
                  { label: 'Free Cancellation', icon: Calendar },
                  { label: 'Instant Booking', icon: Zap },
                  { label: '24/7 Support', icon: Headphones }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-1 bg-slate-950/30 backdrop-blur-xs p-2 rounded-xl border border-white/5">
                    <div className="w-7 h-7 rounded-full bg-[#006F3C]/40 border border-[#006F3C]/60 flex items-center justify-center text-white">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-extrabold text-white leading-tight uppercase tracking-wider">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Premium Dark Gray SUV */}
            <div className="lg:col-span-5 hidden lg:block relative h-full">
              <div className="absolute right-0 bottom-0 top-0 w-full flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"
                  alt="Premium Black SUV Gilgit Baltistan" 
                  className="w-full object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] transform hover:scale-103 transition-transform duration-500 pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* FLOATING SEARCH WIDGET (Overlaps beautifully in Hero container bottom) */}
          <div className="relative z-20 mt-8 bg-white border border-[#E2E8F0] p-5 sm:p-6 shadow-2xl rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Pick-up Location Field */}
              <div className="col-span-1 md:col-span-3 space-y-1.5 relative">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Pick-up Location</p>
                <div 
                  onClick={() => {
                    setShowLocationDropdown(!showLocationDropdown);
                    setShowCarCategoryDropdown(false);
                  }}
                  className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-slate-800">
                    <MapPin className="w-4 h-4 text-[#006F3C] shrink-0" />
                    <span className="text-xs font-bold font-sans">{carPickupLocation}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Dropdown Options */}
                {showLocationDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                    {[
                      'Skardu, Gilgit Baltistan',
                      'Hunza Valley, Gilgit Baltistan',
                      'Gilgit, Gilgit Baltistan',
                      'Islamabad, Capital Territory',
                    ].map((loc) => (
                      <div 
                        key={loc}
                        onClick={() => {
                          setCarPickupLocation(loc);
                          setShowLocationDropdown(false);
                        }}
                        className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#006F3C] cursor-pointer flex items-center gap-2"
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{loc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pick-up Date & Time Field */}
              <div className="col-span-1 md:col-span-3 space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Pick-up Date & Time</p>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50">
                  <Calendar className="w-4 h-4 text-[#006F3C] shrink-0" />
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-800 w-full justify-between">
                    <input 
                      type="date" 
                      value={carPickupDate} 
                      onChange={(e) => setCarPickupDate(e.target.value)}
                      className="bg-transparent focus:outline-none cursor-pointer w-24 text-[11px]" 
                    />
                    <span className="text-slate-300 mx-1">|</span>
                    <select 
                      value={carPickupTime}
                      onChange={(e) => setCarPickupTime(e.target.value)}
                      className="bg-transparent focus:outline-none cursor-pointer text-[11px] font-sans"
                    >
                      {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '05:00 PM'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Return Date & Time Field */}
              <div className="col-span-1 md:col-span-3 space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Return Date & Time</p>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50">
                  <Calendar className="w-4 h-4 text-[#006F3C] shrink-0" />
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-800 w-full justify-between">
                    <input 
                      type="date" 
                      value={carReturnDate} 
                      onChange={(e) => setCarReturnDate(e.target.value)}
                      className="bg-transparent focus:outline-none cursor-pointer w-24 text-[11px]" 
                    />
                    <span className="text-slate-300 mx-1">|</span>
                    <select 
                      value={carReturnTime}
                      onChange={(e) => setCarReturnTime(e.target.value)}
                      className="bg-transparent focus:outline-none cursor-pointer text-[11px] font-sans"
                    >
                      {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '05:00 PM'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Car Type Field */}
              <div className="col-span-1 md:col-span-2 space-y-1.5 relative">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Car Type</p>
                <div 
                  onClick={() => {
                    setShowCarCategoryDropdown(!showCarCategoryDropdown);
                    setShowLocationDropdown(false);
                  }}
                  className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-slate-800">
                    <Car className="w-4 h-4 text-[#006F3C] shrink-0" />
                    <span className="text-xs font-bold font-sans">{carSelectedCategory}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Dropdown Options */}
                {showCarCategoryDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                    {[
                      'All Cars',
                      'SUVs',
                      'Sedans',
                      'Vans',
                      'Hatchbacks',
                      'Luxury Cars',
                    ].map((cat) => (
                      <div 
                        key={cat}
                        onClick={() => {
                          setCarSelectedCategory(cat);
                          setShowCarCategoryDropdown(false);
                        }}
                        className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#006F3C] cursor-pointer flex items-center gap-2"
                      >
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cat}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Button Column */}
              <div className="col-span-1 md:col-span-1 pt-4 md:pt-0">
                <button 
                  onClick={() => {
                    document.getElementById('cars-results')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#006F3C] hover:bg-[#005C32] text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span className="md:hidden">Search Cars</span>
                </button>
              </div>

            </div>

            {/* Checkbox underneath Pick-up Location */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={differentReturnLocation}
                  onChange={(e) => setDifferentReturnLocation(e.target.checked)}
                  className="rounded border-slate-300 text-[#006F3C] focus:ring-[#006F3C] w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-500">Return car at different location</span>
              </label>
            </div>
          </div>
        </div>

        {/* 2. FIVE HORIZONTAL TRUST BADGES ROW (styled impeccably) */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 text-left shadow-xs">
          {[
            { title: 'Well Maintained Cars', desc: 'All vehicles are regularly serviced and sanitized', icon: ShieldCheck, color: 'text-[#006F3C] bg-[#006F3C]/10 border-[#006F3C]/20' },
            { title: 'Best Price Guarantee', desc: 'We ensure you get the best prices always', icon: Tag, color: 'text-orange-600 bg-orange-50 border-orange-100' },
            { title: 'Free Cancellation', desc: 'Cancel up to 24 hours before pick-up', icon: Calendar, color: 'text-blue-600 bg-blue-50 border-blue-100' },
            { title: 'No Hidden Charges', desc: 'Transparent pricing with no surprises', icon: FileText, color: 'text-purple-600 bg-purple-50 border-purple-100' },
            { title: '24/7 Customer Support', desc: "We're here to help you anytime, anywhere", icon: Headphones, color: 'text-[#006F3C] bg-[#006F3C]/10 border-[#006F3C]/20' }
          ].map((badge, idx) => (
            <div key={idx} className="flex gap-3 items-start border-r last:border-0 border-slate-100 pr-2">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${badge.color}`}>
                <badge.icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-extrabold text-xs text-slate-900">{badge.title}</h5>
                <p className="text-[10px] text-slate-450 leading-relaxed">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 3. LIMITED TIME OFFER BANNER (gorgeous emerald/teal gradient with cars overlapping) */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#00381E] via-[#006F3C] to-[#005C32] border border-[#006F3C]/40 p-6 sm:p-10 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* Abstract elegant decoration lines */}
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
          </div>

          {/* Left Column (60%) */}
          <div className="relative z-10 space-y-4 max-w-xl text-left">
            <span className="inline-block border border-emerald-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/40">
              Limited Time Offer
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
              Drive More, Save More!
            </h2>
            <p className="text-xs sm:text-sm text-slate-200">
              Grab exclusive discounts on car rentals and enjoy your journey more.
            </p>

            {/* Discount points with custom badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { pct: '10% OFF', days: 'on 3+ Days', icon: Tag },
                { pct: '15% OFF', days: 'on 7+ Days', icon: Calendar },
                { pct: '20% OFF', days: 'on 14+ Days', icon: Percent }
              ].map((discount, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-xs border border-white/10 px-3 py-2 rounded-xl text-white">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                    <discount.icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h6 className="font-extrabold text-[11px] text-white leading-none">{discount.pct}</h6>
                    <p className="text-[9px] text-emerald-200">{discount.days}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: overlapping cars and explore orange button */}
          <div className="relative z-10 flex flex-col items-center sm:items-end gap-4 shrink-0 w-full md:w-auto">
            {/* Double Overlapping Cars */}
            <div className="relative h-28 w-64 hidden sm:block">
              {/* White Fortuner SUV (Back) */}
              <img 
                src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=350&q=80" 
                alt="White Fortuner" 
                className="absolute left-0 bottom-0 h-20 w-36 object-contain filter drop-shadow-md brightness-110"
                referrerPolicy="no-referrer"
              />
              {/* Sleek Grey Civic/Sedan (Front Overlap) */}
              <img 
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=350&q=80" 
                alt="Grey Sedan" 
                className="absolute right-0 bottom-0 h-16 w-36 object-contain filter drop-shadow-lg scale-x-[-1]"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Orange Button */}
            <button 
              onClick={() => {
                document.getElementById('cars-results')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:shadow-orange-500/20 transition-all cursor-pointer w-full sm:w-auto justify-center"
            >
              <span>Explore All Cars</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Travelers Avatar Stack and 10k text */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex -space-x-2 overflow-hidden">
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
                ].map((src, idx) => (
                  <img 
                    key={idx} 
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-[#006F3C] object-cover" 
                    src={src} 
                    alt="Happy user" 
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <div className="text-left">
                <p className="text-[10px] text-white font-bold leading-none flex items-center gap-1">
                  <span className="text-orange-400 font-extrabold bg-orange-950/40 px-1 rounded-sm">10K+</span>
                  <span>Trusted by Thousands</span>
                </p>
                <p className="text-[8px] text-emerald-200">of Happy Travelers</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. MAIN BODY: 2 Columns (Sidebar + Main Content Grid) */}
        <div id="cars-results" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-4 scroll-mt-24">
          
          {/* A. SIDEBAR FILTERS (preserved & cloned perfectly) */}
          <aside className="lg:col-span-3 space-y-5">
            <div className="bg-white border border-[#E2E8F0] p-5 space-y-6 rounded-2xl">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider">
                  Filter By
                </span>
                <button 
                  onClick={() => {
                    setCarPriceMax(40000);
                    setSelectedCarTypes(['All Cars']);
                    setSelectedFeatures(['AC', 'Automatic', 'Bluetooth', 'GPS', 'Backup Camera']);
                    setCarSearchName('');
                    setActivePill('All Cars');
                    setCarSelectedCategory('All Cars');
                    setCarPickupLocation('Skardu, Gilgit Baltistan');
                  }}
                  className="text-[11px] font-bold uppercase tracking-wider text-[#006F3C] hover:underline cursor-pointer"
                >
                  Reset All
                </button>
              </div>

              {/* Keyword Search by Car Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Search by Car Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Toyota Fortuner"
                    value={carSearchName}
                    onChange={(e) => setCarSearchName(e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#006F3C] transition-colors"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Car Type Checklists */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Car Type</label>
                <div className="space-y-2 text-xs">
                  {[
                    { key: 'All Cars', label: 'All Cars', count: 132 },
                    { key: 'SUVs', label: 'SUVs', count: 48 },
                    { key: 'Sedans', label: 'Sedans', count: 32 },
                    { key: 'Vans', label: 'Vans', count: 20 },
                    { key: 'Luxury Cars', label: 'Luxury Cars', count: 12 },
                    { key: 'Hatchbacks', label: 'Hatchbacks', count: 20 },
                  ].map((item) => {
                    const checked = selectedCarTypes.includes(item.key) || carSelectedCategory === item.key;
                    return (
                      <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (item.key === 'All Cars') {
                                setCarSelectedCategory('All Cars');
                              } else {
                                setCarSelectedCategory(item.key);
                              }
                              handleCarTypeToggle(item.key);
                            }}
                            className="rounded border-slate-300 text-[#006F3C] focus:ring-[#006F3C] w-3.5 h-3.5"
                          />
                          <span className={`font-semibold ${checked ? 'text-slate-900 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>{item.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">({item.count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Price Range (PKR / day)</label>
                <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-800">
                  <span>PKR 3,000</span>
                  <span className="text-[#006F3C] font-extrabold font-mono">PKR {carPriceMax.toLocaleString()}{carPriceMax >= 40000 ? '+' : ''}</span>
                </div>
                <input
                  type="range"
                  min="3000"
                  max="40000"
                  step="1000"
                  value={carPriceMax}
                  onChange={(e) => setCarPriceMax(Number(e.target.value))}
                  className="w-full accent-[#006F3C] bg-slate-100 h-1 rounded-none cursor-pointer"
                />
              </div>

              {/* Features checklists */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Features</label>
                <div className="space-y-2 text-xs">
                  {[
                    { key: 'Automatic', label: 'Automatic', count: 85 },
                    { key: 'Manual', label: 'Manual', count: 47 },
                    { key: 'AC', label: 'AC', count: 132 },
                    { key: 'Bluetooth', label: 'Bluetooth', count: 96 },
                    { key: 'GPS', label: 'GPS', count: 74 },
                    { key: 'Backup Camera', label: 'Backup Camera', count: 63 }
                  ].map((item) => {
                    const checked = selectedFeatures.includes(item.key);
                    return (
                      <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleFeatureToggle(item.key)}
                            className="rounded border-slate-300 text-[#006F3C] focus:ring-[#006F3C] w-3.5 h-3.5"
                          />
                          <span className={`font-semibold ${checked ? 'text-slate-900 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>{item.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">({item.count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>
          </aside>

          {/* B. MAIN RESULTS CONTENT (cloned perfectly) */}
          <main className="lg:col-span-9 space-y-5">
            
            {/* Top Stat and Sort Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="text-left">
                <h3 className="text-lg font-extrabold text-[#0F172A] leading-tight font-sans">
                  {carFilteredListings.length} Cars Found in {carPickupLocation.split(',')[0]}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {carPickupDate} - {carReturnDate} (3 Days)
                </p>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-xs font-medium text-slate-500 shrink-0">Sort by:</span>
                <select
                  value={carSortBy}
                  onChange={(e) => setCarSortBy(e.target.value)}
                  className="bg-white border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#006F3C]"
                >
                  <option value="Recommended">Recommended</option>
                  <option value="PriceLowToHigh">Price: Low to High</option>
                  <option value="PriceHighToLow">Price: High to Low</option>
                  <option value="Rating">Rating</option>
                </select>
              </div>
            </div>

            {/* Pill Selectors Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {[
                { name: 'All Cars', icon: Car, count: 132 },
                { name: 'Best Seller', icon: Star },
                { name: 'Luxury', icon: Sparkles },
                { name: 'Economy', icon: DollarSign },
                { name: 'SUV', icon: Car },
                { name: 'Van', icon: Car },
                { name: 'More Filters', icon: SlidersHorizontal }
              ].map((pill) => {
                const isPillActive = activePill === pill.name || carSelectedCategory === pill.name || (pill.name === 'SUV' && carSelectedCategory === 'SUVs') || (pill.name === 'Van' && carSelectedCategory === 'Vans');
                return (
                  <button
                    key={pill.name}
                    onClick={() => {
                      if (pill.name === 'More Filters') return;
                      setActivePill(pill.name);
                      if (pill.name === 'All Cars') {
                        setCarSelectedCategory('All Cars');
                      } else if (pill.name === 'SUV') {
                        setCarSelectedCategory('SUVs');
                      } else if (pill.name === 'Van') {
                        setCarSelectedCategory('Vans');
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                      isPillActive
                        ? 'bg-[#006F3C] text-white border-[#006F3C] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-[#006F3C] hover:border-[#006F3C]'
                    }`}
                  >
                    <pill.icon className={`w-3.5 h-3.5 ${isPillActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{pill.name}</span>
                    {pill.count !== undefined && <span className={`text-[9px] font-mono font-bold ml-0.5 px-1.5 py-0.5 rounded-full ${isPillActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{pill.count}</span>}
                  </button>
                );
              })}
            </div>

            {/* CARS GRID CONTAINER (4-column responsive) */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array(8).fill(0).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : carFilteredListings.length === 0 ? (
              <div className="bg-white border border-slate-200 p-12 text-center space-y-4 rounded-2xl">
                <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto">
                  <Car className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 uppercase">No Matching Vehicles</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    We could not find active lists matching these filters. Try resetting sliders or changing selected badges.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {carFilteredListings.map((car) => {
                  const isFavorite = favorites[car.id];
                  
                  // Setup dynamic badges matching image
                  let badgeLabel = 'Premium';
                  let badgeClass = 'bg-slate-600';
                  
                  if (car.title.includes('Land Cruiser')) {
                    badgeLabel = 'Best Seller';
                    badgeClass = 'bg-[#EA580C]';
                  } else if (car.title.includes('Fortuner')) {
                    badgeLabel = 'Popular';
                    badgeClass = 'bg-[#006F3C]';
                  } else if (car.title.includes('Camry')) {
                    badgeLabel = 'Luxury';
                    badgeClass = 'bg-[#2563EB]';
                  } else if (car.title.includes('Cultus')) {
                    badgeLabel = 'Economy';
                    badgeClass = 'bg-[#7C3AED]';
                  }

                  return (
                    <div 
                      key={car.id}
                      className="bg-white border border-[#E2E8F0] overflow-hidden flex flex-col justify-between h-full group hover:shadow-md hover:border-slate-300 transition-all rounded-2xl text-left"
                    >
                      {/* Photo Header */}
                      <div className="relative aspect-[16/11] w-full overflow-hidden rounded-t-2xl bg-slate-50 border-b border-slate-100 shrink-0">
                        <img 
                          src={car.image} 
                          alt={car.title} 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 rounded-t-2xl"
                          referrerPolicy="no-referrer"
                          onError={handleImageError}
                        />
                        
                        {/* Cloned badges */}
                        <div className={`absolute top-2 left-2 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 shadow-xs tracking-wider rounded-md ${badgeClass}`}>
                          {badgeLabel}
                        </div>

                        {/* Favorite button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(car.id);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white border border-slate-100 rounded-full flex items-center justify-center transition-colors shadow-xs"
                        >
                          <Heart className={`w-3.5 h-3.5 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400 hover:text-red-500'}`} />
                        </button>
                      </div>

                      {/* Info Block */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#006F3C] transition-colors line-clamp-1">{car.title}</h4>
                          
                          {/* Specs Row 1 */}
                          <div className="flex items-center gap-3 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Car className="w-3 h-3 text-slate-400" />
                              <span>{car.carSpecs?.category}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-slate-400" />
                              <span>{car.carSpecs?.fuelType}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{car.carSpecs?.seats} Seats</span>
                            </span>
                          </div>

                          {/* Specs Row 2 (Detailed icons) */}
                          <div className="flex flex-wrap gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-none">
                              <Wind className="w-2.5 h-2.5 text-[#006F3C]" />
                              <span>AC</span>
                            </span>
                            <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-none">
                              <Settings className="w-2.5 h-2.5 text-[#006F3C]" />
                              <span>{car.carSpecs?.transmission}</span>
                            </span>
                            <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-none">
                              <RefreshCw className="w-2.5 h-2.5 text-[#006F3C]" />
                              <span>Bluetooth</span>
                            </span>
                            <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-none">
                              <MapPin className="w-2.5 h-2.5 text-[#006F3C]" />
                              <span>GPS</span>
                            </span>
                          </div>

                          {/* Rating and Reviews */}
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                            <span className="flex items-center gap-0.5 text-amber-500 font-extrabold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                              <span>{car.rating}</span>
                            </span>
                            <span>({car.reviewsCount} Reviews)</span>
                          </div>
                        </div>

                        {/* Pricing section */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-extrabold text-slate-900">PKR {car.price.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">/ day</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Ribbons & Actions */}
                      <div className="shrink-0">
                        {/* Free Cancellation green ribbon */}
                        <div className="bg-[#006F3C]/10 text-[#006F3C] text-center font-bold py-1 text-[9px] uppercase tracking-wide border-t border-b border-[#006F3C]/20">
                          Free Cancellation
                        </div>

                        <button 
                          onClick={() => onSelectListing(car)}
                          className="w-full bg-[#006F3C] hover:bg-[#005C32] text-white font-bold py-2.5 text-xs uppercase tracking-wider text-center transition-colors rounded-none block cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom trust badges row */}
            <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 text-left mt-8">
              {[
                { title: 'Verified Vehicles', desc: 'All vehicles are verified and well maintained', icon: Shield },
                { title: 'Best Price Guarantee', desc: 'We ensure you get the best prices always', icon: Percent },
                { title: 'Free Cancellation', desc: 'Cancel up to 24 hours before pick-up', icon: Calendar },
                { title: 'No Hidden Charges', desc: 'What you see is what you pay', icon: Tag },
                { title: '24/7 Roadside Assistance', desc: "We're here to help you anytime", icon: Wrench }
              ].map((badge, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center text-[#006F3C]">
                    <badge.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-850">{badge.title}</h5>
                    <p className="text-[10px] text-slate-400 leading-snug">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </main>
        </div>
      </div>
    );
  }

  // ---------------- HOMESTAY SPECIAL RENDERING ENGINE (CLONING IMAGE) ----------------
  if (type === 'homestay') {
    const homestayFilteredListings = displayListings;

    return (
      <div id="listings-search-view" className="space-y-12 pb-16 text-left -mt-4 animate-fadeIn">
        
        {/* 1. GORGEOUS MOUNTAIN HERO BLOCK WITH Scenic Cabin */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl min-h-[520px] lg:min-h-[580px] flex flex-col justify-between p-6 sm:p-10 lg:p-12">
          {/* Panoramic cabin mountain background from image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1920&q=80" 
              alt="Authentic Log Cabin in Gilgit Baltistan Mountains" 
              className="w-full h-full object-cover opacity-60 object-center animate-fadeIn"
              referrerPolicy="no-referrer"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-slate-950/20" />
          </div>

          {/* Hero Content Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-3">
              {/* Stay Local. Feel at Home Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#006F3C]/60 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-[#006F3C]/40 uppercase tracking-widest">
                <Home className="w-3.5 h-3.5 text-white" />
                <span>Stay Local. Feel at Home.</span>
              </div>

              {/* Authentic Homestays in Gilgit Baltistan Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Authentic Homestays in <br />
                <span className="text-[#006F3C] drop-shadow-sm font-black">Gilgit Baltistan</span>
              </h1>

              {/* Subheading */}
              <p className="text-sm sm:text-base text-slate-100 max-w-xl leading-relaxed font-sans font-medium">
                Experience warm hospitality, local culture, and breathtaking views with our handpicked homestays.
              </p>

              {/* 4 Bullet Reassurance Items from the Image */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10" id="homestays-hero-bullets">
                {[
                  { label: 'Verified Homestays', icon: ShieldCheck },
                  { label: 'Local Hosts', icon: Users },
                  { label: 'Best Price Guarantee', icon: Tag },
                  { label: '24/7 Support', icon: Headphones }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-full bg-[#006F3C]/40 flex items-center justify-center text-white shrink-0 border border-[#006F3C]/40">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight tracking-tight text-slate-100">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FLOATING SEARCH WIDGET (Overlaps beautifully in Hero container bottom) */}
          <div className="relative z-20 mt-8 bg-white border border-[#E2E8F0] p-5 sm:p-6 shadow-2xl rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Where are you going? Field */}
              <div className="col-span-1 md:col-span-4 space-y-1.5 text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">Where are you going?</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search destination, city or area"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#006F3C] focus:bg-white transition-colors"
                  />
                  <MapPin className="w-4 h-4 text-[#006F3C] absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Check-in Field */}
              <div className="col-span-1 md:col-span-2 space-y-1.5 text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">Check-in</p>
                <div className="relative">
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-xs text-slate-800 font-semibold">
                    <Calendar className="w-4 h-4 text-[#006F3C] shrink-0" />
                    <span>20 May 2025</span>
                  </div>
                </div>
              </div>

              {/* Check-out Field */}
              <div className="col-span-1 md:col-span-2 space-y-1.5 text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">Check-out</p>
                <div className="relative">
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-xs text-slate-800 font-semibold">
                    <Calendar className="w-4 h-4 text-[#006F3C] shrink-0" />
                    <span>23 May 2025</span>
                  </div>
                </div>
              </div>

              {/* Guests & Rooms Field */}
              <div className="col-span-1 md:col-span-2 space-y-1.5 text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">Guests & Rooms</p>
                <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-xs text-slate-800 font-semibold">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#006F3C] shrink-0" />
                    <span>2 Guests, 1 Room</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              </div>

              {/* Green Search Button */}
              <div className="col-span-1 md:col-span-2 md:pt-5">
                <button 
                  onClick={() => {
                    const resultsSection = document.getElementById('homestay-results-section');
                    resultsSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#006F3C] hover:bg-[#005C32] text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 justify-center shadow-lg hover:shadow-emerald-900/10 transition-all cursor-pointer border-0"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Homestays</span>
                </button>
              </div>

            </div>

            {/* Divider Line */}
            <div className="border-t border-slate-200/80 -mx-5 sm:-mx-6 my-5" />

            {/* FIVE-BADGE TRUST REASSURANCE ROW (under the search bar inside same box) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 text-left" id="homestays-reassurance-row">
              {[
                { title: 'Best Price Guarantee', desc: 'We ensure you get the best price', icon: ShieldCheck },
                { title: 'Free Cancellation', desc: 'Cancel up to 24 hours', icon: Calendar },
                { title: 'Instant Confirmation', desc: 'Book & get confirmed', icon: Sparkles },
                { title: 'Secure Payments', desc: '100% safe & secure', icon: Lock },
                { title: '24/7 Support', desc: "We're here to help", icon: Headphones }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 p-1 rounded-xl hover:bg-slate-50 transition-all min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center text-[#006F3C] shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-[12px] text-slate-800 leading-tight">{item.title}</h5>
                      <p className="text-[10px] text-slate-500 mt-1 break-words leading-tight">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* 3. EXPLORE HOMESTAYS BY EXPERIENCE (5 customized category cards) */}
        <section className="space-y-6 pt-4 text-left" id="section-experiences">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Explore Homestays by Experience
              </h2>
              <p className="text-sm text-slate-500 font-medium">Find the perfect stay that matches your travel style</p>
            </div>
            <button 
              onClick={() => {
                setSelectedExperience(null);
                setSearchQuery('');
                setPriceMax(100000);
              }}
              className="text-xs font-extrabold text-[#006F3C] uppercase tracking-wider flex items-center gap-1 hover:text-[#005C32] transition-colors cursor-pointer bg-transparent border-0"
            >
              <span>View all Homestays</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4" id="experience-cards-grid">
            {[
              { 
                title: 'Mountain View', 
                desc: 'Wake up to stunning mountain views', 
                image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=400&q=80', 
                icon: Mountain,
                color: 'bg-[#006F3C]'
              },
              { 
                title: 'Family Friendly', 
                desc: 'Perfect stays for you and your family', 
                image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=400&q=80', 
                icon: Users,
                color: 'bg-blue-600'
              },
              { 
                title: 'Lakeside Stays', 
                desc: 'Relax by the serene lakes and rivers', 
                image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80', 
                icon: Waves,
                color: 'bg-teal-600'
              },
              { 
                title: 'Local Culture', 
                desc: 'Immerse in local life and traditions', 
                image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=400&q=80', 
                icon: Home,
                color: 'bg-amber-600'
              },
              { 
                title: 'Budget Friendly', 
                desc: 'Comfortable stays that fit your budget', 
                image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', 
                icon: Wallet,
                color: 'bg-purple-600'
              }
            ].map((exp, idx) => {
              const Icon = exp.icon;
              const isActive = selectedExperience === exp.title;
              return (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedExperience(selectedExperience === exp.title ? null : exp.title);
                  }}
                  className={`relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer group shadow-sm transition-all duration-300 ${
                    isActive ? 'ring-4 ring-[#006F3C] scale-[1.02] shadow-lg' : 'border border-slate-200 hover:scale-[1.01] hover:shadow-md'
                  }`}
                >
                  <img 
                    src={exp.image} 
                    alt={exp.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  {/* Premium dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
                  
                  {/* Text on Bottom Left */}
                  <div className="absolute bottom-4 left-4 right-14 text-left z-10">
                    <h4 className="text-sm font-bold text-white tracking-tight leading-snug">{exp.title}</h4>
                    <p className="text-[10px] text-white/85 leading-tight mt-0.5">{exp.desc}</p>
                  </div>

                  {/* Icon on Bottom Right */}
                  <div className="absolute bottom-4 right-4 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${exp.color} border border-white/20 shadow-md transition-transform group-hover:scale-110`}>
                      {isActive ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Icon className="w-4 h-4 stroke-[2]" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. DYNAMIC SEARCH RESULTS VIEWS WITH SIDEBAR FILTERS & INTERACTIVE MAP */}
        <section id="homestay-results-section" className="space-y-6 pt-6 scroll-mt-24 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] uppercase tracking-wide">
                Available Homestays ({homestayFilteredListings.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {selectedExperience 
                  ? `Filtering by experience: "${selectedExperience}"` 
                  : 'Displaying certified local homestays in Northern Pakistan.'}
              </p>
            </div>

            {/* Sync connection */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 self-start md:self-auto shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#006F3C] animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wide">
                Active Connection
              </span>
              <button onClick={fetchListings} className="text-slate-400 hover:text-slate-950 ml-1.5 bg-transparent border-0 cursor-pointer">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* A. Sidebar Filter Panel */}
            <aside className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-xs">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-extrabold text-[#0F172A] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <SlidersHorizontal className="w-4 h-4 text-[#006F3C]" /> Filters
                  </span>
                  <button 
                    onClick={() => {
                      setPriceMax(100000);
                      setSelectedRating(null);
                      setSearchQuery('');
                      setSelectedExperience(null);
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#006F3C] hover:underline cursor-pointer bg-transparent border-0"
                  >
                    Clear All
                  </button>
                </div>

                {/* Keyword search input */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Location Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Hunza, Skardu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#006F3C] focus:bg-white transition-colors"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Price max budget */}
                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    <span>Max Price</span>
                    <span className="text-[#006F3C]">PKR {priceMax.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="120000"
                    step="5000"
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-full accent-[#006F3C] bg-slate-100 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Min rating */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Minimum Rating</label>
                  <div className="flex gap-1.5">
                    {[4.5, 4.7, 4.8, 4.9].map((star) => (
                      <button
                        key={star}
                        onClick={() => setSelectedRating(selectedRating === star ? null : star)}
                        className={`flex-1 py-1 rounded-lg text-[9px] font-extrabold border transition-all cursor-pointer ${
                          selectedRating === star
                            ? 'bg-[#006F3C] border-[#006F3C] text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        ★ {star}+
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </aside>

            {/* B. Listing Results and Map Grid */}
            <main className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Listings List Column */}
              <section className="md:col-span-7 space-y-4">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                      <CardSkeleton key={i} />
                    ))}
                  </div>
                ) : homestayFilteredListings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800">No Homestays Found</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">Try resetting your filters or keyword search to discover more warm local accommodations.</p>
                    <button 
                      onClick={() => {
                        setPriceMax(100000);
                        setSelectedRating(null);
                        setSearchQuery('');
                        setSelectedExperience(null);
                      }}
                      className="bg-[#006F3C] hover:bg-[#005C32] text-white text-[11px] font-extrabold px-4 py-2 rounded-xl mt-4 uppercase tracking-wider transition-colors border-0 cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    {homestayFilteredListings.map((listing) => {
                      const isFavorite = favorites[listing.id];
                      return (
                        <div 
                          key={listing.id}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all flex flex-col sm:flex-row group cursor-pointer"
                          onClick={() => onSelectListing(listing)}
                          onMouseEnter={() => setHoveredListingId(listing.id)}
                          onMouseLeave={() => setHoveredListingId(null)}
                        >
                          {/* Image Box */}
                          <div className="sm:w-5/12 h-44 sm:h-auto relative overflow-hidden shrink-0">
                            <img 
                              src={listing.image} 
                              alt={listing.title} 
                              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                              onError={handleImageError}
                            />
                            {/* Favorite Button */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
                              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-md border border-slate-100 z-10 active:scale-90 transition-transform cursor-pointer"
                            >
                              <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400 group-hover:text-red-500'}`} />
                            </button>
                          </div>

                          {/* Details Content Info Block */}
                          <div className="p-5 flex-1 flex flex-col justify-between text-left space-y-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                                <MapPin className="w-3.5 h-3.5 text-[#006F3C] shrink-0" />
                                <span className="line-clamp-1">{listing.location}</span>
                              </div>
                              <h4 className="text-base font-black text-slate-900 group-hover:text-[#006F3C] transition-colors leading-snug line-clamp-2">
                                {listing.title}
                              </h4>
                              <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">
                                {listing.description}
                              </p>
                            </div>

                            {/* Rating and Price row */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
                              {/* Rating */}
                              <div className="flex items-center gap-1">
                                <div className="flex items-center text-amber-500">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                                  <span className="text-xs font-extrabold text-slate-800 ml-1">{listing.rating}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold">({listing.reviewsCount} reviews)</span>
                              </div>

                              {/* Price and Book Action */}
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-slate-400 text-[8px] uppercase tracking-widest font-extrabold">Price per night</p>
                                  <p className="text-base font-black text-[#006F3C]">PKR {listing.price.toLocaleString()}</p>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onSelectListing(listing); }}
                                  className="bg-[#006F3C] hover:bg-[#005C32] text-white text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 border-0"
                                >
                                  Book
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Interactive Map Column on the right */}
              <section className="md:col-span-5 hidden md:flex relative h-[540px] sticky top-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm flex flex-col justify-between p-4">
                {/* Visual stylised schematic topographic map */}
                <div className="absolute inset-0 z-0 bg-slate-50">
                  {/* Decorative topological contour lines and rivers */}
                  <svg className="w-full h-full opacity-15" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
                    <path d="M-50 100 Q100 50 150 200 T350 100 T500 300" fill="none" stroke="#006F3C" strokeWidth="2" />
                    <path d="M-50 250 Q120 180 200 350 T400 250 T500 450" fill="none" stroke="#006F3C" strokeWidth="1.5" />
                    <path d="M-50 400 Q80 450 180 380 T380 500 T550 400" fill="none" stroke="#006F3C" strokeWidth="1" strokeDasharray="3 3" />
                    {/* Blue Indus River */}
                    <path d="M 0 50 Q 150 150 180 300 T 400 550" fill="none" stroke="#3B82F6" strokeWidth="5" opacity="0.6" />
                  </svg>

                  {/* Topographic height notes */}
                  <span className="absolute bottom-4 left-4 text-[8px] font-mono text-slate-300">UTM ZONE 43N / K2 REGION</span>
                  <span className="absolute top-4 right-4 text-[8px] font-mono text-slate-300">CONTOUR INTERVAL 50M</span>

                  {/* Pins plotted on the map */}
                  {homestayFilteredListings.map((l) => {
                    const coords = getCoordinates(l.id);
                    const isHovered = hoveredListingId === l.id;
                    const isSelected = selectedMapListing?.id === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => setSelectedMapListing(l)}
                        style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-350 cursor-pointer bg-transparent border-0`}
                      >
                        {/* Price bubble */}
                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black border tracking-tight shadow-md transition-colors ${
                          isSelected || isHovered 
                            ? 'bg-[#006F3C] text-white border-[#006F3C]' 
                            : 'bg-white text-slate-800 border-slate-200'
                        }`}>
                          PKR {(l.price / 1000).toFixed(0)}k
                        </div>
                        {/* Pin needle */}
                        <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-md transition-colors -mt-1 ${
                          isSelected || isHovered ? 'bg-red-500' : 'bg-[#006F3C]'
                        }`} />
                      </button>
                    );
                  })}
                </div>

                {/* Top header overlay over map */}
                <div className="relative z-10 bg-white/90 backdrop-blur-md px-3 py-2.5 rounded-xl border border-slate-200/50 flex items-center justify-between shadow-xs">
                  <div>
                    <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 font-sans">Interactive Map</h5>
                    <p className="text-[9px] text-slate-400">Showing local homestays by coordinates</p>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#006F3C]" />
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                </div>

                {/* Bottom selected card popup */}
                <div className="relative z-10 bg-white border border-slate-200 p-3 rounded-xl shadow-xl flex gap-3 max-h-32">
                  {selectedMapListing ? (
                    <>
                      <img 
                        src={selectedMapListing.image} 
                        alt={selectedMapListing.title} 
                        className="w-24 h-full object-cover rounded-lg shrink-0"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                      <div className="flex flex-col justify-between py-0.5 text-left flex-1 min-w-0">
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 truncate leading-tight">{selectedMapListing.title}</h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{selectedMapListing.location}</p>
                          <div className="flex items-center text-amber-500 text-[10px] font-bold mt-1.5">
                            <Star className="w-3 h-3 fill-amber-400 stroke-none mr-0.5" />
                            <span>{selectedMapListing.rating} ({selectedMapListing.reviewsCount})</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="font-bold text-xs text-[#006F3C]">PKR {selectedMapListing.price.toLocaleString()}</span>
                          <button 
                            onClick={() => onSelectListing(selectedMapListing)}
                            className="bg-[#006F3C] hover:bg-[#005C32] text-white text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg transition-colors border-0 cursor-pointer"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full text-center py-6 text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-300 animate-pulse" />
                      <span>Select a pin on the map</span>
                    </div>
                  )}
                </div>

              </section>

            </main>

          </div>
        </section>

      </div>
    );
  }

  // ---------------- HOTEL SPECIAL RENDERING ENGINE (CLONING IMAGE) ----------------
  if (type === 'hotel') {
    const hotelFilteredListings = displayListings;

    return (
      <div id="listings-search-view" className="space-y-12 pb-16 text-left -mt-4 animate-fadeIn">
        
        {/* 1. GORGEOUS MOUNTAIN HERO BLOCK WITH Scenic Luxury Resort */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl min-h-[520px] lg:min-h-[580px] flex flex-col justify-between p-6 sm:p-10 lg:p-12">
          {/* Panoramic hotel mountain background */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80" 
              alt="Luxury Alpine Resort in Gilgit Baltistan" 
              className="w-full h-full object-cover opacity-60 object-center animate-fadeIn"
              referrerPolicy="no-referrer"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-slate-950/20" />
          </div>

          {/* Hero Content Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-3">
              {/* Luxury & Comfort. Elite Stays Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4F46E5]/30 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-[#818CF8]/30 uppercase tracking-widest">
                <Building2 className="w-3.5 h-3.5 text-[#818CF8]" />
                <span>Luxury & Comfort. Elite Stays.</span>
              </div>

              {/* Premium Hotels & Resorts in Gilgit Baltistan Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Premium Hotels & Resorts in <br />
                <span className="text-[#006F3C] drop-shadow-sm font-black">Gilgit Baltistan</span>
              </h1>

              {/* Subheading */}
              <p className="text-sm sm:text-base text-slate-100 max-w-xl leading-relaxed font-sans font-medium">
                Immerse yourself in world-class amenities, premium hospitality, and breathtaking views with our handpicked luxury properties.
              </p>

              {/* 4 Bullet Reassurance Items from the Image */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10" id="hotels-hero-bullets">
                {[
                  { label: 'Certified 5-Star', icon: ShieldCheck },
                  { label: 'Elite Hospitality', icon: Users },
                  { label: 'Best Price Guarantee', icon: Tag },
                  { label: '24/7 Concierge', icon: Headphones }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-full bg-[#4F46E5]/20 flex items-center justify-center text-[#818CF8] shrink-0 border border-[#818CF8]/35">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight tracking-tight text-slate-100">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FLOATING SEARCH WIDGET (Overlaps beautifully in Hero container bottom) */}
          <div className="relative z-20 mt-8 bg-white border border-[#E2E8F0] p-5 sm:p-6 shadow-2xl rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Where are you going? Field */}
              <div className="col-span-1 md:col-span-4 space-y-1.5 text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">Where are you going?</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search destination, city or area"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-colors"
                  />
                  <MapPin className="w-4 h-4 text-[#4F46E5] absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Check-in Field */}
              <div className="col-span-1 md:col-span-2 space-y-1.5 text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">Check-in</p>
                <div className="relative">
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-xs text-slate-800 font-semibold">
                    <Calendar className="w-4 h-4 text-[#4F46E5] shrink-0" />
                    <span>20 May 2025</span>
                  </div>
                </div>
              </div>

              {/* Check-out Field */}
              <div className="col-span-1 md:col-span-2 space-y-1.5 text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">Check-out</p>
                <div className="relative">
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-xs text-slate-800 font-semibold">
                    <Calendar className="w-4 h-4 text-[#4F46E5] shrink-0" />
                    <span>23 May 2025</span>
                  </div>
                </div>
              </div>

              {/* Guests & Rooms Field */}
              <div className="col-span-1 md:col-span-2 space-y-1.5 text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">Guests & Rooms</p>
                <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-xs text-slate-800 font-semibold">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#4F46E5] shrink-0" />
                    <span>2 Guests, 1 Room</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              </div>

              {/* Blue Search Button */}
              <div className="col-span-1 md:col-span-2 md:pt-5">
                <button 
                  onClick={() => {
                    const resultsSection = document.getElementById('hotel-results-section');
                    resultsSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 justify-center shadow-lg hover:shadow-indigo-900/10 transition-all cursor-pointer border-0"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Hotels</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* 2. FIVE-BADGE TRUST REASSURANCE ROW (under the search bar) */}
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-4 shadow-xs text-left" id="hotels-reassurance-row">
          {[
            { title: 'Best Rate Match', desc: 'We guarantee the lowest luxury rates', icon: ShieldCheck },
            { title: 'Flexible Check-In', desc: 'Custom arrival and departures', icon: Calendar },
            { title: 'Instant Booking', desc: 'Get voucher confirmation instantly', icon: Sparkles },
            { title: 'Secure Transactions', desc: '100% encrypted checkout', icon: Lock },
            { title: '24/7 Concierge', desc: 'Personal travel desk assistance', icon: Headphones }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-[11px] text-slate-800 leading-tight">{item.title}</h5>
                  <p className="text-[9px] text-slate-400 mt-0.5 leading-none">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. EXPLORE HOTELS BY EXPERIENCE/CLASS (5 customized category cards) */}
        <section className="space-y-6 pt-4 text-left" id="section-hotel-experiences">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Explore Hotels by Experience
              </h2>
              <p className="text-sm text-slate-500 font-medium">Find the perfect resort or boutique stay that matches your travel style</p>
            </div>
            <button 
              onClick={() => {
                setSelectedExperience(null);
                setSearchQuery('');
                setPriceMax(100000);
              }}
              className="text-xs font-extrabold text-[#4F46E5] uppercase tracking-wider flex items-center gap-1 hover:text-[#4338CA] transition-colors cursor-pointer bg-transparent border-0"
            >
              <span>View all Hotels</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4" id="hotel-experience-cards-grid">
            {[
              { 
                title: 'Mountain Resorts', 
                desc: 'Panoramic alpine chalets & spa retreats', 
                image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=400&q=80', 
                icon: Mountain,
                color: 'bg-emerald-600'
              },
              { 
                title: 'Luxury Suites', 
                desc: 'Five-star rooms & elite penthouse stays', 
                image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80', 
                icon: Star,
                color: 'bg-indigo-600'
              },
              { 
                title: 'Riverfront Lodges', 
                desc: 'Peaceful riversides & crystal stream sides', 
                image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80', 
                icon: Waves,
                color: 'bg-teal-600'
              },
              { 
                title: 'Heritage Hotels', 
                desc: 'Authentic palaces, history, & royal service', 
                image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=400&q=80', 
                icon: Building,
                color: 'bg-amber-600'
              },
              { 
                title: 'Budget Premium', 
                desc: 'High comfort at highly affordable prices', 
                image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', 
                icon: Wallet,
                color: 'bg-purple-600'
              }
            ].map((exp, idx) => {
              const Icon = exp.icon;
              const isActive = selectedExperience === exp.title;
              return (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedExperience(selectedExperience === exp.title ? null : exp.title);
                  }}
                  className={`relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer group shadow-sm transition-all duration-300 ${
                    isActive ? 'ring-4 ring-[#4F46E5] scale-[1.02] shadow-lg' : 'border border-slate-200 hover:scale-[1.01] hover:shadow-md'
                  }`}
                >
                  <img 
                    src={exp.image} 
                    alt={exp.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  {/* Premium dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
                  
                  {/* Text on Bottom Left */}
                  <div className="absolute bottom-4 left-4 right-14 text-left z-10">
                    <h4 className="text-sm font-bold text-white tracking-tight leading-snug">{exp.title}</h4>
                    <p className="text-[10px] text-white/85 leading-tight mt-0.5">{exp.desc}</p>
                  </div>

                  {/* Icon on Bottom Right */}
                  <div className="absolute bottom-4 right-4 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${exp.color} border border-white/20 shadow-md transition-transform group-hover:scale-110`}>
                      {isActive ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Icon className="w-4 h-4 stroke-[2]" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. DYNAMIC SEARCH RESULTS VIEWS WITH SIDEBAR FILTERS & INTERACTIVE MAP */}
        <section id="hotel-results-section" className="space-y-6 pt-6 scroll-mt-24 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] uppercase tracking-wide">
                Available Hotels & Resorts ({hotelFilteredListings.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {selectedExperience 
                  ? `Filtering by experience: "${selectedExperience}"` 
                  : 'Displaying certified elite luxury properties and boutique hotels.'}
              </p>
            </div>

            {/* Sync connection */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 self-start md:self-auto shadow-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wide">
                Active Connection
              </span>
              <button onClick={fetchListings} className="text-slate-400 hover:text-slate-950 ml-1.5 bg-transparent border-0 cursor-pointer">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* A. Sidebar Filter Panel */}
            <aside className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-xs">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-extrabold text-[#0F172A] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <SlidersHorizontal className="w-4 h-4 text-[#4F46E5]" /> Filters
                  </span>
                  <button 
                    onClick={() => {
                      setPriceMax(100000);
                      setSelectedRating(null);
                      setSearchQuery('');
                      setSelectedExperience(null);
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5] hover:underline cursor-pointer bg-transparent border-0"
                  >
                    Clear All
                  </button>
                </div>

                {/* Keyword search input */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Location Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Hunza, Skardu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-colors"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Price max budget */}
                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    <span>Max Price</span>
                    <span className="text-[#4F46E5]">PKR {priceMax.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="120000"
                    step="5000"
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-full accent-[#4F46E5] bg-slate-100 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Min rating */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Minimum Rating</label>
                  <div className="flex gap-1.5">
                    {[4.5, 4.7, 4.8, 4.9].map((star) => (
                      <button
                        key={star}
                        onClick={() => setSelectedRating(selectedRating === star ? null : star)}
                        className={`flex-1 py-1 rounded-lg text-[9px] font-extrabold border transition-all cursor-pointer ${
                          selectedRating === star
                            ? 'bg-[#4F46E5] border-[#4F46E5] text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        ★ {star}+
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </aside>

            {/* B. Listing Results and Map Grid */}
            <main className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Listings List Column */}
              <section className="md:col-span-7 space-y-4">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                      <CardSkeleton key={i} />
                    ))}
                  </div>
                ) : hotelFilteredListings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800">No Hotels Found</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">Try resetting your filters or keyword search to discover more elite resort accommodations.</p>
                    <button 
                      onClick={() => {
                        setPriceMax(100000);
                        setSelectedRating(null);
                        setSearchQuery('');
                        setSelectedExperience(null);
                      }}
                      className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[11px] font-extrabold px-4 py-2 rounded-xl mt-4 uppercase tracking-wider transition-colors border-0 cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    {hotelFilteredListings.map((listing) => {
                      const isFavorite = favorites[listing.id];
                      return (
                        <div 
                          key={listing.id}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all flex flex-col sm:flex-row group cursor-pointer"
                          onClick={() => onSelectListing(listing)}
                          onMouseEnter={() => setHoveredListingId(listing.id)}
                          onMouseLeave={() => setHoveredListingId(null)}
                        >
                          {/* Image Box */}
                          <div className="sm:w-5/12 h-44 sm:h-auto relative overflow-hidden shrink-0">
                            <img 
                              src={listing.image} 
                              alt={listing.title} 
                              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                              onError={handleImageError}
                            />
                            {/* Favorite Button */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
                              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-md border border-slate-100 z-10 active:scale-90 transition-transform cursor-pointer"
                            >
                              <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400 group-hover:text-red-500'}`} />
                            </button>
                          </div>

                          {/* Details Content Info Block */}
                          <div className="p-5 flex-1 flex flex-col justify-between text-left space-y-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                                <MapPin className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" />
                                <span className="line-clamp-1">{listing.location}</span>
                              </div>
                              <h4 className="text-base font-black text-slate-900 group-hover:text-[#4F46E5] transition-colors leading-snug line-clamp-2">
                                {listing.title}
                              </h4>
                              <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">
                                {listing.description}
                              </p>
                            </div>

                            {/* Rating and Price row */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
                              {/* Rating */}
                              <div className="flex items-center gap-1">
                                <div className="flex items-center text-amber-500">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                                  <span className="text-xs font-extrabold text-slate-800 ml-1">{listing.rating}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold">({listing.reviewsCount} reviews)</span>
                              </div>

                              {/* Price and Book Action */}
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-slate-400 text-[8px] uppercase tracking-widest font-extrabold">Price per night</p>
                                  <p className="text-base font-black text-[#4F46E5]">PKR {listing.price.toLocaleString()}</p>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onSelectListing(listing); }}
                                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 border-0"
                                >
                                  Book
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Interactive Map Column on the right */}
              <section className="md:col-span-5 hidden md:flex relative h-[540px] sticky top-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm flex flex-col justify-between p-4">
                {/* Visual stylised schematic topographic map */}
                <div className="absolute inset-0 z-0 bg-slate-50">
                  {/* Decorative topological contour lines and rivers */}
                  <svg className="w-full h-full opacity-15" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
                    <path d="M-50 100 Q100 50 150 200 T350 100 T500 300" fill="none" stroke="#4F46E5" strokeWidth="2" />
                    <path d="M-50 250 Q120 180 200 350 T400 250 T500 450" fill="none" stroke="#4F46E5" strokeWidth="1.5" />
                    <path d="M-50 400 Q80 450 180 380 T380 500 T550 400" fill="none" stroke="#4F46E5" strokeWidth="1" strokeDasharray="3 3" />
                    {/* Blue Indus River */}
                    <path d="M 0 50 Q 150 150 180 300 T 400 550" fill="none" stroke="#3B82F6" strokeWidth="5" opacity="0.6" />
                  </svg>

                  {/* Topographic height notes */}
                  <span className="absolute bottom-4 left-4 text-[8px] font-mono text-slate-300">UTM ZONE 43N / K2 REGION</span>
                  <span className="absolute top-4 right-4 text-[8px] font-mono text-slate-300">CONTOUR INTERVAL 50M</span>

                  {/* Pins plotted on the map */}
                  {hotelFilteredListings.map((l) => {
                    const coords = getCoordinates(l.id);
                    const isHovered = hoveredListingId === l.id;
                    const isSelected = selectedMapListing?.id === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => setSelectedMapListing(l)}
                        style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-350 cursor-pointer bg-transparent border-0`}
                      >
                        {/* Price bubble */}
                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black border tracking-tight shadow-md transition-colors ${
                          isSelected || isHovered 
                            ? 'bg-[#4F46E5] text-white border-[#4F46E5]' 
                            : 'bg-white text-slate-800 border-slate-200'
                        }`}>
                          PKR {(l.price / 1000).toFixed(0)}k
                        </div>
                        {/* Pin needle */}
                        <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-md transition-colors -mt-1 ${
                          isSelected || isHovered ? 'bg-red-500' : 'bg-[#4F46E5]'
                        }`} />
                      </button>
                    );
                  })}
                </div>

                {/* Top header overlay over map */}
                <div className="relative z-10 bg-white/90 backdrop-blur-md px-3 py-2.5 rounded-xl border border-slate-200/50 flex items-center justify-between shadow-xs">
                  <div>
                    <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 font-sans">Interactive Map</h5>
                    <p className="text-[9px] text-slate-400">Showing elite hotels by coordinates</p>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                </div>

                {/* Bottom selected card popup */}
                <div className="relative z-10 bg-white border border-slate-200 p-3 rounded-xl shadow-xl flex gap-3 max-h-32">
                  {selectedMapListing ? (
                    <>
                      <img 
                        src={selectedMapListing.image} 
                        alt={selectedMapListing.title} 
                        className="w-24 h-full object-cover rounded-lg shrink-0"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                      <div className="flex flex-col justify-between py-0.5 text-left flex-1 min-w-0">
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 truncate leading-tight">{selectedMapListing.title}</h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{selectedMapListing.location}</p>
                          <div className="flex items-center text-amber-500 text-[10px] font-bold mt-1.5">
                            <Star className="w-3 h-3 fill-amber-400 stroke-none mr-0.5" />
                            <span>{selectedMapListing.rating} ({selectedMapListing.reviewsCount})</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="font-bold text-xs text-[#4F46E5]">PKR {selectedMapListing.price.toLocaleString()}</span>
                          <button 
                            onClick={() => onSelectListing(selectedMapListing)}
                            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg transition-colors border-0 cursor-pointer"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full text-center py-6 text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-300 animate-pulse" />
                      <span>Select a pin on the map</span>
                    </div>
                  )}
                </div>

              </section>

            </main>

          </div>
        </section>

      </div>
    );
  }

  // ---------------- TOUR SPECIAL RENDERING ENGINE (CLONING HERO & SEARCH) ----------------
  if (type === 'tour') {
    const tourFilteredListings = displayListings;

    return (
      <div id="listings-search-view" className="space-y-12 pb-16 text-left -mt-4 animate-fadeIn">
        
        {/* 1. GORGEOUS MOUNTAIN HERO BLOCK WITH Scenic Adventure Expeditions */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl min-h-[520px] lg:min-h-[580px] flex flex-col justify-between p-6 sm:p-10 lg:p-12">
          {/* Panoramic tour mountain background */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80" 
              alt="Guided Expedition in Gilgit Baltistan" 
              className="w-full h-full object-cover opacity-60 object-center animate-fadeIn"
              referrerPolicy="no-referrer"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-slate-950/20" />
          </div>

          {/* Hero Content Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-3">
              {/* Adventure & Discovery. Premium Guided Tours Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#7C3AED]/30 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-[#A78BFA]/30 uppercase tracking-widest">
                <Compass className="w-3.5 h-3.5 text-[#A78BFA] animate-spin-slow" />
                <span>Adventure & Discovery. Fully Hosted.</span>
              </div>

              {/* Premium Guided Tours in Gilgit Baltistan Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Premium Guided Tours in <br />
                <span className="text-[#006F3C] drop-shadow-sm font-black">Gilgit Baltistan</span>
              </h1>

              {/* Subheading */}
              <p className="text-sm sm:text-base text-slate-100 max-w-xl leading-relaxed font-sans font-medium">
                Explore spectacular mountain passes, pristine alpine lakes, and ancient historical forts with our all-inclusive premium itineraries.
              </p>

              {/* 4 Bullet Reassurance Items from the Image */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10" id="tours-hero-bullets">
                {[
                  { label: 'All-Inclusive Stays', icon: ShieldCheck },
                  { label: 'Certified Guides', icon: Users },
                  { label: 'Private 4x4 Prado', icon: Car },
                  { label: '24/7 Ground Support', icon: Headphones }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#A78BFA] shrink-0 border border-[#A78BFA]/35">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight tracking-tight text-slate-100">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FLOATING SEARCH WIDGET (Overlaps beautifully in Hero container bottom) */}
          <div className="relative z-20 mt-8 bg-white border border-[#E2E8F0] p-5 sm:p-6 shadow-2xl rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Where are you going? Field */}
              <div className="col-span-1 md:col-span-4 space-y-1.5 text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">Where are you going?</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search destination, valley or landmark"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-colors animate-none"
                  />
                  <MapPin className="w-4 h-4 text-[#7C3AED] absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Tour Duration Dropdown */}
              <div className="col-span-1 md:col-span-3 space-y-1.5 text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">Duration (Days)</p>
                <div className="relative flex items-center">
                  <select
                    value={tourDays || ''}
                    onChange={(e) => setTourDays(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#7C3AED] focus:bg-white appearance-none cursor-pointer transition-colors"
                  >
                    <option value="">Any Duration</option>
                    <option value="1">1 Day</option>
                    <option value="5">5 Days</option>
                    <option value="6">6 Days</option>
                    <option value="7">7 Days</option>
                  </select>
                  <Calendar className="w-4 h-4 text-[#7C3AED] absolute left-3 pointer-events-none" />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
              </div>

              {/* Group Size Field */}
              <div className="col-span-1 md:col-span-3 space-y-1.5 text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">Group Size</p>
                <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-xs text-slate-800 font-semibold">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span>Up to 12 Travelers</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              </div>

              {/* Purple Search Button */}
              <div className="col-span-1 md:col-span-2 md:pt-5">
                <button 
                  onClick={() => {
                    const resultsSection = document.getElementById('tour-results-section');
                    resultsSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 justify-center shadow-lg hover:shadow-purple-900/10 transition-all cursor-pointer border-0"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Tours</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* 2. FIVE-BADGE TRUST REASSURANCE ROW (under the search bar) */}
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-4 shadow-xs text-left" id="tours-reassurance-row">
          {[
            { title: 'Best Rate Match', desc: 'Guaranteed lowest local prices', icon: ShieldCheck },
            { title: 'All-Inclusive Comfort', desc: 'Hotels, meals & premium transport', icon: Home },
            { title: 'Expert Local Guides', desc: 'Certified local bilingual storytellers', icon: Compass },
            { title: 'Secure Direct Booking', desc: '100% encrypted direct checkout', icon: Lock },
            { title: '24/7 Ground Support', desc: 'Personal travel coordinator desk', icon: Headphones }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-[#7C3AED] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-[11px] text-slate-800 leading-tight">{item.title}</h5>
                  <p className="text-[9px] text-slate-400 mt-0.5 leading-none">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. EXPLORE TOURS BY EXPERIENCE/CLASS (5 customized category cards) */}
        <section className="space-y-6 pt-4 text-left" id="section-tour-experiences">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Explore Tours by Experience
              </h2>
              <p className="text-sm text-slate-500 font-medium">Find the perfect itinerary and package that matches your dream vacation</p>
            </div>
            <button 
              onClick={() => {
                setSelectedExperience(null);
                setSearchQuery('');
                setPriceMax(100000);
                setTourDays(null);
              }}
              className="text-xs font-extrabold text-[#7C3AED] uppercase tracking-wider flex items-center gap-1 hover:text-[#6D28D9] transition-colors cursor-pointer bg-transparent border-0"
            >
              <span>View all Tours</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4" id="tour-experience-cards-grid">
            {[
              { 
                title: 'Autumn Odyssey', 
                desc: 'Golden foliage, apricot orchards & crisp air', 
                image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', 
                icon: Compass,
                color: 'bg-amber-600'
              },
              { 
                title: 'Wilderness Safaris', 
                desc: 'Traverse Deosai Plains & spot brown bears', 
                image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80', 
                icon: Mountain,
                color: 'bg-emerald-600'
              },
              { 
                title: 'Heritage & Culture', 
                desc: 'Historic forts, folk songs, & royal legacy', 
                image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=400&q=80', 
                icon: Building2,
                color: 'bg-amber-800'
              },
              { 
                title: 'Glacier Expeditions', 
                desc: 'Hike to majestic glaciers & colossal peaks', 
                image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', 
                icon: Waves,
                color: 'bg-blue-600'
              },
              { 
                title: 'Short Getaways', 
                desc: 'Quick 1 to 3 day scenic lake retreats', 
                image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80', 
                icon: Clock,
                color: 'bg-purple-600'
              }
            ].map((exp, idx) => {
              const Icon = exp.icon;
              const isActive = selectedExperience === exp.title;
              return (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedExperience(selectedExperience === exp.title ? null : exp.title);
                  }}
                  className={`relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer group shadow-sm transition-all duration-300 ${
                    isActive ? 'ring-4 ring-[#7C3AED] scale-[1.02] shadow-lg' : 'border border-slate-200 hover:scale-[1.01] hover:shadow-md'
                  }`}
                >
                  <img 
                    src={exp.image} 
                    alt={exp.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  {/* Premium dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
                  
                  {/* Text on Bottom Left */}
                  <div className="absolute bottom-4 left-4 right-14 text-left z-10 font-sans">
                    <h4 className="text-sm font-bold text-white tracking-tight leading-snug">{exp.title}</h4>
                    <p className="text-[10px] text-white/85 leading-tight mt-0.5">{exp.desc}</p>
                  </div>

                  {/* Icon on Bottom Right */}
                  <div className="absolute bottom-4 right-4 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${exp.color} border border-white/20 shadow-md transition-transform group-hover:scale-110`}>
                      {isActive ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Icon className="w-4 h-4 stroke-[2]" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. DYNAMIC SEARCH RESULTS VIEWS WITH SIDEBAR FILTERS & INTERACTIVE MAP */}
        <section id="tour-results-section" className="space-y-6 pt-6 scroll-mt-24 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] uppercase tracking-wide">
                Available Guided Tours ({tourFilteredListings.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium font-sans">
                {selectedExperience 
                  ? `Filtering by experience: "${selectedExperience}"` 
                  : 'Displaying certified all-inclusive premium tours and curated itineraries.'}
              </p>
            </div>

            {/* Sync connection */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 self-start md:self-auto shadow-xs">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wide">
                Active Connection
              </span>
              <button onClick={fetchListings} className="text-slate-400 hover:text-slate-950 ml-1.5 bg-transparent border-0 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* A. Sidebar Filter Panel */}
            <aside className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-xs">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-extrabold text-[#0F172A] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" /> Filters
                  </span>
                  <button 
                    onClick={() => {
                      setPriceMax(100000);
                      setSelectedRating(null);
                      setSearchQuery('');
                      setSelectedExperience(null);
                      setTourDays(null);
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] hover:underline cursor-pointer bg-transparent border-0"
                  >
                    Clear All
                  </button>
                </div>

                {/* Keyword search input */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Location Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Hunza, Skardu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-colors animate-none"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Price max budget */}
                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    <span>Max Budget</span>
                    <span className="text-[#7C3AED]">PKR {priceMax.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="120000"
                    step="5000"
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-full accent-[#7C3AED] bg-slate-100 h-1.5 rounded-lg cursor-pointer animate-none"
                  />
                </div>

                {/* Min rating */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Minimum Rating</label>
                  <div className="flex gap-1.5">
                    {[4.5, 4.7, 4.8, 4.9].map((star) => (
                      <button
                        key={star}
                        onClick={() => setSelectedRating(selectedRating === star ? null : star)}
                        className={`flex-1 py-1 rounded-lg text-[9px] font-extrabold border transition-all cursor-pointer ${
                          selectedRating === star
                            ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        ★ {star}+
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tour specific parameters */}
                <div className="space-y-2 pt-4 border-t border-slate-100 text-left">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Duration (Days)</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 5, 6, 7].map((days) => (
                      <button
                        key={days}
                        onClick={() => setTourDays(tourDays === days ? null : days)}
                        className={`py-1.5 rounded-lg text-[9px] font-extrabold border transition-all cursor-pointer ${
                          tourDays === days
                            ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {days === 1 ? '1 Day' : `${days} Days`}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </aside>

            {/* B. Listing Results and Map Grid */}
            <main className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Listings List Column */}
              <section className="md:col-span-7 space-y-4">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                      <CardSkeleton key={i} />
                    ))}
                  </div>
                ) : tourFilteredListings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800">No Tours Found</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">Try resetting your filters or keyword search to discover more elite guided tour packages.</p>
                    <button 
                      onClick={() => {
                        setPriceMax(100000);
                        setSelectedRating(null);
                        setSearchQuery('');
                        setSelectedExperience(null);
                        setTourDays(null);
                      }}
                      className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-extrabold px-4 py-2 rounded-xl mt-4 uppercase tracking-wider transition-colors border-0 cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    {tourFilteredListings.map((listing) => {
                      const isFavorite = favorites[listing.id];
                      return (
                        <div 
                          key={listing.id}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all flex flex-col sm:flex-row group cursor-pointer"
                          onClick={() => onSelectListing(listing)}
                          onMouseEnter={() => setHoveredListingId(listing.id)}
                          onMouseLeave={() => setHoveredListingId(null)}
                        >
                          {/* Image Box */}
                          <div className="sm:w-5/12 h-48 sm:h-auto relative overflow-hidden shrink-0 bg-slate-100">
                            <img 
                              src={listing.image} 
                              alt={listing.title} 
                              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                              onError={handleImageError}
                            />
                            {/* Favorite Button */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
                              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-md border border-slate-100 z-10 active:scale-90 transition-transform cursor-pointer"
                            >
                              <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400 group-hover:text-red-500'}`} />
                            </button>
                            
                            {/* Floating Duration Ribbon */}
                            {listing.tourSpecs && (
                              <div className="absolute bottom-3 left-3 bg-[#7C3AED] text-white px-3 py-1 rounded-full text-[10px] font-extrabold shadow-md flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{listing.tourSpecs.durationDays} Days</span>
                              </div>
                            )}
                          </div>

                          {/* Details Content Info Block */}
                          <div className="p-5 flex-1 flex flex-col justify-between text-left space-y-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                                <MapPin className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                                <span className="line-clamp-1">{listing.location}</span>
                              </div>
                              <h4 className="text-base font-black text-slate-900 group-hover:text-[#7C3AED] transition-colors leading-snug line-clamp-1">
                                {listing.title}
                              </h4>
                              <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">
                                {listing.description}
                              </p>

                              {/* Included bullet items highlights */}
                              {listing.tourSpecs && listing.tourSpecs.included && (
                                <div className="flex flex-wrap gap-1 pt-1.5" id={`tour-included-${listing.id}`}>
                                  {listing.tourSpecs.included.slice(0, 3).map((item, keyIdx) => (
                                    <span key={keyIdx} className="bg-purple-50 text-[#7C3AED] border border-purple-100/50 text-[9px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-[#7C3AED]" />
                                      {item.split(' ').slice(0, 3).join(' ')}...
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Rating and Price row */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
                              {/* Rating & Difficulty */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center text-amber-500">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                                  <span className="text-xs font-extrabold text-slate-800 ml-1">{listing.rating}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold">({listing.reviewsCount})</span>
                                {listing.tourSpecs && (
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                    listing.tourSpecs.difficulty === 'Easy' 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}>
                                    {listing.tourSpecs.difficulty}
                                  </span>
                                )}
                              </div>

                              {/* Price and Book Action */}
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-slate-400 text-[8px] uppercase tracking-widest font-extrabold">All-Inclusive Package</p>
                                  <p className="text-base font-black text-[#7C3AED]">PKR {listing.price.toLocaleString()}</p>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onSelectListing(listing); }}
                                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 border-0"
                                >
                                  Book
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Interactive Map Column on the right */}
              <section className="md:col-span-5 hidden md:flex relative h-[540px] sticky top-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm flex flex-col justify-between p-4">
                {/* Visual stylised schematic topographic map */}
                <div className="absolute inset-0 z-0 bg-slate-50">
                  {/* Decorative topological contour lines and rivers */}
                  <svg className="w-full h-full opacity-15" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
                    <path d="M-50 100 Q100 50 150 200 T350 100 T500 300" fill="none" stroke="#7C3AED" strokeWidth="2" />
                    <path d="M-50 250 Q120 180 200 350 T400 250 T500 450" fill="none" stroke="#7C3AED" strokeWidth="1.5" />
                    <path d="M-50 400 Q80 450 180 380 T380 500 T550 400" fill="none" stroke="#7C3AED" strokeWidth="1" strokeDasharray="3 3" />
                    {/* Blue Indus River */}
                    <path d="M 0 50 Q 150 150 180 300 T 400 550" fill="none" stroke="#3B82F6" strokeWidth="5" opacity="0.6" />
                  </svg>

                  {/* Topographic height notes */}
                  <span className="absolute bottom-4 left-4 text-[8px] font-mono text-slate-300">UTM ZONE 43N / K2 REGION</span>
                  <span className="absolute top-4 right-4 text-[8px] font-mono text-slate-300">CONTOUR INTERVAL 50M</span>

                  {/* Pins plotted on the map */}
                  {tourFilteredListings.map((l) => {
                    const coords = getCoordinates(l.id);
                    const isHovered = hoveredListingId === l.id;
                    const isSelected = selectedMapListing?.id === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => setSelectedMapListing(l)}
                        style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-350 cursor-pointer bg-transparent border-0`}
                      >
                        {/* Price bubble */}
                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black border tracking-tight shadow-md transition-colors ${
                          isSelected || isHovered 
                            ? 'bg-[#7C3AED] text-white border-[#7C3AED]' 
                            : 'bg-white text-slate-800 border-slate-200'
                        }`}>
                          PKR {(l.price / 1000).toFixed(0)}k
                        </div>
                        {/* Pin needle */}
                        <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-md transition-colors -mt-1 ${
                          isSelected || isHovered ? 'bg-red-500' : 'bg-[#7C3AED]'
                        }`} />
                      </button>
                    );
                  })}
                </div>

                {/* Top header overlay over map */}
                <div className="relative z-10 bg-white/90 backdrop-blur-md px-3 py-2.5 rounded-xl border border-slate-200/50 flex items-center justify-between shadow-xs">
                  <div>
                    <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 font-sans">Interactive Map</h5>
                    <p className="text-[9px] text-slate-400">Showing itinerary starting coordinates</p>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                </div>

                {/* Bottom selected card popup */}
                <div className="relative z-10 bg-white border border-slate-200 p-3 rounded-xl shadow-xl flex gap-3 max-h-32">
                  {selectedMapListing ? (
                    <>
                      <img 
                        src={selectedMapListing.image} 
                        alt={selectedMapListing.title} 
                        className="w-24 h-full object-cover rounded-lg shrink-0"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                      <div className="flex flex-col justify-between py-0.5 text-left flex-1 min-w-0">
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 truncate leading-tight">{selectedMapListing.title}</h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{selectedMapListing.location}</p>
                          <div className="flex items-center text-amber-500 text-[10px] font-bold mt-1.5 font-sans">
                            <Star className="w-3 h-3 fill-amber-400 stroke-none mr-0.5" />
                            <span>{selectedMapListing.rating} ({selectedMapListing.reviewsCount})</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="font-bold text-xs text-[#7C3AED]">PKR {selectedMapListing.price.toLocaleString()}</span>
                          <button 
                            onClick={() => onSelectListing(selectedMapListing)}
                            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg transition-colors border-0 cursor-pointer"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full text-center py-6 text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 font-sans">
                      <MapPin className="w-4 h-4 text-slate-300 animate-pulse" />
                      <span>Select a pin on the map</span>
                    </div>
                  )}
                </div>

              </section>

            </main>

          </div>
        </section>

      </div>
    );
  }

  // ---------------- OFFERS SPECIAL RENDERING ENGINE ----------------
  if (type === 'offer') {
    const offersList = [
      {
        id: 'offer-autumn',
        title: 'Early Bird Autumn Hunza Pack',
        category: 'Seasonal Packs',
        discount: '30% OFF',
        promoCode: 'HUNZAAUTUMN30',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
        location: 'Hunza',
        rate: 0.30,
        description: 'Save big on our most coveted Autumn tours in Hunza. Admire golden apricot groves and the reflective Attabad Lake with private local guides.',
        perks: ['Private local guide included', 'Free Attabad Lake boating', 'Premium room upgrade on availability'],
        expiresIn: '7 Days Left',
        isExclusive: true
      },
      {
        id: 'offer-ski',
        title: 'Winter Ski Malam Jabba Special',
        category: 'Seasonal Packs',
        discount: '20% OFF',
        promoCode: 'MALAMSKI20',
        image: 'https://images.unsplash.com/photo-1518098268026-4e43a1a009de?auto=format&fit=crop&w=800&q=80',
        location: 'Swat',
        rate: 0.20,
        description: 'Unleash your winter spirit in Malam Jabba ski resort. Bundle lodging and full ski gear rentals together to save maximum.',
        perks: ['Free 1-Day Lift Pass', '20% Off Ski gear rental', 'Complimentary hot chocolate on arrival'],
        expiresIn: 'Ends Dec 15',
        isExclusive: false
      },
      {
        id: 'offer-desert',
        title: 'Skardu Desert Escape Flash Deal',
        category: 'Flash Deals',
        discount: 'FLAT 25%',
        promoCode: 'DESERTFLASH25',
        image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
        location: 'Skardu',
        rate: 0.25,
        description: 'Valid only for a limited period! Explore Katpana Cold Desert and stay at boutique Lakeside Resorts with unparalleled luxury rates.',
        perks: ['Free airport transfer both ways', 'Complimentary desert dune 4x4 ride', 'High-tea session on lake shore'],
        expiresIn: '2 Days Left',
        isExclusive: true
      },
      {
        id: 'offer-lahore',
        title: 'Cultural Lahore Heritage Pass',
        category: 'Last Minute',
        discount: 'BUY 1 GET 1 HALF',
        promoCode: 'LAHOREHERITAGE',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        location: 'Lahore',
        rate: 0.25,
        description: 'Discover Mughal masterpieces like Lahore Fort and Badshahi Mosque. Enjoy flat half-price discounts on your second night\'s booking.',
        perks: ['Free Walled City culinary food tour', 'Late 4:00 PM checkout guaranteed', 'Historical map & guide kit'],
        expiresIn: 'Limited Space',
        isExclusive: false
      },
      {
        id: 'offer-naran',
        title: 'Naran Valley Family Retreat Pack',
        category: 'VIP Perks',
        discount: '15% + FREE CAR',
        promoCode: 'NARANFAMILY15',
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
        location: 'Naran',
        rate: 0.15,
        description: 'Perfect for families exploring Saif-ul-Muluk lake. Get 15% discount on 3+ star hotels plus a free driver-driven SUV upgrade.',
        perks: ['Free premium SUV rental', 'Lakeside bonfire setup with tea', 'Kids adventure activity kit'],
        expiresIn: 'Active Seasonal',
        isExclusive: true
      },
      {
        id: 'offer-karachi',
        title: 'Karachi Beachfront Luxury Escape',
        category: 'VIP Perks',
        discount: '20% OFF VIP',
        promoCode: 'BEACHVIP20',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        location: 'Karachi',
        rate: 0.20,
        description: 'Bask in premium Arabian sea breezes. Get 20% discount on luxury stays plus a complimentary private candlelit beach dinner.',
        perks: ['Complimentary private beach dinner', 'Free spa session for two', 'Late check-out till 6 PM'],
        expiresIn: 'Ends Oct 30',
        isExclusive: true
      },
      {
        id: 'offer-passu',
        title: 'Passu Cones Trekker Special',
        category: 'Flash Deals',
        discount: '15% OFF',
        promoCode: 'PASSUTREK15',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
        location: 'Hunza',
        rate: 0.15,
        description: 'The ultimate trekker experience around the iconic Passu Cones. Save 15% on high-altitude equipment rentals and guided treks.',
        perks: ['Professional mountain guide support', 'Free basecamp tent setup', 'Warm sleeping bag rentals included'],
        expiresIn: '4 Days Left',
        isExclusive: false
      },
      {
        id: 'offer-islamabad',
        title: 'Margalla Hills Boutique Getaway',
        category: 'Last Minute',
        discount: 'FLAT 10%',
        promoCode: 'ISLBOOT10',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        location: 'Islamabad',
        rate: 0.10,
        description: 'Escape to boutique retreats nestled inside the Margalla Hills. Wake up to crisp woodland air and enjoy panoramic city views.',
        perks: ['Daily organic hilltop breakfast', 'Free mountain hiking trail kit', 'Complimentary evening Mocktails'],
        expiresIn: 'Active Now',
        isExclusive: false
      },
      {
        id: 'offer-shigar',
        title: 'Shigar Fort Royal Heritage Pack',
        category: 'VIP Perks',
        discount: '30% OFF',
        promoCode: 'ROYALSHIGAR30',
        image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
        location: 'Skardu',
        rate: 0.30,
        description: 'Live like royalty inside the beautifully restored 400-year-old Shigar Fort. Complete museum tour and local fruit picking included.',
        perks: ['Private museum guided tour', 'Complimentary cherry orchard basket', 'Traditional Balti welcome tea'],
        expiresIn: '7 Days Left',
        isExclusive: true
      }
    ];

    const offerCategories = ['All', 'Seasonal Packs', 'Flash Deals', 'Last Minute', 'VIP Perks'];

    const filteredOffers = offersList.filter(offer => {
      const matchesCategory = selectedOfferCategory === 'All' || offer.category === selectedOfferCategory;
      const matchesSearch = offer.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            offer.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            offer.promoCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    const handleCopyCode = (code: string) => {
      navigator.clipboard.writeText(code);
      setCopiedOfferCode(code);
      setTimeout(() => setCopiedOfferCode(null), 2500);
    };

    const handleBudgetChange = (offerId: string, value: string, rate: number) => {
      const numVal = parseFloat(value) || 0;
      setOfferBudgets(prev => ({ ...prev, [offerId]: numVal }));
      setCalculatedSavings(prev => ({ ...prev, [offerId]: Math.round(numVal * rate) }));
    };

    return (
      <div id="listings-search-view" className="space-y-12 pb-16 text-left -mt-4 animate-fadeIn">
        
        {/* 1. OFFERS GORGEOUS FLASH-RED HERO BLOCK */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl min-h-[460px] flex flex-col justify-between p-6 sm:p-10 lg:p-12">
          {/* Background image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=80" 
              alt="Luxury Travel Deals & Perks" 
              className="w-full h-full object-cover opacity-45 object-center"
              referrerPolicy="no-referrer"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-slate-950/20" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-600/30 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-rose-500/30 uppercase tracking-widest">
              <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>Limited Time Travel Privileges</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Exclusive <span className="text-rose-500 font-black">Promos</span> <br />
              & Seasonal Perks
            </h1>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans font-medium">
              Save up to 30% with handpicked packages. Claim verification codes, copy custom vouchers, and receive free rental cars, local guides, and culinary walks.
            </p>
          </div>

          {/* Search bar inside Hero */}
          <div className="relative z-20 mt-8 bg-white border border-slate-200 p-4 shadow-xl rounded-2xl max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter offers by city, promo code, or title (e.g. Hunza, MALAM...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-850 font-bold focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
              />
              <Search className="w-4 h-4 text-rose-500 absolute left-3 top-3.5" />
            </div>
          </div>
        </div>

        {/* 2. REASSURANCE TILES */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-6 shadow-sm">
          {[
            { title: 'Flat Markdowns', desc: 'Up to 30% off standard accommodation', icon: Percent, color: 'text-rose-500 bg-rose-50 border-rose-100' },
            { title: 'Free Upgrade Perks', desc: 'Get free rental cars, drivers, & guides', icon: Sparkles, color: 'text-amber-500 bg-amber-50 border-amber-100' },
            { title: 'Flex Travel Dates', desc: 'Easy booking transfers with no fees', icon: Calendar, color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
            { title: 'Direct Activation', desc: 'Instantly search & apply codes upon click', icon: Zap, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' }
          ].map((item, idx) => (
            <div key={idx} className="flex gap-3.5 items-start">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <h5 className="font-extrabold text-xs text-slate-850 uppercase tracking-tight">{item.title}</h5>
                <p className="text-[11px] text-slate-500 leading-snug font-medium font-sans">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 3. CATEGORY SELECTOR PILLS */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
            {offerCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedOfferCategory(cat)}
                className={`px-4.5 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider border cursor-pointer ${
                  selectedOfferCategory === cat
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md scale-102'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ACTIVE COPY CODE TOAST BANNER */}
          <AnimatePresence>
            {copiedOfferCode && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 justify-between"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 animate-bounce" />
                  <span>Promo Code <span className="underline font-black">{copiedOfferCode}</span> successfully copied to clipboard! Paste it on checkout to receive benefits.</span>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Active Deal</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OFFERS GRID */}
          {filteredOffers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-200 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800">No Offers Found</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">Try selecting another tab or clearing search keywords.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedOfferCategory('All'); }}
                className="bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-extrabold px-5 py-2.5 rounded-xl mt-4 uppercase tracking-wider border-0 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredOffers.map((offer) => {
                const isCopied = copiedOfferCode === offer.promoCode;
                const budgetVal = offerBudgets[offer.id] || 100000;
                const savedVal = Math.round(budgetVal * offer.rate);
                const spentVal = budgetVal - savedVal;

                return (
                  <div 
                    key={offer.id} 
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    
                    {/* Top Section with Image & Discount Badge */}
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden shrink-0">
                      <img 
                        src={offer.image} 
                        alt={offer.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/25" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-md">
                          {offer.discount}
                        </span>
                        {offer.isExclusive && (
                          <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Exclusive</span>
                          </span>
                        )}
                      </div>

                      <div className="absolute top-4 right-4 bg-white/95 border border-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                        ⏳ {offer.expiresIn}
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md text-white font-extrabold uppercase tracking-widest border border-white/10">
                          {offer.category}
                        </span>
                        <h3 className="text-base sm:text-lg font-black mt-1.5 truncate drop-shadow-sm">{offer.title}</h3>
                      </div>
                    </div>

                    {/* Middle details and perks */}
                    <div className="p-5 space-y-4 text-left flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium min-h-[40px] line-clamp-3">
                          {offer.description}
                        </p>

                        {/* Perks checklist */}
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1.5">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Included Perks:</p>
                          <div className="space-y-1">
                            {offer.perks.map((perk, perkIdx) => (
                              <div key={perkIdx} className="flex items-center gap-2 text-xs text-slate-700">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="font-medium font-sans truncate">{perk}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Promo Code Copy Row */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between min-w-0">
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-sans shrink-0">Promo</span>
                            <span className="font-mono font-bold text-xs text-[#0F172A] truncate ml-1">{offer.promoCode}</span>
                          </div>
                          
                          <button
                            onClick={() => handleCopyCode(offer.promoCode)}
                            className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1 shrink-0 select-none ${
                              isCopied 
                                ? 'bg-emerald-600 border-emerald-600 text-white' 
                                : 'bg-[#0F172A] hover:bg-slate-800 border-slate-800 text-white'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Interactive budget savings tool */}
                      <div className="pt-3 border-t border-slate-100 bg-rose-50/20 rounded-xl p-3.5 border border-rose-100/50 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-extrabold text-rose-600 uppercase tracking-widest flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Savings Visualizer</span>
                          </p>
                          <span className="text-[10px] font-mono font-bold text-slate-500">Rs. {budgetVal.toLocaleString()}</span>
                        </div>
                        
                        {/* Interactive Range Slider */}
                        <div className="space-y-1">
                          <input
                            type="range"
                            min="10000"
                            max="300000"
                            step="5000"
                            value={budgetVal}
                            onChange={(e) => handleBudgetChange(offer.id, e.target.value, offer.rate)}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                          />
                          <div className="flex justify-between text-[8px] text-slate-400 font-bold font-sans">
                            <span>Rs. 10k</span>
                            <span>Slide to Adjust Budget</span>
                            <span>Rs. 300k</span>
                          </div>
                        </div>

                        {/* Real-time split bar */}
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/50 text-[8px] font-extrabold text-white text-center leading-none">
                            <div 
                              className="h-full bg-slate-700 flex items-center justify-center transition-all duration-300" 
                              style={{ width: `${(1 - offer.rate) * 100}%` }}
                            >
                              Pay {Math.round((1 - offer.rate) * 100)}%
                            </div>
                            <div 
                              className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-300" 
                              style={{ width: `${offer.rate * 100}%` }}
                            >
                              Save {Math.round(offer.rate * 100)}%
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] pt-0.5">
                            <div className="text-left font-sans font-semibold text-slate-600">
                              You Pay: <span className="font-bold text-slate-900">Rs. {spentVal.toLocaleString()}</span>
                            </div>
                            <div className="text-right font-sans font-bold text-emerald-600">
                              You Save: <span>Rs. {savedVal.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Direct Apply Search buttons */}
                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => {
                            const queryTerm = offer.location;
                            setSearchQuery(queryTerm);
                            setPriceMax(120000);
                            setSelectedRating(null);
                            const searchItem = document.getElementById('app-navbar');
                            searchItem?.scrollIntoView({ behavior: 'smooth' });
                            const customEvent = new CustomEvent('nav-to-type', { detail: { type: 'hotel', destination: queryTerm } });
                            window.dispatchEvent(customEvent);
                          }}
                          className="flex-1 bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-200 text-[10px] font-extrabold uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all cursor-pointer text-center font-sans truncate"
                        >
                          🏨 Stays in {offer.location}
                        </button>
                        <button
                          onClick={() => {
                            const queryTerm = offer.location;
                            setSearchQuery(queryTerm);
                            setPriceMax(120000);
                            setSelectedRating(null);
                            const searchItem = document.getElementById('app-navbar');
                            searchItem?.scrollIntoView({ behavior: 'smooth' });
                            const customEvent = new CustomEvent('nav-to-type', { detail: { type: 'tour', destination: queryTerm } });
                            window.dispatchEvent(customEvent);
                          }}
                          className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all border-0 cursor-pointer text-center font-sans shadow-xs truncate"
                        >
                          🎒 Tours in {offer.location}
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    );
  }

  // ---------------- DESTINATION SPECIAL RENDERING ENGINE (CLONING HERO & SEARCH) ----------------
  if (type === 'destination') {
    const destinationsList = [
      {
        id: 'dest-hunza',
        name: 'Hunza Valley',
        region: 'Gilgit-Baltistan',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        tag: 'Autumn & Lakes',
        desc: 'A slice of paradise on earth, surrounded by towering Karakoram giants, ancient forts, and the turquoise waters of Attabad Lake.',
        elevation: '2,438 m',
        weather: '15°C (Cool)',
        bestTime: 'Apr - Oct',
        keyAttractions: ['Attabad Lake', 'Baltit Fort', 'Passu Cones', 'Eagle\'s Nest'],
        coordinates: { x: 38, y: 22 }
      },
      {
        id: 'dest-skardu',
        name: 'Skardu',
        region: 'Karakoram Peakway',
        image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
        tag: 'Cold Desert & K2',
        desc: 'The gateway to the world\'s highest peaks, featuring the serene Shangrila Resort, the high-altitude Deosai Plains, and historical royal forts.',
        elevation: '2,228 m',
        weather: '12°C (Chilly)',
        bestTime: 'May - Sep',
        keyAttractions: ['Deosai Plains', 'Shangrila Lake', 'Katpana Cold Desert', 'Shigar Fort'],
        coordinates: { x: 55, y: 35 }
      },
      {
        id: 'dest-swat',
        name: 'Swat Valley',
        region: 'Khyber Pakhtunkhwa',
        image: 'https://images.unsplash.com/photo-1518098268026-4e43a1a009de?auto=format&fit=crop&w=1200&q=80',
        tag: 'Alpine & Ski',
        desc: 'Known as the Switzerland of the East, boasting lush green meadows, rushing rivers, the alpine Malam Jabba ski resort, and rich Buddhist archeology.',
        elevation: '980 m',
        weather: '20°C (Pleasant)',
        bestTime: 'May - Oct',
        keyAttractions: ['Malam Jabba Ski Resort', 'Kalam Valley', 'Ushu Forest', 'Fizagat Park'],
        coordinates: { x: 34, y: 44 }
      },
      {
        id: 'dest-islamabad',
        name: 'Islamabad',
        region: 'Margalla Foothills',
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        tag: 'Modern Capital',
        desc: 'The lush capital of Pakistan, nestled against the Margalla Hills. Known for its wide treelined avenues, clean air, monumental Faisal Mosque, and hiking trails.',
        elevation: '540 m',
        weather: '25°C (Warm)',
        bestTime: 'Oct - Mar',
        keyAttractions: ['Faisal Mosque', 'Daman-e-Koh', 'Margalla Hills Trail 3', 'Centaurus Mall'],
        coordinates: { x: 42, y: 55 }
      },
      {
        id: 'dest-lahore',
        name: 'Lahore',
        region: 'Punjab Heritage',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        tag: 'Mughal History',
        desc: 'The cultural heart of Pakistan, famous for Mughal-era masterpieces like Badshahi Mosque, Lahore Fort, vibrant food streets, and legendary hospitality.',
        elevation: '217 m',
        weather: '28°C (Humid)',
        bestTime: 'Nov - Feb',
        keyAttractions: ['Badshahi Mosque', 'Lahore Fort & Sheesh Mahal', 'Shalimar Gardens', 'Anarkali Bazaar'],
        coordinates: { x: 48, y: 65 }
      }
    ];

    const filteredDestinations = destinationsList.filter(dest => 
      dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div id="listings-search-view" className="space-y-12 pb-16 text-left -mt-4 animate-fadeIn">
        
        {/* 1. GORGEOUS MOUNTAIN HERO BLOCK */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl min-h-[520px] lg:min-h-[580px] flex flex-col justify-between p-6 sm:p-10 lg:p-12">
          {/* Panoramic background */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80" 
              alt="Spectacular Karakoram Highway Pass" 
              className="w-full h-full object-cover opacity-55 object-center animate-fadeIn"
              referrerPolicy="no-referrer"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-slate-950/20" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#EA580C]/30 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-[#F97316]/30 uppercase tracking-widest">
                <Compass className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Legendary Locations. Pure Wonder.</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Discover Legendary <br />
                <span className="text-[#F97316] drop-shadow-sm font-black">Destinations</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-150 max-w-xl leading-relaxed font-sans font-medium">
                Explore majestic peaks, ancient forts, alpine lakes, and historic valleys across northern and cultural Pakistan.
              </p>

              {/* 4 Bullet Reassurance Items */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                {[
                  { label: 'Scenic Wonders', icon: Mountain },
                  { label: 'Cultural Heritage', icon: Home },
                  { label: 'Safe Ground Support', icon: ShieldCheck },
                  { label: '24/7 Concierge', icon: Headphones }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-full bg-[#F97316]/20 flex items-center justify-center text-[#F97316] shrink-0 border border-[#F97316]/35">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight tracking-tight text-slate-100">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FLOATING SEARCH WIDGET */}
          <div className="relative z-20 mt-8 bg-white border border-[#E2E8F0] p-5 sm:p-6 shadow-2xl rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Where are you going? Field */}
              <div className="col-span-1 md:col-span-8 space-y-1.5 text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">Search Destinations & Regions</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, region or description (e.g. Hunza, Skardu...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#F97316] focus:bg-white transition-colors animate-none"
                  />
                  <MapPin className="w-4 h-4 text-[#F97316] absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Reset Search Button */}
              <div className="col-span-1 md:col-span-4 md:pt-5">
                <button 
                  onClick={() => setSearchQuery('')}
                  className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 justify-center shadow-lg transition-all cursor-pointer border-0"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Clear Filter</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* 2. FIVE-BADGE TRUST REASSURANCE ROW */}
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-4 shadow-xs text-left">
          {[
            { title: 'Legendary Peaks', desc: 'Home to five 8,000m+ giants', icon: Mountain },
            { title: 'Cultural Heritage', desc: 'Mughal forts & historic trails', icon: Home },
            { title: 'Curated Experiences', desc: 'Handpicked local itineraries', icon: Compass },
            { title: 'Verified Safe Stays', desc: 'Elite hotels & warm host cabins', icon: ShieldCheck },
            { title: 'Personal Concierge', desc: 'Round-the-clock balti hospitality', icon: Headphones }
          ].map((badge, idx) => (
            <div key={idx} className="flex gap-3 items-start p-1.5" id={`dest-trust-${idx}`}>
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F97316] shrink-0">
                <badge.icon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-extrabold text-[11px] text-slate-850 uppercase tracking-tight">{badge.title}</h5>
                <p className="text-[10px] text-slate-400 leading-snug font-medium font-sans">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 3. INTERACTIVE DESTINATIONS PORTAL */}
        <section id="destinations-results-section" className="space-y-6 pt-6 scroll-mt-24 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] uppercase tracking-wide font-sans">
                Legendary Regions of Pakistan ({filteredDestinations.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium font-sans">
                {searchQuery 
                  ? `Filtering destinations matching "${searchQuery}"` 
                  : 'Click a destination on the card or map to view details, climate, and top hotels/tours.'}
              </p>
            </div>

            {/* Sync connection */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 self-start md:self-auto shadow-xs">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wide">
                Live Regional Info
              </span>
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-950 ml-1.5 bg-transparent border-0 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Hand: Detailed Destination Cards list */}
            <div className="lg:col-span-7 space-y-6" id="destinations-cards-list">
              {filteredDestinations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800">No Destinations Match</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">Try clearing the search query to explore all five majestic regions.</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="bg-[#F97316] hover:bg-[#EA580C] text-white text-[11px] font-extrabold px-5 py-2.5 rounded-xl mt-4 uppercase tracking-wider transition-colors border-0 cursor-pointer"
                  >
                    Reset Search
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-fadeIn">
                  {filteredDestinations.map((dest) => {
                    const isSelected = selectedDestinationItem?.id === dest.id;
                    return (
                      <div
                        key={dest.id}
                        onClick={() => setSelectedDestinationItem(dest)}
                        onMouseEnter={() => setHoveredListingId(dest.id)}
                        onMouseLeave={() => setHoveredListingId(null)}
                        className={`bg-white overflow-hidden border transition-all duration-300 flex flex-col md:flex-row cursor-pointer group rounded-2xl shadow-sm ${
                          isSelected ? 'border-[#F97316] ring-2 ring-[#F97316]/25 translate-x-1' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Image Thumbnail */}
                        <div className="relative w-full md:w-56 h-48 md:h-auto overflow-hidden shrink-0 bg-slate-100">
                          <img 
                            src={dest.image} 
                            alt={dest.name} 
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                            onError={handleImageError}
                          />
                          <div className="absolute top-3 left-3 bg-white/95 border border-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md text-[9px] font-extrabold shadow-xs uppercase tracking-wider">
                            {dest.tag}
                          </div>
                        </div>

                        {/* Content Detail Info */}
                        <div className="p-5 flex-1 flex flex-col justify-between text-left space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                              <MapPin className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                              <span>{dest.region}</span>
                            </div>
                            
                            <h4 className="text-xl font-black text-slate-900 group-hover:text-[#F97316] transition-colors leading-tight">
                              {dest.name}
                            </h4>
                            
                            <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium line-clamp-3">
                              {dest.desc}
                            </p>

                            {/* Weather, Elevation Row */}
                            <div className="flex flex-wrap gap-2 pt-1 font-sans">
                              <span className="bg-slate-50 border border-slate-100 text-[10px] font-bold px-2 py-0.5 rounded-md text-slate-600 flex items-center gap-1">
                                🌡️ Temp: {dest.weather}
                              </span>
                              <span className="bg-slate-50 border border-slate-100 text-[10px] font-bold px-2 py-0.5 rounded-md text-slate-600 flex items-center gap-1">
                                🏔️ Elevation: {dest.elevation}
                              </span>
                              <span className="bg-slate-50 border border-slate-100 text-[10px] font-bold px-2 py-0.5 rounded-md text-slate-600 flex items-center gap-1">
                                📅 Best Time: {dest.bestTime}
                              </span>
                            </div>

                            {/* Key attractions bullets */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-100/60">
                              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Top Scenic Attractions:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {dest.keyAttractions.map((att, keyIdx) => (
                                  <span key={keyIdx} className="bg-orange-50/50 text-[#F97316] border border-orange-100/50 text-[9px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-[#F97316]" />
                                    {att}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Quick action triggers to seamlessly go search hotels/tours there */}
                          <div className="flex gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const queryTerm = dest.name.split(' ')[0];
                                setSearchQuery(queryTerm);
                                setPriceMax(120000);
                                setSelectedRating(null);
                                // Redirect to Hotels search view in App
                                const searchItem = document.getElementById('app-navbar');
                                searchItem?.scrollIntoView({ behavior: 'smooth' });
                                // Modify search parameters to hotels
                                const customEvent = new CustomEvent('nav-to-type', { detail: { type: 'hotel', destination: queryTerm } });
                                window.dispatchEvent(customEvent);
                              }}
                              className="flex-1 bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-200 text-[10px] font-extrabold uppercase tracking-wider py-2 px-3 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 text-center font-sans"
                            >
                              🏨 Find Hotels
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const queryTerm = dest.name.split(' ')[0];
                                setSearchQuery(queryTerm);
                                setPriceMax(120000);
                                setSelectedRating(null);
                                // Redirect to Tours search view in App
                                const searchItem = document.getElementById('app-navbar');
                                searchItem?.scrollIntoView({ behavior: 'smooth' });
                                // Modify search parameters to tours
                                const customEvent = new CustomEvent('nav-to-type', { detail: { type: 'tour', destination: queryTerm } });
                                window.dispatchEvent(customEvent);
                              }}
                              className="flex-1 bg-[#F97316] hover:bg-[#EA580C] text-white text-[10px] font-extrabold uppercase tracking-wider py-2 px-3 rounded-xl transition-all border-0 cursor-pointer shadow-xs active:scale-95 text-center font-sans"
                            >
                              🎒 Find Tours
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Hand: Topographic map with pin needles */}
            <aside className="lg:col-span-5 hidden lg:flex relative h-[600px] sticky top-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm flex flex-col justify-between p-4 animate-fadeIn">
              
              {/* Visual stylised topographic map */}
              <div className="absolute inset-0 z-0 bg-slate-50">
                {/* Decorative contour lines and rivers */}
                <svg className="w-full h-full opacity-20" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
                  <path d="M-50 100 Q100 50 150 200 T350 100 T500 300" fill="none" stroke="#F97316" strokeWidth="2" />
                  <path d="M-50 250 Q120 180 200 350 T400 250 T500 450" fill="none" stroke="#F97316" strokeWidth="1.5" />
                  <path d="M-50 400 Q80 450 180 380 T380 500 T550 400" fill="none" stroke="#F97316" strokeWidth="1" strokeDasharray="3 3" />
                  {/* Indus River route */}
                  <path d="M 0 80 Q 150 120 180 280 T 400 520" fill="none" stroke="#2563EB" strokeWidth="5.5" opacity="0.6" />
                </svg>

                <span className="absolute bottom-4 left-4 text-[8px] font-mono text-slate-300 font-bold">UTM NORTHERN ZONE 43N</span>
                <span className="absolute top-4 right-4 text-[8px] font-mono text-slate-300 font-bold">ELEVATION DATA - METRIC</span>

                {/* Plot the 5 legendary destinations */}
                {destinationsList.map((dest) => {
                  const isHovered = hoveredListingId === dest.id;
                  const isSelected = selectedDestinationItem?.id === dest.id;
                  return (
                    <button
                      key={dest.id}
                      onClick={() => setSelectedDestinationItem(dest)}
                      style={{ left: `${dest.coordinates.x}%`, top: `${dest.coordinates.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-350 cursor-pointer bg-transparent border-0"
                    >
                      {/* Name tag */}
                      <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black border tracking-tight shadow-md transition-all ${
                        isSelected || isHovered 
                          ? 'bg-[#F97316] text-white border-[#F97316] scale-105 z-20' 
                          : 'bg-white text-slate-800 border-slate-200'
                      }`}>
                        {dest.name}
                      </div>
                      {/* Pin needle with pulse indicator */}
                      <div className="relative mt-1">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-colors ${
                          isSelected || isHovered ? 'bg-[#EA580C]' : 'bg-[#F97316]'
                        }`} />
                        {(isSelected || isHovered) && (
                          <span className="absolute -inset-1 rounded-full bg-[#F97316] animate-ping opacity-35" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Map Title overlay */}
              <div className="relative z-10 bg-white/95 backdrop-blur-md px-3 py-2.5 rounded-xl border border-slate-200/50 flex items-center justify-between shadow-xs">
                <div>
                  <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 font-sans">Topographic Map Portal</h5>
                  <p className="text-[9px] text-slate-400">Showing geographic coordinates of the regions</p>
                </div>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                </div>
              </div>

              {/* Selected destination showcase popup at the bottom of the map */}
              <div className="relative z-10 bg-white border border-slate-200 p-4 rounded-xl shadow-xl flex gap-3 max-h-40 overflow-hidden">
                {selectedDestinationItem ? (
                  <>
                    <img 
                      src={selectedDestinationItem.image} 
                      alt={selectedDestinationItem.name} 
                      className="w-28 h-full object-cover rounded-lg shrink-0 animate-fadeIn"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                    />
                    <div className="flex flex-col justify-between text-left flex-1 min-w-0">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 truncate leading-tight font-sans">{selectedDestinationItem.name}</h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{selectedDestinationItem.region}</p>
                        
                        <div className="flex gap-1.5 mt-2">
                          <span className="bg-slate-50 border border-slate-100 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-slate-500">
                            🌡️ {selectedDestinationItem.weather}
                          </span>
                          <span className="bg-slate-50 border border-slate-100 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-slate-500">
                            🏔️ {selectedDestinationItem.elevation}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 line-clamp-2 mt-2 leading-relaxed font-sans font-medium">
                          {selectedDestinationItem.desc}
                        </p>
                      </div>

                      <div className="flex justify-end gap-1.5 mt-1.5">
                        <button
                          onClick={() => {
                            const queryTerm = selectedDestinationItem.name.split(' ')[0];
                            const customEvent = new CustomEvent('nav-to-type', { detail: { type: 'hotel', destination: queryTerm } });
                            window.dispatchEvent(customEvent);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[8px] font-black uppercase tracking-wider py-1 px-2 rounded-lg border-0 cursor-pointer"
                        >
                          🏨 Hotels
                        </button>
                        <button
                          onClick={() => {
                            const queryTerm = selectedDestinationItem.name.split(' ')[0];
                            const customEvent = new CustomEvent('nav-to-type', { detail: { type: 'tour', destination: queryTerm } });
                            window.dispatchEvent(customEvent);
                          }}
                          className="bg-[#F97316] hover:bg-[#EA580C] text-white text-[8px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg border-0 cursor-pointer text-center"
                        >
                          🎒 Tours
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center py-8 text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 font-sans">
                    <MapPin className="w-4 h-4 text-[#F97316] animate-pulse" />
                    <span>Select a pin or a card to preview</span>
                  </div>
                )}
              </div>

            </aside>

          </div>
        </section>

      </div>
    );
  }

  // ---------------- GENERAL HOTEL & TOUR RENDERING ENGINE ----------------
  return (
    <div id="listings-search-view" className="space-y-8 pb-10">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-bold tracking-tight text-[#0F172A] uppercase">
            {isRtl 
              ? 'سیاحتی پیکیجز تلاش کریں'
              : 'Explore Tour Packages'}
          </h2>
          <p className="text-sm text-slate-500">
            {isRtl 
              ? 'آپ کے سفر کے پروگرام کے مطابق ہمارے ہینڈ پک کیے گئے خصوصی اشتہارات۔' 
              : 'Currently displaying handpicked elite packages matching your itinerary.'}
          </p>
        </div>

        {/* Realtime API Sync Indicator */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wide">
            {isRtl ? 'کنکشن فعال ہے' : 'API Connection Active'}
          </span>
          <button id="btn-sync-listings" onClick={fetchListings} className="text-slate-400 hover:text-slate-900 ml-2">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="search-main-grid">
        {/* 1. Sidebar Filters */}
        <aside className="lg:col-span-3 space-y-6" id="search-sidebar-filters">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-[#0F172A] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Filters
              </span>
              <button 
                id="btn-reset-filters"
                onClick={() => {
                  setPriceMax(100000);
                  setSelectedRating(null);
                  setSelectedTransmission('All');
                  setRequireDriver(null);
                  setTourDays(null);
                  setSearchQuery('');
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* Keyword Location Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location Search</label>
              <div className="relative">
                <input
                  type="text"
                  id="filter-keyword-search"
                  placeholder="e.g. Hunza, Skardu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white transition-colors"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>Max Budget (PKR)</span>
                <span className="text-indigo-600 font-bold">PKR {priceMax.toLocaleString()}</span>
              </div>
              <input
                type="range"
                id="filter-price-range"
                min="5000"
                max="120000"
                step="5000"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full accent-indigo-600 bg-slate-100 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Minimum Rating</label>
              <div className="flex gap-2" id="filter-rating-buttons">
                {[4.5, 4.7, 4.8, 4.9].map((star) => (
                  <button
                    key={star}
                    id={`btn-rating-${star}`}
                    onClick={() => setSelectedRating(selectedRating === star ? null : star)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer uppercase ${
                      selectedRating === star
                        ? 'bg-[#0F172A] border-[#0F172A] text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-[#0F172A] hover:bg-slate-50'
                    }`}
                  >
                    ★ {star}+
                  </button>
                ))}
              </div>
            </div>

            {/* Tour specific parameters */}
            {type === 'tour' && (
              <div className="space-y-2 pt-4 border-t border-slate-100" id="filter-tour-specific">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Duration (Days)</label>
                <div className="grid grid-cols-3 gap-1.5" id="filter-tour-duration-buttons">
                  {[1, 5, 6, 7].map((days) => (
                    <button
                      key={days}
                      id={`btn-tour-days-${days}`}
                      onClick={() => setTourDays(tourDays === days ? null : days)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border uppercase transition-all cursor-pointer ${
                        tourDays === days
                          ? 'bg-[#0F172A] border-[#0F172A] text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {days === 1 ? '1 Day' : `${days} Days`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* 2. Listings Grid & Visual Interactive Map */}
        <main className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-6" id="search-results-viewport">
          {/* List Area */}
          <section className="md:col-span-7 space-y-4" id="listings-cards-list">
            {loading ? (
              // Shimmer skeletons
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 h-44 rounded-2xl animate-shimmer" />
              ))
            ) : displayListings.length === 0 ? (
              // Empty State
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs" id="listings-empty-state">
                <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 uppercase">No Matching Properties</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    We could not find active lists matching these filters. Try resetting sliders or changing the target destination.
                  </p>
                </div>
                <button
                  id="btn-clear-search-empty"
                  onClick={() => {
                    setPriceMax(100000);
                    setSelectedRating(null);
                    setSearchQuery('');
                  }}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider"
                >
                  Reset Active Filters
                </button>
              </div>
            ) : (
              // Real Cards
              displayListings.map((listing) => {
                const isHovered = hoveredListingId === listing.id;
                return (
                  <div
                    key={listing.id}
                    id={`search-card-${listing.id}`}
                    onMouseEnter={() => setHoveredListingId(listing.id)}
                    onMouseLeave={() => setHoveredListingId(null)}
                    onClick={() => onSelectListing(listing)}
                    className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col sm:flex-row cursor-pointer group shadow-xs ${
                      isHovered ? 'border-indigo-500 translate-x-1 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full sm:w-44 h-36 sm:h-auto overflow-hidden rounded-t-2xl sm:rounded-tr-none sm:rounded-l-2xl shrink-0 bg-slate-100">
                      <img 
                        src={listing.image} 
                        alt={listing.title} 
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 rounded-t-2xl sm:rounded-tr-none sm:rounded-l-2xl"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                      <div className="absolute top-2 left-2 bg-white/95 border border-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md text-[9px] font-bold shadow-xs uppercase tracking-wider">
                        PKR {listing.price >= 30000 ? '⭐ Elite' : '✔️ Standard'}
                      </div>
                    </div>

                    {/* Meta Detail Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider flex items-center">
                            <MapPin className="w-3 h-3 mr-0.5" /> {listing.location.split(',')[1] || listing.location}
                          </p>
                          <div className="flex items-center text-xs text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-500 stroke-none mr-1" />
                            {listing.rating}
                          </div>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{listing.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-normal">{listing.description}</p>
                      </div>

                      {/* Pricing block */}
                      <div className="flex items-end justify-between pt-2 border-t border-slate-100">
                        <div className="flex flex-wrap gap-1.5">
                          {listing.hotelSpecs?.amenities.slice(0, 2).map((a) => (
                            <span key={a} className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[9px] text-slate-600 font-bold uppercase tracking-wide">{a}</span>
                          ))}
                          {listing.homestaySpecs?.amenities.slice(0, 2).map((a) => (
                            <span key={a} className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[9px] text-slate-600 font-bold uppercase tracking-wide">{a}</span>
                          ))}
                          {listing.tourSpecs && (
                            <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[9px] text-slate-600 font-bold uppercase tracking-wide">{listing.tourSpecs.durationDays} Days</span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Starts from</p>
                          <p className="text-base font-bold text-slate-900">PKR {listing.price.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* Map Area */}
          <section className="md:col-span-5 hidden md:block relative h-[500px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs" id="search-interactive-map">
            {/* Styled Map Background Grid */}
            <div className="absolute inset-0 z-0 opacity-60 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:16px_16px] flex flex-col justify-between p-4 pointer-events-none">
              <div className="text-[9px] font-bold text-slate-400 flex justify-between uppercase tracking-wider">
                <span>COORD RANGE [35.12N, 74.34E]</span>
                <span>PAKISTAN SECTOR MAP v2.4</span>
              </div>
              <div className="text-[9px] font-bold text-slate-400 flex justify-between uppercase tracking-wider">
                <span>VECTOR RENDERING ENGINE</span>
                <span>GBBOOKINGS.COM MOCK</span>
              </div>
            </div>

            {/* Custom mountains/lakes sketches */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-32 h-20 bg-indigo-50/40 rounded-full blur-xl border border-indigo-100/40 flex items-center justify-center">
                <span className="text-[9px] font-bold text-indigo-600/30 uppercase tracking-wider">Attabad Lake</span>
              </div>
              <div className="absolute top-1/3 right-1/4 w-28 h-24 bg-indigo-50/30 rounded-full blur-xl border border-indigo-100/30 flex items-center justify-center">
                <span className="text-[9px] font-bold text-indigo-600/20 uppercase tracking-wider">Cold Desert Skardu</span>
              </div>
              <div className="absolute bottom-1/4 left-1/3 w-36 h-20 bg-indigo-50/40 rounded-full blur-xl border border-indigo-100/40 flex items-center justify-center">
                <span className="text-[9px] font-bold text-indigo-600/25 uppercase tracking-wider">Islamabad Margalla</span>
              </div>
            </div>

            {/* Pins layer */}
            <div className="absolute inset-0 z-10" id="map-pins-layer">
              {displayListings.map((listing) => {
                const pos = getCoordinates(listing.id);
                const isHovered = hoveredListingId === listing.id || selectedMapListing?.id === listing.id;

                return (
                  <button
                    key={listing.id}
                    id={`map-pin-btn-${listing.id}`}
                    onClick={() => {
                      setSelectedMapListing(listing);
                      onSelectListing(listing);
                    }}
                    onMouseEnter={() => setHoveredListingId(listing.id)}
                    onMouseLeave={() => setHoveredListingId(null)}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all duration-300"
                  >
                    <div className="relative">
                      {isHovered && (
                        <span className="absolute -inset-2.5 bg-indigo-500/20 rounded-full animate-ping pointer-events-none" />
                      )}
                      
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm transition-all ${
                        isHovered 
                          ? 'bg-[#0F172A] border-white text-white scale-125 z-30' 
                          : 'bg-white border-indigo-600 text-indigo-600 text-xs scale-100 z-20 hover:scale-110 shadow-xs'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>

                      <div className={`absolute bottom-9 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white border border-[#0F172A] text-[9px] font-bold px-2 py-0.5 rounded shadow-sm transition-all ${
                        isHovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-1 pointer-events-none'
                      }`}>
                        {listing.title.split(' ')[0]} - PKR {Math.round(listing.price/1000)}k
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 bg-white/95 border border-slate-200 rounded-lg p-2.5 z-20 flex flex-col gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-wider shadow-xs">
              <span className="text-slate-800 font-extrabold">MAP SECTOR CONTROLS</span>
              <span>ZOOM: OPTIMIZED FOR SIGHTS</span>
              <span>GRID LOCK: LOCKED</span>
            </div>
          </section>
        </main>
      </div>

      {/* Frequently Asked Questions (FAQ) Accordion - Only shown for Tours */}
      {type === 'tour' && (
        <section className="max-w-3xl mx-auto space-y-6 pt-12 border-t border-slate-200 mt-12 pb-6" id="faq-section">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              {isRtl ? 'عام سوالات' : 'Got Questions?'}
            </h3>
            <p className="text-sm text-slate-500">
              {isRtl ? 'گلگت بلتستان میں پریمیم ہوٹل بکنگ کے بارے میں تمام تفصیلات۔' : 'Everything you need to know about premium tour package bookings in Gilgit Baltistan.'}
            </p>
          </div>

          <div className="space-y-3" id="faq-list">
            {PAKISTAN_FAQ.map((faq, i) => {
              const isOpen = expandedFaq === i;
              
              const translatedQ = isRtl
                ? faq.q.includes('safe') ? 'کیا شمالی پاکستان کا سفر کرنا محفوظ ہے؟'
                  : faq.q.includes('best time') ? 'ہنزہ اور سکردو کا دورہ کرنے کا بہترین وقت کب ہے؟'
                  : faq.q.includes('payment methods') ? 'آپ ادائیگی کے کون سے طریقے قبول کرتے ہیں؟'
                  : faq.q.includes('drivers') ? 'کیا گاڑیوں کے کرائے میں ڈرائیور شامل ہیں؟'
                  : faq.q
                : faq.q;

              const translatedA = isRtl
                ? faq.a.includes('safe') ? 'جی ہاں! ہنزہ اور سکردو جیسے شمالی علاقے انتہائی پرامن اور محفوظ ہیں، اور یہاں ہر سال ہزاروں ملکی و غیر ملکی سیاح آتے ہیں۔ مقامی لوگوں کی مہمان نوازی دنیا بھر میں مشہور ہے!'
                  : faq.a.includes('Spring') ? 'بہار (اپریل تا مئی) چیری کے پھولوں کے لیے، گرمیاں (جون تا اگست) خوشگوار موسم اور ہائیکنگ کے لیے، اور خزاں (اکتوبر تا نومبر) سنہرے پتیوں کے دلفریب نظاروں کے لیے بہترین ہیں۔ موسم سرما برفانی کھیلوں کے لیے لاجواب ہے۔'
                  : faq.a.includes('Visa') ? 'ہم ویزا اور ماسٹر کارڈ کے علاوہ پاکستان کے بڑے ڈیجیٹل والٹس یعنی جیز کیش اور ایزی پیسہ بھی قبول کرتے ہیں۔'
                  : faq.a.includes('mountain-terrain') ? 'پہاڑی سڑکوں پر حفاظت کے پیش نظر ہماری زیادہ تر پہاڑی جیپیں (جیسے ٹویوٹا پراڈو) ڈرائیور کے ساتھ دی جاتی ہیں۔کمروں کی بکنگ اور دیگر سہولیات کے لیے آپ بلا جھجھک ہماری ٹیم سے رابطہ کر سکتے ہیں۔'
                  : faq.a
                : faq.a;

              return (
                <div 
                  key={i} 
                  id={`faq-item-${i}`}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 transition-colors"
                    id={`btn-faq-trigger-${i}`}
                  >
                    <span className="font-bold text-slate-800 text-sm">{translatedQ}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#006F3C]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-6 pb-5 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50 text-left"
                      >
                        {translatedA}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
