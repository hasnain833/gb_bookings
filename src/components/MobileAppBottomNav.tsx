import React from 'react';
import { 
  Home, 
  Search, 
  Sparkles, 
  Car, 
  Compass, 
  User, 
  Tag, 
  Bed,
  MapPin,
  Flame
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
  const { t } = useLanguage();

  // Primary mobile app navigation tabs
  const navItems = [
    {
      id: 'homestays',
      matchViews: ['homestays', 'explore', 'hotels'],
      label: 'Stays',
      icon: Bed,
      action: () => setView('homestays')
    },
    {
      id: 'cars',
      matchViews: ['cars'],
      label: '4x4 Jeeps',
      icon: Car,
      action: () => setView('cars')
    },
    {
      id: 'ai-planner',
      matchViews: ['ai-planner'],
      label: 'AI Trip',
      icon: Sparkles,
      action: () => setView('ai-planner'),
      highlight: true
    },
    {
      id: 'tours',
      matchViews: ['tours', 'destinations', 'offers'],
      label: 'Expeditions',
      icon: Compass,
      action: () => setView('tours')
    },
    {
      id: 'account',
      matchViews: ['user-dashboard', 'dashboard-user', 'vendor-dashboard', 'support'],
      label: isLoggedIn ? 'Account' : 'Sign In',
      icon: User,
      action: () => {
        if (isLoggedIn) {
          setView('user-dashboard');
        } else {
          onOpenAuthModal('signin');
        }
      },
      hasBadge: unreadNotifications
    }
  ];

  return (
    <aside 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-bottom-nav pb-safe pointer-events-auto select-none"
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto min-h-[58px]">
        {navItems.map((item) => {
          const isActive = item.matchViews.includes(currentView) || currentView === item.id;
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="relative flex flex-col items-center justify-center -top-3 app-tap focus:outline-hidden cursor-pointer"
                aria-label={item.label}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                  isActive 
                    ? 'bg-gradient-to-tr from-[#006F3C] to-[#00A651] text-white shadow-emerald-700/30 ring-3 ring-white'
                    : 'bg-gradient-to-tr from-[#0A182E] to-[#1E3A8A] text-white shadow-slate-900/25 ring-2 ring-white'
                }`}>
                  <Icon className="w-5 h-5 animate-pulse" />
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
              onClick={item.action}
              className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 app-tap focus:outline-hidden cursor-pointer min-w-0"
              aria-label={item.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-[#006F3C] stroke-[2.5]' : 'text-slate-500 hover:text-slate-700'
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
                  className="w-4 h-0.5 bg-[#006F3C] rounded-full mt-0.5"
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
