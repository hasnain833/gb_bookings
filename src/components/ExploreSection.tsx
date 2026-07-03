import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Calendar, Users, Star, ArrowRight, Compass, Shield, Award, Sparkles, 
  ChevronDown, ChevronUp, Clock, ShieldCheck, Heart, Building2, Home, Car, HelpCircle,
  CheckCircle2, Flame, Users2, ThumbsUp, Headset, Mountain, Waves, Wallet
} from 'lucide-react';
import { Listing, handleImageError } from '../types';
import { INITIAL_LISTINGS, PAKISTAN_FAQ } from '../data';
import { useLanguage, tListing } from '../LanguageContext';

interface ExploreSectionProps {
  setView: (v: string) => void;
  setSearchFilters: (filters: { destination: string; startDate: string; endDate: string; extra: any }) => void;
  onSelectListing: (listing: Listing) => void;
}

export default function ExploreSection({ setView, setSearchFilters, onSelectListing }: ExploreSectionProps) {
  const { language, t, isRtl } = useLanguage();
  // Supports tabs: 'hotel' | 'homestay' | 'car' | 'tour'
  const [activeTab, setActiveTab] = useState<'hotel' | 'homestay' | 'car' | 'tour'>('hotel');
  const [destination, setDestination] = useState('Gilgit Baltistan');
  const [startDate, setStartDate] = useState('2025-05-20');
  const [endDate, setEndDate] = useState('2025-05-23');
  const [guestCount, setGuestCount] = useState('2 Guests, 1 Room');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const monthName = months[monthIndex] || parts[1];
    return `${day} ${monthName} ${year}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilters({
      destination: destination === 'Gilgit Baltistan' ? 'Hunza' : destination,
      startDate,
      endDate,
      extra: { guestCount, isHomestay: activeTab === 'homestay' }
    });
    
    // Route appropriately based on selected tab
    if (activeTab === 'hotel') {
      setView('browse-hotels');
    } else if (activeTab === 'homestay') {
      setView('browse-homestays');
    } else if (activeTab === 'car') {
      setView('browse-cars');
    } else {
      setView('browse-tours');
    }
  };

  const handleCategoryCardClick = (type: 'hotel' | 'homestay' | 'car' | 'tour') => {
    setActiveTab(type);
    setSearchFilters({
      destination: '',
      startDate: '',
      endDate: '',
      extra: { isHomestay: type === 'homestay' }
    });
    if (type === 'hotel') {
      setView('browse-hotels');
    } else if (type === 'homestay') {
      setView('browse-homestays');
    } else if (type === 'car') {
      setView('browse-cars');
    } else {
      setView('browse-tours');
    }
  };

  const destinations = [
    { name: 'Hunza Valley', region: 'Gilgit-Baltistan', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', tag: 'Autumn & Lakes' },
    { name: 'Skardu', region: 'Karakoram Peakway', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80', tag: 'Cold Desert & K2' },
    { name: 'Swat Valley', region: 'Khyber Pakhtunkhwa', image: 'https://images.unsplash.com/photo-1518098268026-4e43a1a009de?auto=format&fit=crop&w=600&q=80', tag: 'Alpine & Ski' },
    { name: 'Islamabad', region: 'Margalla Foothills', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80', tag: 'Modern Capital' },
    { name: 'Lahore', region: 'Punjab Heritage', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80', tag: 'Mughal History' }
  ];

  const featuredListings = INITIAL_LISTINGS.filter(l => l.featured).map(l => tListing(l, isRtl));

  return (
    <div id="explore-section" className="space-y-12 pb-20">
      
      {/* 1. Elegant Sweeping Hero Section matching the image */}
      <section className="relative rounded-3xl overflow-hidden min-h-[520px] lg:min-h-[580px] flex flex-col justify-between p-6 sm:p-10 lg:p-12 shadow-xl border border-slate-200" id="hero-banner">
        {/* Sweeping Panoramic Mountain Background with refined overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80" 
            alt="Karakoram Mountains Gilgit Baltistan" 
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/15" />
        </div>

        {/* Top/Badge element */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/20 text-white text-xs font-semibold backdrop-blur-md">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('hero.badge')}</span>
          </div>
        </div>

        {/* Content & Promo Card split layout */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mt-8">
          
          {/* Left Hero Texts */}
          <div className="lg:col-span-7 space-y-4 text-left" id="hero-left-content">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-white tracking-tight leading-tight">
              {t('hero.title_part1')}<br />
              {t('hero.title_part2')} <span className="text-[#22C55E]">{t('hero.title_highlight')}</span>
            </h1>
            <p className="text-white/90 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
              {t('hero.subtitle')}
            </p>

            {/* Row of 4 Hero trust factors directly from image */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10" id="hero-trust-factors">
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-full bg-[#10B981]/25 border border-[#10B981]/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-[11px] font-bold tracking-tight">Verified Homestays</span>
              </div>

              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-full bg-[#10B981]/25 border border-[#10B981]/30 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-[11px] font-bold tracking-tight">Local Hosts</span>
              </div>

              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-full bg-[#10B981]/25 border border-[#10B981]/30 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-[11px] font-bold tracking-tight">Best Price Guarantee</span>
              </div>

              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-full bg-[#10B981]/25 border border-[#10B981]/30 flex items-center justify-center shrink-0">
                  <Headset className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-[11px] font-bold tracking-tight">24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Right Promo Card (UP TO 40% OFF) matching the image */}
          <div className="lg:col-span-5" id="hero-promo-card">
            <div className="bg-gradient-to-br from-[#0B5D3E] via-[#0D6E4A] to-[#043E28] rounded-3xl p-5 border border-[#16A34A]/35 text-white shadow-2xl relative overflow-hidden flex justify-between gap-4 max-w-md mx-auto lg:ml-auto">
              
              {/* Promo details */}
              <div className="flex flex-col justify-between z-10 py-1 space-y-4">
                <div>
                  <span className="inline-block bg-gradient-to-r from-[#FF7D29] to-[#EA580C] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                    {t('hero.promo.tag')}
                  </span>
                  <p className="text-white/80 text-[11px] font-bold tracking-widest uppercase">{t('hero.promo.upto')}</p>
                  <h3 className="text-4xl font-black text-white tracking-tighter leading-none mt-1">{t('hero.promo.discount')}</h3>
                  <p className="text-white/80 text-xs font-semibold mt-2">{t('hero.promo.on_hotels')}</p>
                </div>
                
                <button 
                  onClick={() => handleCategoryCardClick('hotel')}
                  className="text-left font-bold text-xs uppercase tracking-wider text-white hover:text-[#FF7D29] transition-colors flex items-center gap-1 group cursor-pointer"
                >
                  <span>{t('hero.promo.btn')}</span>
                  <span className="transition-transform group-hover:translate-x-1 font-mono">&gt;</span>
                </button>
              </div>

              {/* Promo Chalet image with rounded overlay */}
              <div className="relative w-40 h-36 shrink-0 rounded-2xl overflow-hidden shadow-lg border border-white/15 z-10 self-center">
                <img 
                  src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80" 
                  alt="Promo alpine chalet" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#043E28]/50 to-transparent" />
              </div>

              {/* Ambient green radial lights */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#22C55E]/20 rounded-full blur-2xl pointer-events-none" />
            </div>
          </div>

        </div>
      </section>

      {/* 2. Overlapping Booking / Search Widget Console */}
      <section className="-mt-20 relative z-20 max-w-7xl mx-auto px-2" id="search-console">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-hidden">
          
          {/* Tabs header matching the image: Hotels, Homestays, Cars, Tours */}
          <div className="flex border-b border-[#F1F5F9] bg-[#FAFAFA] px-6 sm:px-8 gap-4 sm:gap-8 overflow-x-auto scrollbar-none" id="booking-tabs">
            {[
              { id: 'hotel', label: t('search.hotel_tab'), icon: Building2 },
              { id: 'homestay', label: t('search.homestay_tab'), icon: Home },
              { id: 'car', label: t('search.car_tab'), icon: Car },
              { id: 'tour', label: t('search.tour_tab'), icon: Compass }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-search-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2.5 py-4 px-1 border-b-2 font-bold text-[13px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-[#0B5D3E] text-[#0B5D3E]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0B5D3E]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Fields Section */}
          <form onSubmit={handleSearch} className="p-6 sm:p-8 space-y-6" id="form-search-listings">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-px md:bg-[#E2E8F0] md:rounded-xl overflow-hidden border md:border-[#E2E8F0] items-stretch" id="fields-row">
              
              {/* Field 1: Where are you going? */}
              <div className="bg-white p-4 md:col-span-3 flex flex-col justify-center space-y-1 rounded-xl md:rounded-none">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{isRtl ? 'کہاں جانا چاہتے ہیں؟' : 'Where are you going?'}</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#64748B] shrink-0" />
                  <select
                    id="search-dest"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 focus:outline-none p-0 cursor-pointer"
                  >
                    <option value="Gilgit Baltistan">{isRtl ? 'منزل تلاش کریں (گلگت بلتستان)' : 'Search destination (Gilgit Baltistan)'}</option>
                    <option value="Hunza">{isRtl ? 'وادی ہنزہ' : 'Hunza Valley'}</option>
                    <option value="Skardu">{isRtl ? 'سکردو کا علاقہ' : 'Skardu Region'}</option>
                    <option value="Swat">{isRtl ? 'سوات اور مالم جبہ' : 'Swat & Malam Jabba'}</option>
                    <option value="Islamabad">{isRtl ? 'اسلام آباد (دارالحکومت)' : 'Islamabad (Capital)'}</option>
                    <option value="Lahore">{isRtl ? 'لاہور (تاریخی مقام)' : 'Lahore (Heritage)'}</option>
                  </select>
                </div>
              </div>

              {/* Field 2: Check-in with Overlay Display */}
              <div className="bg-white p-4 md:col-span-2 flex flex-col justify-center space-y-1 rounded-xl md:rounded-none relative min-h-[64px]">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{isRtl ? 'چیک ان' : 'Check-in'}</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#64748B] shrink-0" />
                  <span className="text-[13px] font-bold text-slate-800 select-none">
                    {formatDateForDisplay(startDate)}
                  </span>
                  <input
                    type="date"
                    id="search-start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                </div>
              </div>

              {/* Field 3: Check-out with Overlay Display */}
              <div className="bg-white p-4 md:col-span-2 flex flex-col justify-center space-y-1 rounded-xl md:rounded-none relative min-h-[64px]">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{isRtl ? 'چیک آؤٹ' : 'Check-out'}</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#64748B] shrink-0" />
                  <span className="text-[13px] font-bold text-slate-800 select-none">
                    {formatDateForDisplay(endDate)}
                  </span>
                  <input
                    type="date"
                    id="search-end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                </div>
              </div>

              {/* Field 4: Guests & Rooms */}
              <div className="bg-white p-4 md:col-span-3 flex flex-col justify-center space-y-1 rounded-xl md:rounded-none relative">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{t('search.guests')}</label>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#64748B] shrink-0" />
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 focus:outline-none p-0 cursor-pointer appearance-none pr-6"
                  >
                    <option value="2 Guests, 1 Room">{isRtl ? '2 مہمان، 1 کمرہ' : '2 Guests, 1 Room'}</option>
                    <option value="1 Guest, 1 Room">{isRtl ? '1 مہمان، 1 کمرہ' : '1 Guest, 1 Room'}</option>
                    <option value="4 Guests, 2 Rooms">{isRtl ? '4 مہمان، 2 کمرے' : '4 Guests, 2 Rooms'}</option>
                    <option value="6 Guests, 3 Rooms">{isRtl ? '6 مہمان، 3 کمرے' : '6 Guests, 3 Rooms'}</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-4 pointer-events-none" />
                </div>
              </div>

              {/* Field 5: Unified Search Now Button */}
              <div className="bg-white p-2 md:col-span-2 flex items-center justify-center rounded-xl md:rounded-none">
                <button
                  type="submit"
                  id="btn-trigger-search"
                  className="w-full h-full bg-[#0B5D3E] hover:bg-[#07472E] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-[14px] uppercase tracking-wider cursor-pointer py-3.5 md:py-0 min-h-[48px] md:min-h-0"
                >
                  <Search className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span className="whitespace-nowrap font-extrabold text-[13px]">
                    {activeTab === 'homestay' ? 'Search Homestays' : t('search.btn')}
                  </span>
                </button>
              </div>

            </div>

          </form>
        </div>

        {/* 5-Column Trust Assurance Bar directly matching the reference image */}
        <div className="mt-6 bg-[#F8FAFC] border border-slate-200/60 rounded-2xl p-4 sm:p-5" id="homestay-trust-bar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 justify-between items-center text-left">
            {[
              { title: 'Best Price Guarantee', desc: 'We ensure you get the best price', icon: ShieldCheck },
              { title: 'Free Cancellation', desc: 'Cancel up to 24 hours', icon: Calendar },
              { title: 'Instant Confirmation', desc: 'Book & get confirmed', icon: Sparkles },
              { title: 'Secure Payments', desc: '100% safe & secure', icon: Shield },
              { title: '24/7 Support', desc: "We're here to help", icon: Headset }
            ].map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div key={idx} className="flex items-center gap-3 text-slate-700">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0B5D3E] shrink-0">
                    <Icon className="w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-[12px] text-slate-800 leading-tight">{badge.title}</h5>
                    <p className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </section>

      {/* 3. Original Category Bento Grid at the bottom */}
      <section className="space-y-6 pt-4 animate-fadeIn" id="section-categories">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight uppercase">
            {isRtl ? 'کیٹیگریز دیکھیں' : 'Browse By Category'}
          </h2>
          <p className="text-sm text-slate-500">{isRtl ? 'اپنا پسندیدہ سفر انجن چنیں اور گلگت بلتستان کے خوبصورت مقامات کا رخ کریں۔' : 'Pick a travel engine and set sail across the majestic lands of Gilgit Baltistan.'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="category-cards-grid">
          
          {/* Card 1: Hotels */}
          <div 
            onClick={() => handleCategoryCardClick('hotel')}
            className="bg-white rounded-none overflow-hidden border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
            id="category-hotels"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase bg-indigo-50 px-2.5 py-1 rounded-full">
                  {isRtl ? '120+ ہوٹل' : '120+ Stays'}
                </span>
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-950">{t('category.hotels.title')}</h3>
              <p className="text-xs text-slate-500 mt-1">{t('category.hotels.desc')}</p>
            </div>
            
            <div className="px-6 pb-6 space-y-4">
              <div className="h-32 rounded-none overflow-hidden relative border border-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80" 
                  alt="Luxury Hotels Gilgit" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
              </div>
              <div className="flex justify-start">
                <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center transition-transform group-hover:translate-x-1 duration-200">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

            {/* Card 2: Homestays */}
            <div 
              onClick={() => handleCategoryCardClick('homestay')}
              className="bg-white rounded-none overflow-hidden border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
              id="category-homestays"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-600 tracking-wider uppercase bg-emerald-50 px-2.5 py-1 rounded-full">
                    {isRtl ? '800+ جائیدادیں' : '800+ Properties'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Home className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-950">{t('category.homestays.title')}</h3>
                <p className="text-xs text-slate-500 mt-1">{t('category.homestays.desc')}</p>
              </div>
              
              <div className="px-6 pb-6 space-y-4">
                <div className="h-32 rounded-none overflow-hidden relative border border-slate-100">
                  <img 
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80" 
                    alt="Cozy Stays Skardu" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                </div>
                <div className="flex justify-start">
                  <div className="w-9 h-9 rounded-full bg-[#16A34A] text-white flex items-center justify-center transition-transform group-hover:translate-x-1 duration-200">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Cars */}
            <div 
              onClick={() => handleCategoryCardClick('car')}
              className="bg-white rounded-none overflow-hidden border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
              id="category-cars"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-orange-600 tracking-wider uppercase bg-orange-50 px-2.5 py-1 rounded-full">
                    {isRtl ? '500+ گاڑیاں' : '500+ Vehicles'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                    <Car className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-950">{t('category.cars.title')}</h3>
                <p className="text-xs text-slate-500 mt-1">{t('category.cars.desc')}</p>
              </div>
              
              <div className="px-6 pb-6 space-y-4">
                <div className="h-32 rounded-none overflow-hidden relative border border-slate-100 bg-slate-50">
                  <img 
                    src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80" 
                    alt="Premium SUV Prado" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                </div>
                <div className="flex justify-start">
                  <div className="w-9 h-9 rounded-full bg-[#EA580C] text-white flex items-center justify-center transition-transform group-hover:translate-x-1 duration-200">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Tours & Packages */}
            <div 
              onClick={() => handleCategoryCardClick('tour')}
              className="bg-white rounded-none overflow-hidden border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
              id="category-tours"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-purple-600 tracking-wider uppercase bg-purple-50 px-2.5 py-1 rounded-full">
                    {isRtl ? '50+ پیکیجز' : '50+ Packages'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                    <Compass className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-950">{t('category.tours.title')}</h3>
                <p className="text-xs text-slate-500 mt-1">{t('category.tours.desc')}</p>
              </div>
              
              <div className="px-6 pb-6 space-y-4">
                <div className="h-32 rounded-none overflow-hidden relative border border-slate-100">
                  <img 
                    src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" 
                    alt="Curated Mountain Expeditions" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                </div>
                <div className="flex justify-start">
                  <div className="w-9 h-9 rounded-full bg-[#6366F1] text-white flex items-center justify-center transition-transform group-hover:translate-x-1 duration-200">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

      {/* 4. Editorial Locations Grid */}
      <section className="space-y-6 pt-4" id="section-destinations">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              {isRtl ? 'مشہور ترین منازل' : 'Legendary Destinations'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {isRtl ? 'عالمی معیار کی سہولیات سے لیس بہترین تفریحی مقامات۔' : 'Handpicked landscapes offering world-class standard facilities.'}
            </p>
          </div>
          <button 
            id="btn-all-destinations"
            onClick={() => { setDestination(''); setView('hotels'); }} 
            className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            <span>{isRtl ? 'تمام مقامات دیکھیں' : 'Browse All Locations'}</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4" id="destinations-grid">
          {destinations.map((dest, i) => {
            // Translate destination names & regions
            const translatedName = isRtl
              ? dest.name.includes('Hunza') ? 'وادی ہنزہ'
                : dest.name.includes('Skardu') ? 'سکردو'
                : dest.name.includes('Swat') ? 'وادی سوات'
                : dest.name.includes('Islamabad') ? 'اسلام آباد'
                : dest.name.includes('Lahore') ? 'لاہور'
                : dest.name
              : dest.name;

            const translatedRegion = isRtl
              ? dest.region.includes('Gilgit') ? 'گلگت بلتستان'
                : dest.region.includes('Karakoram') ? 'شاہراہ قراقرم'
                : dest.region.includes('Khyber') ? 'خیبر پختونخوا'
                : dest.region.includes('Margalla') ? 'مارگلہ کی پہاڑیاں'
                : dest.region.includes('Punjab') ? 'پنجاب کا ورثہ'
                : dest.region
              : dest.region;

            const translatedTag = isRtl
              ? dest.tag.includes('Autumn') ? 'خزاں اور جھیلیں'
                : dest.tag.includes('Cold') ? 'سرد صحرا اور کے ٹو'
                : dest.tag.includes('Alpine') ? 'برفباری اور اسکیئنگ'
                : dest.tag.includes('Modern') ? 'جدید دارالحکومت'
                : dest.tag.includes('Mughal') ? 'مغلیہ تاریخ'
                : dest.tag
              : dest.tag;

            return (
              <div
                key={dest.name}
                id={`dest-card-${i}`}
                onClick={() => {
                  setDestination(dest.name.split(' ')[0]);
                  setSearchFilters({ destination: dest.name.split(' ')[0], startDate: '', endDate: '', extra: {} });
                  setView(activeTab === 'car' ? 'browse-cars' : activeTab === 'tour' ? 'browse-tours' : 'browse-hotels');
                }}
                className="relative rounded-none overflow-hidden aspect-[3/4] cursor-pointer group shadow-sm border border-[#E2E8F0] bg-white"
              >
                <img 
                  src={dest.image} 
                  alt={dest.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 bg-white/90 border border-slate-100 px-2.5 py-1 rounded-full text-[9px] font-bold text-slate-800 uppercase backdrop-blur-xs shadow-xs">
                  {translatedTag}
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{translatedRegion}</p>
                  <h4 className="text-base font-bold text-white mt-0.5">{translatedName}</h4>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Curated Signature Luxury Exclusives */}
      <section className="space-y-6 pt-4" id="section-exclusives">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            {isRtl ? 'ہمارا دستخطی مجموعہ' : 'The Signature Collection'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {isRtl ? 'گلگت بلتستان میں بہترین پریمیم رہائش گاہیں، گاڑیاں اور یادگار تجربات۔' : 'Award-winning, highly coveted experiences and premium fleets in Gilgit Baltistan.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="exclusives-grid">
          {featuredListings.slice(0, 3).map((listing, index) => (
            <div
              key={listing.id}
              id={`exclusive-card-${listing.id}`}
              className="bg-white rounded-none overflow-hidden border border-slate-200 flex flex-col h-full group hover:border-emerald-300 transition-all shadow-md"
            >
              {/* Photo Area */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <img 
                  src={listing.image} 
                  alt={listing.title} 
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div className="absolute top-3 left-3 bg-[#0B5D3E] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  {listing.type === 'hotel' 
                    ? (isRtl ? '🏨 ہوٹل' : '🏨 Hotel') 
                    : listing.type === 'car' 
                      ? (isRtl ? '🚘 پریمیم گاڑی' : '🚘 Premium SUV') 
                      : (isRtl ? '🏔️ مہم جوئی' : '🏔️ Expedition')}
                </div>
                <div className="absolute bottom-3 right-3 bg-emerald-50 border border-emerald-100 text-[#0B5D3E] font-bold px-2 py-1 rounded-lg text-xs flex items-center shadow-sm">
                  <Star className="w-3 h-3 fill-[#0B5D3E] stroke-none mr-1" /> {listing.rating}
                </div>
              </div>

              {/* Text Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2 text-left">
                  <p className="text-xs font-bold text-[#0B5D3E] uppercase tracking-wider flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-[#0B5D3E]" /> 
                    {isRtl 
                      ? (listing.location.includes('Hunza') ? 'وادی ہنزہ' 
                          : listing.location.includes('Skardu') ? 'سکردو کا علاقہ' 
                          : listing.location.includes('Swat') ? 'وادی سوات' 
                          : listing.location)
                      : listing.location}
                  </p>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-[#0B5D3E] transition-colors leading-snug">
                    {isRtl 
                      ? (listing.title.includes('Resort') ? listing.title.replace('Resort', 'ریزارٹ')
                          : listing.title.includes('Hotel') ? listing.title.replace('Hotel', 'ہوٹل')
                          : listing.title)
                      : listing.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{listing.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      {isRtl ? 'ابتدائی قیمت' : 'Prices starting from'}
                    </span>
                    <span className="text-base font-bold text-slate-900">{isRtl ? 'روپے' : 'PKR'} {listing.price.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400">
                      /{listing.type === 'hotel' 
                        ? (isRtl ? 'رات' : 'night') 
                        : listing.type === 'car' 
                          ? (isRtl ? 'دن' : 'day') 
                          : (isRtl ? 'پیکیج' : 'tour')}
                    </span>
                  </div>
                  <button
                    id={`btn-view-exclusive-${listing.id}`}
                    onClick={() => onSelectListing(listing)}
                    className="bg-[#0B5D3E] hover:bg-[#07472E] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-transform active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <span>{isRtl ? 'تفصیلات دیکھیں' : 'View Spaces'}</span> <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


    </div>
  );
}
