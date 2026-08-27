import React from 'react';
import { 
  Building2,
  Home, 
  Sparkles,
  Car, 
  Compass
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

  // 4 Core Categories + AI Trip in Center:
  // HOTELS | HOMESTAYS | [ AI TRIP ] | CARS | TOURS
  const navItems: NavItem[] = [
    {
      id: 'hotels',
      matchViews: ['hotels', 'browse-hotels'],
      label: isRtl ? 'ہوٹلز' : 'Hotels',
      icon: Building2,
      action: () => setView('hotels')
    },
    {
      id: 'homestays',
      matchViews: ['homestays', 'browse-homestays'],
      label: isRtl ? 'ہوم اسٹیز' : 'Homestays',
      icon: Home,
      action: () => setView('homestays')
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
      id: 'cars',
      matchViews: ['cars', 'browse-cars'],
      label: isRtl ? 'گاڑیاں' : 'Cars',
      icon: Car,
      action: () => setView('cars')
    },
    {
      id: 'tours',
      matchViews: ['tours', 'browse-tours', 'destinations', 'offers'],
      label: isRtl ? 'ٹورز' : 'Tours',
      icon: Compass,
      action: () => setView('tours')
    }
  ];

  return (
    <aside 
      aria-label="Mobile Navigation"
      id="mobile-bottom-tab-bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-bottom-nav pb-safe pointer-events-auto select-none bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div className="grid grid-cols-5 items-end px-1 py-1 max-w-md mx-auto min-h-[58px] relative">
        {navItems.map((item) => {
          const isActive = item.matchViews.includes(currentView) || currentView === item.id;
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={item.action}
                className="relative flex flex-col items-center justify-end w-full h-full pb-1 app-tap focus:outline-hidden cursor-pointer"
                aria-label={item.label}
              >
                <div className="relative -top-2 flex flex-col items-center">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-all ${
                    isActive 
                      ? 'bg-[#006F3C] text-white shadow-emerald-900/30 ring-2 ring-white scale-105'
                      : 'bg-gradient-to-tr from-slate-900 to-emerald-950 text-emerald-300 shadow-slate-900/20 ring-2 ring-white hover:scale-105'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <span className={`text-[10px] tracking-tight transition-colors -mt-1 ${
                  isActive ? 'text-[#006F3C] font-bold' : 'text-slate-600 font-medium'
                }`}>
                  {item.label}
                </span>
                {isActive ? (
                  <motion.div 
                    layoutId="mobileNavIndicator"
                    className="w-4 h-0.5 bg-[#006F3C] rounded-full mt-0.5"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                ) : (
                  <div className="w-4 h-0.5 mt-0.5 opacity-0" />
                )}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              onClick={item.action}
              className="relative flex flex-col items-center justify-end w-full h-full pb-1 app-tap focus:outline-hidden cursor-pointer"
              aria-label={item.label}
            >
              <div className="relative h-6 flex items-center justify-center mb-1">
                <Icon className={`w-5 h-5 transition-all ${
                  isActive ? 'text-[#006F3C] stroke-[2.5] scale-105' : 'text-slate-400 hover:text-slate-600'
                }`} />
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight truncate max-w-full transition-colors ${
                isActive ? 'text-[#006F3C] font-bold' : 'text-slate-500 font-medium'
              }`}>
                {item.label}
              </span>
              {isActive ? (
                <motion.div 
                  layoutId="mobileNavIndicator"
                  className="w-4 h-0.5 bg-[#006F3C] rounded-full mt-0.5"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              ) : (
                <div className="w-4 h-0.5 mt-0.5 opacity-0" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
