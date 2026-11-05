import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { api } from '../../shared/api/api';
import { flashToast } from '../../shared/components/Toaster';

const input = 'mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/20';
const code = `${input} max-w-44 font-mono text-lg tracking-[0.3em]`;
const CODE_RULE = { inputMode: 'numeric', autoComplete: 'one-time-code', pattern: '\\d{6}', title: 'Enter the 6-digit code from that email.', maxLength: 6, required: true } as const;

/** A code goes to both addresses, so neither a stolen session nor a mistyped address can take over the account. */
export default function ChangeEmailDialog({ currentEmail, onClose }: { currentEmail: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [newEmail, setNewEmail] = useState('');
  const [challenges, setChallenges] = useState<{ currentChallengeId: string; newChallengeId: string } | null>(null);
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try { setChallenges(await api.requestEmailChange(newEmail.trim().toLowerCase())); setCurrentCode(''); setNewCode(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The codes could not be sent.'); }
    finally { setBusy(false); }
  };

  const confirm = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await api.confirmEmailChange({ ...challenges!, currentCode, newCode });
      flashToast(`Your email is now ${newEmail.trim().toLowerCase()}. Other devices were signed out.`);
      window.location.reload();
    } catch (reason) {
      // A used or wrong code may have spent that attempt, so offer fresh ones.
      setError(`${reason instanceof Error ? reason.message : 'That did not work.'} If it keeps failing, go back and send new codes.`);
      setBusy(false);
    }
  };

  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="change-email-title" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-0 backdrop:bg-slate-950/60">
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 id="change-email-title" className="text-lg font-bold text-slate-900">Change your email</h2>
        <button type="button" aria-label="Close" onClick={onClose} className="-m-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="size-5" /></button>
      </div>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {!challenges ? <form onSubmit={send} className="space-y-4">
        <p className="text-sm text-slate-600">Now: <strong className="font-semibold text-slate-900">{currentEmail}</strong>. We'll send a code to this address and one to the new one.</p>
        <label className="block text-sm font-medium text-slate-700">New email<input required autoFocus type="email" autoComplete="email" maxLength={254} value={newEmail} onChange={(event) => setNewEmail(event.target.value)} className={input} /></label>
        <button disabled={busy} className="min-h-11 w-full rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Sending…' : 'Send the codes'}</button>
      </form> : <form onSubmit={confirm} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">Code sent to {currentEmail}<input autoFocus {...CODE_RULE} value={currentCode} onChange={(event) => setCurrentCode(event.target.value.replace(/\D/g, ''))} className={code} /></label>
        <label className="block text-sm font-medium text-slate-700">Code sent to {newEmail.trim().toLowerCase()}<input {...CODE_RULE} value={newCode} onChange={(event) => setNewCode(event.target.value.replace(/\D/g, ''))} className={code} /></label>
        <div className="flex justify-between gap-2">
          <button type="button" disabled={busy} onClick={() => { setChallenges(null); setError(''); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50">Back</button>
          <button disabled={busy} className="min-h-11 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Change email'}</button>
        </div>
      </form>}
    </div>
  </dialog>;
}
