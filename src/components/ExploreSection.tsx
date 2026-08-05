import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Calendar, Users, Star, ArrowRight, Compass, Shield, Award, Sparkles, 
  ChevronDown, ChevronUp, Clock, ShieldCheck, Heart, Building2, Home, Car, HelpCircle,
  CheckCircle2, Flame, Users2, ThumbsUp, Headset, Mountain, Waves, Wallet,
  ChevronLeft, ChevronRight, Map, Fuel, Lock, BadgePercent, CalendarCheck, BadgeCheck,
  RotateCw, Play, Pause, Plus, MessageSquare, Shuffle, RefreshCw, Send
} from 'lucide-react';
import { Listing, handleImageError } from '../types';
import { INITIAL_LISTINGS, PAKISTAN_FAQ } from '../data';
import { useLanguage, tListing } from '../LanguageContext';
import { formatDateForDisplay, getMinCheckOutDate } from '../utils/date';
import { CalendarPickerDropdown } from './CalendarPickerDropdown';
import GBLogo from './GBLogo';

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
  const [destQuery, setDestQuery] = useState('');
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState(false);

  const [startDate, setStartDate] = useState('2025-05-20');
  const [endDate, setEndDate] = useState('2025-05-23');
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const [adultGuests, setAdultGuests] = useState(2);
  const [roomCount, setRoomCount] = useState(1);
  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Floating & Revolving Comments State
  const [commentsList, setCommentsList] = useState([
    {
      id: 'c-1',
      name: 'Ahmed Khan',
      location: 'Lahore, Pakistan',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
      badge: 'Hunza Valley Hotel',
      rating: 5,
      comment: 'Amazing experience with GBBookings! The hotel in Hunza was spotless with breathtaking views of Rakaposhi Peak.',
      time: 'Just now',
      likes: 38,
      floatClass: 'animate-float-1'
    },
    {
      id: 'c-2',
      name: 'Sophia Martinez',
      location: 'London, UK',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      badge: 'Skardu Prado 4x4',
      rating: 5,
      comment: 'Rented a Prado for Skardu and Deosai Plains. Vehicle was immaculate and our local driver knew every hidden spot!',
      time: '12m ago',
      likes: 54,
      floatClass: 'animate-float-2'
    },
    {
      id: 'c-3',
      name: 'Zainab Malik',
      location: 'Islamabad, Pakistan',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80',
      badge: 'Attabad Lake Resort',
      rating: 5,
      comment: 'Attabad Lake boat trip and resort stay booked in 2 minutes. Instant confirmation and zero surprise fees.',
      time: '45m ago',
      likes: 27,
      floatClass: 'animate-float-3'
    },
    {
      id: 'c-4',
      name: 'David Miller',
      location: 'Toronto, Canada',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
      badge: 'Nagar Valley Homestay',
      rating: 5,
      comment: 'Found a serene homestay in Nagar Valley. Host family treated us like royalty with fresh orchard fruits!',
      time: '2h ago',
      likes: 41,
      floatClass: 'animate-float-4'
    },
    {
      id: 'c-5',
      name: 'Elena Rostova',
      location: 'Berlin, Germany',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
      badge: 'Fairy Meadows Trek',
      rating: 5,
      comment: 'Fairy Meadows jeep safari + trekking guide package was top-notch! Best rates guaranteed indeed.',
      time: '3h ago',
      likes: 62,
      floatClass: 'animate-float-1'
    },
    {
      id: 'c-6',
      name: 'Usman Sheikh',
      location: 'Rawalpindi, Pakistan',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80',
      badge: 'Serena Hotel Gilgit',
      rating: 5,
      comment: 'The website made comparing luxury hotels in Gilgit super smooth. Seamless booking and easy payment.',
      time: '5h ago',
      likes: 33,
      floatClass: 'animate-float-2'
    }
  ]);

  const [isRevolving, setIsRevolving] = useState(true);
  const [revolveAngle, setRevolveAngle] = useState(0);
  const [commentViewMode, setCommentViewMode] = useState<'3d-ring' | 'floating-stream'>('3d-ring');
  const [newCommentText, setNewCommentText] = useState('');
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  // Auto-revolve effect for 3D ring
  useEffect(() => {
    if (!isRevolving) return;
    const interval = setInterval(() => {
      setRevolveAngle((prev) => (prev + 0.35) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isRevolving]);

  // Handler to like a comment
  const handleLikeComment = (id: string) => {
    setCommentsList(prev => prev.map(c => c.id === id ? { ...c, likes: c.likes + 1 } : c));
  };

  // Handler to inject a random new floating comment
  const handleGenerateRandomComment = () => {
    const randomPool = [
      {
        name: 'Ayesha Siddiqui',
        location: 'Peshawar, Pakistan',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&h=150&q=80',
        badge: 'Khunjerab Border Tour',
        comment: 'Khunjerab Pass border excursion was the highlight of our honeymoon trip! Thank you GBBookings!',
      },
      {
        name: 'Michael Chen',
        location: 'Singapore',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80',
        badge: 'Shangrila Resort Skardu',
        comment: 'Clean luxury rooms, instant confirmation, transparent prices with zero hidden charges. Will book again!',
      },
      {
        name: 'Bilal Raza',
        location: 'Faisalabad, Pakistan',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&h=150&q=80',
        badge: 'Combo Car + Stay',
        comment: 'Most reliable portal for Northern Pakistan travel. Booked hotel stays + Prado 4x4 rental in one go!',
      },
      {
        name: 'Tariq Mehmood',
        location: 'Multan, Pakistan',
        avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&h=150&q=80',
        badge: 'Naltar Valley Ski Tour',
        comment: 'Satrangi Lake and Naltar Valley tour was super well coordinated. Driver was punctual and courteous.',
      },
      {
        name: 'Claire Dubois',
        location: 'Paris, France',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&h=150&q=80',
        badge: 'Passu Cones Lodge',
        comment: 'Watching sunrise over Passu Cones from our balcony was unforgettable. GBBookings made it effortless!',
      },
      {
        name: 'Hassan Ali',
        location: 'Quetta, Pakistan',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80',
        badge: 'Shigar Fort Palace',
        comment: 'Historical stay at Serena Shigar Fort! Exceptional hospitality and authentic local Baltic cuisine.',
      }
    ];

    const pick = randomPool[Math.floor(Math.random() * randomPool.length)];
    const floatClasses = ['animate-float-1', 'animate-float-2', 'animate-float-3', 'animate-float-4'];
    const newCommentObj = {
      id: 'c-rnd-' + Date.now(),
      name: pick.name,
      location: pick.location,
      avatar: pick.avatar,
      badge: pick.badge,
      rating: 5,
      comment: pick.comment,
      time: 'Just now',
      likes: Math.floor(Math.random() * 15) + 10,
      floatClass: floatClasses[Math.floor(Math.random() * floatClasses.length)]
    };

    setCommentsList(prev => [newCommentObj, ...prev]);
  };

  // Add custom user comment
  const handleAddCustomComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const floatClasses = ['animate-float-1', 'animate-float-2', 'animate-float-3', 'animate-float-4'];
    const userObj = {
      id: 'c-usr-' + Date.now(),
      name: 'You (Traveler)',
      location: 'Gilgit Baltistan Explorer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
      badge: 'Verified Travel Experience',
      rating: 5,
      comment: newCommentText.trim(),
      time: 'Just now',
      likes: 1,
      floatClass: floatClasses[Math.floor(Math.random() * floatClasses.length)]
    };

    setCommentsList(prev => [userObj, ...prev]);
    setNewCommentText('');
    setIsCommentModalOpen(false);
  };

  const destDropdownRef = React.useRef<HTMLDivElement>(null);
  const guestDropdownRef = React.useRef<HTMLDivElement>(null);
  const startDateRef = React.useRef<HTMLDivElement>(null);
  const endDateRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (destDropdownRef.current && !destDropdownRef.current.contains(event.target as Node)) {
        setIsDestDropdownOpen(false);
      }
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target as Node)) {
        setIsGuestDropdownOpen(false);
      }
      if (startDateRef.current && !startDateRef.current.contains(event.target as Node)) {
        setIsStartDateOpen(false);
      }
      if (endDateRef.current && !endDateRef.current.contains(event.target as Node)) {
        setIsEndDateOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const destinationItems = [
    { name: 'Gilgit Baltistan', region: 'Northern Pakistan', desc: 'Search entire Gilgit Baltistan' },
    { name: 'Hunza Valley', region: 'Gilgit-Baltistan', desc: 'Karimabad, Attabad Lake, Passu Cones' },
    { name: 'Skardu', region: 'Gilgit-Baltistan', desc: 'Shangrila Lake, Cold Desert, Deosai' },
    { name: 'Attabad Lake', region: 'Hunza', desc: 'Boating & luxury water resorts' },
    { name: 'Karimabad', region: 'Hunza', desc: 'Baltit Fort, Altit Fort & Local Bazaar' },
    { name: 'Swat Valley', region: 'Khyber Pakhtunkhwa', desc: 'Kalam, Malam Jabba Ski Resort' },
    { name: 'Fairy Meadows', region: 'Diamer', desc: 'Nanga Parbat Basecamp trekking' },
    { name: 'Khaplu Valley', region: 'Baltistan', desc: 'Historic Khaplu Fort & Palace' },
    { name: 'Naltar Valley', region: 'Gilgit', desc: 'Satrangi Lake & Pine valley' },
    { name: 'Islamabad', region: 'Federal Capital', desc: 'Margalla Hills & Faisal Mosque' },
  ];

  const filteredDestinations = destinationItems.filter(item => 
    item.name.toLowerCase().includes((destQuery || destination).toLowerCase()) || 
    item.region.toLowerCase().includes((destQuery || destination).toLowerCase()) ||
    item.desc.toLowerCase().includes((destQuery || destination).toLowerCase())
  );

  // States for Countdown timer & Testimonials matching the second image
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, minutes: 36, seconds: 45 });
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        } else {
          // Reset to some realistic countdown state
          return { days: 2, hours: 14, minutes: 36, seconds: 45 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedGuestLabel = `${adultGuests} Guest${adultGuests > 1 ? 's' : ''}, ${roomCount} Room${roomCount > 1 ? 's' : ''}`;
    setSearchFilters({
      destination: destination || 'Gilgit Baltistan',
      startDate,
      endDate,
      extra: { guestCount: formattedGuestLabel, isHomestay: activeTab === 'homestay' }
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
      
      {/* 1. Full-Bleed Sweeping Hero Section matching reference image */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-8 md:-mt-12 overflow-hidden min-h-[300px] sm:min-h-[330px] lg:min-h-[350px] shadow-xl" id="hero-banner">
        {/* Sweeping Panoramic Mountain Background spanning edge-to-edge till the screen ends */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80" 
            alt="Karakoram Mountains Gilgit Baltistan" 
            className="w-full h-full object-cover object-center scale-105"
            referrerPolicy="no-referrer"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-slate-950/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
        </div>

        {/* Inner Left-Aligned Content Wrapper */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 md:pt-16 pb-14 sm:pb-16 flex flex-col justify-start items-start h-full text-left">
          {/* Content & Promo Card split layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end w-full">
            
            {/* Left Hero Texts */}
            <div className="lg:col-span-7 space-y-3.5 text-left" id="hero-left-content">
              {/* Top/Badge element matching image */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-white/20 text-white text-[11px] font-semibold backdrop-blur-md shadow-md">
                  <MapPin className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="tracking-tight text-white font-medium">{t('hero.badge')}</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug drop-shadow-md">
                {t('hero.title_part1')} {t('hero.title_part2')} <span className="text-[#00A651] font-black">Gilgit Baltistan</span>
              </h1>
              <p className="text-slate-100/95 text-xs sm:text-sm font-medium max-w-xl leading-relaxed drop-shadow-xs">
                {t('hero.subtitle')}
              </p>

              {/* Row of 4 Hero trust factors matching screenshot style */}
              <div className="flex flex-wrap items-center gap-3.5 sm:gap-6 pt-2 text-white" id="hero-trust-factors">
                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white">Best Price Guarantee</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Calendar className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white">Free Cancellation</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Headset className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white">24/7 Support</span>
                </div>

                <div className="flex items-center gap-1.5 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#00A651]/30 border border-[#00A651]/70 flex items-center justify-center shrink-0 shadow-inner">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white">Trusted Stays</span>
                </div>
              </div>
            </div>

            {/* Right Promo Card (UP TO 40% OFF) positioned at bottom right */}
            <div className="lg:col-span-5 lg:self-end flex justify-end" id="hero-promo-card">
              <div className="bg-gradient-to-br from-[#006F3C] via-[#007D44] to-[#003D21] rounded-2xl p-3.5 border border-[#006F3C]/40 text-white shadow-xl relative overflow-hidden flex justify-between gap-3 max-w-sm w-full">
                
                {/* Promo details */}
                <div className="flex flex-col justify-between z-10 py-0.5 space-y-2">
                  <div>
                    <span className="inline-block bg-gradient-to-r from-[#FF7D29] to-[#EA580C] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5 shadow-sm">
                      {t('hero.promo.tag')}
                    </span>
                    <p className="text-white/80 text-[10px] font-bold tracking-widest uppercase">{t('hero.promo.upto')}</p>
                    <h3 className="text-2xl font-black text-white tracking-tighter leading-none mt-0.5">{t('hero.promo.discount')}</h3>
                    <p className="text-white/80 text-[11px] font-semibold mt-1">{t('hero.promo.on_hotels')}</p>
                  </div>
                  
                  {/* Styled Button inside the Deal Card */}
                  <button 
                    onClick={() => setView('offers')}
                    className="bg-[#002816]/90 hover:bg-[#006F3C] border border-[#006F3C]/50 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-95 group w-fit"
                  >
                    <span>Explore Deals</span>
                    <ChevronRight className="w-3 h-3 text-white/90 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>

                {/* Promo Chalet image with rounded overlay */}
                <div className="relative w-32 h-28 shrink-0 rounded-xl overflow-hidden shadow-md border border-white/15 z-10 self-center">
                  <img 
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80" 
                    alt="Promo alpine chalet" 
                    className="w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#003D21]/50 to-transparent" />
                </div>

                {/* Ambient green radial lights */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#006F3C]/20 rounded-full blur-xl pointer-events-none" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Overlapping Booking / Search Widget Console */}
      <section className="-mt-12 sm:-mt-14 relative z-20 w-full" id="search-console">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-visible">
          
          {/* Tabs header matching the image: Hotels, Homestays, Cars, Tours */}
          <div className="flex border-b border-[#F1F5F9] bg-[#FAFAFA] px-6 sm:px-8 gap-4 sm:gap-8 overflow-x-auto scrollbar-none rounded-t-3xl" id="booking-tabs">
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
                      ? 'border-[#006F3C] text-[#006F3C]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#006F3C]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Fields Section with 5 Separated Boxes */}
          <form onSubmit={handleSearch} className="p-4 sm:p-6 bg-slate-50/50 rounded-b-3xl" id="form-search-listings">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-3.5 items-stretch relative" id="fields-row">
              
              {/* Box 1: Where are you going? */}
              <div ref={destDropdownRef} className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-3 xl:col-span-3 relative">
                <label className="text-[11px] font-bold text-slate-700 tracking-tight">{isRtl ? 'کہاں جانا چاہتے ہیں؟' : 'Where are you going?'}</label>
                <div className="flex items-center gap-2 relative">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    id="search-dest-input"
                    value={isDestDropdownOpen ? destQuery : destination}
                    onChange={(e) => {
                      setDestQuery(e.target.value);
                      setDestination(e.target.value);
                      setIsDestDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setDestQuery(destination === 'Gilgit Baltistan' ? '' : destination);
                      setIsDestDropdownOpen(true);
                    }}
                    placeholder={isRtl ? 'منزل، ہوٹل یا علاقہ تلاش کریں' : 'Search destination, hotel or area'}
                    className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 focus:outline-none p-0 cursor-text placeholder-slate-400"
                  />
                </div>

                {/* Dropdown Menu BELOW the field */}
                {isDestDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-72 overflow-y-auto p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Popular Destinations in GB
                    </div>
                    {filteredDestinations.length > 0 ? (
                      filteredDestinations.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setDestination(item.name);
                            setDestQuery(item.name);
                            setIsDestDropdownOpen(false);
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
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No destinations found matching &quot;{destQuery}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Box 2: Check-in */}
              <div 
                ref={startDateRef}
                onClick={() => {
                  setIsStartDateOpen(!isStartDateOpen);
                  setIsEndDateOpen(false);
                  setIsGuestDropdownOpen(false);
                  setIsDestDropdownOpen(false);
                }}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-2 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">{isRtl ? 'چیک ان' : 'Check-in'}</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
                  <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap">
                    {formatDateForDisplay(startDate)}
                  </span>
                </div>

                {/* Calendar Dropdown */}
                {isStartDateOpen && (
                  <CalendarPickerDropdown
                    title="Check-in Date"
                    selectedDate={startDate}
                    minDate={new Date().toISOString().split('T')[0]}
                    onChange={(newDate) => {
                      setStartDate(newDate);
                      if (newDate > endDate) {
                        setEndDate(newDate);
                      }
                    }}
                    onClose={() => setIsStartDateOpen(false)}
                  />
                )}
              </div>

              {/* Box 3: Check-out */}
              <div 
                ref={endDateRef}
                onClick={() => {
                  setIsEndDateOpen(!isEndDateOpen);
                  setIsStartDateOpen(false);
                  setIsGuestDropdownOpen(false);
                  setIsDestDropdownOpen(false);
                }}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-2 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">{isRtl ? 'چیک آؤٹ' : 'Check-out'}</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
                  <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap">
                    {formatDateForDisplay(endDate)}
                  </span>
                </div>

                {/* Calendar Dropdown */}
                {isEndDateOpen && (
                  <CalendarPickerDropdown
                    title="Check-out Date"
                    selectedDate={endDate}
                    minDate={startDate}
                    onChange={(newDate) => setEndDate(newDate)}
                    onClose={() => setIsEndDateOpen(false)}
                  />
                )}
              </div>

              {/* Box 4: Guests & Rooms */}
              <div 
                ref={guestDropdownRef} 
                onClick={() => {
                  setIsGuestDropdownOpen(!isGuestDropdownOpen);
                  setIsStartDateOpen(false);
                  setIsEndDateOpen(false);
                  setIsDestDropdownOpen(false);
                }}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 lg:col-span-3 xl:col-span-3 relative cursor-pointer group"
              >
                <label className="text-[11px] font-bold text-slate-700 tracking-tight cursor-pointer">{t('search.guests')}</label>
                <div className="flex items-center justify-between gap-1 cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
                    <span className="text-[13px] font-bold text-slate-800 select-none whitespace-nowrap truncate">
                      {adultGuests} Guest{adultGuests > 1 ? 's' : ''}, {roomCount} Room{roomCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isGuestDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Dropdown for Guest & Room counters */}
                {isGuestDropdownOpen && (
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
                          onClick={() => setAdultGuests(Math.max(1, adultGuests - 1))}
                          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{adultGuests}</span>
                        <button
                          type="button"
                          onClick={() => setAdultGuests(Math.min(20, adultGuests + 1))}
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
                        onClick={() => setIsGuestDropdownOpen(false)}
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
                  id="btn-trigger-search"
                  className="w-full h-full min-h-[50px] bg-[#006F3C] hover:bg-[#005C32] text-white font-bold rounded-xl flex items-center justify-center gap-2 px-6 py-3.5 transition-all hover:scale-[1.01] active:scale-[0.99] text-[14px] cursor-pointer shadow-md"
                >
                  <Search className="w-4 h-4 stroke-[2.5] shrink-0" />
                  <span className="whitespace-nowrap font-extrabold text-[14px]">
                    {activeTab === 'hotels' ? 'Search Hotels' : activeTab === 'homestays' ? 'Search Homestays' : activeTab === 'cars' ? 'Search Cars' : activeTab === 'tours' ? 'Search Tours' : 'Search'}
                  </span>
                </button>
              </div>

            </div>

          </form>

          {/* Divider Line */}
          <div className="border-t border-slate-200/80" />

          {/* 4-Column Trust Assurance Bar matching reference image with vertical dividers */}
          <div className="bg-[#F8FAFC]/80 p-2 sm:p-3 rounded-b-3xl" id="homestay-trust-bar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-200/80 items-center">
              
              {/* Item 1 */}
              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center text-[#006F3C] shrink-0">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Best Price Guarantee</h5>
                  <p className="text-[11px] text-slate-500 break-words">We ensure you get the best price</p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center text-[#006F3C] shrink-0">
                  <Calendar className="w-5 h-5 shrink-0 text-[#006F3C]" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Free Cancellation</h5>
                  <p className="text-[11px] text-slate-500 break-words">Cancel up to 24 hours</p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-amber-100/70 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
                  <Sparkles className="w-5 h-5 shrink-0 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Instant Confirmation</h5>
                  <p className="text-[11px] text-slate-500 break-words">Book & get confirmed</p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-center gap-3 text-slate-700 px-3 sm:px-5 py-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-purple-100/70 border border-purple-200/60 flex items-center justify-center text-purple-600 shrink-0">
                  <Shield className="w-5 h-5 shrink-0 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[13px] text-slate-800 leading-snug">Secure Payments</h5>
                  <p className="text-[11px] text-slate-500 break-words">100% safe & secure</p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 3. Category Bento Grid matching reference image - aligned with upper bar */}
        <div className="mt-5 animate-fadeIn" id="section-categories">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5" id="category-cards-grid">
          
          {/* Card 1: Hotels */}
          <div 
            onClick={() => handleCategoryCardClick('hotel')}
            className="bg-[#EFF6FF] rounded-2xl overflow-hidden border border-blue-100/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group relative flex items-stretch h-[160px] sm:h-[165px]"
            id="category-hotels"
          >
            {/* Left Content */}
            <div className="w-[58%] p-4 sm:p-4.5 flex flex-col justify-between z-10 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 className="w-5 h-5 text-[#2563EB] shrink-0 stroke-[2.2]" />
                  <h3 className="text-base sm:text-[17px] font-extrabold text-slate-900 tracking-tight">
                    {isRtl ? 'ہوٹل' : 'Hotels'}
                  </h3>
                </div>
                <p className="text-[12px] font-bold text-slate-800">
                  {isRtl ? '1200+ جائیدادیں' : '1200+ Properties'}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  {isRtl ? 'بہترین ہوٹل کے سودے اور لگژری قیام تلاش کریں' : 'Find the best hotel deals & luxury stays'}
                </p>
              </div>

              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center transition-transform group-hover:scale-110 duration-200 shadow-xs mt-2">
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>

            {/* Right Image Cutout */}
            <div className="absolute right-0 top-0 bottom-0 w-[46%] overflow-hidden rounded-r-2xl rounded-l-[40px] sm:rounded-l-[50px]">
              <img 
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80" 
                alt="Hotels" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                onError={handleImageError}
              />
            </div>
          </div>

          {/* Card 2: Homestays */}
          <div 
            onClick={() => handleCategoryCardClick('homestay')}
            className="bg-[#006F3C]/5 rounded-2xl overflow-hidden border border-[#006F3C]/15 shadow-2xs hover:shadow-md transition-all cursor-pointer group relative flex items-stretch h-[160px] sm:h-[165px]"
            id="category-homestays"
          >
            {/* Left Content */}
            <div className="w-[58%] p-4 sm:p-4.5 flex flex-col justify-between z-10 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Home className="w-5 h-5 text-[#006F3C] shrink-0 stroke-[2.2]" />
                  <h3 className="text-base sm:text-[17px] font-extrabold text-slate-900 tracking-tight">
                    {isRtl ? 'ہوم اسٹے' : 'Homestays'}
                  </h3>
                </div>
                <p className="text-[12px] font-bold text-slate-800">
                  {isRtl ? '800+ جائیدادیں' : '800+ Properties'}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  {isRtl ? 'مقامی مہمان نوازی کے ساتھ پرسکون قیام' : 'Cozy stays with local hospitality'}
                </p>
              </div>

              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#006F3C] text-white flex items-center justify-center transition-transform group-hover:scale-110 duration-200 shadow-xs mt-2">
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>

            {/* Right Image Cutout */}
            <div className="absolute right-0 top-0 bottom-0 w-[46%] overflow-hidden rounded-r-2xl rounded-l-[40px] sm:rounded-l-[50px]">
              <img 
                src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80" 
                alt="Homestays" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                onError={handleImageError}
              />
            </div>
          </div>

          {/* Card 3: Cars */}
          <div 
            onClick={() => handleCategoryCardClick('car')}
            className="bg-[#FFF7ED] rounded-2xl overflow-hidden border border-orange-100/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group relative flex items-stretch h-[160px] sm:h-[165px]"
            id="category-cars"
          >
            {/* Left Content */}
            <div className="w-[58%] p-4 sm:p-4.5 flex flex-col justify-between z-10 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Car className="w-5 h-5 text-[#EA580C] shrink-0 stroke-[2.2]" />
                  <h3 className="text-base sm:text-[17px] font-extrabold text-slate-900 tracking-tight">
                    {isRtl ? 'گاڑیاں' : 'Cars'}
                  </h3>
                </div>
                <p className="text-[12px] font-bold text-slate-800">
                  {isRtl ? '500+ گاڑیاں' : '500+ Vehicles'}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  {isRtl ? 'آپ کے سفر کے لیے گاڑیوں کی وسعت' : 'Wide range of cars for your journey'}
                </p>
              </div>

              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EA580C] text-white flex items-center justify-center transition-transform group-hover:scale-110 duration-200 shadow-xs mt-2">
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>

            {/* Right Image Cutout */}
            <div className="absolute right-0 top-0 bottom-0 w-[46%] overflow-hidden rounded-r-2xl rounded-l-[40px] sm:rounded-l-[50px] bg-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80" 
                alt="Cars" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                onError={handleImageError}
              />
            </div>
          </div>

          {/* Card 4: Tours & Packages */}
          <div 
            onClick={() => handleCategoryCardClick('tour')}
            className="bg-[#F5F3FF] rounded-2xl overflow-hidden border border-purple-100/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group relative flex items-stretch h-[160px] sm:h-[165px]"
            id="category-tours"
          >
            {/* Left Content */}
            <div className="w-[58%] p-4 sm:p-4.5 flex flex-col justify-between z-10 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Mountain className="w-5 h-5 text-[#7C3AED] shrink-0 stroke-[2.2]" />
                  <h3 className="text-base sm:text-[17px] font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                    {isRtl ? 'ٹورز اور پیکیجز' : 'Tours & Packages'}
                  </h3>
                </div>
                <p className="text-[12px] font-bold text-slate-800">
                  {isRtl ? '50+ پیکیجز' : '50+ Packages'}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                  {isRtl ? 'خاص طور پر آپ کے لیے تیار کردہ تجربات' : 'Curated experiences just for you'}
                </p>
              </div>

              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center transition-transform group-hover:scale-110 duration-200 shadow-xs mt-2">
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>

            {/* Right Image Cutout */}
            <div className="absolute right-0 top-0 bottom-0 w-[46%] overflow-hidden rounded-r-2xl rounded-l-[40px] sm:rounded-l-[50px]">
              <img 
                src="https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&q=80" 
                alt="Tours and Packages" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                onError={handleImageError}
              />
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
            onClick={() => { 
              setDestination(''); 
              setSearchFilters({ destination: '', startDate: '', endDate: '', extra: {} }); 
              setView('destinations'); 
            }} 
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
                className="relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer group shadow-sm border border-[#E2E8F0] bg-white"
              >
                <img 
                  src={dest.image} 
                  alt={dest.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-2xl"
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
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 flex flex-col h-full group hover:border-emerald-300 transition-all shadow-md"
            >
              {/* Photo Area */}
              <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-slate-100">
                <img 
                  src={listing.image} 
                  alt={listing.title} 
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 rounded-t-2xl"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div className="absolute top-3 left-3 bg-[#006F3C] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  {listing.type === 'hotel' 
                    ? (isRtl ? '🏨 ہوٹل' : '🏨 Hotel') 
                    : listing.type === 'car' 
                      ? (isRtl ? '🚘 پریمیم گاڑی' : '🚘 Premium SUV') 
                      : (isRtl ? '🏔️ مہم جوئی' : '🏔️ Expedition')}
                </div>
                <div className="absolute bottom-3 right-3 bg-[#006F3C]/10 border border-[#006F3C]/20 text-[#006F3C] font-bold px-2 py-1 rounded-lg text-xs flex items-center shadow-sm">
                  <Star className="w-3 h-3 fill-[#006F3C] stroke-none mr-1" /> {listing.rating}
                </div>
              </div>

              {/* Text Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2 text-left">
                  <p className="text-xs font-bold text-[#006F3C] uppercase tracking-wider flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-[#006F3C]" /> 
                    {isRtl 
                      ? (listing.location.includes('Hunza') ? 'وادی ہنزہ' 
                          : listing.location.includes('Skardu') ? 'سکردو کا علاقہ' 
                          : listing.location.includes('Swat') ? 'وادی سوات' 
                          : listing.location)
                      : listing.location}
                  </p>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-[#006F3C] transition-colors leading-snug">
                    {isRtl 
                      ? (listing.title.includes('Resort') ? listing.title.replace('Resort', 'ریزارٹ')
                          : listing.title.includes('Hotel') ? listing.title.replace('Hotel', 'ہوٹل')
                          : listing.title)
                      : listing.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{listing.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-slate-100">
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
                    className="bg-[#006F3C] hover:bg-[#005C32] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-transform active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <span>{isRtl ? 'تفصیلات دیکھیں' : 'View Spaces'}</span> <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 1: Featured Hotels & Resorts */}
      <section className="space-y-6 pt-6" id="section-featured-hotels">
        <div className="flex items-end justify-between flex-wrap gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
              {isRtl ? 'نمایاں ہوٹلز اور ریزارٹس' : 'Featured Hotels & Resorts'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {isRtl ? 'ایک ناقابل فراموش تجربے کے لیے ہاتھ سے منتخب کردہ رہائش گاہیں۔' : 'Handpicked stays for an unforgettable experience'}
            </p>
          </div>
          <button 
            id="btn-all-hotels-link"
            onClick={() => { 
              setDestination(''); 
              setSearchFilters({ destination: '', startDate: '', endDate: '', extra: {} }); 
              setView('hotels'); 
            }}
            className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            <span>{isRtl ? 'تمام ہوٹلز دیکھیں' : 'View all Hotels'}</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5" id="featured-hotels-grid">
          {[
            {
              id: 'h-4',
              title: 'PC Malam Jabba',
              location: 'Swat Valley, KPK',
              rating: 4.6,
              reviewsCount: 145,
              price: 13200,
              badge: 'Best Seller',
              badgeColor: 'bg-[#FF7D29]',
              image: 'https://images.unsplash.com/photo-1518098268026-4e43a1a009de?auto=format&fit=crop&w=400&q=80'
            },
            {
              id: 'h-1',
              title: 'Serena Hotel Hunza',
              location: 'Hunza, Gilgit Baltistan',
              rating: 4.8,
              reviewsCount: 256,
              price: 18500,
              badge: 'Top Rated',
              badgeColor: 'bg-emerald-600',
              image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'
            },
            {
              id: 'h-3',
              title: 'Gilgit Serena Hotel',
              location: 'Gilgit, Baltistan',
              rating: 4.7,
              reviewsCount: 198,
              price: 16500,
              badge: 'Luxury',
              badgeColor: 'bg-blue-600',
              image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=400&q=80'
            },
            {
              id: 'h-2',
              title: 'Pearl Continental Skardu',
              location: 'Skardu, Baltistan',
              rating: 4.7,
              reviewsCount: 170,
              price: 16800,
              badge: 'Popular',
              badgeColor: 'bg-teal-600',
              image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80'
            },
            {
              id: 'h-5',
              title: 'Mountiand Lodge Resort',
              location: 'Skardu, Baltistan',
              rating: 4.4,
              reviewsCount: 112,
              price: 14000,
              badge: 'New',
              badgeColor: 'bg-orange-500',
              image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=400&q=80'
            }
          ].map((hotel, idx) => (
            <div 
              key={idx}
              id={`featured-hotel-card-${idx}`}
              onClick={() => {
                // Find listing in INITIAL_LISTINGS or generate a dynamic one
                const matched = INITIAL_LISTINGS.find(l => l.id === hotel.id) || {
                  id: hotel.id,
                  type: 'hotel',
                  title: hotel.title,
                  location: hotel.location,
                  price: hotel.price,
                  rating: hotel.rating,
                  reviewsCount: hotel.reviewsCount,
                  image: hotel.image,
                  images: [hotel.image],
                  description: `${hotel.title} is a premium standard accommodation situated in the beautiful landscape of ${hotel.location}, providing high fidelity hospitality services.`,
                  featured: true,
                  hotelSpecs: { roomsAvailable: 5, amenities: ['Free Wi-Fi', 'Room Service', 'Fireside Lounge', 'Traditional Dining'], hotelType: 'Premium Hotel' }
                };
                onSelectListing(matched as any);
              }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between h-full group cursor-pointer text-left"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden shrink-0 bg-slate-100">
                <img 
                  src={hotel.image} 
                  alt={hotel.title} 
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 rounded-t-2xl"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div className={`absolute top-2.5 left-2.5 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 shadow-xs tracking-wider rounded-md ${hotel.badgeColor}`}>
                  {hotel.badge}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); }}
                  className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/95 rounded-full border border-slate-100 flex items-center justify-center text-slate-500 hover:text-red-500 hover:scale-105 active:scale-95 transition-all shadow-xs"
                >
                  <Heart className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div className="space-y-1">
                  <h4 className="text-[14px] font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-snug">
                    {hotel.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 flex items-center">
                    <MapPin className="w-3 h-3 text-slate-400 mr-0.5 shrink-0" />
                    <span>{hotel.location}</span>
                  </p>
                  <div className="flex items-center gap-1 pt-1">
                    <Star className="w-3 h-3 fill-amber-400 stroke-none" />
                    <span className="text-[11px] font-bold text-slate-800">{hotel.rating}</span>
                    <span className="text-[10px] text-slate-400">({hotel.reviewsCount} Reviews)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PKR {hotel.price.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500 font-medium">/night</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: Popular Destinations */}
      <section className="space-y-6 pt-6" id="section-popular-destinations">
        <div className="flex items-end justify-between flex-wrap gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
              {isRtl ? 'مقبول ترین مقامات' : 'Popular Destinations'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {isRtl ? 'گلگت بلتستان میں سب سے مشہور مقامات کا جائزہ لیں۔' : 'Explore the most popular places in Gilgit Baltistan'}
            </p>
          </div>
          <button 
            id="btn-all-destinations-link-popular"
            onClick={() => { 
              setDestination(''); 
              setSearchFilters({ destination: '', startDate: '', endDate: '', extra: {} }); 
              setView('destinations'); 
            }}
            className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            <span>{isRtl ? 'تمام مقامات دیکھیں' : 'View all Destinations'}</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4" id="popular-destinations-grid">
          {[
            { name: 'Skardu', count: '320+ Properties', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80' },
            { name: 'Hunza Valley', count: '450+ Properties', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80' },
            { name: 'Deosai Plains', count: '120+ Properties', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80' },
            { name: 'Khaplu', count: '80+ Properties', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80' },
            { name: 'Basho Valley', count: '60+ Properties', image: 'https://images.unsplash.com/photo-1518098268026-4e43a1a009de?auto=format&fit=crop&w=400&q=80' }
          ].map((dest, i) => (
            <div
              key={i}
              id={`popular-dest-card-${i}`}
              onClick={() => {
                setDestination(dest.name);
                setSearchFilters({ destination: dest.name, startDate: '', endDate: '', extra: {} });
                setView('browse-hotels');
              }}
              className="relative rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer group shadow-sm border border-slate-200/60 bg-slate-900"
            >
              <img 
                src={dest.image} 
                alt={dest.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-2xl opacity-90"
                referrerPolicy="no-referrer"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 flex items-center">
                  <MapPin className="w-2.5 h-2.5 mr-0.5 text-emerald-400" /> {dest.name}
                </p>
                <h4 className="text-base font-black text-white mt-0.5 tracking-tight">{dest.name}</h4>
                <span className="text-[10px] text-white/80 font-bold block mt-1">{dest.count}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Trending Tour Packages */}
      <section className="space-y-6 pt-6" id="section-trending-tours">
        <div className="flex items-end justify-between flex-wrap gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
              {isRtl ? 'مقبول ترین ٹور پیکیجز' : 'Trending Tour Packages'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {isRtl ? 'صرف آپ کے لیے خصوصی طور پر تیار کردہ ٹورز۔' : 'Curated tour packages just for you'}
            </p>
          </div>
          <button 
            id="btn-all-tours-link-trending"
            onClick={() => { 
              setDestination(''); 
              setSearchFilters({ destination: '', startDate: '', endDate: '', extra: {} }); 
              setView('tours'); 
            }}
            className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            <span>{isRtl ? 'تمام پیکیجز دیکھیں' : 'View all Packages'}</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="trending-tours-grid">
          {[
            {
              title: 'Hunza Valley Explorer',
              duration: '5 Days / 4 Nights',
              stops: 'Islamabad - Hunza - Attabad Lake',
              price: 45000,
              oldPrice: 56000,
              rating: 4.8,
              reviews: 156,
              badge: '-20% OFF',
              badgeColor: 'bg-[#FF7D29]',
              image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80'
            },
            {
              title: 'Skardu Adventure Tour',
              duration: '6 Days / 5 Nights',
              stops: 'Islamabad - Skardu - Shigar - Khaplu',
              price: 38000,
              oldPrice: 45000,
              rating: 4.7,
              reviews: 128,
              badge: '-15% OFF',
              badgeColor: 'bg-emerald-600',
              image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80'
            },
            {
              title: 'Deosai Plains Expedition',
              duration: '4 Days / 3 Nights',
              stops: 'Skardu - Deosai - Sheosar Lake',
              price: 32000,
              oldPrice: 36000,
              rating: 4.6,
              reviews: 98,
              badge: '-10% OFF',
              badgeColor: 'bg-blue-600',
              image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'
            },
            {
              title: 'Naran Kaghan Escape',
              duration: '5 Days / 4 Nights',
              stops: 'Islamabad - Naran - Lake Saif ul Malook',
              price: 28000,
              oldPrice: 36000,
              rating: 4.6,
              reviews: 98,
              badge: 'Family Tour',
              badgeColor: 'bg-purple-600',
              image: 'https://images.unsplash.com/photo-1518098268026-4e43a1a009de?auto=format&fit=crop&w=400&q=80'
            }
          ].map((tour, idx) => (
            <div 
              key={idx}
              id={`trending-tour-card-${idx}`}
              onClick={() => {
                const matched = {
                  id: `t-trend-${idx}`,
                  type: 'tour',
                  title: tour.title,
                  location: tour.stops,
                  price: tour.price,
                  rating: tour.rating,
                  reviewsCount: tour.reviews,
                  image: tour.image,
                  images: [tour.image],
                  description: `Experience the breathtaking adventure of our ${tour.title}. Spanning ${tour.duration}, this curated tour package includes luxury transport, premium stays, expert mountain guides, and breathtaking views of ${tour.stops}.`,
                  featured: true,
                  tourSpecs: { durationDays: parseInt(tour.duration), groupSizeMax: 12, standardInclusions: ['Luxury AC Coaster', '3-Star Hotel Stay', 'Local Mountain Guide', 'Daily Breakfast & Dinner', 'Entry Tickets Included'] }
                };
                onSelectListing(matched as any);
              }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between h-full group cursor-pointer text-left"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 shrink-0">
                <img 
                  src={tour.image} 
                  alt={tour.title} 
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 rounded-t-2xl"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div className={`absolute top-2.5 left-2.5 text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 shadow-xs tracking-wider rounded-md ${tour.badgeColor}`}>
                  {tour.badge}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase block">{tour.duration}</span>
                  <h4 className="text-[14px] font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-snug">
                    {tour.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mr-0.5 shrink-0" />
                    <span>{tour.stops}</span>
                  </p>
                  <div className="flex items-center gap-1 pt-1">
                    <Star className="w-3 h-3 fill-amber-400 stroke-none" />
                    <span className="text-[11px] font-bold text-slate-800">{tour.rating}</span>
                    <span className="text-[10px] text-slate-400">({tour.reviews} Reviews)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[13px] font-black text-slate-950">PKR {tour.price.toLocaleString()}</span>
                    {tour.oldPrice && (
                      <span className="text-[11px] text-slate-400 line-through">PKR {tour.oldPrice.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: Premium Car Rentals */}
      <section className="space-y-6 pt-6" id="section-car-rentals">
        <div className="flex items-end justify-between flex-wrap gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Premium <span className="text-[#EA580C]">Car Rentals</span>
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {isRtl ? 'آرام دہ اور یادگار سفر کے لیے قابل اعتماد اور پائیدار گاڑیاں۔' : 'Reliable cars for a comfortable journey'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              id="btn-all-cars-link-premium"
              onClick={() => { 
                setDestination(''); 
                setSearchFilters({ destination: '', startDate: '', endDate: '', extra: {} }); 
                setView('cars'); 
              }}
              className="text-xs font-bold text-[#006F3C] flex items-center gap-1 hover:text-[#005C32] transition-colors cursor-pointer"
            >
              <span>{isRtl ? 'تمام گاڑیاں دیکھیں' : 'View all Cars'}</span> <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('premium-cars-grid');
                if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
              }}
              className="w-8 h-8 rounded-full border border-[#006F3C]/20 bg-white flex items-center justify-center text-[#006F3C] hover:bg-[#006F3C]/10 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5" id="premium-cars-grid">
          {[
            {
              title: 'Toyota Land Cruiser',
              type: 'SUV',
              fuel: 'Diesel',
              seats: '7 Seats',
              price: 32000,
              rating: 4.9,
              reviews: 156,
              badge: 'Best Seller',
              badgeColor: 'bg-[#EA580C]',
              image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'
            },
            {
              title: 'Toyota Fortuner',
              type: 'SUV',
              fuel: 'Diesel',
              seats: '7 Seats',
              price: 18000,
              rating: 4.8,
              reviews: 198,
              badge: 'Popular',
              badgeColor: 'bg-[#006F3C]',
              image: 'https://images.unsplash.com/photo-1606016159991-dfe4f974be5c?auto=format&fit=crop&w=600&q=80'
            },
            {
              title: 'Toyota Hiace Grand Cabin',
              type: 'Van',
              fuel: 'Diesel',
              seats: '14 Seats',
              price: 25000,
              rating: 4.7,
              reviews: 112,
              badge: 'Luxury',
              badgeColor: 'bg-[#2563EB]',
              image: 'https://images.unsplash.com/photo-1520050206274-a1ae446cb3cc?auto=format&fit=crop&w=600&q=80'
            },
            {
              title: 'Suzuki Cultus',
              type: 'Hatchback',
              fuel: 'Petrol',
              seats: '4 Seats',
              price: 3500,
              rating: 4.5,
              reviews: 98,
              badge: 'Economy',
              badgeColor: 'bg-[#6366F1]',
              image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80'
            },
            {
              title: 'Honda Civic',
              type: 'Sedan',
              fuel: 'Petrol',
              seats: '5 Seats',
              price: 7500,
              rating: 4.5,
              reviews: 98,
              badge: 'Standard',
              badgeColor: 'bg-[#006F3C]',
              image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=600&q=80'
            }
          ].map((car, idx) => (
            <div 
              key={idx}
              id={`premium-car-card-${idx}`}
              onClick={() => {
                const matched = {
                  id: `car-trend-${idx}`,
                  type: 'car',
                  title: car.title,
                  location: 'Gilgit & Skardu Region',
                  price: car.price,
                  rating: car.rating,
                  reviewsCount: car.reviews,
                  image: car.image,
                  images: [car.image],
                  description: `Experience a premium rental trip with ${car.title}, equipped with premium engine performance, pristine interiors, full heating/cooling, and highly durable build suitable for the Karakoram peaks. Includes options for professional local driver.`,
                  featured: true,
                  carSpecs: { transmission: 'Automatic', seatingCapacity: parseInt(car.seats), fuelType: car.fuel, engineCapacity: '2700cc', withDriverOption: true }
                };
                onSelectListing(matched as any);
              }}
              className="bg-[#F8FAFC] rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 flex flex-col justify-between h-full group cursor-pointer text-left hover:shadow-md hover:border-slate-300 transition-all duration-300"
            >
              {/* Top Image Box */}
              <div>
                <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100/80 mb-3 shrink-0">
                  <img 
                    src={car.image} 
                    alt={car.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-xl"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  <div className={`absolute top-2.5 left-2.5 text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1 shadow-2xs rounded-md ${car.badgeColor}`}>
                    {car.badge}
                  </div>
                </div>

                {/* Info Content */}
                <div className="space-y-1.5 px-0.5">
                  <h4 className="text-[14px] sm:text-[15px] font-bold text-slate-900 group-hover:text-[#EA580C] transition-colors line-clamp-1 leading-snug">
                    {car.title}
                  </h4>
                  
                  {/* Specs row matching screenshot: [CarIcon] SUV [FuelIcon] Diesel [UsersIcon] 7 Seats */}
                  <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-medium my-1.5 flex-wrap">
                    <span className="flex items-center gap-1 shrink-0">
                      <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {car.type}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Fuel className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {car.fuel}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {car.seats}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Price & Rating */}
              <div className="pt-2.5 mt-2 border-t border-slate-200/60 space-y-1 px-0.5">
                <div>
                  <span className="text-base font-extrabold text-slate-900">PKR {car.price.toLocaleString()}</span>
                  <span className="text-xs font-medium text-slate-400"> /day</span>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none text-amber-400 shrink-0" />
                  <span className="font-bold text-amber-600">{car.rating}</span>
                  <span className="text-slate-400">({car.reviews} Reviews)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: Summer Special Deals! */}
      <section className="pt-6" id="section-summer-deals">
        <div className="bg-[#FAFBFD] border border-slate-200/65 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 items-stretch">
          
          {/* Left Area: Countdown Promo (Green Block matching the image) */}
          <div className="lg:col-span-5 bg-gradient-to-r from-[#003D21] via-[#006F3C] to-[#002816] p-6 sm:p-8 flex flex-col justify-between text-white relative overflow-hidden text-left min-h-[280px]">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-[#006F3C]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="z-10 space-y-2 max-w-[260px] sm:max-w-xs">
              <span className="text-[10px] text-white/80 uppercase font-black tracking-widest block">
                Limited Time Offer
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Summer <span className="text-[#FACC15]">Special Deals!</span>
              </h3>
              <p className="text-white/80 text-xs font-medium leading-relaxed">
                Grab amazing discounts on hotels, tours & cars.
              </p>
            </div>

            {/* Timers countdown matching reference image */}
            <div className="z-10 flex items-center gap-1.5 pt-4" id="countdown-timer-grid">
              {[
                { label: 'Days', val: timeLeft.days },
                { label: 'Hours', val: timeLeft.hours },
                { label: 'Minutes', val: timeLeft.minutes },
                { label: 'Seconds', val: timeLeft.seconds }
              ].map((time, tIdx) => (
                <React.Fragment key={tIdx}>
                  {tIdx > 0 && <span className="text-white/40 font-bold text-xs sm:text-sm">-</span>}
                  <div className="bg-black/20 border border-white/15 rounded-xl px-2.5 py-1.5 min-w-[48px] sm:min-w-[54px] flex flex-col items-center justify-center backdrop-blur-xs">
                    <span className="text-base sm:text-lg font-black text-white leading-none block">
                      {time.val.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[7px] sm:text-[8px] font-extrabold uppercase tracking-wider text-white/60 mt-1 block">
                      {time.label}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Beautiful Layered Travel Illustration mirroring the reference image */}
            <div className="absolute right-0 top-0 bottom-0 w-60 pointer-events-none hidden sm:block overflow-hidden z-20">
              <svg viewBox="0 0 240 240" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  {/* Sky gradient inside the circle */}
                  <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#bae6fd" />
                    <stop offset="100%" stopColor="#f0f9ff" />
                  </linearGradient>
                  
                  {/* Mountain gradient 1 */}
                  <linearGradient id="mountGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#075985" />
                  </linearGradient>

                  {/* Mountain gradient 2 */}
                  <linearGradient id="mountGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0369a1" />
                    <stop offset="100%" stopColor="#0c4a6e" />
                  </linearGradient>

                  {/* Suitcase gradient */}
                  <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>

                  {/* Straw hat gradient */}
                  <linearGradient id="strawGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#facc15" />
                  </linearGradient>

                  <clipPath id="circle-clip">
                    <circle cx="140" cy="110" r="70" />
                  </clipPath>
                </defs>

                {/* 1. Background Circular Peak using clip-path */}
                <g clipPath="url(#circle-clip)">
                  {/* Sky */}
                  <rect x="60" y="30" width="160" height="160" fill="url(#skyGrad)" />
                  
                  {/* Sun */}
                  <circle cx="175" cy="75" r="12" fill="#fef08a" opacity="0.9" />
                  
                  {/* Mountains Back */}
                  <polygon points="65,185 125,85 185,185" fill="url(#mountGrad1)" />
                  
                  {/* Mountains Front */}
                  <polygon points="100,185 160,65 220,185" fill="url(#mountGrad2)" />

                  {/* Mountain Snow Caps */}
                  <polygon points="125,85 120,93 130,93" fill="#ffffff" />
                  <polygon points="160,65 152,76 168,76" fill="#ffffff" />
                </g>

                {/* Circular Peak border */}
                <circle cx="140" cy="110" r="70" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />

                {/* 2. Palm Leaf behind the suitcase */}
                <g opacity="0.85">
                  {/* Leaf stem */}
                  <path d="M 85,170 Q 55,140 45,95" fill="none" stroke="#006F3C" strokeWidth="2" strokeLinecap="round" />
                  {/* Fronds */}
                  <path d="M 80,155 Q 52,145 42,130" fill="none" stroke="#006F3C" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 75,140 Q 48,128 38,112" fill="none" stroke="#006F3C" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 70,125 Q 45,110 35,95" fill="none" stroke="#006F3C" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 62,110 Q 42,95 35,80" fill="none" stroke="#006F3C" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 52,98 Q 38,82 32,68" fill="none" stroke="#006F3C" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 45,95 Q 35,75 35,60" fill="none" stroke="#006F3C" strokeWidth="2.5" strokeLinecap="round" />
                </g>

                {/* Subtle ground shadow under suitcase and wheels */}
                <ellipse cx="110" cy="176" rx="35" ry="4" fill="#000000" opacity="0.3" />

                {/* 3. Travel Suitcase standing */}
                {/* Trolley Handle */}
                <rect x="100" y="45" width="24" height="40" rx="3" fill="none" stroke="#64748b" strokeWidth="3" />
                <rect x="103" y="42" width="18" height="6" rx="1.5" fill="#0f172a" />
                
                {/* Suitcase Body Shadow */}
                <rect x="87" y="83" width="54" height="92" rx="10" fill="#000000" opacity="0.25" />

                {/* Suitcase Body */}
                <rect x="85" y="80" width="54" height="92" rx="10" fill="url(#suitGrad)" stroke="#334155" strokeWidth="1.5" />
                
                {/* Corner protectors */}
                <path d="M 85,92 A 12,12 0 0,1 97,80" fill="none" stroke="#475569" strokeWidth="3" />
                <path d="M 139,92 A 12,12 0 0,0 127,80" fill="none" stroke="#475569" strokeWidth="3" />

                {/* Vertical Ribs/Stripes for texture */}
                <line x1="95" y1="92" x2="95" y2="160" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="95" y1="92" x2="95" y2="160" stroke="#1e293b" strokeWidth="1" strokeLinecap="round" />

                <line x1="112" y1="92" x2="112" y2="160" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="112" y1="92" x2="112" y2="160" stroke="#1e293b" strokeWidth="1" strokeLinecap="round" />

                <line x1="129" y1="92" x2="129" y2="160" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="129" y1="92" x2="129" y2="160" stroke="#1e293b" strokeWidth="1" strokeLinecap="round" />

                {/* Wheels */}
                <circle cx="96" cy="174" r="5.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <circle cx="96" cy="174" r="2.5" fill="#94a3b8" />
                <circle cx="128" cy="174" r="5.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <circle cx="128" cy="174" r="2.5" fill="#94a3b8" />

                {/* 4. Straw Sun Hat resting in front, slightly rotated */}
                <g transform="rotate(6 145 168)">
                  {/* Hat Shadow */}
                  <ellipse cx="147" cy="172" rx="42" ry="12" fill="#000000" opacity="0.35" />
                  
                  {/* Hat Brim (Wide ellipse) */}
                  <ellipse cx="145" cy="168" rx="42" ry="11" fill="url(#strawGrad)" stroke="#d97706" strokeWidth="1" />
                  
                  {/* Inner concentric lines on brim for straw texture */}
                  <ellipse cx="145" cy="168" rx="34" ry="8" fill="none" stroke="#d97706" strokeDasharray="3,3" opacity="0.4" />
                  <ellipse cx="145" cy="168" rx="26" ry="6" fill="none" stroke="#d97706" strokeDasharray="2,2" opacity="0.3" />

                  {/* Hat Crown (dome) */}
                  <path d="M 125,164 C 125,142 165,142 165,164 Z" fill="url(#strawGrad)" stroke="#d97706" strokeWidth="1" />
                  
                  {/* Ribbon around crown */}
                  <path d="M 125,162 C 131,158 159,158 165,162 L 164.5,165 C 158.5,161 131.5,161 125.5,165 Z" fill="#1e3a8a" />
                  
                  {/* Ribbon bow tail */}
                  <path d="M 163,163 L 172,166 L 168,169 Z" fill="#172554" />
                </g>

                {/* 5. Camera on the ground */}
                <g transform="rotate(-10 75 170)">
                  <rect x="65" y="165" width="22" height="15" rx="3.5" fill="#475569" stroke="#334155" strokeWidth="1" />
                  <rect x="68" y="168" width="16" height="9" fill="#1e293b" />
                  <circle cx="76" cy="172" r="5" fill="#64748b" stroke="#94a3b8" strokeWidth="0.75" />
                  <circle cx="76" cy="172" r="3" fill="#0f172a" />
                  <circle cx="75" cy="171" r="1" fill="#38bdf8" />
                  <rect x="68" y="163" width="3" height="2" fill="#94a3b8" />
                </g>
              </svg>

              {/* 6. Orange Scalloped Badge: Up to 40% OFF */}
              <div className="absolute right-4 top-[25%] w-18 h-18 bg-[#FF7D29] rounded-full border-2 border-dashed border-white/60 shadow-lg flex flex-col items-center justify-center rotate-[10deg] z-50 animate-pulse">
                <span className="text-[7px] font-bold uppercase tracking-wider text-white/90 leading-none">Up to</span>
                <span className="text-lg font-black text-white leading-none mt-0.5">40%</span>
                <span className="text-[9px] font-bold uppercase text-white/95 leading-none">OFF</span>
              </div>
            </div>

            {/* S-curve wave divider (replaces linear edge on large screens) */}
            <svg 
              className="absolute right-0 top-0 bottom-0 h-full w-20 text-white fill-white pointer-events-none hidden lg:block z-50"
              viewBox="0 0 100 100" 
              preserveAspectRatio="none"
            >
              <path d="M 50,0 C 25,30 75,70 50,100 L 100,100 L 100,0 Z" />
            </svg>
          </div>

          {/* Right Area: Offers listing and Action (Matching reference image) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 bg-white text-left">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 flex-1 w-full justify-around">
              
              {/* Stat 1: Hotels */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="shrink-0 text-[#1E40AF]">
                  <Building2 className="w-9 h-9 stroke-[1.8] text-[#1E40AF]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 font-semibold block leading-none">Up to</span>
                  <span className="text-xl sm:text-2xl font-black text-[#EA580C] block leading-snug my-0.5">40% OFF</span>
                  <span className="text-[12px] text-slate-600 font-medium block leading-none">on Hotels</span>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="hidden sm:block w-px h-12 bg-slate-200/80 shrink-0" />

              {/* Stat 2: Tour Packages */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="shrink-0 text-[#16A34A]">
                  <Map className="w-9 h-9 stroke-[1.8] text-[#16A34A]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 font-semibold block leading-none">Up to</span>
                  <span className="text-xl sm:text-2xl font-black text-[#EA580C] block leading-snug my-0.5">30% OFF</span>
                  <span className="text-[12px] text-slate-600 font-medium block leading-none">on Tour Packages</span>
                </div>
              </div>

              {/* Stat 3: Car Rentals */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="shrink-0 text-[#EA580C]">
                  <Car className="w-9 h-9 stroke-[1.8] text-[#EA580C]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 font-semibold block leading-none">Up to</span>
                  <span className="text-xl sm:text-2xl font-black text-[#EA580C] block leading-snug my-0.5">25% OFF</span>
                  <span className="text-[12px] text-slate-600 font-medium block leading-none">on Car Rentals</span>
                </div>
              </div>

            </div>

            {/* Explore All Deals Button matching reference image */}
            <button
              id="btn-explore-deals"
              onClick={() => { 
                setDestination(''); 
                setSearchFilters({ destination: '', startDate: '', endDate: '', extra: {} }); 
                setView('offers'); 
              }}
              className="bg-[#0B2559] hover:bg-[#071a3e] text-white px-6 py-3.5 rounded-2xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-md shrink-0 w-full lg:w-auto"
            >
              <span className="font-bold text-[13px]">Explore All Deals</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 6: Why Choose GBBookings.com? */}
      <section className="pt-6" id="section-why-choose">
        <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xs text-left">
          
          {/* Header block with exact GBLogo mark */}
          <div className="space-y-1 pb-6 border-b border-slate-100 mb-6">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 flex-wrap">
              <span>{isRtl ? 'ہمیں کیوں منتخب کریں؟' : 'Why Choose'}</span>
              <GBLogo size="sm" />
              <span className="text-slate-900 font-bold">?</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {isRtl ? 'آپ کا اطمینان ہماری پہلی ترجیح ہے۔' : 'Your satisfaction is our top priority'}
            </p>
          </div>

          {/* Six features in a row with vertical line dividers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 lg:divide-x divide-slate-200/80 gap-y-6 sm:gap-y-6 lg:gap-y-0 items-start" id="why-choose-grid">
            {[
              { 
                title: 'Verified Properties', 
                desc: 'All properties are thoroughly verified', 
                icon: CheckCircle2,
                color: 'text-[#16A34A]'
              },
              { 
                title: 'Best Price Guarantee', 
                desc: 'We ensure the best price always', 
                icon: BadgePercent,
                color: 'text-[#1E40AF]'
              },
              { 
                title: 'Secure Payments', 
                desc: '100% safe & secure payment gateway', 
                icon: Lock, 
                color: 'text-[#16A34A]'
              },
              { 
                title: 'Instant Confirmation', 
                desc: 'Book instantly & get confirmation', 
                icon: Sparkles, 
                color: 'text-[#EA580C]'
              },
              { 
                title: 'Free Cancellation', 
                desc: 'Cancel up to 24 hours before check-in', 
                icon: CalendarCheck, 
                color: 'text-[#16A34A]'
              },
              { 
                title: '24/7 Customer Support', 
                desc: "We're here to help anytime, anywhere", 
                icon: Headset, 
                color: 'text-[#1E40AF]'
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex flex-col items-start text-left space-y-2.5 px-3 sm:px-4 py-1 group first:pl-0 last:pr-0">
                  {/* Clean Icon direct outline */}
                  <div className={`${item.color} transition-transform duration-200 group-hover:scale-110`}>
                    <Icon className="w-7 h-7 stroke-[2]" />
                  </div>
                  
                  {/* Text Information block */}
                  <div className="space-y-1">
                    <h5 className="font-bold text-[13px] text-slate-900 leading-snug tracking-tight">
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SECTION 7: What Our Travelers Say */}
      <section className="space-y-6 pt-6 overflow-hidden" id="section-testimonials">
        <div className="space-y-1.5 text-left">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
            {isRtl ? 'ہمارے مسافروں کی رائے' : 'What Our Travelers Say'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Real stories from adventurers exploring Hunza, Skardu, Gilgit & beyond
          </p>
        </div>

        {/* CONTINUOUS MOVING MARQUEE STREAM */}
        <div className="relative group-pause space-y-4 py-2 -mx-4 sm:-mx-8 lg:-mx-12 overflow-hidden" id="marquee-comments-container">
          {/* Side Fade Gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#FAFAFA] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#FAFAFA] to-transparent z-10 pointer-events-none" />

          {/* ROW 1: Moving Left Continuous Loop */}
          <div className="flex overflow-hidden">
            <div className="animate-marquee-left flex gap-4 sm:gap-5 pr-4 sm:pr-5">
              {[...commentsList, ...commentsList].map((card, idx) => (
                <div
                  key={card.id + '-row1-' + idx}
                  className={`w-[300px] sm:w-[340px] shrink-0 bg-white border border-slate-200/80 hover:border-emerald-500/50 p-5 rounded-2xl shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-3 cursor-pointer group ${card.floatClass}`}
                  onClick={() => handleLikeComment(card.id)}
                >
                  <div className="space-y-2.5 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {Array(card.rating).fill(0).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Verified Traveler</span>
                      </span>
                    </div>

                    <p className="text-slate-700 text-xs sm:text-[13px] font-normal leading-relaxed italic line-clamp-3">
                      "{card.comment}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 text-left">
                      <img
                        src={card.avatar}
                        alt={card.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                          {card.name}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>{card.location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeComment(card.id);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200/60"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{card.likes}</span>
                      </button>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg shrink-0 border border-slate-200/50">
                        {card.badge}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROW 2: Moving Right Continuous Loop */}
          <div className="flex overflow-hidden">
            <div className="animate-marquee-right flex gap-4 sm:gap-5 pr-4 sm:pr-5">
              {[...commentsList, ...commentsList].reverse().map((card, idx) => (
                <div
                  key={card.id + '-row2-' + idx}
                  className={`w-[300px] sm:w-[340px] shrink-0 bg-white border border-slate-200/80 hover:border-emerald-500/50 p-5 rounded-2xl shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-3 cursor-pointer group ${card.floatClass}`}
                  onClick={() => handleLikeComment(card.id)}
                >
                  <div className="space-y-2.5 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {Array(card.rating).fill(0).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Verified Traveler</span>
                      </span>
                    </div>

                    <p className="text-slate-700 text-xs sm:text-[13px] font-normal leading-relaxed italic line-clamp-3">
                      "{card.comment}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 text-left">
                      <img
                        src={card.avatar}
                        alt={card.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                          {card.name}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>{card.location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeComment(card.id);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200/60"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{card.likes}</span>
                      </button>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg shrink-0 border border-slate-200/50">
                        {card.badge}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL: WRITE A FLOATING COMMENT */}
        <AnimatePresence>
          {isCommentModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl text-left space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">Write Floating Comment</h4>
                      <p className="text-xs text-slate-500">Your comment will revolve live in the traveler feed</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCommentModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddCustomComment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Your Travel Story / Comment
                    </label>
                    <textarea
                      rows={3}
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="e.g. Loved our stay in Hunza valley! Super smooth booking..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCommentModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Comment</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* SECTION 8: GBBookings by the Numbers */}
      <section className="space-y-6 pt-6 pb-4" id="section-by-the-numbers">
        <div className="text-left space-y-1">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
            {isRtl ? 'نمبرز کی زبانی' : 'GBBookings by the Numbers'}
          </h3>
          <p className="text-sm text-slate-500">
            Trusted by travelers all around the world
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5" id="numbers-grid">
          {[
            { metric: '1200+', label: 'Properties', desc: 'Hotels, Resorts & Homestays', color: 'text-indigo-600', icon: Building2 },
            { metric: '500+', label: 'Cars', desc: 'Wide Range of Vehicles', color: 'text-emerald-700', icon: Car },
            { metric: '50+', label: 'Packages', desc: 'Curated Experiences for You', color: 'text-orange-600', icon: Compass },
            { metric: '10K+', label: 'Happy Travelers', desc: 'Trusted by Thousands of Travelers', color: 'text-purple-600', icon: Users2 }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-3xl text-left flex flex-col justify-between space-y-5 shadow-xs hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className={`text-2xl sm:text-3xl font-black ${item.color} tracking-tight`}>
                    {item.metric}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">{item.label}</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 leading-normal font-medium">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
