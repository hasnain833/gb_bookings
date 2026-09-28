import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, LoaderCircle, X } from 'lucide-react';
import { api } from '../../shared/api/api';

type Action = 'verify-email' | 'reset-password';

function currentAction(): { action: Action; token: string } | null {
  const action = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
  if (action !== 'verify-email' && action !== 'reset-password') return null;
  const token = new URLSearchParams(window.location.search).get('token');
  return token ? { action, token } : null;
}

export default function AccountActionModal() {
  const action = useMemo(currentAction, []);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    action?.action === 'verify-email' ? 'loading' : 'idle',
  );
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    if (action?.action !== 'verify-email') return;
    api.verifyEmail(action.token)
      .then(() => {
        setStatus('success');
        setMessage('Your email address has been verified.');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Email verification failed.');
      });
  }, [action]);

  if (!action) return null;

  const close = () => {
    window.history.replaceState({}, '', '/');
    window.location.reload();
  };

  const submitReset = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setStatus('error');
      setMessage('Use at least 8 characters with at least one letter and one number.');
      return;
    }
    if (password !== confirmation) {
      setStatus('error');
      setMessage('The passwords do not match.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      await api.resetPassword(action.token, password);
      setStatus('success');
      setMessage('Your password has been reset. You can now sign in.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Password reset failed.');
    }
  };

  const isVerification = action.action === 'verify-email';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4">
      <section className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
        <button type="button" onClick={close} className="absolute right-3 top-3 flex size-10 items-center justify-center text-slate-500 hover:text-slate-900" aria-label="Close">
          <X className="size-5" />
        </button>

        <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-emerald-50 text-[#006F3C]">
          {status === 'loading'
            ? <LoaderCircle className="size-6 animate-spin" />
            : status === 'error'
              ? <AlertCircle className="size-6 text-rose-600" />
              : status === 'success'
                ? <CheckCircle2 className="size-6" />
                : <KeyRound className="size-6" />}
        </div>

        <h1 className="pr-10 text-xl font-bold text-slate-900">
          {isVerification ? 'Email verification' : 'Choose a new password'}
        </h1>

        {isVerification || status === 'success' ? (
          <div className="mt-3">
            <p className={`text-sm leading-6 ${status === 'error' ? 'text-rose-700' : 'text-slate-600'}`}>
              {status === 'loading' ? 'Verifying your email address...' : message}
            </p>
            {status !== 'loading' && (
              <button type="button" onClick={close} className="mt-5 min-h-11 w-full rounded-md bg-[#006F3C] px-4 font-bold text-white hover:bg-[#005c32]">
                Continue to GBBookings
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={submitReset} className="mt-5 space-y-4">
            {message && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}
            <label className="block text-sm font-semibold text-slate-700">
              New password
              <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-[#006F3C]" required />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Confirm password
              <input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-[#006F3C]" required />
            </label>
            <button type="submit" disabled={status === 'loading'} className="flex min-h-11 w-full items-center justify-center rounded-md bg-[#006F3C] px-4 font-bold text-white hover:bg-[#005c32] disabled:opacity-60">
              {status === 'loading' ? <LoaderCircle className="size-5 animate-spin" /> : 'Reset password'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
