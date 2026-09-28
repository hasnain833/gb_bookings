import { useEffect, useState } from 'react';
import { KeyRound, LoaderCircle, LogOut, MonitorSmartphone, ShieldCheck } from 'lucide-react';
import { api, type AuthSession, type AuthUser } from '../../shared/api/api';

export default function SecurityPanel() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

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
          {sessions.map((session) => (
            <div key={session.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
              <KeyRound className="size-5 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{session.userAgent}</p><p className="text-xs text-slate-500">{session.ipAddress || 'Unknown IP'} · Last used {new Date(session.lastUsedAt).toLocaleString()}</p></div>
              {session.current && <span className="text-xs font-bold text-emerald-700">Current</span>}
              <button type="button" disabled={busy} onClick={() => revoke(session)} title="Sign out session" className="flex size-10 items-center justify-center text-rose-600 hover:bg-rose-50"><LogOut className="size-4" /></button>
            </div>
          ))}
          {sessions.length === 0 && <p className="py-6 text-sm text-slate-500">No active sessions were found.</p>}
        </div>
      </section>
    </div>
  );
}
