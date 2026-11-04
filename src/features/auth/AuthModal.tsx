import React, { useEffect, useRef, useState } from 'react';
import { X, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, Wallet, BadgeCheck, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../app/LanguageContext';
import { useBodyScrollLock } from '../../shared/utils/scrollLock';
import { api, type AuthUser } from '../../shared/api/api';
import { isValidPassword, passwordChecks, PASSWORD_REQUIREMENTS } from '../../shared/utils/password';
import { toast } from '../../shared/components/Toaster';
import GBLogo from '../../shared/components/GBLogo';

interface AuthModalProps {
  onClose: () => void;
  initialMode?: 'signin' | 'register';
  onSuccessLogin: (user: AuthUser) => void;
}

const inputClass = 'mt-1 w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/20 outline-none aria-[invalid=true]:border-rose-400';
const labelClass = 'block text-sm font-medium text-slate-700';
const submitClass = 'w-full h-11 rounded-lg bg-[#006F3C] font-semibold text-white hover:bg-[#005c32] disabled:opacity-60';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const PERKS = [
  { icon: BadgeCheck, title: 'Verified local partners', text: 'Every partner and listing is checked before it goes live.' },
  { icon: Wallet, title: 'Pay now or on arrival', text: 'Choose what suits you at checkout.' },
  { icon: ShieldCheck, title: 'Your details stay safe', text: 'Passwords are encrypted and chats stay on GBBookings.' },
];

let googleScript: Promise<void> | undefined;
const loadGoogleScript = () => googleScript ??= new Promise<void>((resolve, reject) => {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.onload = () => resolve();
  script.onerror = () => { googleScript = undefined; reject(new Error('Google sign-in could not load.')); };
  document.head.appendChild(script);
});

/** Google's own "Continue with Google" button; passes the signed ID token on. Renders nothing until a client ID is configured. */
function GoogleButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const slot = useRef<HTMLDivElement>(null);
  const latest = useRef(onCredential);
  latest.current = onCredential;
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGoogleScript().then(() => {
      const google = (window as any).google;
      if (cancelled || !slot.current || !google?.accounts?.id) return;
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (response: { credential: string }) => latest.current(response.credential) });
      google.accounts.id.renderButton(slot.current, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: Math.min(slot.current.offsetWidth || 320, 400) });
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  if (!GOOGLE_CLIENT_ID) return null;
  return <div ref={slot} className="flex min-h-11 justify-center" />;
}

// Mounted only while open, so every open starts with a clean form.
export default function AuthModal({ onClose, initialMode = 'signin', onSuccessLogin }: AuthModalProps) {
  const { isRtl } = useLanguage();
  useBodyScrollLock(true);
  const [mode, setMode] = useState<'signin' | 'register' | 'forgot'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'login'>('login');
  const [resendAfter, setResendAfter] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  // Set while a Google sign-in waits for its two-step code; "Resend code" signs in with it again.
  const [googleCredential, setGoogleCredential] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isSignIn = mode === 'signin';
  const isRegister = mode === 'register';

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

  useEffect(() => {
    if (!challengeId) return;
    const tick = () => setRemainingSeconds(Math.max(0, Math.ceil((resendAfter - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [challengeId, resendAfter]);

  const finish = (user: AuthUser, greeting: 'new' | 'back' | 'neutral') => {
    const first = user.name.split(/\s+/)[0];
    toast(greeting === 'new' ? `Welcome to GBBookings, ${first}! Your account is ready.` : greeting === 'back' ? `Welcome back, ${first}!` : `Welcome, ${first}!`);
    onSuccessLogin(user);
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isRegister && !isValidPassword(password)) {
      setErrorMessage(PASSWORD_REQUIREMENTS);
      return;
    }
    if (isRegister && password !== confirmPassword) { setErrorMessage('Passwords do not match.'); return; }
    const trimmedEmail = email.trim().toLowerCase();
    run(async () => {
      const response = isSignIn
        ? await api.login({ email: trimmedEmail, password, rememberMe })
        : await api.register({ name: fullName.trim(), email: trimmedEmail, password, confirmPassword, acceptTerms: true });
      if ('requiresTwoFactor' in response || 'requiresEmailVerification' in response) {
        setOtpPurpose(isSignIn ? 'login' : 'signup'); setChallengeId(response.challengeId); setOtpCode(''); setResendAfter(Date.now() + 60_000);
      }
      else finish(response.user, 'back');
    });
  };

  const handleGoogle = (credential: string) => run(async () => {
    const response = await api.googleSignIn(credential, rememberMe);
    if ('requiresTwoFactor' in response) {
      setGoogleCredential(credential); setOtpPurpose('login'); setChallengeId(response.challengeId); setOtpCode(''); setResendAfter(Date.now() + 60_000);
    } else finish(response.user, 'neutral');
  });

  const handleOtpSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    run(async () => finish(
      (await (otpPurpose === 'signup' ? api.verifySignupOtp(challengeId, otpCode) : api.verifyLoginOtp(challengeId, otpCode))).user,
      otpPurpose === 'signup' ? 'new' : 'back',
    ));
  };

  const handleForgotPassword = (event: React.FormEvent) => {
    event.preventDefault();
    run(async () => {
      await api.forgotPassword(email.trim().toLowerCase());
      setNotice(`If an account exists for ${email.trim()}, a reset link is on its way. It can take a minute, so check your spam folder too.`);
    });
  };

  const switchMode = (next: 'signin' | 'register' | 'forgot') => {
    setMode(next);
    setErrorMessage('');
    setNotice('');
  };

  const title = challengeId
    ? otpPurpose === 'signup' ? 'Verify your email' : 'Enter security code'
    : mode === 'forgot' ? 'Reset your password'
      : isSignIn ? (isRtl ? 'لاگ ان کریں' : 'Welcome back') : (isRtl ? 'نیا اکاؤنٹ بنائیں' : 'Create your account');

  return (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-slate-950/60" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="relative flex w-full max-w-sm overflow-hidden bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92dvh] md:max-w-3xl"
      >
        <aside className="hidden w-[38%] shrink-0 flex-col justify-between bg-forest-950 p-7 text-white md:flex">
          <GBLogo size="sm" />
          <ul className="space-y-5">
            {PERKS.map(({ icon: Icon, title: perk, text }) => <li key={perk} className="flex gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-emerald-300" aria-hidden="true" />
              <span><strong className="block text-sm font-semibold">{perk}</strong><span className="mt-0.5 block text-xs leading-5 text-slate-300">{text}</span></span>
            </li>)}
          </ul>
          <p className="text-xs text-slate-400">Explore Gilgit-Baltistan</p>
        </aside>

        <div className="relative min-w-0 flex-1 overflow-y-auto p-6 sm:p-7">
          <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>

          <h2 id="auth-title" className="pr-8 text-xl font-bold text-slate-900">{title}</h2>
          {!challengeId && mode !== 'forgot' && (
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
            <p role="status" className="mt-4 flex gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />{notice}
            </p>
          )}

          {challengeId ? (
            <form onSubmit={handleOtpSubmit} className="mt-5 space-y-4">
              <p className="text-sm leading-6 text-slate-500">We sent a 6-digit code to <strong>{email.trim() || 'your email'}</strong>. {otpPurpose === 'signup' && 'Your account will be created after you verify this code.'}</p>
              <input
                aria-label="Security code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                title="Enter the 6-digit code from your email."
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                className={`${inputClass} text-center font-mono text-lg tracking-[0.4em]`}
              />
              <button type="submit" disabled={isLoading} className={submitClass}>
                {isLoading ? 'Verifying…' : otpPurpose === 'signup' ? 'Verify and create account' : 'Verify and sign in'}
              </button>
              <div className="flex items-center justify-between">
                <button type="button" disabled={isLoading} onClick={() => { setChallengeId(''); setOtpCode(''); setGoogleCredential(''); setErrorMessage(''); setNotice(''); }} className="min-h-11 text-sm font-medium text-slate-600 hover:text-slate-900">
                  Back
                </button>
                <button type="button" disabled={isLoading || remainingSeconds > 0} onClick={() => run(async () => {
                  const response = otpPurpose === 'signup'
                    ? await api.register({ name: fullName.trim(), email: email.trim().toLowerCase(), password, confirmPassword, acceptTerms: true })
                    : googleCredential ? await api.googleSignIn(googleCredential, rememberMe)
                      : await api.login({ email: email.trim().toLowerCase(), password, rememberMe });
                  if ('challengeId' in response) { setChallengeId(response.challengeId); setOtpCode(''); setResendAfter(Date.now() + 60_000); setNotice('A new code is on its way. Check your spam folder too.'); }
                  else finish(response.user, 'back');
                })} className="min-h-11 text-sm font-semibold text-[#006F3C] disabled:text-slate-400">{remainingSeconds ? `Resend code in ${remainingSeconds}s` : 'Resend code'}</button>
              </div>
            </form>
          ) : mode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
              <p className="text-sm leading-6 text-slate-500">Enter your account email and we'll send you a link to choose a new password.</p>
              <label className={labelClass}>
                Email
                <input type="email" required autoComplete="email" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
              </label>
              <button type="submit" disabled={isLoading} className={submitClass}>{isLoading ? 'Sending…' : 'Send reset link'}</button>
              <button type="button" onClick={() => switchMode('signin')} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"><ArrowLeft className="size-4 rtl:rotate-180" />Back to sign in</button>
            </form>
          ) : (<>
            {GOOGLE_CLIENT_ID && <div className="mt-5 space-y-3">
              <GoogleButton onCredential={handleGoogle} />
              <div className="flex items-center gap-3 text-xs font-medium uppercase text-slate-400"><span className="h-px flex-1 bg-slate-200" />or with email<span className="h-px flex-1 bg-slate-200" /></div>
            </div>}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div className={isRegister ? 'grid gap-3.5 sm:grid-cols-2' : ''}>
                {isRegister && (
                  <label className={labelClass}>
                    Full name
                    <input required minLength={2} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} />
                  </label>
                )}
                <label className={labelClass}>
                  Email
                  <input type="email" required autoComplete="email" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
                </label>
              </div>

              <div className={isRegister ? 'grid gap-3.5 sm:grid-cols-2' : ''}>
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="auth-password" className={labelClass}>Password</label>
                    {isSignIn && (
                      <button type="button" onClick={() => switchMode('forgot')} className="text-sm font-medium text-[#006F3C] hover:underline">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      maxLength={72}
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
                </div>
                {isRegister && <label className={labelClass}>Confirm password<input required type={showPassword ? 'text' : 'password'} autoComplete="new-password" maxLength={72} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} /></label>}
              </div>

              {isRegister && <>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">{passwordChecks(password).map((check) => <li key={check.label} className={`flex items-center gap-1.5 ${check.valid ? 'text-emerald-700' : 'text-slate-500'}`}><CheckCircle2 className="size-3 shrink-0" />{check.label}</li>)}</ul>
                {confirmPassword && password !== confirmPassword && <p className="text-xs text-rose-700">Passwords do not match.</p>}
                <label className="flex items-start gap-2 text-xs leading-5 text-slate-600"><input type="checkbox" required checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#006F3C]" /><span>I agree to the <a href="/terms" target="_blank" rel="noreferrer" className="font-semibold text-[#006F3C] underline">Terms</a> and <a href="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-[#006F3C] underline">Privacy Policy</a>.</span></label>
              </>}

              {isSignIn && (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="w-4 h-4 accent-[#006F3C]" />
                  Remember me for 7 days
                </label>
              )}

              <button type="submit" disabled={isLoading} className={submitClass}>
                {isLoading ? 'Please wait…' : isSignIn ? 'Sign in' : 'Send verification code'}
              </button>
              {GOOGLE_CLIENT_ID && <p className="text-center text-xs text-slate-500">Continuing with Google means you agree to our <a href="/terms" target="_blank" rel="noreferrer" className="underline">Terms</a> and <a href="/privacy" target="_blank" rel="noreferrer" className="underline">Privacy Policy</a>.</p>}
            </form>
          </>)}
        </div>
      </div>
    </div>
  );
}
