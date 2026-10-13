import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, X } from 'lucide-react';

export interface ReasonRequest {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  /** Label for the required note; omit to ask for confirmation only. */
  noteLabel?: string;
}

const secondaryButton = 'min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700';
const primaryButton = 'min-h-11 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white transition hover:bg-[#005c32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700';

function ReasonDialog({ request, onClose }: { request: ReasonRequest; onClose: (reason: string | null) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const noteId = useId();
  const errorId = useId();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) previouslyFocused.focus();
    };
  }, []);

  return createPortal(
    <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); onClose(null); }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm">
      <form onSubmit={(event) => {
        event.preventDefault();
        if (!request.noteLabel) { onClose(''); return; }
        const reason = note.trim();
        if (reason.length < 3) { setError('Please enter a note of at least 3 characters.'); return; }
        onClose(reason);
      }}>
        <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${request.destructive ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-[#006F3C]'}`}><ShieldCheck className="size-5" /></span>
          <div className="min-w-0 flex-1"><h2 id={titleId} className="text-lg font-bold">{request.title}</h2><p id={descriptionId} className="mt-1 break-words text-sm leading-6 text-slate-600">{request.description}</p></div>
          <button type="button" onClick={() => onClose(null)} aria-label="Close dialog" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#006F3C]"><X className="size-5" /></button>
        </div>
        {request.noteLabel && <div className="space-y-2 px-6 py-5">
          <label htmlFor={noteId} className="block text-sm font-semibold">{request.noteLabel} <span className="font-normal text-slate-500">(required)</span></label>
          <textarea id={noteId} autoFocus required maxLength={1000} value={note}
            onChange={(event) => { setNote(event.target.value); setError(''); }}
            aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}
            placeholder="Add a short note…"
            className="min-h-32 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15" />
          {error && <p id={errorId} role="alert" className="text-sm text-rose-700">{error}</p>}
        </div>}
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button type="button" className={secondaryButton} onClick={() => onClose(null)}>Cancel</button>
          <button type="submit" autoFocus={!request.noteLabel} className={request.destructive ? 'min-h-11 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800' : primaryButton}>{request.confirmLabel}</button>
        </div>
      </form>
    </dialog>, document.body,
  );
}

/** `askReason` resolves to the entered note ('' for confirm-only dialogs), or null when dismissed. */
export function useReasonDialog() {
  const [request, setRequest] = useState<ReasonRequest | null>(null);
  const resolver = useRef<((reason: string | null) => void) | null>(null);
  useEffect(() => () => { resolver.current?.(null); resolver.current = null; }, []);
  const askReason = (next: ReasonRequest) => new Promise<string | null>((resolve) => {
    resolver.current?.(null);
    resolver.current = resolve;
    setRequest(next);
  });
  const close = (reason: string | null) => {
    resolver.current?.(reason);
    resolver.current = null;
    setRequest(null);
  };
  return { askReason, dialog: request && <ReasonDialog request={request} onClose={close} /> };
}
