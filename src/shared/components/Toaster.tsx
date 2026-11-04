import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

type Kind = 'success' | 'error';
type Toast = { id: number; message: string; kind: Kind };

const EVENT = 'gb:toast';
const FLASH_KEY = 'gb.toast';

export function toast(message: string, kind: Kind = 'success') {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, kind } }));
}

/** Shown after the next page load, for actions that reload the page (e.g. signing out). */
export function flashToast(message: string, kind: Kind = 'success') {
  try { sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, kind })); } catch { /* storage unavailable: no message */ }
}

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const show = ({ message, kind }: { message: string; kind: Kind }) => {
      const id = Date.now() + Math.random();
      setToasts((items) => [...items, { id, message, kind }]);
      window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 5000);
    };
    const onToast = (event: Event) => show((event as CustomEvent).detail);
    window.addEventListener(EVENT, onToast);
    try {
      const flash = sessionStorage.getItem(FLASH_KEY);
      if (flash) { sessionStorage.removeItem(FLASH_KEY); show(JSON.parse(flash)); }
    } catch { /* storage unavailable */ }
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-3 z-[300] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:items-end">
    {toasts.map((item) => <div key={item.id} role={item.kind === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-medium text-slate-800 shadow-lg animate-fadeIn">
      {item.kind === 'error' ? <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#006F3C]" />}
      <span className="min-w-0 flex-1">{item.message}</span>
      <button type="button" aria-label="Dismiss" onClick={() => setToasts((items) => items.filter((other) => other.id !== item.id))} className="-m-1 p-1 text-slate-400 hover:text-slate-700"><X className="size-4" /></button>
    </div>)}
  </div>;
}
