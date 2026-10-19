import React, { createContext, useContext, useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useBodyScrollLock } from '../shared/utils/scrollLock';

type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRtl: boolean;
  requestLanguageChange: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved === 'ur' || saved === 'en') ? saved : 'en';
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<'en' | 'ur' | null>(null);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  };

  const requestLanguageChange = (lang: Language) => {
    if (lang === 'ur' && language !== 'ur') {
      setPendingLanguage('ur');
      setShowPermissionModal(true);
    } else {
      setLanguage(lang);
    }
  };

  const isRtl = language === 'ur';

  // Lock body scroll when permission dialog is open
  useBodyScrollLock(showPermissionModal);

  useEffect(() => {
    // Dynamically adjust html dir and lang attributes
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    // Apply styling helper classes if needed
    if (isRtl) {
      document.body.classList.add('font-urdu');
    } else {
      document.body.classList.remove('font-urdu');
    }
  }, [language, isRtl]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRtl, requestLanguageChange }}>
      <div className={isRtl ? 'rtl-layout' : 'ltr-layout'}>
        {children}
      </div>

      {/* Centered Urdu Language Permission Dialog */}
      {showPermissionModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs touch-none overscroll-none" id="language-permission-modal">
            {/* Backdrop */}
            <div
              onClick={() => setShowPermissionModal(false)}
              className="absolute inset-0 cursor-default touch-none overscroll-none"
            />
            
            {/* Modal Body */}
            <div
              className="animate-pop-in relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 text-left overflow-y-auto max-h-[calc(100vh-2rem)] z-10 my-auto mx-auto"
              dir="ltr"
            >
              {/* Pattern Header Accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
              
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-950 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span>Language Permission</span>
                    <span className="text-slate-300 hidden sm:inline">|</span>
                    <span className="font-urdu font-medium text-emerald-700">اردو زبان</span>
                  </h3>
                  <p className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-600">Urdu Language Request</p>
                </div>
              </div>

              <div className="space-y-3 py-0.5 text-slate-600 text-xs sm:text-sm leading-relaxed">
                <p className="font-medium text-slate-900 border-b border-slate-100 pb-2.5">
                  Would you like to experience GBBookings.com in beautifully rendered, hand-crafted Urdu typography?
                </p>
                <p className="font-urdu font-medium text-slate-700 text-xs sm:text-base leading-relaxed bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 text-right" dir="rtl">
                  کیا آپ ویب سائٹ کو شاندار اور پڑھنے میں انتہائی آسان اردو رسم الخط میں دیکھنا چاہتے ہیں؟
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                <button
                  id="btn-confirm-language-cancel"
                  onClick={() => {
                    setShowPermissionModal(false);
                    setPendingLanguage(null);
                  }}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer text-center min-h-[44px] flex items-center justify-center"
                >
                  Cancel / منسوخ
                </button>
                <button
                  id="btn-confirm-language-approve"
                  onClick={() => {
                    if (pendingLanguage) {
                      setLanguage(pendingLanguage);
                    }
                    setShowPermissionModal(false);
                    setPendingLanguage(null);
                  }}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/10 hover:shadow-emerald-700/20 cursor-pointer text-center min-h-[44px]"
                >
                  Yes, Switch / تبدیل کریں
                </button>
              </div>
            </div>
          </div>
        )}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
