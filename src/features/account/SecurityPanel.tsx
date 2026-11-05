import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, LogOut, Mail, MonitorSmartphone, ShieldCheck, Trash2, X } from 'lucide-react';
import { api, type AuthSession, type AuthUser } from '../../shared/api/api';
import { isValidPassword, passwordChecks, PASSWORD_REQUIREMENTS } from '../../shared/utils/password';
import { toast } from '../../shared/components/Toaster';
import { deviceName } from '../../shared/utils/device';

const SESSIONS_SHOWN = 3;
const primary = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white hover:bg-[#005c32] disabled:opacity-50';
const secondary = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const danger = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50';
const input = 'mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/20';
const codeInput = `${input} max-w-44 font-mono text-lg tracking-[0.3em]`;

const errorText = (reason: unknown, fallback: string) => reason instanceof Error ? reason.message : fallback;

function Row({ icon, title, text, action, children, tone }: { icon: ReactNode; title: string; text: string; action?: ReactNode; children?: ReactNode; tone?: 'danger' }) {
  return <section className="py-5 first:pt-0 last:pb-0">
    <div className="flex flex-wrap items-center gap-4">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-[#006F3C]'}`}>{icon}</span>
      <div className="min-w-48 flex-1"><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-0.5 text-sm leading-5 text-slate-500">{text}</p></div>
      {action}
    </div>
    {children && <div className="mt-4 sm:pl-14">{children}</div>}
  </section>;
}

/** Email code, then the new password. This device stays signed in; the other ones are signed out. */
function ChangePasswordDialog({ email, challengeId, onResend, onClose }: { email: string; challengeId: string; onResend: () => Promise<void>; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidPassword(password)) { setError(PASSWORD_REQUIREMENTS); return; }
    if (password !== confirmation) { setError('The passwords do not match.'); return; }
    setBusy(true); setError('');
    try {
      await api.changePassword(challengeId, code, password);
      toast('Your password has been changed. Other devices were signed out.');
      onClose();
    } catch (reason) { setError(errorText(reason, 'Unable to change your password.')); setBusy(false); }
  };

  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="change-password-title" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-0 backdrop:bg-slate-950/60">
    <form onSubmit={submit} className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 id="change-password-title" className="text-lg font-bold text-slate-900">Change your password</h2>
        <button type="button" aria-label="Close" onClick={onClose} className="-m-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="size-5" /></button>
      </div>
      <p className="flex gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"><Mail className="mt-0.5 size-4 shrink-0" /><span>We sent a 6-digit code to <strong>{email}</strong>.</span></p>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-slate-700">Code from your email
          <input required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" title="Enter the 6-digit code from your email." maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className={codeInput} />
        </label>
        <button type="button" disabled={busy} onClick={() => void onResend().then(() => setError('')).catch((reason) => setError(errorText(reason, 'Unable to send a new code.')))} className="mt-1 min-h-9 text-sm font-semibold text-[#006F3C]">Send a new code</button>
      </div>
      <div>
        <label htmlFor="security-new-password" className="block text-sm font-medium text-slate-700">New password</label>
        <div className="relative">
          <input id="security-new-password" required type={show ? 'text' : 'password'} autoComplete="new-password" maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} className={`${input} pr-10`} />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 mt-0.5 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">{passwordChecks(password).map((check) => <li key={check.label} className={`flex items-center gap-1.5 ${check.valid ? 'text-emerald-700' : 'text-slate-500'}`}><CheckCircle2 className="size-3 shrink-0" />{check.label}</li>)}</ul>
      </div>
      <label className="block text-sm font-medium text-slate-700">Confirm new password
        <input required type={show ? 'text' : 'password'} autoComplete="new-password" maxLength={72} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={input} />
      </label>
      {confirmation && password !== confirmation && <p className="text-xs text-rose-700">The passwords do not match.</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className={secondary} disabled={busy} onClick={onClose}>Cancel</button>
        <button className={primary} disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
      </div>
    </form>
  </dialog>;
}

export default function SecurityPanel() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [showAllSessions, setShowAllSessions] = useState(false);
  // This device first, then the most recently used.
  const sortedSessions = [...sessions].sort((a, b) => Number(b.current) - Number(a.current) || Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt));
  const visibleSessions = showAllSessions ? sortedSessions : sortedSessions.slice(0, SESSIONS_SHOWN);
  const [loading, setLoading] = useState(true);
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordChallenge, setPasswordChallenge] = useState('');
  const [deleteChallenge, setDeleteChallenge] = useState('');
  const [deleteCode, setDeleteCode] = useState('');
  const [disabling, setDisabling] = useState(false);
  // Partner and admin accounts are closed by support (the server enforces this too).
  const isAdmin = (user?.roles ?? []).includes('admin');
  const customerOnly = (user?.roles ?? [user?.role ?? 'customer']).every((role) => role === 'customer');

  useEffect(() => {
    Promise.all([api.getCurrentUser(), api.getSessions()])
      .then(([userResult, sessionResult]) => { setUser(userResult.user); setSessions(sessionResult); })
      .catch((reason) => toast(errorText(reason, 'Unable to load account security.'), 'error'))
      .finally(() => setLoading(false));
  }, []);

  /** Runs an action with the buttons locked; failures show as a toast. */
  const act = async (action: () => Promise<void>, fallback: string) => {
    setBusy(true);
    try { await action(); } catch (reason) { toast(errorText(reason, fallback), 'error'); } finally { setBusy(false); }
  };

  const sendPasswordCode = async () => setPasswordChallenge((await api.requestPasswordChangeCode()).challengeId);

  if (loading) return <div className="flex min-h-40 items-center justify-center"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" /></div>;

  return <div className="divide-y divide-slate-200 animate-fadeIn">
    {!user?.emailVerified && <Row icon={<Mail className="size-5" />} title="Verify your email" text="Needed for partner registration and security codes."
      action={<button type="button" disabled={busy} className={primary} onClick={() => void act(async () => { await api.requestEmailVerification(); toast('Verification email sent. Open the link in your inbox.'); }, 'Unable to send verification email.')}>Send verification email</button>} />}

    <Row icon={<KeyRound className="size-5" />} title="Password" text="We email you a code first, to make sure it's really you. You stay signed in on this device."
      action={<button type="button" disabled={busy || !user?.emailVerified} className={secondary} onClick={() => void act(sendPasswordCode, 'Unable to send the code.')}>{busy ? 'Sending…' : 'Change password'}</button>} />
    {passwordChallenge && user && <ChangePasswordDialog email={user.email} challengeId={passwordChallenge} onResend={sendPasswordCode} onClose={() => setPasswordChallenge('')} />}

    <Row icon={<ShieldCheck className="size-5" />} title="Two-step sign-in" text={isAdmin ? 'Always on for admin accounts: we email you a code when you sign in on a new device.' : user?.twoFactorEnabled ? `On. We ask for a code from your ${user.twoFactorChannel} when you sign in on a new device.` : 'Ask for an emailed code when signing in on a new device.'}
      action={isAdmin ? undefined : user?.twoFactorEnabled
        ? <button type="button" className={danger} disabled={busy} onClick={() => setDisabling(!disabling)}>{disabling ? 'Keep it on' : 'Turn off'}</button>
        : !challengeId && <button type="button" className={secondary} disabled={busy || !user?.emailVerified} onClick={() => void act(async () => { setChallengeId((await api.beginTwoFactorSetup('email')).challengeId); toast('We emailed you a security code.'); }, 'Unable to start two-step sign-in.')}>Turn on</button>}>
      {user?.twoFactorEnabled && disabling && <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); void act(async () => { await api.disableTwoFactor(password); window.location.reload(); }, 'Unable to turn off two-step sign-in.'); }}>
        <label className="min-w-56 flex-1 text-sm font-medium text-slate-700">Your password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={input} /></label>
        <button className={danger} disabled={busy}>Turn off two-step sign-in</button>
      </form>}
      {!user?.twoFactorEnabled && challengeId && <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); void act(async () => { setUser((await api.enableTwoFactor(challengeId, code)).user); setChallengeId(''); setCode(''); toast('Two-step sign-in is on.'); }, 'Unable to turn on two-step sign-in.'); }}>
        <label className="text-sm font-medium text-slate-700">Code from your email<input required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" title="Enter the 6-digit code from your email." maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className={codeInput} /></label>
        <button className={primary} disabled={busy}>Confirm</button>
        <button type="button" className={secondary} disabled={busy} onClick={() => { setChallengeId(''); setCode(''); }}>Cancel</button>
      </form>}
    </Row>

    <Row icon={<MonitorSmartphone className="size-5" />} title="Signed-in devices" text="Sign out of any device you don't recognise.">
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {visibleSessions.map((session) => <li key={session.id} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800" title={session.userAgent}>{deviceName(session.userAgent)}{session.current && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">This device</span>}</p><p className="text-xs text-slate-500">{session.ipAddress || 'Unknown IP'} · Last used {new Date(session.lastUsedAt).toLocaleString()}</p></div>
          <button type="button" disabled={busy} aria-label={`Sign out ${deviceName(session.userAgent)}`} title="Sign out" onClick={() => void act(async () => { await api.revokeSession(session.id); if (session.current) window.location.reload(); else { setSessions((items) => items.filter((item) => item.id !== session.id)); toast('That device has been signed out.'); } }, 'Unable to sign out that device.')} className="flex size-10 shrink-0 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"><LogOut className="size-4" /></button>
        </li>)}
        {sessions.length === 0 && <li className="p-4 text-sm text-slate-500">No signed-in devices were found.</li>}
      </ul>
      {sessions.length > SESSIONS_SHOWN && <button type="button" aria-expanded={showAllSessions} onClick={() => setShowAllSessions(!showAllSessions)} className="mt-2 min-h-11 text-sm font-semibold text-[#006F3C]">{showAllSessions ? 'Show fewer' : `Show all ${sessions.length} devices`}</button>}
    </Row>

    <Row tone="danger" icon={<Trash2 className="size-5" />} title="Delete account" text={customerOnly ? 'Removes your name, email, phone, saved stays and sign-in for good. Past bookings stay with the property under the details you booked with.' : 'Partner and admin accounts are closed by GBBookings support. Email info@gbbookings.com.'}
      action={customerOnly && !deleteChallenge ? <button type="button" disabled={busy} className={danger} onClick={() => void act(async () => { setDeleteChallenge((await api.requestAccountDeletion()).challengeId); toast('We emailed you a code to confirm.'); }, 'Unable to start account deletion.')}>Delete my account</button> : undefined}>
      {customerOnly && deleteChallenge && <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); void act(async () => { await api.deleteAccount(deleteChallenge, deleteCode); window.location.assign('/'); }, 'Unable to delete the account.'); }}>
        <label className="text-sm font-medium text-slate-700">Code from your email<input required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" title="Enter the 6-digit code from your email." maxLength={6} value={deleteCode} onChange={(event) => setDeleteCode(event.target.value.replace(/\D/g, ''))} className={codeInput} /></label>
        <button className="inline-flex min-h-11 items-center rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={busy}>Delete my account for good</button>
        <button type="button" className={secondary} disabled={busy} onClick={() => { setDeleteChallenge(''); setDeleteCode(''); }}>Keep my account</button>
      </form>}
    </Row>
  </div>;
}
