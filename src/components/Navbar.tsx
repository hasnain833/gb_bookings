import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Globe, User, Bell, Bot, CalendarDays, Key, Compass as TourIcon, Sparkles, MessageCircle, Building2, Home, Car, MapPin, Flame } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import GBLogo from './GBLogo';

interface NavbarProps {
  currentView: string;
  setView: (v: string) => void;
  notificationsCount: number;
  unreadNotifications: boolean;
  userEmail: string;
  onOpenNotifications: () => void;
}

export default function Navbar({
  currentView,
  setView,
  notificationsCount,
  unreadNotifications,
  userEmail,
  onOpenNotifications
}: NavbarProps) {
   const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { language, requestLanguageChange, t, isRtl } = useLanguage();

  const handleLinkClick = (id: string) => {
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

  const navItems = [
    { id: 'hotels', label: t('nav.hotels'), icon: Building2 },
    { id: 'homestays', label: t('search.homestay_tab'), icon: Home },
    { id: 'cars', label: t('nav.cars'), icon: Car },
    { id: 'tours', label: t('nav.tours'), icon: TourIcon },
    { id: 'destinations', label: isRtl ? 'مقامات' : 'Destinations', icon: MapPin },
    { id: 'offers', label: isRtl ? 'آفرز' : 'Offers', icon: Flame },
    { id: 'ai-planner', label: t('nav.ai_planner'), icon: Bot }
  ];

  return (
    <header id="app-navbar" className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] shadow-xs">
      <div className="w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 h-16 sm:h-20 md:h-24 flex items-center justify-between gap-2 sm:gap-4 md:gap-6 flex-nowrap" id="nav-container">
        
        {/* Left Side: Brand Logo */}
        <div 
          onClick={() => setView('explore')} 
          className="flex items-center cursor-pointer group shrink-0"
          id="nav-logo"
        >
          <GBLogo size="md" />
        </div>

        {/* Center: Desktop Navigation Links (Direct match with image, no overlapping) */}
        <nav className="hidden lg:flex items-center justify-between gap-4 xl:gap-8 text-[14px] font-semibold text-[#1A1A1A] shrink-0 flex-nowrap" id="nav-desktop-links">
          {navItems.map((item: any) => {
            const isActive = currentView === item.id || 
              (item.id === 'hotels' && (currentView === 'hotels' || currentView === 'browse-hotels')) ||
              (item.id === 'cars' && (currentView === 'cars' || currentView === 'browse-cars')) ||
              (item.id === 'tours' && (currentView === 'tours' || currentView === 'browse-tours'));

            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleLinkClick(item.id)}
                className={`flex items-center gap-1.5 transition-all duration-200 py-2 font-semibold hover:text-[#15803D] cursor-pointer relative whitespace-nowrap shrink-0 hover:scale-[1.03] active:scale-95 ${
                  isActive ? 'text-[#15803D] font-bold border-b-2 border-[#15803D]' : 'text-slate-700'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* More Dropdown */}
          <div className="relative shrink-0">
            <button
              id="nav-link-more"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              onBlur={() => setTimeout(() => setShowMoreMenu(false), 200)}
              className="flex items-center gap-1 font-semibold text-slate-700 hover:text-[#15803D] py-2 cursor-pointer whitespace-nowrap"
            >
              <span>{isRtl ? 'مزید' : 'More'}</span>
              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fadeIn" id="nav-more-dropdown">
                <button
                  onClick={() => setView('dashboard-user')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-[#15803D] flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{t('nav.user_dashboard')}</span>
                </button>
                <button
                  onClick={() => setView('dashboard-vendor')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-[#15803D] flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{t('nav.vendor_dashboard')}</span>
                </button>
                <button
                  onClick={() => setView('support')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-[#15803D] flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-slate-500" />
                  <span>{t('nav.support')}</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Right Side: Language & Auth Actions (Direct match with image, perfect spacing, no overlap) */}
        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-5 shrink-0 flex-nowrap" id="nav-actions">
          
          {/* Language Toggle Button (Urdu / English) */}
          <button
            id="btn-language-toggle"
            onClick={() => requestLanguageChange(language === 'en' ? 'ur' : 'en')}
            className="flex items-center gap-1 text-[11px] sm:text-[14px] font-extrabold text-[#0B5D3E] hover:bg-emerald-50 py-1.5 px-2 sm:px-3 rounded-xl transition-all border border-emerald-100 cursor-pointer whitespace-nowrap shrink-0 hover:scale-[1.03] active:scale-95"
            title={language === 'en' ? 'اردو زبان منتخب کریں' : 'Switch to English'}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">{language === 'en' ? 'اردو' : 'English'}</span>
            <span className="sm:hidden">{language === 'en' ? 'اردو' : 'EN'}</span>
          </button>

          <div className="hidden sm:block h-6 w-px bg-slate-200 shrink-0"></div>

          {/* Interactive Sign In / Register Buttons with perfect spacing */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 flex-nowrap">
            {/* Sign In Button */}
            <button
              id="btn-sign-in"
              onClick={() => {
                setView('dashboard-user');
              }}
              className="border border-[#CBD5E1] hover:border-[#1A1A1A] text-slate-800 font-bold text-[11px] sm:text-[14px] px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              {isRtl ? 'لاگ ان' : 'Sign In'}
            </button>

            {/* Register Button */}
            <button
              id="btn-register"
              onClick={() => {
                setView('dashboard-user');
              }}
              className="bg-[#0B5D3E] hover:bg-[#07472E] text-white font-bold text-[11px] sm:text-[14px] px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-1 sm:gap-2 shadow-xs whitespace-nowrap shrink-0"
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 stroke-[2.5]" />
              <span className="hidden sm:inline">{isRtl ? 'رجسٹر کریں' : 'Register'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Scrollable links */}
      <div className="lg:hidden border-t border-[#E5E5E5] bg-slate-50 px-4 py-2.5 flex gap-2 items-center overflow-x-auto scrollbar-none" id="nav-mobile-scroll">
        {/* Mobile Language quick selector */}
        <button
          onClick={() => requestLanguageChange(language === 'en' ? 'ur' : 'en')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap bg-emerald-50 text-[#0B5D3E] border border-emerald-100"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'اردو' : 'EN'}</span>
        </button>

        {[
          { id: 'hotels', label: t('nav.hotels'), icon: Building2 },
          { id: 'homestays', label: t('search.homestay_tab'), icon: Home },
          { id: 'cars', label: t('nav.cars'), icon: Car },
          { id: 'tours', label: t('nav.tours'), icon: TourIcon },
          { id: 'ai-planner', label: t('nav.ai_planner'), icon: Bot },
          { id: 'my-bookings', label: t('nav.user_dashboard'), icon: User },
          { id: 'vendor', label: t('nav.vendor_dashboard'), icon: Sparkles }
        ].map((item) => {
          const isCurrent = currentView === item.id || 
            (item.id === 'hotels' && (currentView === 'hotels' || currentView === 'browse-hotels')) ||
            (item.id === 'cars' && (currentView === 'cars' || currentView === 'browse-cars')) ||
            (item.id === 'tours' && (currentView === 'tours' || currentView === 'browse-tours')) ||
            (item.id === 'my-bookings' && currentView === 'dashboard-user') ||
            (item.id === 'vendor' && currentView === 'dashboard-vendor');

          const buttonClass = isCurrent
            ? 'bg-[#0B5D3E] text-white border-[#0B5D3E]'
            : 'bg-white text-slate-600 border-slate-200 hover:text-[#0B5D3E]';

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'my-bookings') setView('dashboard-user');
                else if (item.id === 'vendor') setView('dashboard-vendor');
                else handleLinkClick(item.id);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${buttonClass}`}
            >
              {item.icon && <item.icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

