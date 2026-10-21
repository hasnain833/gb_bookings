import { useEffect, useState } from 'react';
import { KeyRound, LoaderCircle, LogOut, MonitorSmartphone, ShieldCheck } from 'lucide-react';
import { api, type AuthSession, type AuthUser } from '../../shared/api/api';
import { PASSWORD_PATTERN, PASSWORD_REQUIREMENTS } from '../../shared/utils/password';

const SESSIONS_SHOWN = 3;

/** "Chrome on Windows" from a user-agent string; scripts and tools read as such. */
export function deviceName(userAgent: string) {
  const ua = userAgent || '';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : null;
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iPhone' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : null;
  if (browser) return os ? `${browser} on ${os}` : browser;
  if (/^(node|curl|axios|python|postman|undici)/i.test(ua)) return 'App or script (not a browser)';
  return ua ? ua.slice(0, 40) : 'Unknown device';
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
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [userResult, sessionResult] = await Promise.all([api.getCurrentUser(), api.getSessions()]);
      setUser(userResult.user);
      setSessions(sessionResult);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load account security.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const beginSetup = async () => {
    setBusy(true); setMessage('');
    try {
      const result = await api.beginTwoFactorSetup('email');
      setChallengeId(result.challengeId);
      setMessage('A security code was sent to your verified email address.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start two-factor setup.');
    } finally { setBusy(false); }
  };

  const confirmSetup = async () => {
    setBusy(true); setMessage('');
    try {
      const result = await api.enableTwoFactor(challengeId, code);
      setUser(result.user); setChallengeId(''); setCode('');
      setMessage('Two-factor authentication is enabled.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to enable two-factor authentication.');
    } finally { setBusy(false); }
  };

  const disable = async () => {
    setBusy(true); setMessage('');
    try {
      await api.disableTwoFactor(password);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to disable two-factor authentication.');
      setBusy(false);
    }
  };

  const revoke = async (session: AuthSession) => {
    setBusy(true); setMessage('');
    try {
      await api.revokeSession(session.id);
      if (session.current) window.location.reload();
      else setSessions((items) => items.filter((item) => item.id !== session.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to revoke the session.');
    } finally { setBusy(false); }
  };

  if (loading) return <div className="flex min-h-40 items-center justify-center"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" /></div>;

  return (
    <div className="space-y-8 animate-fadeIn">
      {message && <p className="border-l-4 border-[#006F3C] bg-emerald-50 p-3 text-sm text-slate-700">{message}</p>}

      {!user?.emailVerified && <section className="space-y-3 border-y border-slate-200 py-4">
        <h3 className="font-bold">Verify your email</h3>
        <p className="text-sm text-slate-600">Email verification is required for vendor registration and email security codes.</p>
        <button type="button" disabled={busy} className="min-h-11 rounded-md bg-[#006F3C] px-4 text-sm font-bold text-white" onClick={async () => {
          setBusy(true); setMessage('');
          try { await api.requestEmailVerification(); setMessage('Verification email requested. Open the link in your inbox, then reload this page.'); }
          catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Unable to send verification email.'); }
          finally { setBusy(false); }
        }}>Send verification email</button>
      </section>}

      <form className="grid gap-3 border-y border-slate-200 py-4 sm:grid-cols-2" onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setMessage('');
        try { await api.changePassword(currentPassword, newPassword); window.location.reload(); }
        catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Unable to change password.'); setBusy(false); }
      }}>
        <h3 className="font-bold sm:col-span-2">Change password</h3>
        <p className="text-xs leading-5 text-slate-500 sm:col-span-2">{PASSWORD_REQUIREMENTS}</p>
        <label className="text-xs font-semibold">Current password<input required type="password" autoComplete="current-password" className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
        <label className="text-xs font-semibold">New password<input required type="password" autoComplete="new-password" minLength={8} maxLength={72} pattern={PASSWORD_PATTERN} title={PASSWORD_REQUIREMENTS} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
        <button disabled={busy} className="min-h-11 rounded-md bg-[#006F3C] px-4 text-sm font-bold text-white sm:col-span-2">Change password and sign out all devices</button>
      </form>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <ShieldCheck className="size-5 text-[#006F3C]" />
          <div><h3 className="font-bold text-slate-900">Two-factor authentication</h3><p className="text-xs text-slate-500">Require an emailed security code when signing in.</p></div>
        </div>
        {user?.twoFactorEnabled ? (
          <div className="flex flex-col gap-3 border-y border-slate-200 py-4 sm:flex-row sm:items-end">
            <div className="flex-1"><p className="text-sm font-semibold text-emerald-700">Enabled via {user.twoFactorChannel}</p><label className="mt-3 block text-xs font-semibold text-slate-600">Current password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 min-h-11 w-full max-w-sm rounded-md border border-slate-300 px-3" /></label></div>
            <button type="button" disabled={busy || !password} onClick={disable} className="min-h-11 rounded-md border border-rose-300 px-4 text-sm font-bold text-rose-700 disabled:opacity-50">Disable</button>
          </div>
        ) : challengeId ? (
          <div className="flex flex-col gap-3 border-y border-slate-200 py-4 sm:flex-row sm:items-end">
            <label className="flex-1 text-xs font-semibold text-slate-600">Six-digit code<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className="mt-1 min-h-11 w-full max-w-xs rounded-md border border-slate-300 px-3 font-mono text-lg" /></label>
            <button type="button" disabled={busy || code.length !== 6} onClick={confirmSetup} className="min-h-11 rounded-md bg-[#006F3C] px-4 text-sm font-bold text-white disabled:opacity-50">Confirm and enable</button>
          </div>
        ) : (
          <button type="button" disabled={busy || !user?.emailVerified} onClick={beginSetup} className="min-h-11 rounded-md bg-[#006F3C] px-4 text-sm font-bold text-white disabled:opacity-50">
            {user?.emailVerified ? 'Enable email verification codes' : 'Verify email before enabling'}
          </button>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3"><MonitorSmartphone className="size-5 text-indigo-600" /><div><h3 className="font-bold text-slate-900">Active sessions</h3><p className="text-xs text-slate-500">Devices currently signed in to your account.</p></div></div>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {visibleSessions.map((session) => (
            <div key={session.id} className="flex items-center gap-3 py-3.5">
              <KeyRound className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800" title={session.userAgent}>{deviceName(session.userAgent)}</p><p className="text-xs text-slate-500">{session.ipAddress || 'Unknown IP'} · Last used {new Date(session.lastUsedAt).toLocaleString()}</p></div>
              {session.current && <span className="text-xs font-bold text-emerald-700">This device</span>}
              <button type="button" disabled={busy} onClick={() => revoke(session)} aria-label={`Sign out ${deviceName(session.userAgent)}`} title="Sign out session" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"><LogOut className="size-4" /></button>
            </div>
          ))}
          {sessions.length === 0 && <p className="py-6 text-sm text-slate-500">No active sessions were found.</p>}
        </div>
        {sessions.length > SESSIONS_SHOWN && <button type="button" aria-expanded={showAllSessions} onClick={() => setShowAllSessions(!showAllSessions)} className="mt-2 min-h-11 text-sm font-bold text-[#006F3C] underline">
          {showAllSessions ? 'Show fewer' : `Show all ${sessions.length} devices`}</button>}
      </section>
    </div>
  );
}
