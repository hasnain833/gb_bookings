import React, { useState } from 'react';
import { ChevronDown, Globe, User, Bell, Bot, CalendarDays, Key, Compass as TourIcon, Sparkles, MessageCircle } from 'lucide-react';

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

  const handleLinkClick = (id: string) => {
    if (id === 'hotels') {
      setView('hotels');
    } else if (id === 'homestays') {
      setView('hotels'); // homestays are handled under hotel search
    } else if (id === 'cars') {
      setView('cars');
    } else if (id === 'tours') {
      setView('tours');
    } else if (id === 'destinations' || id === 'offers') {
      setView('explore');
      setTimeout(() => {
        const element = document.getElementById(id === 'destinations' ? 'section-destinations' : 'hero-banner');
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  return (
    <header id="app-navbar" className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] shadow-xs">
      <div className="w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 h-20 md:h-24 flex items-center justify-between gap-4 md:gap-6 flex-nowrap" id="nav-container">
        
        {/* Left Side: Brand Logo (Horizontal layout matching the reference image) */}
        <div 
          onClick={() => setView('explore')} 
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          id="nav-logo"
        >
          {/* Logo Icon on the left */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-12 h-9" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Sun (Orange/Red circle with white light trail) */}
              <circle cx="50" cy="24" r="14" fill="#F97316" />
              <path d="M46 18 Q50 13 54 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              
              {/* Blue/Teal mountain (Left) */}
              <path d="M22 70 L52 28 L72 70 Z" fill="#1E40AF" opacity="0.9" />
              
              {/* Green mountain (Right / Foreground) */}
              <path d="M42 70 L72 16 L98 70 Z" fill="#15803D" />
            </svg>
          </div>
          
          {/* Brand Text on the right */}
          <div className="flex flex-col shrink-0">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 leading-none whitespace-nowrap">
              <span className="text-[#15803D]">GB</span>Bookings<span className="text-[#F97316]">.com</span>
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links (Direct match with image, no overlapping) */}
        <nav className="hidden lg:flex items-center justify-between gap-4 xl:gap-8 text-[14px] font-semibold text-[#1A1A1A] shrink-0 flex-nowrap" id="nav-desktop-links">
          {['Hotels', 'Homestays', 'Cars', 'Tours', 'Destinations', 'Offers'].map((item) => {
            const id = item.toLowerCase();
            const isActive = currentView === id || 
              (id === 'hotels' && (currentView === 'hotels' || currentView === 'browse-hotels')) ||
              (id === 'cars' && (currentView === 'cars' || currentView === 'browse-cars')) ||
              (id === 'tours' && (currentView === 'tours' || currentView === 'browse-tours'));

            return (
              <button
                key={item}
                id={`nav-link-${id}`}
                onClick={() => handleLinkClick(id)}
                className={`transition-all duration-200 py-2 font-semibold hover:text-[#15803D] cursor-pointer relative whitespace-nowrap shrink-0 hover:scale-[1.03] active:scale-95 ${
                  isActive ? 'text-[#15803D] font-bold' : 'text-slate-700'
                }`}
              >
                {item}
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
              <span>More</span>
              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fadeIn" id="nav-more-dropdown">
                <button
                  onClick={() => setView('ai-planner')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                >
                  <Bot className="w-4 h-4 text-indigo-600" />
                  <span>AI Companion Planner</span>
                </button>
                <button
                  onClick={() => setView('dashboard-user')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-[#15803D] flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>My Bookings Panel</span>
                </button>
                <button
                  onClick={() => setView('dashboard-vendor')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-[#15803D] flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Vendor Console</span>
                </button>
                <button
                  onClick={() => setView('support')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-[#15803D] flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-slate-500" />
                  <span>Customer Desk</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Right Side: Language & Auth Actions (Direct match with image, perfect spacing, no overlap) */}
        <div className="flex items-center gap-3 md:gap-5 shrink-0 flex-nowrap" id="nav-actions">
          
          {/* Language Selector (Globe EN Chevron) */}
          <div className="hidden sm:flex items-center gap-1.5 text-[14px] font-semibold text-slate-700 cursor-pointer hover:text-[#15803D] py-1.5 px-2 rounded-lg hover:bg-slate-50 shrink-0 whitespace-nowrap">
            <Globe className="w-4 h-4 text-slate-600 shrink-0" />
            <span>EN</span>
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-200 shrink-0"></div>

          {/* Interactive Sign In / Register Buttons with perfect spacing */}
          <div className="flex items-center gap-3 shrink-0 flex-nowrap">
            {/* Sign In Button */}
            <button
              id="btn-sign-in"
              onClick={() => {
                setView('dashboard-user');
              }}
              className="border border-[#CBD5E1] hover:border-[#1A1A1A] text-slate-800 font-bold text-[14px] px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              Sign In
            </button>

            {/* Register Button */}
            <button
              id="btn-register"
              onClick={() => {
                setView('dashboard-user');
              }}
              className="bg-[#0B5D3E] hover:bg-[#07472E] text-white font-bold text-[14px] px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-2 shadow-xs whitespace-nowrap shrink-0"
            >
              <User className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span>Register</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Scrollable links */}
      <div className="lg:hidden border-t border-[#E5E5E5] bg-slate-50 px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-none" id="nav-mobile-scroll">
        {['Hotels', 'Homestays', 'Cars', 'Tours', 'AI Planner', 'My Bookings', 'Vendor'].map((item) => {
          const id = item.toLowerCase().replace(' ', '-');
          const isCurrent = currentView === id || 
            (id === 'hotels' && (currentView === 'hotels' || currentView === 'browse-hotels')) ||
            (id === 'cars' && (currentView === 'cars' || currentView === 'browse-cars')) ||
            (id === 'tours' && (currentView === 'tours' || currentView === 'browse-tours')) ||
            (id === 'my-bookings' && currentView === 'dashboard-user') ||
            (id === 'vendor' && currentView === 'dashboard-vendor');

          return (
            <button
              key={item}
              onClick={() => {
                if (id === 'my-bookings') setView('dashboard-user');
                else if (id === 'vendor') setView('dashboard-vendor');
                else handleLinkClick(id);
              }}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                isCurrent
                  ? 'bg-[#0B5D3E] text-white border-[#0B5D3E]'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-[#0B5D3E]'
              }`}
            >
              <span>{item}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

