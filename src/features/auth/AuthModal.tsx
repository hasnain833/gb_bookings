import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, CheckCircle2, 
  Sparkles, ShieldCheck, LogOut, KeyRound, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../app/LanguageContext';
import { useBodyScrollLock } from '../../shared/utils/scrollLock';
import { api } from '../../shared/api/api';

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
  useBodyScrollLock(isOpen);
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
  const [twoFactorChallengeId, setTwoFactorChallengeId] = useState('');
  const [otpCode, setOtpCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage(isRtl ? 'براہ کرم صحیح ای میل درج کریں' : 'Please enter a valid email address');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage(isRtl ? 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہئے' : 'Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = mode === 'register'
        ? await api.register({
            name: fullName.trim(),
            email: trimmedEmail,
            phone: phoneNumber.trim() || undefined,
            password,
          })
        : await api.login({ email: trimmedEmail, password, rememberMe });

      if ('requiresTwoFactor' in response) {
        setTwoFactorChallengeId(response.challengeId);
        return;
      }

      setIsSuccess(true);
      onSuccessLogin(response.user.email, response.user.name);
      onClose();
    } catch (reason) {
      setErrorMessage(reason instanceof Error ? reason.message : 'Authentication is currently unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpCode)) {
      setErrorMessage('Enter the 6-digit security code.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await api.verifyLoginOtp(twoFactorChallengeId, otpCode);
      setIsSuccess(true);
      onSuccessLogin(response.user.email, response.user.name);
      onClose();
    } catch (reason) {
      setErrorMessage(reason instanceof Error ? reason.message : 'Unable to verify the security code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address to receive password reset link');
      return;
    }
    setErrorMessage('');
    try {
      await api.forgotPassword(email.trim().toLowerCase());
      setForgotSent(true);
    } catch (reason) {
      setErrorMessage(reason instanceof Error ? reason.message : 'Unable to request a password reset.');
    }
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
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity touch-none overscroll-none"
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

                {twoFactorChallengeId ? (
                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block">Security code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                        className="mt-1 w-full min-h-[52px] rounded-xl border border-slate-200 bg-slate-50 px-4 text-center font-mono text-xl tracking-[0.35em] outline-none focus:border-[#006F3C] focus:bg-white"
                        required
                        autoFocus
                      />
                    </div>
                    <p className="text-xs leading-5 text-slate-500">Enter the one-time code sent to your verified contact method.</p>
                    <button type="submit" disabled={isLoading} className="w-full min-h-[50px] rounded-xl bg-[#006F3C] font-bold text-white disabled:opacity-60">
                      {isLoading ? 'Verifying...' : 'Verify and sign in'}
                    </button>
                    <button type="button" onClick={() => { setTwoFactorChallengeId(''); setOtpCode(''); setErrorMessage(''); }} className="w-full min-h-[44px] text-xs font-bold text-slate-600">
                      Back to sign in
                    </button>
                  </form>
                ) : (
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
                )}

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
