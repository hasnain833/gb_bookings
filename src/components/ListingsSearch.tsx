import React, { useState, useEffect } from 'react';
import { Listing, ListingType, handleImageError } from '../types';
import { Search, MapPin, Star, SlidersHorizontal, Key, Calendar, Map, Check, RefreshCw } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface ListingsSearchProps {
  type: ListingType;
  initialFilters: { destination: string; startDate: string; endDate: string; extra: any };
  onSelectListing: (listing: Listing) => void;
}

export default function ListingsSearch({ type, initialFilters, onSelectListing }: ListingsSearchProps) {
  const { language, t, isRtl } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialFilters.destination || '');
  const [priceMax, setPriceMax] = useState<number>(100000);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  
  // Specific States
  const [selectedTransmission, setSelectedTransmission] = useState<'All' | 'Automatic' | 'Manual'>('All');
  const [requireDriver, setRequireDriver] = useState<boolean | null>(null);
  const [tourDays, setTourDays] = useState<number | null>(null);

  // Map state
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [selectedMapListing, setSelectedMapListing] = useState<Listing | null>(null);

  // Fetch from Express API
  const fetchListings = async () => {
    setLoading(true);
    try {
      const url = `/api/listings?type=${type}&search=${searchQuery}`;
      const res = await fetch(url);
      const data = await res.json();
      setListings(data);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [type, searchQuery]);

  // Client side secondary filtering
  const filteredListings = listings.filter((l) => {
    if (l.price > priceMax) return false;
    if (selectedRating && l.rating < selectedRating) return false;

    if (type === 'car' && l.carSpecs) {
      if (selectedTransmission !== 'All' && l.carSpecs.transmission !== selectedTransmission) return false;
      if (requireDriver !== null && l.carSpecs.withDriver !== requireDriver) return false;
    }

    if (type === 'tour' && l.tourSpecs && tourDays) {
      if (l.tourSpecs.durationDays !== tourDays) return false;
    }

    return true;
  });

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

  return (
    <div id="listings-search-view" className="space-y-8 pb-10">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-bold tracking-tight text-[#0F172A] uppercase">
            {isRtl 
              ? `${type === 'hotel' ? 'ریزورٹس اور ہوٹلز تلاش کریں' : type === 'car' ? 'لگژری گاڑیاں تلاش کریں' : 'سیاحتی پیکیجز تلاش کریں'}`
              : `Explore ${type === 'hotel' ? 'Resorts & Hotels' : type === 'car' ? 'Luxury Vehicles' : 'Tour Packages'}`}
          </h2>
          <p className="text-sm text-slate-500">
            {isRtl ? 'آپ کے سفر کے پروگرام کے مطابق ہمارے ہینڈ پک کیے گئے خصوصی اشتہارات۔' : 'Currently displaying handpicked elite listings matching your itinerary.'}
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

            {/* Car specific parameters */}
            {type === 'car' && (
              <div className="space-y-4 pt-4 border-t border-slate-100" id="filter-car-specific">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Transmission</label>
                  <select
                    id="filter-car-transmission"
                    value={selectedTransmission}
                    onChange={(e: any) => setSelectedTransmission(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white"
                  >
                    <option value="All">All Transmissions</option>
                    <option value="Automatic">Automatic Only</option>
                    <option value="Manual">Manual Only</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Service Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="btn-driver-yes"
                      onClick={() => setRequireDriver(requireDriver === true ? null : true)}
                      className={`py-2 rounded-lg text-[10px] font-bold border uppercase transition-all cursor-pointer ${
                        requireDriver === true
                          ? 'bg-[#0F172A] border-[#0F172A] text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      With Driver
                    </button>
                    <button
                      type="button"
                      id="btn-driver-no"
                      onClick={() => setRequireDriver(requireDriver === false ? null : false)}
                      className={`py-2 rounded-lg text-[10px] font-bold border uppercase transition-all cursor-pointer ${
                        requireDriver === false
                          ? 'bg-[#0F172A] border-[#0F172A] text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Self-Drive
                    </button>
                  </div>
                </div>
              </div>
            )}

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
            ) : filteredListings.length === 0 ? (
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
              filteredListings.map((listing) => {
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
                    <div className="relative w-full sm:w-44 h-36 sm:h-auto overflow-hidden shrink-0 bg-slate-100">
                      <img 
                        src={listing.image} 
                        alt={listing.title} 
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
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
                          {listing.carSpecs && (
                            <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[9px] text-slate-600 font-bold uppercase tracking-wide capitalize">{listing.carSpecs.transmission}</span>
                          )}
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
              {/* Lake Attabad area */}
              <div className="absolute top-1/4 left-1/4 w-32 h-20 bg-indigo-50/40 rounded-full blur-xl border border-indigo-100/40 flex items-center justify-center">
                <span className="text-[9px] font-bold text-indigo-600/30 uppercase tracking-wider">Attabad Lake</span>
              </div>
              {/* Skardu Desert */}
              <div className="absolute top-1/3 right-1/4 w-28 h-24 bg-indigo-50/30 rounded-full blur-xl border border-indigo-100/30 flex items-center justify-center">
                <span className="text-[9px] font-bold text-indigo-600/20 uppercase tracking-wider">Cold Desert Skardu</span>
              </div>
              {/* Islamabad Sector */}
              <div className="absolute bottom-1/4 left-1/3 w-36 h-20 bg-indigo-50/40 rounded-full blur-xl border border-indigo-100/40 flex items-center justify-center">
                <span className="text-[9px] font-bold text-indigo-600/25 uppercase tracking-wider">Islamabad Margalla</span>
              </div>
            </div>

            {/* Pins layer */}
            <div className="absolute inset-0 z-10" id="map-pins-layer">
              {filteredListings.map((listing) => {
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
                      {/* Ring Ripple */}
                      {isHovered && (
                        <span className="absolute -inset-2.5 bg-indigo-500/20 rounded-full animate-ping pointer-events-none" />
                      )}
                      
                      {/* Main Pin */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm transition-all ${
                        isHovered 
                          ? 'bg-[#0F172A] border-white text-white scale-125 z-30' 
                          : 'bg-white border-indigo-600 text-indigo-600 text-xs scale-100 z-20 hover:scale-110 shadow-xs'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>

                      {/* Tooltip price bubble */}
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
    </div>
  );
}
