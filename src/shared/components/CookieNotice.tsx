import { useState } from 'react';

const KEY = 'gb.cookieNotice';

function seen() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

/** The site only uses cookies it needs to work, so there is nothing to opt out of: this tells people, once. */
export default function CookieNotice() {
  const [open, setOpen] = useState(() => !seen());
  if (!open) return null;
  const close = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* storage unavailable: it shows again next visit */ }
    setOpen(false);
  };
  return <aside aria-label="Cookies" className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-40 flex max-w-md flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-lg sm:right-auto lg:bottom-6 lg:left-6">
    <p className="min-w-0 flex-1 basis-56">We only use the cookies needed to keep you signed in and your booking safe. No advertising or tracking. <a href="/privacy" className="font-semibold text-[#006F3C] underline">Privacy Policy</a></p>
    <button type="button" onClick={close} className="min-h-10 rounded-lg bg-[#006F3C] px-4 font-semibold text-white hover:bg-[#005c32]">OK</button>
  </aside>;
}
