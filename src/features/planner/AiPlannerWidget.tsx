import { lazy, Suspense, useEffect, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useBodyScrollLock } from '../../shared/utils/scrollLock';
import type { Listing } from '../../types';

const AiPlanner = lazy(() => import('./AiPlanner'));

export default function AiPlannerWidget({ onClose, onNavigate, onSelectListing }: {
  onClose: () => void; onNavigate: (view: string) => void; onSelectListing: (listing: Listing) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useBodyScrollLock(true);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} aria-labelledby="planner-widget-title" onCancel={onClose}
    onClick={(event) => { if (event.target === dialog.current) onClose(); }}
    className="fixed inset-0 m-auto h-[100dvh] max-h-[100dvh] w-full max-w-none overflow-hidden bg-slate-50 p-0 text-slate-900 backdrop:bg-slate-950/50 sm:h-[90dvh] sm:max-h-[900px] sm:w-[calc(100%-3rem)] sm:max-w-5xl sm:rounded-2xl sm:shadow-2xl">
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6"><h2 id="planner-widget-title" className="flex items-center gap-2 font-semibold"><Sparkles className="size-5 text-emerald-700" />AI Trip Planner</h2><button type="button" autoFocus onClick={onClose} aria-label="Close AI planner" className="flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="size-5" /></button></header>
    <div className="h-[calc(100%-4rem)] overflow-y-auto overscroll-contain p-4 sm:p-6"><Suspense fallback={<p className="py-10 text-center text-sm text-slate-500" role="status">Opening your planner…</p>}><AiPlanner setView={(view) => { onClose(); onNavigate(view); }} onSelectListing={(listing) => { onClose(); onSelectListing(listing); }} /></Suspense></div>
  </dialog>;
}
