import { useEffect, useState } from 'react';
import { LoaderCircle, UserPlus, Users } from 'lucide-react';
import { api, type TeamMember } from '../../shared/api/api';
import { useReasonDialog } from '../../shared/components/ReasonDialog';

const fieldClass = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';
const roleLabels: Record<TeamMember['role'], string> = { owner: 'Owner', manager: 'Manager', listings: 'Listings', reservations: 'Reception', finance: 'Finance' };

/** The owner adds managers (hotels, rooms, reservations, reports) and reception staff (reservations only). */
export default function HotelTeam() {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'reservations' as 'manager' | 'reservations' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { askReason, dialog } = useReasonDialog();

  useEffect(() => { api.getTeam().then(setMembers).catch((reason: Error) => setError(reason.message)); }, []);

  const add = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const result = await api.addTeamMember(form);
      setMembers((items) => [...(items ?? []), result.data]);
      setForm({ name: '', email: '', role: form.role });
      setMessage(result.newAccount
        ? result.passwordSetupSent ? `${result.data.email} was invited and emailed a link to choose a password.` : `${result.data.email} was added, but the password email could not be sent. Ask them to use "Forgot password" on the sign-in screen.`
        : `${result.data.email} already had a GBBookings account and now has access.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The team member could not be added.'); }
    finally { setBusy(false); }
  };

  const remove = async (member: TeamMember) => {
    if (await askReason({ title: `Remove ${member.name ?? member.email}?`, destructive: true, confirmLabel: 'Remove access', description: 'They lose access to your partner dashboard immediately. Their own GBBookings account stays.' }) === null) return;
    setError(''); setMessage('');
    try { await api.removeTeamMember(member.id); setMembers((items) => items?.filter((item) => item.id !== member.id) ?? null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Access could not be removed.'); }
  };

  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6" aria-labelledby="team-heading">
      {dialog}
      <div className="flex items-center gap-3"><Users className="size-5 text-[#006F3C]" /><h2 id="team-heading" className="font-bold text-slate-900">Team</h2></div>
      <p className="text-sm text-slate-600"><strong>Managers</strong> can manage hotels, rooms, reservations and reports. <strong>Reception</strong> can only see and manage reservations. Only you can change business details and the team.</p>
      {message && <p role="status" className="border-l-4 border-[#006F3C] bg-emerald-50 p-3 text-sm text-slate-700">{message}</p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {!members ? <div className="flex justify-center py-6"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading team" /></div> : (
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {members.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{member.name}</p><p className="truncate text-xs text-slate-500">{member.email}</p></div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{roleLabels[member.role]}</span>
              {member.role !== 'owner' && <button type="button" onClick={() => remove(member)} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50">Remove</button>}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <label className="text-xs font-semibold text-slate-600">Name<input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={`${fieldClass} mt-1`} /></label>
        <label className="text-xs font-semibold text-slate-600">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={`${fieldClass} mt-1`} /></label>
        <label className="text-xs font-semibold text-slate-600">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as typeof form.role })} className={`${fieldClass} mt-1`}><option value="reservations">Reception</option><option value="manager">Manager</option></select></label>
        <button disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white hover:bg-[#005c32] disabled:opacity-50"><UserPlus className="size-4" />{busy ? 'Adding…' : 'Add'}</button>
      </form>
    </section>
  );
}
