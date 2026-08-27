import React from 'react';
import { 
  Home, 
  Compass, 
  CalendarCheck, 
  User, 
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../LanguageContext';

interface MobileAppBottomNavProps {
  currentView: string;
  setView: (view: string) => void;
  isLoggedIn: boolean;
  onOpenAuthModal: (mode?: 'signin' | 'register') => void;
  unreadNotifications?: boolean;
}

export default function MobileAppBottomNav({
  currentView,
  setView,
  isLoggedIn,
  onOpenAuthModal,
  unreadNotifications = false
}: MobileAppBottomNavProps) {
  const { t, isRtl } = useLanguage();

  interface NavItem {
    id: string;
    matchViews: string[];
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    action: () => void;
    highlight?: boolean;
    hasBadge?: boolean;
  }

  // Mobile app navigation tabs: Home, Explore, AI Trip (Elevated), Bookings, Profile
  const navItems: NavItem[] = [
    {
      id: 'home',
      matchViews: ['hotels', 'homestays', 'home'],
      label: isRtl ? 'ہوم' : 'Home',
      icon: Home,
      action: () => setView('hotels')
    },
    {
      id: 'explore',
      matchViews: ['explore', 'browse-hotels', 'browse-homestays', 'browse-cars', 'browse-tours', 'destinations', 'offers', 'cars', 'tours'],
      label: isRtl ? 'دریافت' : 'Explore',
      icon: Compass,
      action: () => setView('explore')
    },
    {
      id: 'ai-planner',
      matchViews: ['ai-planner'],
      label: isRtl ? 'اے آئی ٹرپ' : 'AI Trip',
      icon: Sparkles,
      action: () => setView('ai-planner'),
      highlight: true
    },
    {
      id: 'bookings',
      matchViews: ['bookings', 'checkout'],
      label: isRtl ? 'بکنگز' : 'Bookings',
      icon: CalendarCheck,
      action: () => {
        if (!isLoggedIn) {
          onOpenAuthModal('signin');
        } else {
          setView('user-dashboard');
        }
      }
    },
    {
      id: 'profile',
      matchViews: ['user-dashboard', 'vendor-dashboard', 'profile'],
      label: isRtl ? 'پروفائل' : 'Profile',
      icon: User,
      action: () => {
        if (!isLoggedIn) {
          onOpenAuthModal('signin');
        } else {
          setView('user-dashboard');
        }
      },
      hasBadge: unreadNotifications
    }
  ];

  return (
    <aside 
      aria-label="Mobile Navigation"
      id="mobile-bottom-tab-bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-bottom-nav pb-safe pointer-events-auto select-none bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto min-h-[58px]">
        {navItems.map((item) => {
          const isActive = item.matchViews.includes(currentView) || currentView === item.id;
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={item.action}
                className="relative flex flex-col items-center justify-center -top-3 app-tap focus:outline-hidden cursor-pointer"
                aria-label={item.label}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                  isActive 
                    ? 'bg-[#006F3C] text-white shadow-emerald-900/30 ring-3 ring-white'
                    : 'bg-gradient-to-tr from-[#0A182E] to-[#1E3A8A] text-white shadow-slate-900/25 ring-2 ring-white'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold mt-1 tracking-tight ${
                  isActive ? 'text-[#006F3C]' : 'text-slate-700'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="mobileNavIndicatorHighlight"
                    className="w-1.5 h-1.5 bg-[#006F3C] rounded-full mt-0.5"
                  />
                )}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              onClick={item.action}
              className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 app-tap focus:outline-hidden cursor-pointer min-w-0"
              aria-label={item.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-[#006F3C] stroke-[2.5]' : 'text-slate-400 hover:text-slate-600'
                }`} />
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                )}
              </div>
              <span className={`text-[10px] font-semibold mt-0.5 tracking-tight truncate max-w-full transition-colors ${
                isActive ? 'text-[#006F3C] font-black' : 'text-slate-500'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="mobileNavIndicator"
                  className="w-5 h-0.5 bg-[#006F3C] rounded-full mt-0.5"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
