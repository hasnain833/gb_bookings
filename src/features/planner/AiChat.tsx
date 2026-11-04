import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MapPin, RotateCcw, Send, Sparkles, Star, X } from 'lucide-react';
import { api, ApiError } from '../../shared/api/api';
import { handleImageError, type Listing } from '../../types';

type Message = { role: 'user' | 'assistant'; text: string };

const STORAGE_KEY = 'gb.tripChat';
const STARTERS = ['Plan a 5-day Hunza trip', 'A family trip on a budget', 'Best time to visit Skardu', 'I need a car with a driver'];
const LISTING_TOKEN = /\s*\[\[(lst_[\w-]+)\]\]/g;

function savedMessages(): Message[] {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}

const unitLabel = (listing: Listing) => ['hotel', 'homestay'].includes(listing.type) ? 'night' : listing.type === 'car' ? 'day' : 'person';

/** A listing the assistant recommended, read from the live catalogue so the price is never the model's. */
function ListingChip({ id, onSelect }: { id: string; onSelect: (listing: Listing) => void }) {
  const [listing, setListing] = useState<Listing | null>(null);
  useEffect(() => {
    let active = true;
    api.getListing(id).then((result) => active && setListing(result)).catch(() => undefined);
    return () => { active = false; };
  }, [id]);
  if (!listing) return null;
  return <button type="button" onClick={() => onSelect(listing)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 text-start hover:border-[#006F3C]">
    <img src={listing.image} alt="" onError={handleImageError} className="size-14 shrink-0 rounded-lg object-cover" />
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold text-slate-900">{listing.title}</span>
      <span className="flex items-center gap-1 truncate text-xs text-slate-500"><MapPin className="size-3 shrink-0" />{listing.location}{listing.reviewsCount > 0 && <><Star className="ms-1 size-3 shrink-0 fill-amber-400 text-amber-400" />{listing.rating}</>}</span>
      <span className="block text-xs font-semibold text-slate-800">From PKR {listing.price.toLocaleString()} / {unitLabel(listing)}</span>
    </span>
  </button>;
}

/** The trip assistant: a small chat window that talks with the traveller, then recommends real listings. */
export default function AiChat({ onClose, onSelectListing }: { onClose: () => void; onSelectListing: (listing: Listing) => void }) {
  const [messages, setMessages] = useState<Message[]>(savedMessages);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { field.current?.focus(); }, []);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch { /* storage unavailable: the chat ends with the page */ }
  }, [messages, thinking]);

  const send = async (text: string) => {
    const body = text.trim();
    if (!body || thinking) return;
    const next = [...messages, { role: 'user' as const, text: body }];
    setMessages(next); setDraft(''); setError(''); setThinking(true);
    try {
      // The server takes the last 30 messages at most, which is plenty of context for a trip.
      setMessages([...next, { role: 'assistant', text: await api.tripChat(next.slice(-30)) }]);
    } catch (reason) {
      setError(reason instanceof ApiError && reason.status === 503 ? 'The trip assistant is not available right now. Please try again later, or browse stays yourself.' : reason instanceof Error ? reason.message : 'That didn’t send. Please try again.');
      setMessages(messages); setDraft(body);
    } finally { setThinking(false); field.current?.focus(); }
  };

  const submit = (event: FormEvent) => { event.preventDefault(); void send(draft); };

  return <section role="dialog" aria-label="Trip assistant" className="fixed inset-x-0 bottom-0 z-90 flex h-[85dvh] flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl animate-fadeIn sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(640px,calc(100dvh-3rem))] sm:w-[400px] sm:rounded-2xl">
    <header className="flex items-center gap-3 bg-forest-950 px-4 py-3 text-white">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10"><Sparkles className="size-5 text-emerald-300" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-bold">GBBookings trip assistant</h2><p className="truncate text-xs text-slate-300">Ask me anything about your trip</p></div>
      {messages.length > 0 && <button type="button" aria-label="Start again" title="Start again" onClick={() => { setMessages([]); setError(''); }} className="flex size-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"><RotateCcw className="size-4" /></button>}
      <button type="button" aria-label="Close" onClick={onClose} className="flex size-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"><X className="size-5" /></button>
    </header>

    <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
      {messages.length === 0 && <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50"><Sparkles className="size-7 text-[#006F3C]" aria-hidden="true" /></span>
        <div><p className="font-bold text-slate-900">Where would you like to go?</p><p className="mt-1 text-sm leading-5 text-slate-500">Tell me what you enjoy and I'll help you plan, then suggest places you can book.</p></div>
        <div className="flex flex-wrap justify-center gap-2 pt-1">{STARTERS.map((starter) => <button key={starter} type="button" onClick={() => void send(starter)} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#006F3C] hover:text-[#006F3C]">{starter}</button>)}</div>
      </div>}

      {messages.map((message, index) => {
        const mine = message.role === 'user';
        const ids = mine ? [] : [...new Set([...message.text.matchAll(LISTING_TOKEN)].map((match) => match[1]))];
        const text = message.text.replace(LISTING_TOKEN, '').trim();
        return <div key={index} className={`space-y-2 ${mine ? 'flex justify-end' : ''}`}>
          <p className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${mine ? 'bg-[#006F3C] text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>{text}</p>
          {ids.map((id) => <ListingChip key={id} id={id} onSelect={onSelectListing} />)}
        </div>;
      })}

      {thinking && <p className="inline-flex gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3" role="status" aria-label="The assistant is typing">
        {[0, 150, 300].map((delay) => <span key={delay} className="size-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${delay}ms` }} />)}
      </p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    </div>

    <form onSubmit={submit} className="border-t border-slate-200 bg-white p-3">
      <div className="flex items-end gap-2 rounded-xl border border-slate-300 px-3 py-2 focus-within:border-[#006F3C]">
        <textarea ref={field} rows={1} maxLength={1000} aria-label="Your message" placeholder="Ask about your trip…" value={draft} onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(draft); } }}
          className="max-h-28 min-h-7 flex-1 resize-none bg-transparent text-sm outline-none" />
        <button type="submit" disabled={thinking || !draft.trim()} aria-label="Send" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#006F3C] text-white disabled:opacity-40"><Send className="size-4 rtl:rotate-180" /></button>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-slate-400">AI suggestions can be wrong. Prices and dates are confirmed on the listing.</p>
    </form>
  </section>;
}
