import React, { useEffect, useState } from 'react';
import { X, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../app/LanguageContext';
import { useBodyScrollLock } from '../../shared/utils/scrollLock';
import { api } from '../../shared/api/api';

interface AuthModalProps {
  onClose: () => void;
  initialMode?: 'signin' | 'register';
  onSuccessLogin: (email: string, name?: string) => void;
}

const inputClass = 'mt-1 w-full h-11 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/20 outline-none';
const labelClass = 'block text-sm font-medium text-slate-700';

// Mounted only while open, so every open starts with a clean form.
export default function AuthModal({ onClose, initialMode = 'signin', onSuccessLogin }: AuthModalProps) {
  const { isRtl } = useLanguage();
  useBodyScrollLock(true);
  const [mode, setMode] = useState(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isSignIn = mode === 'signin';

  const run = async (action: () => Promise<void>) => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      await action();
    } catch (reason) {
      setErrorMessage(reason instanceof Error ? reason.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const finish = (user: { email: string; name?: string }) => {
    onSuccessLogin(user.email, user.name);
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setErrorMessage(isRtl ? 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہئے' : 'Password must be at least 8 characters.');
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    run(async () => {
      const response = isSignIn
        ? await api.login({ email: trimmedEmail, password, rememberMe })
        : await api.register({ name: fullName.trim(), email: trimmedEmail, password });
      if ('requiresTwoFactor' in response) setChallengeId(response.challengeId);
      else finish(response.user);
    });
  };

  const handleOtpSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    run(async () => finish((await api.verifyLoginOtp(challengeId, otpCode)).user));
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setErrorMessage('Enter your email above, then click "Forgot password?" again.');
      return;
    }
    run(async () => {
      await api.forgotPassword(email.trim().toLowerCase());
      setNotice(`If an account exists for ${email.trim()}, a reset link is on its way.`);
    });
  };

  const switchMode = (next: 'signin' | 'register') => {
    setMode(next);
    setErrorMessage('');
    setNotice('');
  };

  const title = challengeId
    ? 'Enter security code'
    : isSignIn ? (isRtl ? 'لاگ ان کریں' : 'Sign in') : (isRtl ? 'نیا اکاؤنٹ بنائیں' : 'Create your account');

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-slate-950/60" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="relative w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>

        <h2 id="auth-title" className="text-xl font-bold text-slate-900">{title}</h2>
        {!challengeId && (
          <p className="mt-1 text-sm text-slate-500">
            {isSignIn ? 'New to GBBookings? ' : 'Already have an account? '}
            <button type="button" onClick={() => switchMode(isSignIn ? 'register' : 'signin')} className="font-semibold text-[#006F3C] hover:underline">
              {isSignIn ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        )}

        {errorMessage && (
          <p role="alert" className="mt-4 flex gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{errorMessage}
          </p>
        )}
        {notice && (
          <p className="mt-4 flex gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />{notice}
          </p>
        )}

        {challengeId ? (
          <form onSubmit={handleOtpSubmit} className="mt-5 space-y-4">
            <p className="text-sm text-slate-500">We sent a 6-digit code to your email.</p>
            <input
              aria-label="Security code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
              className={`${inputClass} text-center font-mono text-lg tracking-[0.4em]`}
            />
            <button type="submit" disabled={isLoading} className="w-full h-11 rounded-lg bg-[#006F3C] font-semibold text-white hover:bg-[#005c32] disabled:opacity-60">
              {isLoading ? 'Verifying…' : 'Verify and sign in'}
            </button>
            <button type="button" onClick={() => { setChallengeId(''); setOtpCode(''); setErrorMessage(''); }} className="w-full text-sm font-medium text-slate-600 hover:text-slate-900">
              Back
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {!isSignIn && (
              <label className={labelClass}>
                Full name
                <input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} />
              </label>
            )}

            <label className={labelClass}>
              Email
              <input type="email" required autoComplete="email" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
            </label>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="auth-password" className={labelClass}>Password</label>
                {isSignIn && (
                  <button type="button" onClick={handleForgotPassword} className="text-sm font-medium text-[#006F3C] hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete={isSignIn ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 mt-0.5 p-2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isSignIn && <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>}
            </div>

            {isSignIn && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="w-4 h-4 accent-[#006F3C]" />
                Keep me signed in
              </label>
            )}

            <button type="submit" disabled={isLoading} className="w-full h-11 rounded-lg bg-[#006F3C] font-semibold text-white hover:bg-[#005c32] disabled:opacity-60">
              {isLoading ? 'Please wait…' : isSignIn ? 'Sign in' : 'Create account'}
            </button>

            {!isSignIn && (
              <p className="text-xs text-center text-slate-500">By creating an account you agree to our Terms and Privacy Policy.</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
