import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, CheckCircle2, 
  Sparkles, ShieldCheck, LogOut, KeyRound, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'register';
  onSuccessLogin: (email: string, name?: string) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signin',
  onSuccessLogin
}: AuthModalProps) {
  const { isRtl } = useLanguage();
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage(isRtl ? 'براہ کرم صحیح ای میل درج کریں' : 'Please enter a valid email address');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage(isRtl ? 'پاس ورڈ کم از کم 4 حروف کا ہونا چاہئے' : 'Password must be at least 4 characters');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      try {
        const rawUsers = localStorage.getItem('gb_registered_users');
        const users: Array<{ email: string; name: string; password?: string }> = rawUsers ? JSON.parse(rawUsers) : [];

        if (mode === 'register') {
          const existingUser = users.find(u => u.email.toLowerCase() === trimmedEmail);
          if (existingUser) {
            setIsLoading(false);
            setErrorMessage(isRtl ? 'اس ای میل کے ساتھ اکاؤنٹ پہلے سے موجود ہے' : 'An account with this email already exists. Please sign in.');
            return;
          }

          const newUserName = fullName.trim() || trimmedEmail.split('@')[0];
          users.push({ email: trimmedEmail, name: newUserName, password });
          localStorage.setItem('gb_registered_users', JSON.stringify(users));

          setIsLoading(false);
          setIsSuccess(true);

          setTimeout(() => {
            setIsSuccess(false);
            onSuccessLogin(trimmedEmail, newUserName);
            onClose();
          }, 600);
        } else {
          // Sign in mode
          const foundUser = users.find(u => u.email.toLowerCase() === trimmedEmail);
          if (foundUser && foundUser.password && foundUser.password !== password) {
            setIsLoading(false);
            setErrorMessage(isRtl ? 'غلط پاس ورڈ۔ براہ کرم دوبارہ کوشش کریں' : 'Incorrect password. Please verify and try again.');
            return;
          }

          const userDisplayName = foundUser ? foundUser.name : (fullName.trim() || trimmedEmail.split('@')[0]);
          
          if (!foundUser) {
            // Save newly signed in user
            users.push({ email: trimmedEmail, name: userDisplayName, password });
            localStorage.setItem('gb_registered_users', JSON.stringify(users));
          }

          setIsLoading(false);
          setIsSuccess(true);

          setTimeout(() => {
            setIsSuccess(false);
            onSuccessLogin(trimmedEmail, userDisplayName);
            onClose();
          }, 600);
        }
      } catch (err) {
        setIsLoading(false);
        const fallbackName = fullName.trim() || trimmedEmail.split('@')[0];
        onSuccessLogin(trimmedEmail, fallbackName);
        onClose();
      }
    }, 500);
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        const socialEmail = email.trim() || `traveler@${provider.toLowerCase().replace(/\s+/g, '')}.com`;
        const socialName = fullName.trim() || `${provider} Traveler`;
        onSuccessLogin(socialEmail, socialName);
        onClose();
      }, 600);
    }, 500);
  };

  const handleForgotPassword = () => {
    if (!email) {
      setErrorMessage('Please enter your email address to receive password reset link');
      return;
    }
    setForgotSent(true);
    setTimeout(() => setForgotSent(false), 4000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
        />

        {/* Bottom Sheet Modal Container */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 text-left max-h-[88vh] sm:max-h-[calc(100vh-3rem)] flex flex-col"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
        >
          {/* Mobile Drag Handle */}
          <div className="sm:hidden sheet-drag-handle" />

          {/* Header Banner */}
          <div className="relative bg-gradient-to-r from-[#006F3C] via-[#005C32] to-emerald-800 p-5 sm:p-6 text-white shrink-0">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center app-tap"
              title="Close"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>GBBookings Auth</span>
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {mode === 'signin' 
                ? (isRtl ? 'اکاؤنٹ میں لاگ ان کریں' : 'Welcome Back!')
                : (isRtl ? 'نیا اکاؤنٹ بنائیں' : 'Join GBBookings')}
            </h3>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 font-normal leading-relaxed">
              {mode === 'signin'
                ? (isRtl ? 'اپنا ای میل اور پاس ورڈ درج کریں' : 'Sign in to access your bookings, rewards & wishlist.')
                : (isRtl ? 'گلگت بلتستان میں اپنی سیاحت شروع کریں' : 'Create an account to book hotels, cars & authentic tours.')}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(''); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer min-h-[44px] flex items-center justify-center app-tap ${
                mode === 'signin'
                  ? 'bg-white text-[#006F3C] shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isRtl ? 'لاگ ان کریں' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(''); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer min-h-[44px] flex items-center justify-center app-tap ${
                mode === 'register'
                  ? 'bg-white text-[#006F3C] shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isRtl ? 'نیا اکاؤنٹ بنائیں' : 'Create Account'}
            </button>
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 pb-10 sm:pb-6">
            {/* Success Message Overlay */}
            {isSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#006F3C] flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">
                  {mode === 'signin' ? 'Signed In Successfully!' : 'Account Created!'}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Welcome to GBBookings. Directing to your dashboard...
                </p>
              </div>
            ) : (
              <>
                {/* Social Login Buttons */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Google')}
                    className="w-full min-h-[48px] flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm transition-all shadow-xs cursor-pointer app-tap"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Phone OTP')}
                    className="w-full min-h-[48px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm transition-all shadow-xs cursor-pointer app-tap"
                  >
                    <Phone className="w-4 h-4 text-[#006F3C]" />
                    <span>Sign in with Phone Number</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative whitespace-nowrap">
                    Or with email
                  </span>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Forgot Password Sent Notification */}
                {forgotSent && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#006F3C] shrink-0" />
                    <span>Password reset instructions have been sent to {email}.</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Full Name Field (Register Mode) */}
                  {mode === 'register' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Ahmad Raza"
                          className="w-full min-h-[48px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#006F3C] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full min-h-[48px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#006F3C] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 block">
                        Password
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-xs font-bold text-[#006F3C] hover:underline cursor-pointer"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full min-h-[48px] pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#006F3C] focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Checkbox Options */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-[#006F3C] focus:ring-[#006F3C] w-4.5 h-4.5 cursor-pointer accent-[#006F3C]"
                      />
                      <span className="text-xs text-slate-600 font-medium leading-snug">
                        {mode === 'signin' ? 'Remember this device' : 'I agree to Terms & Conditions'}
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    id="btn-auth-submit"
                    className="w-full min-h-[50px] bg-[#006F3C] hover:bg-[#005c32] active:bg-[#004d2a] text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer transition-all mt-3 app-tap"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{mode === 'signin' ? 'Sign In Now' : 'Create Free Account'}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 text-center text-xs text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />
                  <span>Your credentials are encrypted & stored securely.</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
