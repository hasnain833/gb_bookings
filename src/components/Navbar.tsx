import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, Globe, User, Bell, Bot, Calendar, Headset, 
  Compass as TourIcon, Compass, Sparkles, MessageCircle, Building2, Home, 
  Car, MapPin, Flame, LogOut, Heart, ShieldCheck, Shield, ChevronRight,
  ArrowRight, ArrowLeft, Tag, Percent, Star, PlusCircle, HelpCircle, MoreVertical,
  Wifi, Coffee, Mountain, Waves, Utensils, Plane, Snowflake,
  LayoutGrid, Crown, Dog, Briefcase, Lock, Users, Building,
  Smartphone, Sun, Landmark, Trees, Flower2, Gift, Zap, Clock, CreditCard,
  Award, Moon, Wallet, Key, Camera, Menu, X, Phone
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { handleImageError } from '../types';
import GBLogo from './GBLogo';

interface NavbarProps {
  currentView: string;
  setView: (v: string) => void;
  notificationsCount: number;
  unreadNotifications: boolean;
  userEmail: string;
  userName?: string;
  isLoggedIn: boolean;
  onOpenNotifications: () => void;
  onOpenAuthModal: (mode?: 'signin' | 'register') => void;
  onSignOut: () => void;
}

const CAR_BRAND_LOGOS: Record<string, { primary: string; secondary: string }> = {
  toyota: {
    primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/toyota.svg',
    secondary: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Toyota.svg'
  },
  nissan: {
    primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/nissan.svg',
    secondary: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Nissan_2020_logo.svg'
  },
  honda: {
    primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/honda.svg',
    secondary: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg'
  },
  suzuki: {
    primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/suzuki.svg',
    secondary: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Suzuki_logo.svg'
  },
  mitsubishi: {
    primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/mitsubishi.svg',
    secondary: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Mitsubishi-logo.svg'
  },
  hyundai: {
    primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/hyundai.svg',
    secondary: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg'
  },
  kia: {
    primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/kia.svg',
    secondary: 'https://upload.wikimedia.org/wikipedia/commons/4/47/KIA_logo2.svg'
  },
  'land rover': {
    primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/landrover.svg',
    secondary: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/LandRover.svg'
  },
  mg: {
    primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/mg.svg',
    secondary: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/MG_Motor_2021_logo.svg'
  },
  bmw: {
    primary: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/bmw.svg',
    secondary: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg'
  }
};

const CarBrandLogo = ({ brand }: { brand: string }) => {
  const brandKey = Object.keys(CAR_BRAND_LOGOS).find(k => brand.toLowerCase().includes(k));
  const info = brandKey ? CAR_BRAND_LOGOS[brandKey] : null;

  if (!info) {
    return <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }

  return (
    <div className="w-4 h-4 flex items-center justify-center shrink-0 bg-slate-100 rounded-xs p-0.5 border border-slate-200/60 shadow-2xs">
      <img
        src={info.primary}
        alt={`${brand} logo`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== info.secondary) {
            target.src = info.secondary;
          }
        }}
        className="w-full h-full object-contain filter contrast-125"
      />
    </div>
  );
};

export default function Navbar({
  currentView,
  setView,
  notificationsCount,
  unreadNotifications,
  userEmail,
  userName,
  isLoggedIn,
  onOpenNotifications,
  onOpenAuthModal,
  onSignOut
}: NavbarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [activeMegaTab, setActiveMegaTab] = useState<'hotels' | 'homestays' | 'cars' | 'tours' | 'destinations' | 'offers'>('hotels');
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const megaMenuTimeoutRef = useRef<any>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
        setShowLangDropdown(false);
        setShowMoreMenu(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const { language, requestLanguageChange, t, isRtl } = useLanguage();

  const userInitials = userName 
    ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : (userEmail ? userEmail.substring(0, 2).toUpperCase() : 'US');

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'User');

  const handleLinkClick = (id: string) => {
    setShowMegaMenu(false);
    setShowMoreMenu(false);
    if (id === 'hotels') {
      setView('hotels');
    } else if (id === 'homestays') {
      setView('homestays');
    } else if (id === 'cars') {
      setView('cars');
    } else if (id === 'tours') {
      setView('tours');
    } else if (id === 'destinations') {
      setView('destinations');
    } else if (id === 'offers') {
      setView('offers');
    } else if (id === 'ai-planner') {
      setView('ai-planner');
    }
  };

  const handleNavHover = (id: 'hotels' | 'homestays' | 'cars' | 'tours' | 'destinations' | 'offers') => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    setActiveMegaTab(id);
    setShowMegaMenu(true);
  };

  const handleNavLeave = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setShowMegaMenu(false);
    }, 300);
  };

  const navItems = [
    { id: 'hotels', label: t('nav.hotels') || 'Hotels', icon: Building2, mega: 'hotels' as const },
    { id: 'homestays', label: t('search.homestay_tab') || 'Homestays', icon: Home, mega: 'homestays' as const },
    { id: 'cars', label: t('nav.cars') || 'Cars', icon: Car, mega: 'cars' as const },
    { id: 'tours', label: t('nav.tours') || 'Tours', icon: TourIcon, mega: 'tours' as const },
    { id: 'destinations', label: isRtl ? 'مقامات' : 'Destinations', icon: MapPin, mega: 'destinations' as const },
    { id: 'offers', label: isRtl ? 'آفرز' : 'Offers', icon: Tag, isHot: true, mega: 'offers' as const },
  ];

  return (
    <header ref={navRef} id="app-navbar" className="fixed top-0 left-0 right-0 z-50 w-full bg-white shadow-md border-b border-[#E2E8F0]">
      
      {/* 1. TOP UTILITY HEADER BAR (Dark Navy matching exact reference image) */}
      <div className="bg-[#0A182E] text-slate-200 text-xs py-2 px-3 sm:px-4 lg:px-6 border-b border-slate-800/80 hidden sm:block">
        <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Top Bar Left: Key Trust Factors */}
          <div className="flex items-center gap-3 lg:gap-5 text-[11px] lg:text-[12px] font-medium text-slate-300">
            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>{isRtl ? 'بہترین قیمت کی ضمانت' : 'Best Price Guarantee'}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-700"></div>
            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-white" />
              <span>{isRtl ? 'اکثر بکنگز پر مفت منسوخی' : 'Free cancellation on most bookings'}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-700"></div>
            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer" onClick={() => setView('support')}>
              <Headset className="w-3.5 h-3.5 text-white" />
              <span>{isRtl ? '24/7 سپورٹ - ہم ہمیشہ یہاں ہیں' : "24/7 Support – We're always here"}</span>
            </div>
          </div>

          {/* Top Bar Right: Utility Links & Account Controls */}
          <div className="flex items-center gap-3 lg:gap-4 text-[11px] lg:text-[12px] font-semibold text-slate-200">
            
            {/* Download App */}
            <button 
              onClick={() => setView('support')} 
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              <span>{isRtl ? 'ایپ ڈاؤن لوڈ کریں' : 'Download App'}</span>
            </button>

            {/* Currency Selector */}
            <div className="relative">
              <button
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer px-1 py-0.5 rounded"
              >
                <span>{currency}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {showCurrencyDropdown && (
                <div className="absolute right-0 mt-1 w-24 bg-[#0A182E] border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-left">
                  <button 
                    onClick={() => { setCurrency('PKR'); setShowCurrencyDropdown(false); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-slate-200"
                  >
                    PKR (₨)
                  </button>
                  <button 
                    onClick={() => { setCurrency('USD'); setShowCurrencyDropdown(false); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-slate-200"
                  >
                    USD ($)
                  </button>
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer px-1 py-0.5 rounded"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'en' ? 'English' : 'اردو'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {showLangDropdown && (
                <div className="absolute right-0 mt-1 w-28 bg-[#0A182E] border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-left">
                  <button 
                    onClick={() => { requestLanguageChange('en'); setShowLangDropdown(false); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-slate-200"
                  >
                    English
                  </button>
                  <button 
                    onClick={() => { requestLanguageChange('ur'); setShowLangDropdown(false); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-xs text-slate-200 font-bold"
                  >
                    اردو (Urdu)
                  </button>
                </div>
              )}
            </div>

            {/* Wishlist */}
            <button 
              onClick={() => setView('user-dashboard')} 
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-white" />
              <span>{isRtl ? 'خواہشات کی فہرست' : 'Wishlist'}</span>
            </button>

            {/* Sign In & Register */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('user-dashboard')}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#00A651]" />
                  <span className="max-w-[100px] truncate">{displayName}</span>
                </button>
                <button
                  onClick={onSignOut}
                  className="text-xs text-rose-400 hover:text-rose-300 ml-1"
                >
                  {isRtl ? 'خروج' : 'Sign Out'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-1">
                <button
                  onClick={() => onOpenAuthModal('signin')}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-300" />
                  <span>{isRtl ? 'سائن ان' : 'Sign In'}</span>
                </button>

                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="bg-[#00A651] hover:bg-[#008E45] text-white text-xs font-bold px-3 py-1 rounded transition-all shadow-xs cursor-pointer"
                >
                  {isRtl ? 'رجسٹر کریں' : 'Register'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION BAR */}
      <div 
        className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 h-14 sm:h-18 flex items-center justify-between gap-1.5 sm:gap-2 lg:gap-3 relative"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}
        onMouseLeave={handleNavLeave}
      >
        
        {/* Left Side: Dynamic Mobile Header (Back Button on subpages, Logo on Home) + Desktop Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Subpage Back Button for Mobile */}
          {currentView !== 'hotels' && currentView !== 'homestays' ? (
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                id="btn-mobile-back"
                aria-label="Go back"
                onClick={() => {
                  if (currentView === 'checkout') setView('details');
                  else if (currentView === 'details') setView('search');
                  else setView('hotels');
                }}
                className="w-10 h-10 -ml-1 rounded-xl flex items-center justify-center text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer app-tap"
              >
                <ArrowLeft className="w-5 h-5 text-slate-800 stroke-[2.5]" />
              </button>
              <span className="font-extrabold text-sm text-slate-900 truncate max-w-[170px] sm:max-w-[240px]">
                {currentView === 'cars' ? (isRtl ? 'گاڑیاں اور جیپیں' : '4x4 Jeeps & Cars') :
                 currentView === 'tours' ? (isRtl ? 'ٹورز اور ٹریکس' : 'Expeditions & Tours') :
                 currentView === 'explore' ? (isRtl ? 'دریافت کریں' : 'Explore GB') :
                 currentView === 'destinations' ? (isRtl ? 'مقامات' : 'Top Destinations') :
                 currentView === 'offers' ? (isRtl ? 'خصوصی آفرز' : 'Special Deals') :
                 currentView === 'ai-planner' ? (isRtl ? 'اے آئی ٹرپ' : 'AI Trip Planner') :
                 currentView === 'user-dashboard' ? (isRtl ? 'میرا اکاؤنٹ' : 'My Bookings') :
                 currentView === 'vendor-dashboard' ? (isRtl ? 'ہوسٹ پورٹل' : 'Host Portal') :
                 currentView === 'support' ? (isRtl ? 'ہیلپ سینٹر' : 'Help & Support') :
                 currentView === 'search' ? (isRtl ? 'تلاش' : 'Search Results') :
                 currentView === 'details' ? (isRtl ? 'تفصیلات' : 'Listing') :
                 currentView === 'checkout' ? (isRtl ? 'چیک آؤٹ' : 'Checkout') : 'GBBookings'}
              </span>
            </div>
          ) : (
            <button
              type="button"
              id="btn-navbar-mobile-toggle"
              aria-label="Toggle mobile menu"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="lg:hidden w-10 h-10 -ml-1 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer app-tap"
            >
              {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
          
          <div 
            onClick={() => { setView('explore'); setMobileDrawerOpen(false); }} 
            className={`flex items-center cursor-pointer group shrink-0 pr-1 lg:pr-2 ${currentView !== 'hotels' && currentView !== 'homestays' ? 'hidden lg:flex' : 'flex'}`}
            id="nav-logo"
          >
            <GBLogo size="md" />
          </div>
        </div>

        {/* Center: Desktop Navigation Items */}
        <nav className="hidden lg:flex items-center gap-0.5 lg:gap-1 xl:gap-2 text-[12px] lg:text-[13px] xl:text-[14px] font-semibold text-slate-800 shrink-0" id="nav-desktop-links">
          {navItems.map((item) => {
            const isActive = currentView === item.id || 
              (item.id === 'hotels' && (currentView === 'hotels' || currentView === 'browse-hotels')) ||
              (item.id === 'homestays' && (currentView === 'homestays' || currentView === 'browse-homestays')) ||
              (item.id === 'cars' && (currentView === 'cars' || currentView === 'browse-cars')) ||
              (item.id === 'tours' && (currentView === 'tours' || currentView === 'browse-tours')) ||
              (item.id === 'destinations' && (currentView === 'destinations' || currentView === 'browse-destinations')) ||
              (item.id === 'offers' && (currentView === 'offers' || currentView === 'browse-offers'));

            return (
              <div 
                key={item.id} 
                className="relative py-4"
                onMouseEnter={() => item.mega && handleNavHover(item.mega)}
              >
                <button
                  id={`nav-link-${item.id}`}
                  onClick={() => handleLinkClick(item.id)}
                  className={`flex items-center gap-1 xl:gap-1.5 transition-all duration-150 font-bold cursor-pointer relative whitespace-nowrap py-1 px-1 lg:px-1.5 xl:px-2 ${
                    isActive ? 'text-[#00A651] border-b-2 border-[#00A651]' : 'text-slate-800 hover:text-[#00A651]'
                  }`}
                >
                  {item.icon && <item.icon className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0 text-[#00A651]" />}
                  <span>{item.label}</span>
                  {item.isHot && (
                    <span className="bg-[#FF3B30] text-white text-[8px] xl:text-[9px] font-black px-1 xl:px-1.5 py-0.2 rounded-md uppercase tracking-tight shadow-xs ml-0.5">
                      HOT
                    </span>
                  )}
                </button>
              </div>
            );
          })}

          {/* More Dropdown */}
          <div className="relative py-4" onMouseEnter={() => setShowMoreMenu(true)} onMouseLeave={() => setShowMoreMenu(false)}>
            <button
              id="nav-link-more"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex items-center gap-1 font-bold text-slate-800 hover:text-[#00A651] py-1 px-1 lg:px-1.5 xl:px-2 cursor-pointer whitespace-nowrap"
            >
              <span>{isRtl ? 'مزید' : 'More'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            </button>

            {showMoreMenu && (
              <div className="absolute left-0 mt-0 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fadeIn" id="nav-more-dropdown">
                <button
                  onClick={() => setView('user-dashboard')}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-[#00A651] flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{t('nav.user_dashboard')}</span>
                </button>
                <button
                  onClick={() => setView('vendor-dashboard')}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-[#00A651] flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#00A651]" />
                  <span>{t('nav.vendor_dashboard')}</span>
                </button>
                <button
                  onClick={() => setView('support')}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-[#00A651] flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-slate-500" />
                  <span>{t('nav.support')}</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0 ml-auto" id="nav-actions">
          
          {/* AI Planner Button (Tablet/Desktop Only) */}
          <button
            onClick={() => setView('ai-planner')}
            className="hidden md:flex items-center gap-1 xl:gap-1.5 border border-[#00A651]/50 hover:border-[#00A651] text-[#00A651] hover:bg-[#00A651]/5 text-xs font-extrabold px-2.5 lg:px-3 xl:px-3.5 py-2 xl:py-2.5 rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0 min-h-[40px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00A651]" />
            <span>AI Planner</span>
          </button>

          {/* List Your Property Button */}
          <button
            onClick={() => { setView('vendor-dashboard'); setMobileDrawerOpen(false); }}
            className="bg-[#00A651] hover:bg-[#008E45] text-white text-xs font-extrabold px-2.5 sm:px-3 xl:px-4 py-1.5 sm:py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1 lg:gap-1.5 cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] sm:min-h-[40px]"
            title="List Your Property / Become a Host"
          >
            <Building2 className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
            <span className="hidden sm:inline">List Property</span>
            <span className="inline sm:hidden">Host</span>
          </button>

          {/* User Account Button (Mobile Only) */}
          {isLoggedIn ? (
            <button
              onClick={() => { setView('user-dashboard'); setMobileDrawerOpen(false); }}
              className="lg:hidden w-9 h-9 min-w-[36px] sm:w-10 sm:h-10 rounded-xl bg-[#0A182E] text-white font-black text-xs flex items-center justify-center shadow-xs cursor-pointer shrink-0"
              title="My Dashboard"
            >
              {userInitials}
            </button>
          ) : (
            <button
              onClick={() => onOpenAuthModal('signin')}
              className="lg:hidden w-9 h-9 min-w-[36px] sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer shrink-0"
              title="Sign In"
            >
              <User className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* 3. MEGA MENU DROPDOWN (1:1 Exact Match with Uploaded Screenshots for Hotels & Tours) */}
      <AnimatePresence>
        {showMegaMenu && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 w-full bg-white border-b border-slate-300 shadow-2xl z-40"
            onMouseEnter={() => {
              if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
              setShowMegaMenu(true);
            }}
            onMouseLeave={handleNavLeave}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-6">
              
              {/* HOMESTAYS MEGA MENU (1:1 Exact Match with Reference Screenshot) */}
              {activeMegaTab === 'homestays' ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-12 gap-5 items-start">
                    
                    {/* Column 1: EXPLORE HOMESTAYS BY DESTINATION */}
                    <div className="col-span-3 text-left">
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                        EXPLORE HOMESTAYS BY DESTINATION
                      </h4>
                      <ul className="space-y-1 text-[12px] font-semibold text-slate-700">
                        {[
                          'Homestays in Skardu', 'Homestays in Hunza', 'Homestays in Gilgit', 
                          'Homestays in Shigar', 'Homestays in Khaplu', 'Homestays in Astore', 
                          'Homestays in Nagar', 'Homestays in Ghizer'
                        ].map((item) => (
                          <li key={item}>
                            <button
                              onClick={() => { setView('homestays'); setShowMegaMenu(false); }}
                              className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{item}</span>
                            </button>
                          </li>
                        ))}
                        <li className="pt-1 border-t border-slate-100">
                          <button
                            onClick={() => { setView('homestays'); setShowMegaMenu(false); }}
                            className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1.5 cursor-pointer"
                          >
                            <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                            <span>All Homestays</span>
                          </button>
                        </li>
                      </ul>
                    </div>

                    {/* Column 2: BROWSE HOMESTAYS BY TYPE */}
                    <div className="col-span-3 text-left">
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                        BROWSE HOMESTAYS BY TYPE
                      </h4>
                      <ul className="space-y-1 text-[12px] font-semibold text-slate-700">
                        {[
                          { name: 'Entire Homes', icon: Home },
                          { name: 'Private Rooms', icon: Key },
                          { name: 'Shared Rooms', icon: Users },
                          { name: 'Family Friendly', icon: Users },
                          { name: 'Couple Friendly', icon: Heart },
                          { name: 'Pet Friendly', icon: Dog },
                          { name: 'Luxury Homestays', icon: Crown },
                          { name: 'Budget Homestays', icon: Percent },
                          { name: 'Traditional Homes', icon: Building },
                          { name: 'Wooden Cabins', icon: Trees },
                          { name: 'Farm Stays', icon: Sun },
                        ].map((item) => (
                          <li key={item.name}>
                            <button
                              onClick={() => { setView('homestays'); setShowMegaMenu(false); }}
                              className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <item.icon className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Column 3: POPULAR AMENITIES */}
                    <div className="col-span-2 text-left">
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                        POPULAR AMENITIES
                      </h4>
                      <ul className="space-y-1 text-[12px] font-semibold text-slate-700">
                        {[
                          { name: 'Free WiFi', icon: Wifi },
                          { name: 'Breakfast Included', icon: Coffee },
                          { name: 'Mountain View', icon: Mountain },
                          { name: 'Heating', icon: Snowflake },
                          { name: 'Parking', icon: Car },
                          { name: 'Kitchen', icon: Utensils },
                          { name: 'Bonfire', icon: Flame },
                          { name: '24/7 Power Backup', icon: Zap },
                          { name: 'Hot Water', icon: Waves },
                        ].map((item) => (
                          <li key={item.name}>
                            <button
                              onClick={() => { setView('homestays'); setShowMegaMenu(false); }}
                              className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <item.icon className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Column 4: POPULAR AREAS */}
                    <div className="col-span-2 text-left">
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                        POPULAR AREAS
                      </h4>
                      <ul className="space-y-1 text-[12px] font-semibold text-slate-700">
                        {[
                          'Near Kachura Lake', 'Upper Kachura', 'Lower Kachura', 'Skardu City',
                          'Shigar Valley', 'Hussaini', 'Passu', 'Altit', 'Duikar'
                        ].map((area) => (
                          <li key={area}>
                            <button
                              onClick={() => { setView('homestays'); setShowMegaMenu(false); }}
                              className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{area}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Column 5: RIGHT BANNER CARD ("Become a Homestay Host") */}
                    <div className="col-span-2 text-left">
                      <div className="bg-[#071728] rounded-2xl p-4 text-white relative overflow-hidden shadow-lg flex flex-col justify-between h-full min-h-[260px]">
                        <div className="relative z-10 space-y-2">
                          <h5 className="text-base font-extrabold text-white leading-tight">Become a Homestay Host</h5>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            List your homestay and start welcoming travelers.
                          </p>
                        </div>

                        <button
                          onClick={() => { setView('vendor-dashboard'); setShowMegaMenu(false); }}
                          className="relative z-10 bg-[#00A651] hover:bg-[#008E45] text-white text-xs font-bold px-3 py-2 rounded-xl inline-flex items-center justify-center gap-1.5 w-full transition-all cursor-pointer mt-4 shadow-md"
                        >
                          <span>List Your Homestay</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Background image of cozy wooden homestay cabin in mountains */}
                        <img 
                          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80"
                          alt="Wooden cabin homestay in mountains"
                          className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Bottom Trust Pillars Row */}
                  <div className="pt-4 mt-2 border-t border-slate-100 grid grid-cols-4 gap-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#00A651] flex items-center justify-center shrink-0 border border-emerald-100">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h6 className="text-[12px] font-bold text-slate-900 leading-tight">Verified Homestays</h6>
                        <p className="text-[10px] text-slate-500">All homestays are verified for your safety</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#00A651] flex items-center justify-center shrink-0 border border-emerald-100">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h6 className="text-[12px] font-bold text-slate-900 leading-tight">Secure Booking</h6>
                        <p className="text-[10px] text-slate-500">Your data and payments are always safe</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#00A651] flex items-center justify-center shrink-0 border border-emerald-100">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <h6 className="text-[12px] font-bold text-slate-900 leading-tight">Best Price Guarantee</h6>
                        <p className="text-[10px] text-slate-500">Get the best prices with no hidden fees</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#00A651] flex items-center justify-center shrink-0 border border-emerald-100">
                        <Headset className="w-4 h-4" />
                      </div>
                      <div>
                        <h6 className="text-[12px] font-bold text-slate-900 leading-tight">24/7 Support</h6>
                        <p className="text-[10px] text-slate-500">We're always here to help you</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeMegaTab === 'cars' ? (
                <div className="grid grid-cols-12 gap-4 items-start">
                  
                  {/* Left Column 1: EXPLORE BY CITY / DESTINATION */}
                  <div className="col-span-2 text-left border-r border-slate-100 pr-3">
                    <button
                      onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                      className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between w-full hover:text-[#00A651] transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#00A651]" />
                        <span>Explore by city / destination</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <ul className="space-y-1.5 text-[12px] font-semibold text-slate-700">
                      {[
                        'Skardu', 'Hunza Valley', 'Gilgit', 'Shigar Valley', 
                        'Khaplu', 'Astore Valley', 'Naltar Valley', 'Deosai Plains'
                      ].map((loc) => (
                        <li key={loc}>
                          <button
                            onClick={() => { setView('cars'); setShowMegaMenu(false); }}
                            className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span className="text-slate-600 hover:text-[#00A651]">{loc}</span>
                          </button>
                        </li>
                      ))}
                      <li className="pt-1.5 border-t border-slate-100">
                        <button
                          onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1.5 cursor-pointer"
                        >
                          <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                          <span>All Destinations</span>
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Middle Section: 5 Columns for Cars (col-span-8 grid-cols-5) */}
                  <div className="col-span-8 grid grid-cols-5 gap-3 text-left">
                    
                    {/* Col 1: EXPLORE CARS BY CITY */}
                    <div>
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                        EXPLORE CARS BY CITY
                      </h4>
                      <ul className="space-y-1 text-[12px] font-semibold text-slate-700">
                        {[
                          'Cars in Skardu', 'Cars in Hunza', 'Cars in Gilgit', 'Cars in Shigar',
                          'Cars in Khaplu', 'Cars in Astore', 'Cars in Ghizer', 'Cars in Chilas',
                          'Airport Pickup & Drop'
                        ].map((item) => (
                          <li key={item}>
                            <button
                              onClick={() => { setView('cars'); setShowMegaMenu(false); }}
                              className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{item}</span>
                            </button>
                          </li>
                        ))}
                        <li className="pt-1 border-t border-slate-100">
                          <button
                            onClick={() => { setView('cars'); setShowMegaMenu(false); }}
                            className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1.5 cursor-pointer"
                          >
                            <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                            <span>All Cities</span>
                          </button>
                        </li>
                      </ul>
                    </div>

                    {/* Col 2: BROWSE CARS BY TYPE */}
                    <div>
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                        BROWSE CARS BY TYPE
                      </h4>
                      <ul className="space-y-1 text-[12px] font-semibold text-slate-700">
                        {[
                          { name: 'SUVs', icon: Car },
                          { name: 'Vans', icon: Users },
                          { name: '7 Seater', icon: Users },
                          { name: 'Luxury Cars', icon: Crown },
                          { name: 'Economy Cars', icon: Car },
                          { name: 'Sedan Cars', icon: Car },
                          { name: 'Hatchback Cars', icon: Car },
                          { name: '4x4 Jeeps', icon: Mountain },
                          { name: 'Convertibles', icon: Sun },
                          { name: 'Camping Vehicles', icon: Home },
                        ].map((item) => (
                          <li key={item.name}>
                            <button
                              onClick={() => { setView('cars'); setShowMegaMenu(false); }}
                              className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <item.icon className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Col 3: POPULAR BRANDS */}
                    <div>
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                        POPULAR BRANDS
                      </h4>
                      <ul className="space-y-1 text-[12px] font-semibold text-slate-700">
                        {[
                          'Toyota', 'Nissan', 'Honda', 'Suzuki', 'Mitsubishi',
                          'Hyundai', 'KIA', 'Land Rover', 'MG', 'BMW'
                        ].map((brand) => (
                          <li key={brand}>
                            <button
                              onClick={() => { setView('cars'); setShowMegaMenu(false); }}
                              className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <CarBrandLogo brand={brand} />
                              <span className="truncate">{brand}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Col 4: CAR RENTAL & OPTIONS */}
                    <div>
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                        CAR RENTAL & OPTIONS
                      </h4>
                      <ul className="space-y-1 text-[12px] font-semibold text-slate-700">
                        {[
                          { name: 'Self Drive Cars', icon: Key },
                          { name: 'With Driver', icon: User },
                          { name: 'Without Driver', icon: Key },
                          { name: 'Long Term Rentals', icon: Clock },
                          { name: 'Airport Transfers', icon: Plane },
                          { name: 'Hourly Rentals', icon: Clock },
                          { name: 'One Way Rentals', icon: ArrowRight },
                          { name: 'Outstation Rentals', icon: Compass },
                          { name: 'Corporate Rentals', icon: Briefcase },
                          { name: 'Wedding Cars', icon: Heart },
                        ].map((item) => (
                          <li key={item.name}>
                            <button
                              onClick={() => { setView('cars'); setShowMegaMenu(false); }}
                              className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <item.icon className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Col 5: TOP VEHICLES */}
                    <div>
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                        TOP VEHICLES
                      </h4>
                      <div className="space-y-2">
                        {[
                          { name: 'Toyota Prado', img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Toyota Land Cruiser', img: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Toyota Fortuner', img: 'https://images.unsplash.com/photo-1606016159991-dfe4f974be5c?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Honda BR-V', img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Toyota Hiace', img: 'https://images.unsplash.com/photo-1520050206274-a1ae446cb3cc?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Suzuki Alto', img: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=300&q=80' },
                        ].map((car) => (
                          <div 
                            key={car.name}
                            onClick={() => { setView('cars'); setShowMegaMenu(false); }}
                            className="flex items-center gap-2.5 cursor-pointer group hover:bg-emerald-50/60 p-1 rounded-lg transition-all"
                          >
                            <img 
                              src={car.img} 
                              alt={car.name} 
                              referrerPolicy="no-referrer"
                              onError={handleImageError}
                              className="w-12 h-9 object-cover rounded-md shrink-0 border border-slate-200/90 shadow-2xs group-hover:border-[#00A651]/40 transition-colors" 
                            />
                            <h5 className="text-[11px] font-bold text-slate-900 group-hover:text-[#00A651] truncate">{car.name}</h5>
                          </div>
                        ))}
                        <div className="pt-1">
                          <button
                            onClick={() => { setView('cars'); setShowMegaMenu(false); }}
                            className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1 cursor-pointer"
                          >
                            <span>View All Cars</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column Banner Card: RENT THE PERFECT CAR */}
                  <div className="col-span-2 text-left">
                    <div className="bg-[#071728] rounded-2xl p-4 text-white relative overflow-hidden shadow-lg flex flex-col justify-between h-full min-h-[260px]">
                      <div className="relative z-10 space-y-2">
                        <h5 className="text-base font-extrabold text-white leading-tight">Rent the Perfect Car</h5>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Choose from a wide range of cars for every journey and adventure.
                        </p>
                      </div>

                      <button
                        onClick={() => { setView('vendor-dashboard'); setShowMegaMenu(false); }}
                        className="relative z-10 bg-[#00A651] hover:bg-[#008E45] text-white text-xs font-bold px-3 py-2 rounded-xl inline-flex items-center justify-center gap-1.5 w-full transition-all cursor-pointer mt-4 shadow-md"
                      >
                        <span>List Your Car</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Background image of Prado / SUV driving on mountain road */}
                      <img 
                        src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=500&q=80"
                        alt="SUV driving in mountains"
                        className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
                      />
                    </div>
                  </div>

                </div>
              ) : activeMegaTab === 'offers' ? (
                <div className="grid grid-cols-12 gap-5 items-start">
                  
                  {/* Column 1: FEATURED DEALS */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-[#00A651]" />
                      <span>Featured Deals</span>
                    </h4>
                    <div className="space-y-3">
                      {[
                        { title: 'Hotel Deals', desc: 'Best hotel discounts', icon: Building2, view: 'hotels' },
                        { title: 'Homestay Deals', desc: 'Save on homestays', icon: Home, view: 'homestays' },
                        { title: 'Car Rental Deals', desc: 'Low prices on cars', icon: Car, view: 'cars' },
                        { title: 'Tour Package Deals', desc: 'Exclusive tour offers', icon: TourIcon, view: 'tours' },
                      ].map((item) => (
                        <div 
                          key={item.title}
                          onClick={() => { setView(item.view); setShowMegaMenu(false); }}
                          className="flex items-start gap-2.5 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-lg transition-all"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-[#00A651]/10 group-hover:text-[#00A651] transition-colors">
                            <item.icon className="w-4 h-4 text-slate-600 group-hover:text-[#00A651]" />
                          </div>
                          <div>
                            <h5 className="text-[12px] font-bold text-slate-900 group-hover:text-[#00A651] transition-colors">{item.title}</h5>
                            <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => { setView('offers'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1 cursor-pointer"
                        >
                          <span>View All Deals</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: SEASONAL OFFERS */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span>Seasonal Offers</span>
                    </h4>
                    <div className="space-y-3">
                      {[
                        { title: 'Summer Sale', desc: 'Up to 40% OFF', icon: Sun, view: 'offers' },
                        { title: 'Winter Sale', desc: 'Up to 40% OFF', icon: Snowflake, view: 'offers' },
                        { title: 'Eid Special', desc: 'Special discounts', icon: Moon, view: 'offers' },
                        { title: 'Honeymoon Deals', desc: 'For couples', icon: Heart, view: 'offers' },
                        { title: 'Family Deals', desc: 'Perfect for families', icon: Users, view: 'offers' },
                      ].map((item) => (
                        <div 
                          key={item.title}
                          onClick={() => { setView(item.view); setShowMegaMenu(false); }}
                          className="flex items-start gap-2.5 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-lg transition-all"
                        >
                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 font-bold group-hover:bg-[#00A651]/10 group-hover:text-[#00A651] transition-colors">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-[12px] font-bold text-slate-900 group-hover:text-[#00A651] transition-colors">{item.title}</h5>
                            <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => { setView('offers'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1 cursor-pointer"
                        >
                          <span>View All Seasonal Offers</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: PAYMENT OFFERS */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span>Payment Offers</span>
                    </h4>
                    <div className="space-y-3">
                      {[
                        { title: 'JazzCash Discount', desc: 'Exclusive savings', icon: Wallet, color: 'bg-red-50 text-red-600' },
                        { title: 'Easypaisa Discount', desc: 'Exclusive savings', icon: Wallet, color: 'bg-emerald-50 text-emerald-600' },
                        { title: 'Bank Card Offers', desc: 'Save with cards', icon: CreditCard, color: 'bg-blue-50 text-blue-600' },
                        { title: 'Promo Codes', desc: 'Use code & save more', icon: Percent, color: 'bg-purple-50 text-purple-600' },
                      ].map((item) => (
                        <div 
                          key={item.title}
                          onClick={() => { setView('offers'); setShowMegaMenu(false); }}
                          className="flex items-start gap-2.5 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-lg transition-all"
                        >
                          <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center shrink-0 font-bold`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-[12px] font-bold text-slate-900 group-hover:text-[#00A651] transition-colors">{item.title}</h5>
                            <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => { setView('offers'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1 cursor-pointer"
                        >
                          <span>View All Payment Offers</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 4: MEMBER BENEFITS */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>Member Benefits</span>
                    </h4>
                    <div className="space-y-3">
                      {[
                        { title: 'Login & Save', desc: 'Extra member discounts', icon: User },
                        { title: 'Referral Rewards', desc: 'Invite & earn', icon: Gift },
                        { title: 'Loyalty Points', desc: 'Earn points & save', icon: Award },
                        { title: 'First Booking Discount', desc: 'Special for new users', icon: Percent },
                      ].map((item) => (
                        <div 
                          key={item.title}
                          onClick={() => { setView('offers'); setShowMegaMenu(false); }}
                          className="flex items-start gap-2.5 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-lg transition-all"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold group-hover:bg-[#00A651]/10 group-hover:text-[#00A651] transition-colors">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-[12px] font-bold text-slate-900 group-hover:text-[#00A651] transition-colors">{item.title}</h5>
                            <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => { setView('offers'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1 cursor-pointer"
                        >
                          <span>View All Benefits</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 5: LAST MINUTE */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>Last Minute</span>
                    </h4>
                    <div className="space-y-3">
                      {[
                        { title: 'Flash Deals', desc: 'Limited time offers', icon: Zap },
                        { title: 'Weekend Deals', desc: 'Best weekend offers', icon: Calendar },
                        { title: 'Last Minute Getaways', desc: 'Plan spontaneous trips', icon: TourIcon },
                        { title: 'Early Bird Offers', desc: 'Book early & save more', icon: Heart },
                      ].map((item) => (
                        <div 
                          key={item.title}
                          onClick={() => { setView('offers'); setShowMegaMenu(false); }}
                          className="flex items-start gap-2.5 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-lg transition-all"
                        >
                          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold group-hover:bg-[#00A651]/10 group-hover:text-[#00A651] transition-colors">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-[12px] font-bold text-slate-900 group-hover:text-[#00A651] transition-colors">{item.title}</h5>
                            <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => { setView('offers'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1 cursor-pointer"
                        >
                          <span>View All Offers</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 6: RIGHT BANNER CARD FOR OFFERS */}
                  <div className="col-span-2 text-left">
                    <div className="bg-gradient-to-br from-emerald-50 via-sky-50 to-blue-100 rounded-2xl p-4 text-slate-900 relative overflow-hidden border border-emerald-200/80 shadow-md flex flex-col justify-between min-h-[280px]">
                      
                      <div className="relative z-10 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block mb-1">
                          LIMITED TIME ONLY
                        </span>
                        <p className="text-xs font-semibold text-slate-600">Up to</p>
                        <h5 className="text-3xl font-black text-[#00A651] tracking-tight leading-none">
                          40% <span className="text-xl font-extrabold text-slate-800">OFF</span>
                        </h5>

                        <ul className="pt-3 space-y-1.5 text-[11px] font-bold text-slate-700">
                          <li className="flex items-center gap-2 hover:text-[#00A651] cursor-pointer" onClick={() => { setView('hotels'); setShowMegaMenu(false); }}>
                            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Hotels</span>
                          </li>
                          <li className="flex items-center gap-2 hover:text-[#00A651] cursor-pointer" onClick={() => { setView('tours'); setShowMegaMenu(false); }}>
                            <TourIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tours & Packages</span>
                          </li>
                          <li className="flex items-center gap-2 hover:text-[#00A651] cursor-pointer" onClick={() => { setView('cars'); setShowMegaMenu(false); }}>
                            <Car className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Cars</span>
                          </li>
                          <li className="flex items-center gap-2 hover:text-[#00A651] cursor-pointer" onClick={() => { setView('homestays'); setShowMegaMenu(false); }}>
                            <Home className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Homestays</span>
                          </li>
                        </ul>
                      </div>

                      <div className="relative z-10 pt-4">
                        <button
                          onClick={() => { setView('offers'); setShowMegaMenu(false); }}
                          className="bg-[#00A651] hover:bg-[#008E45] text-white text-xs font-extrabold px-3 py-2 rounded-xl inline-flex items-center justify-center gap-1.5 w-full transition-all shadow-md cursor-pointer"
                        >
                          <span>Explore All Offers</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* 3D Gift Box illustration at bottom */}
                      <div className="absolute -bottom-2 -right-2 w-20 h-20 opacity-80 pointer-events-none">
                        <img 
                          src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=150&q=80" 
                          alt="Special gift deal" 
                          className="w-full h-full object-cover rounded-xl shadow-lg border border-white"
                        />
                      </div>

                    </div>
                  </div>

                </div>
              ) : activeMegaTab === 'destinations' ? (
                <div className="grid grid-cols-12 gap-5 items-start">
                  
                  {/* Column 1: EXPLORE BY REGION */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                      EXPLORE BY REGION
                    </h4>
                    <ul className="space-y-1.5 text-[12px] font-semibold text-slate-700">
                      {[
                        'Skardu', 'Hunza Valley', 'Gilgit', 'Diamer', 'Astore Valley', 
                        'Shigar Valley', 'Khaplu Valley', 'Ghizer Valley', 'Nagar Valley'
                      ].map((region) => (
                        <li key={region}>
                          <button
                            onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                            className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{region}</span>
                          </button>
                        </li>
                      ))}
                      <li className="pt-1.5 border-t border-slate-100">
                        <button
                          onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1.5 cursor-pointer"
                        >
                          <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                          <span>All Regions</span>
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Column 2: TOP DESTINATIONS */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                      TOP DESTINATIONS
                    </h4>
                    <div className="space-y-2.5">
                      {[
                        { name: 'Skardu', sub: 'Satpara, Skardu', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=120&q=80' },
                        { name: 'Hunza Valley', sub: 'Karimabad, Hunza', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=120&q=80' },
                        { name: 'Attabad Lake', sub: 'Hunza', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=120&q=80' },
                        { name: 'Basho Valley', sub: 'Skardu', img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=120&q=80' },
                        { name: 'Deosai Plains', sub: 'Skardu', img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=120&q=80' },
                        { name: 'Fairy Meadows', sub: 'Diamer', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=120&q=80' },
                      ].map((dest) => (
                        <div 
                          key={dest.name}
                          onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                          className="flex items-center gap-2.5 cursor-pointer group hover:bg-slate-50 p-1 rounded-lg transition-all"
                        >
                          <img 
                            src={dest.img} 
                            alt={dest.name} 
                            className="w-12 h-10 object-cover rounded-md shrink-0 border border-slate-200" 
                          />
                          <div className="overflow-hidden">
                            <h5 className="text-[12px] font-bold text-slate-900 group-hover:text-[#00A651] truncate">{dest.name}</h5>
                            <p className="text-[10px] text-slate-500 truncate">{dest.sub}</p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1">
                        <button
                          onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1 cursor-pointer"
                        >
                          <span>View All Destinations</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: EXPLORE BY THEME */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                      EXPLORE BY THEME
                    </h4>
                    <ul className="space-y-1.5 text-[12px] font-semibold text-slate-700">
                      {[
                        { name: 'Lakes & Waterfalls', icon: Waves },
                        { name: 'Mountains & Peaks', icon: Mountain },
                        { name: 'Valleys', icon: Trees },
                        { name: 'Historic Places', icon: Landmark },
                        { name: 'Adventure Spots', icon: TourIcon },
                        { name: 'Religious Sites', icon: Sparkles },
                        { name: 'Glaciers', icon: Snowflake },
                        { name: 'Deserts', icon: Sun },
                        { name: 'National Parks', icon: Trees },
                      ].map((theme) => (
                        <li key={theme.name}>
                          <button
                            onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                            className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <theme.icon className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{theme.name}</span>
                          </button>
                        </li>
                      ))}
                      <li className="pt-1.5 border-t border-slate-100">
                        <button
                          onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>View All Themes</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Column 4: POPULAR ATTRACTIONS */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                      POPULAR ATTRACTIONS
                    </h4>
                    <div className="space-y-2.5">
                      {[
                        { name: 'Passu Cones', sub: 'Hunza', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=120&q=80' },
                        { name: 'Hussaini Suspension Bridge', sub: 'Hunza', img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=120&q=80' },
                        { name: 'Khunjerab Pass', sub: 'Hunza', img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=120&q=80' },
                        { name: 'Shigar Fort', sub: 'Shigar', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=120&q=80' },
                        { name: 'Baltit Fort', sub: 'Hunza', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=120&q=80' },
                        { name: 'Naltar Valley', sub: 'Gilgit', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=120&q=80' },
                      ].map((item) => (
                        <div 
                          key={item.name}
                          onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                          className="flex items-center gap-2.5 cursor-pointer group hover:bg-slate-50 p-1 rounded-lg transition-all"
                        >
                          <img 
                            src={item.img} 
                            alt={item.name} 
                            className="w-12 h-10 object-cover rounded-md shrink-0 border border-slate-200" 
                          />
                          <div className="overflow-hidden">
                            <h5 className="text-[12px] font-bold text-slate-900 group-hover:text-[#00A651] truncate">{item.name}</h5>
                            <p className="text-[10px] text-slate-500 truncate">{item.sub}</p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1">
                        <button
                          onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1 cursor-pointer"
                        >
                          <span>View All Attractions</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 5: SEASONAL DESTINATIONS & AI PLANNER CARD */}
                  <div className="col-span-4 text-left grid grid-cols-2 gap-4 items-stretch">
                    
                    {/* Left: Seasonal Destinations */}
                    <div>
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                        SEASONAL DESTINATIONS
                      </h4>
                      <ul className="space-y-3 text-[12px] font-semibold text-slate-700">
                        <li>
                          <button 
                            onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                            className="w-full text-left hover:text-[#00A651] transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-1.5 font-bold text-amber-600 group-hover:text-[#00A651]">
                              <Sun className="w-3.5 h-3.5 shrink-0" />
                              <span>Summer Destinations</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal ml-5 block">(May – August)</span>
                          </button>
                        </li>
                        <li>
                          <button 
                            onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                            className="w-full text-left hover:text-[#00A651] transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-1.5 font-bold text-orange-600 group-hover:text-[#00A651]">
                              <Flame className="w-3.5 h-3.5 shrink-0" />
                              <span>Autumn Destinations</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal ml-5 block">(September – November)</span>
                          </button>
                        </li>
                        <li>
                          <button 
                            onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                            className="w-full text-left hover:text-[#00A651] transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-1.5 font-bold text-sky-600 group-hover:text-[#00A651]">
                              <Snowflake className="w-3.5 h-3.5 shrink-0" />
                              <span>Winter Destinations</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal ml-5 block">(December – February)</span>
                          </button>
                        </li>
                        <li>
                          <button 
                            onClick={() => { setView('destinations'); setShowMegaMenu(false); }}
                            className="w-full text-left hover:text-[#00A651] transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-1.5 font-bold text-rose-500 group-hover:text-[#00A651]">
                              <Flower2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Spring Destinations</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal ml-5 block">(March – April)</span>
                          </button>
                        </li>
                      </ul>
                    </div>

                    {/* Right Banner Card: AI Planner */}
                    <div className="bg-[#071728] rounded-2xl p-4 text-white relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[220px]">
                      <div className="relative z-10 space-y-1.5">
                        <h5 className="text-sm font-extrabold text-white leading-tight">
                          Not sure where to go?
                        </h5>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Let our AI Planner plan the perfect trip for you.
                        </p>
                      </div>

                      <button
                        onClick={() => { setView('ai-planner'); setShowMegaMenu(false); }}
                        className="relative z-10 bg-[#00A651] hover:bg-[#008E45] text-white text-xs font-extrabold px-3 py-2 rounded-xl inline-flex items-center justify-center gap-1.5 w-full transition-all shadow-md cursor-pointer mt-3"
                      >
                        <span>Plan My Trip</span>
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      {/* Background image of alpine lake & mountain cabin */}
                      <img 
                        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
                        alt="AI trip planner destination"
                        className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
                      />
                    </div>

                  </div>

                </div>
              ) : activeMegaTab === 'tours' ? (
                <div className="grid grid-cols-12 gap-5 items-start">
                  
                  {/* Column 1: EXPLORE TOURS BY REGION */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                      EXPLORE TOURS BY REGION
                    </h4>
                    <ul className="space-y-1.5 text-[12px] font-semibold text-slate-700">
                      {[
                        'Skardu Tours', 'Hunza Tours', 'Gilgit Tours', 'Astore Tours', 'Shigar Tours',
                        'Khaplu Tours', 'Naltar Tours', 'Fairy Meadows Tours', 'Nanga Parbat Tours', 'Khunjerab Pass Tours'
                      ].map((region) => (
                        <li key={region}>
                          <button
                            onClick={() => { setView('tours'); setShowMegaMenu(false); }}
                            className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{region}</span>
                          </button>
                        </li>
                      ))}
                      <li className="pt-1.5 border-t border-slate-100">
                        <button
                          onClick={() => { setView('tours'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1.5 cursor-pointer"
                        >
                          <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                          <span>All Tours</span>
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Column 2: TOUR PACKAGES BY DURATION */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                      TOUR PACKAGES BY DURATION
                    </h4>
                    <ul className="space-y-1.5 text-[12px] font-semibold text-slate-700">
                      {[
                        '1–2 Days Trips', '3 Days Packages', '4 Days Packages', '5 Days Packages',
                        '6 Days Packages', '7 Days Packages', '8–10 Days Packages', '10+ Days Packages'
                      ].map((duration) => (
                        <li key={duration}>
                          <button
                            onClick={() => { setView('tours'); setShowMegaMenu(false); }}
                            className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{duration}</span>
                          </button>
                        </li>
                      ))}
                      <li className="pt-2 border-t border-slate-100">
                        <button
                          onClick={() => { setView('tours'); setShowMegaMenu(false); }}
                          className="w-full text-left py-1 text-[12px] font-extrabold text-[#00A651] bg-[#00A651]/10 px-2 py-1 rounded-md hover:bg-[#00A651]/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#00A651] shrink-0" />
                          <span>Custom Tour (Tailor Made)</span>
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Column 3: TOUR TYPES */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                      TOUR TYPES
                    </h4>
                    <ul className="space-y-1.5 text-[12px] font-semibold text-slate-700">
                      {[
                        { name: 'Family Tours', icon: Users },
                        { name: 'Couple / Honeymoon Tours', icon: Heart },
                        { name: 'Adventure Tours', icon: TourIcon },
                        { name: 'Luxury Tours', icon: Crown },
                        { name: 'Group Tours', icon: Users },
                        { name: 'Student Tours', icon: Briefcase },
                        { name: 'Photography Tours', icon: Camera },
                        { name: 'Trekking Tours', icon: Mountain },
                        { name: 'Camping Tours', icon: Home },
                        { name: 'Jeep Safari Tours', icon: Car },
                        { name: 'Religious Tours', icon: Sparkles },
                      ].map((item) => (
                        <li key={item.name}>
                          <button
                            onClick={() => { setView('tours'); setShowMegaMenu(false); }}
                            className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <item.icon className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 4: POPULAR PACKAGES */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                      POPULAR PACKAGES
                    </h4>
                    <div className="space-y-2.5">
                      {[
                        { name: '3 Days Skardu Tour', sub: 'Skardu, Kachura, Shangrila', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=120&q=80' },
                        { name: '5 Days Hunza Tour', sub: 'Hunza, Passu, Attabad Lake', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=120&q=80' },
                        { name: '7 Days Skardu & Hunza', sub: 'Skardu, Deosai, Hunza, Attabad', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=120&q=80' },
                        { name: '8 Days Astore & Deosai', sub: 'Astore, Deosai Plains', img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=120&q=80' },
                        { name: '10 Days GB Explorer', sub: 'Skardu, Hunza, Khaplu, Gilgit', img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=120&q=80' },
                      ].map((pkg) => (
                        <div 
                          key={pkg.name}
                          onClick={() => { setView('tours'); setShowMegaMenu(false); }}
                          className="flex items-center gap-2.5 cursor-pointer group hover:bg-slate-50 p-1 rounded-lg transition-all"
                        >
                          <img 
                            src={pkg.img} 
                            alt={pkg.name} 
                            className="w-12 h-10 object-cover rounded-md shrink-0 border border-slate-200" 
                          />
                          <div className="overflow-hidden">
                            <h5 className="text-[12px] font-bold text-slate-900 group-hover:text-[#00A651] truncate">{pkg.name}</h5>
                            <p className="text-[10px] text-slate-500 truncate">{pkg.sub}</p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1">
                        <button
                          onClick={() => { setView('tours'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1 cursor-pointer"
                        >
                          <span>View All Packages</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 5: RIGHT BANNER CARD FOR TOURS */}
                  <div className="col-span-4 text-left">
                    <div className="bg-[#071728] rounded-2xl p-5 text-white relative overflow-hidden shadow-lg flex flex-col justify-between h-full min-h-[260px]">
                      <div className="relative z-10 space-y-2 max-w-xs">
                        <h5 className="text-lg font-extrabold text-white leading-tight">
                          Unforgettable Journeys
                          <br />
                          <span className="text-emerald-400">Memories for a Lifetime</span>
                        </h5>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Explore the most beautiful places in Gilgit Baltistan with our best tour packages.
                        </p>
                      </div>

                      <button
                        onClick={() => { setView('tours'); setShowMegaMenu(false); }}
                        className="relative z-10 bg-[#00A651] hover:bg-[#008E45] text-white text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 w-fit transition-all cursor-pointer mt-4 shadow-md"
                      >
                        <span>Explore Packages</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Background image of travelers hiking in mountains */}
                      <img 
                        src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=500&q=80"
                        alt="Tour travelers in Gilgit Baltistan"
                        className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
                      />
                    </div>
                  </div>

                </div>
              ) : (
                /* HOTELS & OTHER SERVICES MEGA MENU */
                <div className="grid grid-cols-12 gap-5 items-start">
                  
                  {/* Column 1: EXPLORE HOTELS BY CITY */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                      EXPLORE HOTELS BY CITY
                    </h4>
                    <ul className="space-y-1.5 text-[12px] font-semibold text-slate-700">
                      {[
                        'Skardu', 'Hunza', 'Gilgit', 'Shigar', 'Khaplu', 
                        'Astore', 'Nagar', 'Ghizer', 'Chilas', 'Naltar', 'Fairy Meadows'
                      ].map((city) => (
                        <li key={city}>
                          <button
                            onClick={() => { setView('hotels'); setShowMegaMenu(false); }}
                            className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Hotels in {city}</span>
                          </button>
                        </li>
                      ))}
                      <li className="pt-1.5 border-t border-slate-100">
                        <button
                          onClick={() => { setView('hotels'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1.5 cursor-pointer"
                        >
                          <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                          <span>All Hotels</span>
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Column 2: BROWSE HOTELS BY TYPE */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                      BROWSE HOTELS BY TYPE
                    </h4>
                    <ul className="space-y-1.5 text-[12px] font-semibold text-slate-700">
                      {[
                        { name: 'Luxury Hotels', icon: Crown },
                        { name: '5 Star Hotels', icon: Star },
                        { name: '4 Star Hotels', icon: Star },
                        { name: '3 Star Hotels', icon: Star },
                        { name: 'Budget Hotels', icon: Building },
                        { name: 'Boutique Hotels', icon: Building2 },
                        { name: 'Family Hotels', icon: Users },
                        { name: 'Couple Friendly Hotels', icon: Heart },
                        { name: 'Pet Friendly Hotels', icon: Dog },
                        { name: 'Business Hotels', icon: Briefcase },
                        { name: 'Resort Hotels', icon: Mountain },
                      ].map((item) => (
                        <li key={item.name}>
                          <button
                            onClick={() => { setView('hotels'); setShowMegaMenu(false); }}
                            className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <item.icon className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.name}</span>
                          </button>
                        </li>
                      ))}
                      <li className="pt-1.5 border-t border-slate-100">
                        <button
                          onClick={() => { setView('hotels'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1.5 cursor-pointer"
                        >
                          <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                          <span>All Hotel Types</span>
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Column 3: POPULAR AMENITIES */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                      POPULAR AMENITIES
                    </h4>
                    <ul className="space-y-1.5 text-[12px] font-semibold text-slate-700">
                      {[
                        { name: 'Free WiFi', icon: Wifi },
                        { name: 'Breakfast Included', icon: Coffee },
                        { name: 'Mountain View', icon: Mountain },
                        { name: 'Lake View', icon: Waves },
                        { name: 'Parking', icon: Car },
                        { name: 'Room Service', icon: Bell },
                        { name: 'Restaurant', icon: Utensils },
                        { name: 'Airport Transfer', icon: Plane },
                        { name: 'Air Conditioning', icon: Snowflake },
                        { name: 'Heating', icon: Flame },
                      ].map((item) => (
                        <li key={item.name}>
                          <button
                            onClick={() => { setView('hotels'); setShowMegaMenu(false); }}
                            className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <item.icon className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.name}</span>
                          </button>
                        </li>
                      ))}
                      <li className="pt-1.5 border-t border-slate-100">
                        <button
                          onClick={() => { setView('hotels'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1.5 cursor-pointer"
                        >
                          <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                          <span>All Amenities</span>
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Column 4: POPULAR AREAS */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                      POPULAR AREAS
                    </h4>
                    <ul className="space-y-1.5 text-[12px] font-semibold text-slate-700">
                      {[
                        'Upper Kachura', 'Lower Kachura', 'Skardu City', 'Shigar Valley', 
                        'Hunza Valley', 'Attabad Lake', 'Naltar Valley', 'Khaplu City', 
                        'Basho Valley', 'Deosai Plains'
                      ].map((area) => (
                        <li key={area}>
                          <button
                            onClick={() => { setView('hotels'); setShowMegaMenu(false); }}
                            className="w-full text-left py-0.5 hover:text-[#00A651] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{area}</span>
                          </button>
                        </li>
                      ))}
                      <li className="pt-2">
                        <button
                          onClick={() => { setView('hotels'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1 cursor-pointer"
                        >
                          <span>View All Areas</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Column 5: TOP PICKS */}
                  <div className="col-span-2 text-left">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                      TOP PICKS
                    </h4>
                    <div className="space-y-2.5">
                      {[
                        { name: 'Serena Skardu', rating: '4.8 Excellent', type: 'Luxury Hotel', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=120&q=80' },
                        { name: 'Shangrila Resort', rating: '4.7 Excellent', type: 'Resort Hotel', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=120&q=80' },
                        { name: 'Pearl Continental', rating: '4.6 Excellent', type: '5 Star Hotel', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=120&q=80' },
                        { name: 'PTDC Motel Skardu', rating: '4.4 Very Good', type: 'Budget Hotel', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=120&q=80' },
                      ].map((pick) => (
                        <div 
                          key={pick.name}
                          onClick={() => { setView('hotels'); setShowMegaMenu(false); }}
                          className="flex items-center gap-2.5 cursor-pointer group hover:bg-slate-50 p-1 rounded-lg transition-all"
                        >
                          <img 
                            src={pick.img} 
                            alt={pick.name} 
                            className="w-12 h-10 object-cover rounded-md shrink-0 border border-slate-200" 
                          />
                          <div className="overflow-hidden">
                            <h5 className="text-[12px] font-bold text-slate-900 group-hover:text-[#00A651] truncate">{pick.name}</h5>
                            <p className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                              <span>★</span>
                              <span>{pick.rating}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">{pick.type}</p>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1">
                        <button
                          onClick={() => { setView('hotels'); setShowMegaMenu(false); }}
                          className="text-[12px] font-bold text-slate-900 hover:text-[#00A651] flex items-center gap-1 cursor-pointer"
                        >
                          <span>View All Hotels</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 6: RIGHT BANNER CARD FOR HOTELS */}
                  <div className="col-span-2 text-left">
                    <div className="bg-[#071728] rounded-2xl p-4 text-white relative overflow-hidden shadow-lg flex flex-col justify-between h-full min-h-[260px]">
                      <div className="relative z-10 space-y-2">
                        <h5 className="text-base font-extrabold text-white leading-tight">List Your Hotel</h5>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Grow your business and reach thousands of travelers.
                        </p>
                      </div>

                      <button
                        onClick={() => { setView('vendor-dashboard'); setShowMegaMenu(false); }}
                        className="relative z-10 bg-[#00A651] hover:bg-[#008E45] text-white text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 w-fit transition-all cursor-pointer mt-4 shadow-md"
                      >
                        <span>List Your Hotel</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Background image of luxury hotel balcony */}
                      <img 
                        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80"
                        alt="Balcony hotel view"
                        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* BOTTOM TRUST PILLARS ROW (5 Cards with subtle borders matching screenshot) */}
              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-5 gap-3">
                
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-full bg-[#00A651]/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#00A651]" />
                  </div>
                  <div>
                    <h6 className="text-[11px] font-bold text-slate-900 leading-tight">Best Price Guarantee</h6>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Get the best prices with no hidden fees</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-full bg-[#00A651]/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-[#00A651]" />
                  </div>
                  <div>
                    <h6 className="text-[11px] font-bold text-slate-900 leading-tight">Free Cancellation</h6>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Cancel up to 24 hours before your trip</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-full bg-[#00A651]/10 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-[#00A651]" />
                  </div>
                  <div>
                    <h6 className="text-[11px] font-bold text-slate-900 leading-tight">Secure Booking</h6>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Your data and payments are always safe</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-full bg-[#00A651]/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-[#00A651]" />
                  </div>
                  <div>
                    <h6 className="text-[11px] font-bold text-slate-900 leading-tight">Trusted by Travelers</h6>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Thousands of happy travelers</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-full bg-[#00A651]/10 flex items-center justify-center shrink-0">
                    <Headset className="w-4 h-4 text-[#00A651]" />
                  </div>
                  <div>
                    <h6 className="text-[11px] font-bold text-slate-900 leading-tight">24/7 Support</h6>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">We're always here to help you</p>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MOBILE SCROLLABLE NAV */}
      <div className="lg:hidden border-t border-slate-200 bg-slate-50/90 px-3 sm:px-4 py-2 flex gap-2 items-center overflow-x-auto scrollbar-none" id="nav-mobile-scroll">
        {[
          { id: 'hotels', label: t('nav.hotels') || 'Hotels', icon: Building2 },
          { id: 'homestays', label: t('search.homestay_tab') || 'Homestays', icon: Home },
          { id: 'cars', label: t('nav.cars') || 'Cars', icon: Car },
          { id: 'tours', label: t('nav.tours') || 'Tours & Packages', icon: TourIcon },
          { id: 'destinations', label: 'Destinations', icon: MapPin },
          { id: 'offers', label: 'Offers', icon: Flame },
          { id: 'ai-planner', label: 'AI Planner', icon: Bot },
        ].map((item) => {
          const isCurrent = currentView === item.id;
          const buttonClass = isCurrent
            ? 'bg-[#00A651] text-white border-[#00A651] shadow-xs'
            : 'bg-white text-slate-700 border-slate-200 hover:text-[#00A651] hover:border-slate-300';

          return (
            <button
              key={item.id}
              onClick={() => handleLinkClick(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer min-h-[38px] ${buttonClass}`}
            >
              {item.icon && <item.icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. MOBILE FULL-SCREEN / SLIDE-IN NAVIGATION DRAWER */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: isRtl ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 260 }}
              className={`lg:hidden fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} w-[88%] max-w-[360px] bg-white z-50 shadow-2xl flex flex-col justify-between overflow-y-auto border-r border-slate-200`}
            >
              {/* Drawer Top Header with Brand & Close */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200/80 bg-white sticky top-0 z-10">
                <div 
                  onClick={() => { setView('explore'); setMobileDrawerOpen(false); }} 
                  className="flex items-center cursor-pointer"
                >
                  <GBLogo size="sm" />
                </div>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="p-4 space-y-5 flex-1">
                
                {/* Account Section */}
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-3">
                  {isLoggedIn ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00A651] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                          {userInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">{displayName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{userEmail || 'traveler@gbbookings.com'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                        <button
                          onClick={() => { setView('user-dashboard'); setMobileDrawerOpen(false); }}
                          className="w-full min-h-[44px] py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00A651] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <User className="w-3.5 h-3.5 text-[#00A651]" />
                          <span>My Profile</span>
                        </button>
                        <button
                          onClick={() => { onSignOut(); setMobileDrawerOpen(false); }}
                          className="w-full min-h-[44px] py-2 bg-rose-50 rounded-lg border border-rose-100 text-xs font-bold text-rose-600 hover:bg-rose-100 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-800">Sign in to unlock secret deals & manage bookings</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => { onOpenAuthModal('signin'); setMobileDrawerOpen(false); }}
                          className="w-full min-h-[44px] py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs"
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => { onOpenAuthModal('register'); setMobileDrawerOpen(false); }}
                          className="w-full min-h-[44px] py-2.5 bg-[#00A651] hover:bg-[#008E45] text-white rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm"
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Navigation Menu */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                    Explore Gilgit-Baltistan
                  </span>

                  {[
                    { id: 'hotels', label: t('nav.hotels') || 'Hotels & Resorts', icon: Building2, count: '350+ Stays' },
                    { id: 'homestays', label: t('search.homestay_tab') || 'Authentic Homestays', icon: Home, count: '120+ Stays' },
                    { id: 'cars', label: t('nav.cars') || 'Car & 4x4 Jeep Rentals', icon: Car, count: '45+ Fleets' },
                    { id: 'tours', label: t('nav.tours') || 'Tours & Packages', icon: TourIcon, count: '80+ Tours' },
                    { id: 'destinations', label: 'Destinations & Valleys', icon: MapPin, count: 'Top 8 Valleys' },
                    { id: 'offers', label: 'Special Offers & Deals', icon: Tag, isHot: true, count: 'Up to 50% Off' },
                    { id: 'ai-planner', label: 'AI Trip Planner', icon: Sparkles, badge: 'Smart AI' },
                  ].map((nav) => {
                    const Icon = nav.icon;
                    const isActive = currentView === nav.id;
                    return (
                      <button
                        key={nav.id}
                        onClick={() => { handleLinkClick(nav.id); setMobileDrawerOpen(false); }}
                        className={`w-full min-h-[46px] flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          isActive 
                            ? 'bg-emerald-50 text-[#00A651] font-extrabold border border-emerald-200/60' 
                            : 'text-slate-700 hover:bg-slate-50 font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-[#00A651] text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs block leading-tight">{nav.label}</span>
                            {nav.count && <span className="text-[10px] text-slate-400 block font-normal">{nav.count}</span>}
                          </div>
                        </div>

                        {nav.isHot ? (
                          <span className="bg-[#FF3B30] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">HOT</span>
                        ) : nav.badge ? (
                          <span className="bg-[#00A651] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">{nav.badge}</span>
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Secondary Links & Services */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                    Services & Tools
                  </span>

                  <button
                    onClick={() => { setView('vendor-dashboard'); setMobileDrawerOpen(false); }}
                    className="w-full min-h-[44px] flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00A651] flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span>List Your Property (Vendor)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>

                  <button
                    onClick={() => { setView('support'); setMobileDrawerOpen(false); }}
                    className="w-full min-h-[44px] flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Headset className="w-4 h-4" />
                      </div>
                      <span>24/7 Support Center</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                </div>

                {/* Language & Currency Controls */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                    Preferences
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Currency Switch */}
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 mb-1.5">Currency</p>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setCurrency('PKR')}
                          className={`min-h-[36px] py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                            currency === 'PKR' ? 'bg-[#00A651] text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          PKR (₨)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrency('USD')}
                          className={`min-h-[36px] py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                            currency === 'USD' ? 'bg-[#00A651] text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          USD ($)
                        </button>
                      </div>
                    </div>

                    {/* Language Switch */}
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 mb-1.5">Language</p>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => requestLanguageChange('en')}
                          className={`min-h-[36px] py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                            language === 'en' ? 'bg-[#00A651] text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => requestLanguageChange('ur')}
                          className={`min-h-[36px] py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                            language === 'ur' ? 'bg-[#00A651] text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          اردو
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Drawer Footer / Helpline */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-[#00A651]" />
                  <span>24/7 Helpline: +92 5811 920000</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  © 2026 GBBookings (Pvt) Ltd. All rights reserved.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}



