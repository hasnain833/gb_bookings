import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle } from 'lucide-react';
import { api } from '../../shared/api/api';
import { isValidPassword, passwordChecks, PASSWORD_REQUIREMENTS } from '../../shared/utils/password';
import { flashToast } from '../../shared/components/Toaster';
import GBLogo from '../../shared/components/GBLogo';

type Action = 'verify-email' | 'reset-password';
const inputClass = 'mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/20';
const buttonClass = 'flex min-h-11 w-full items-center justify-center rounded-lg bg-[#006F3C] px-4 font-semibold text-white hover:bg-[#005c32] disabled:opacity-60';

function currentAction(): { action: Action; token: string | null } {
  const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
  return { action: path === 'verify-email' ? 'verify-email' : 'reset-password', token: new URLSearchParams(window.location.search).get('token') };
}

export const isAccountActionPath = () => /^\/(verify-email|reset-password)\/?$/.test(window.location.pathname);

/**
 * The page behind links in account emails, on its own with nothing else from the site around it.
 * It only opens for whoever holds a valid link: the reset form shows that person's account, anyone else gets an error.
 */
export default function AccountActionPage() {
  const { action, token } = useMemo(currentAction, []);
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'invalid'>(token ? 'loading' : 'invalid');
  const [message, setMessage] = useState(token ? '' : 'This link is invalid or has expired.');
  const [owner, setOwner] = useState<{ name: string; email: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const verification = useRef<Promise<void> | null>(null);
  const isVerification = action === 'verify-email';

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    if (isVerification) {
      verification.current ??= api.verifyEmail(token);
      verification.current
        .then(() => { if (active) { setStatus('success'); setMessage('Your email address has been verified.'); } })
        .catch((error) => { if (active) { setStatus('invalid'); setMessage(error instanceof Error ? error.message : 'Email verification failed.'); } });
    } else {
      api.checkResetLink(token)
        .then((result) => { if (active) { setOwner(result); setStatus('ready'); } })
        .catch((error) => { if (active) { setStatus('invalid'); setMessage(error instanceof Error ? error.message : 'This link is invalid or has expired.'); } });
    }
    return () => { active = false; };
  }, [token, isVerification]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidPassword(password)) { setFormError(PASSWORD_REQUIREMENTS); return; }
    if (password !== confirmation) { setFormError('The passwords do not match.'); return; }
    setBusy(true); setFormError('');
    try {
      await api.resetPassword(token!, password);
      flashToast('Your password has been changed. Sign in with the new one.');
      setStatus('success');
      setMessage('Your password has been changed. Every device was signed out, so sign in again with the new one.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Password reset failed.');
    } finally { setBusy(false); }
  };

  const heading = status === 'invalid' ? 'This link can’t be used' : isVerification ? 'Email verification' : status === 'success' ? 'Password changed' : 'Choose a new password';

  return <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-100 p-4">
    <div className="mb-6"><a href="/" aria-label="GBBookings home"><GBLogo size="md" /></a></div>
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className={`mb-4 flex size-12 items-center justify-center rounded-full ${status === 'invalid' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-[#006F3C]'}`}>
        {status === 'loading' ? <LoaderCircle className="size-6 animate-spin" /> : status === 'invalid' ? <AlertCircle className="size-6" /> : status === 'success' ? <CheckCircle2 className="size-6" /> : <KeyRound className="size-6" />}
      </div>
      <h1 className="text-xl font-bold text-slate-900">{heading}</h1>

      {status === 'loading' && <p className="mt-2 text-sm text-slate-600">{isVerification ? 'Verifying your email address…' : 'Checking your link…'}</p>}

      {status === 'invalid' && <>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message} Reset links work once and expire after a short time. You can ask for a new one from the sign-in screen.</p>
        <a href="/" className={`${buttonClass} mt-5`}>Go to GBBookings</a>
      </>}

      {status === 'success' && <>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <a href="/" className={`${buttonClass} mt-5`}>Continue to GBBookings</a>
      </>}

      {status === 'ready' && owner && <form onSubmit={submit} className="mt-1 space-y-4">
        <p className="text-sm leading-6 text-slate-600">For <strong className="font-semibold text-slate-900">{owner.name}</strong> ({owner.email})</p>
        {formError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{formError}</p>}
        <input type="email" autoComplete="username" value={owner.email} readOnly hidden />
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">New password</label>
          <div className="relative">
            <input id="new-password" required autoFocus type={show ? 'text' : 'password'} autoComplete="new-password" maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pr-10`} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 mt-0.5 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">{passwordChecks(password).map((check) => <li key={check.label} className={`flex items-center gap-1.5 ${check.valid ? 'text-emerald-700' : 'text-slate-500'}`}><CheckCircle2 className="size-3 shrink-0" />{check.label}</li>)}</ul>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Confirm password
          <input required type={show ? 'text' : 'password'} autoComplete="new-password" maxLength={72} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputClass} />
        </label>
        {confirmation && password !== confirmation && <p className="text-xs text-rose-700">The passwords do not match.</p>}
        <button type="submit" disabled={busy} className={buttonClass}>{busy ? <LoaderCircle className="size-5 animate-spin" /> : 'Change password'}</button>
      </form>}
    </section>
  </main>;
}
