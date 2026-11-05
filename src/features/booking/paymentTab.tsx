import { useEffect, useState } from 'react';
import { ExternalLink, LoaderCircle } from 'lucide-react';

/**
 * Safepay opens in its own tab, so its page is never in the main tab's history and Back cannot return to it.
 * When Safepay sends the guest back, that tab tells the main tab, which shows the result, and then closes itself.
 * If the browser blocks the new tab, payment falls back to the same tab.
 */
const CHANNEL = 'gb-payment';
const ANSWER_WAIT_MS = 500;

type PaymentReturn = { bookingId: string; cancelled: boolean };

/** Must run straight from the click, before any waiting, or the browser blocks it. */
export function openPaymentTab() {
  const tab = window.open('', '_blank');
  if (!tab) return null;
  tab.opener = null;
  tab.document.title = 'Opening secure payment';
  tab.document.body.textContent = 'Opening the secure payment page…';
  return tab;
}

export function sendToPayment(tab: Window | null, url: string) {
  if (tab && !tab.closed) tab.location.replace(url);
  else window.location.replace(url);
}

const resultUrl = ({ bookingId, cancelled }: PaymentReturn) => `/bookings?payment=${encodeURIComponent(bookingId)}&main=1${cancelled ? '&cancelled=1' : ''}`;

/** On the page Safepay returned to: true if a main tab was waiting, so this one was only ever the payment tab. */
export function announcePaymentReturn(payment: PaymentReturn) {
  return new Promise<boolean>((resolve) => {
    if (typeof BroadcastChannel === 'undefined') { resolve(false); return; }
    const channel = new BroadcastChannel(CHANNEL);
    const finish = (answered: boolean) => { channel.close(); resolve(answered); };
    const timer = window.setTimeout(() => finish(false), ANSWER_WAIT_MS);
    channel.onmessage = (event) => {
      if (event.data?.type === 'received' && event.data.bookingId === payment.bookingId) { window.clearTimeout(timer); finish(true); }
    };
    channel.postMessage({ type: 'returned', ...payment });
  });
}

/** Shown in the main tab while the guest pays in the other one. */
export function PaymentWaiting({ bookingId, url }: { bookingId: string; url: string }) {
  const [blocked, setBlocked] = useState(false);
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event) => {
      if (event.data?.type !== 'returned' || event.data.bookingId !== bookingId) return;
      channel.postMessage({ type: 'received', bookingId });
      window.location.replace(resultUrl(event.data));
    };
    return () => channel.close();
  }, [bookingId]);

  return <section role="status" className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-7 text-center">
    <LoaderCircle className="mx-auto size-8 animate-spin text-[#006F3C]" aria-hidden="true" />
    <h1 className="text-xl font-bold text-slate-950">Finish paying in the new tab</h1>
    <p className="text-sm leading-6 text-slate-600">Safepay's secure page opened in another tab. Keep this page open: it updates as soon as you're done. Your room is held for you meanwhile.</p>
    {blocked && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">Your browser blocked the tab. Allow pop-ups for this site, or press the button again.</p>}
    <div className="flex flex-col gap-2">
      <button type="button" onClick={() => { const tab = window.open(url, '_blank'); setBlocked(!tab); if (tab) tab.opener = null; }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ExternalLink className="size-4" aria-hidden="true" />Open the payment page again</button>
      <button type="button" onClick={() => window.location.replace(resultUrl({ bookingId, cancelled: false }))} className="min-h-11 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white hover:bg-[#005c32]">I've finished paying</button>
    </div>
  </section>;
}
