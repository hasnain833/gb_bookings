import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, LoaderCircle, MessageSquare, Send, ShieldCheck } from 'lucide-react';
import { api, type ChatMessage, type Conversation, type ConversationThread } from '../../shared/api/api';
import { onMessage, realtimeConnected } from '../../shared/api/realtime';
import { formatDateForDisplay } from '../../shared/utils/date';
import { handleImageError } from '../../types';

/** Opens (or starts) the thread with a listing's partner, e.g. from a booking card or listing page. */
export type InboxStart = { listingId: string; title: string; image?: string };

const POLL_MS = 15_000;
const timeLabel = (value: string) => {
  const date = new Date(value);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function Inbox({ start }: { start?: InboxStart }) {
  const [side, setSide] = useState<'guest' | 'partner'>('guest');
  const [isPartner, setIsPartner] = useState(false);
  const [unread, setUnread] = useState({ guest: 0, partner: 0 });
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draftStart, setDraftStart] = useState<InboxStart | null>(start ?? null);
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [error, setError] = useState('');
  const openRef = useRef<string | null>(null);
  openRef.current = openId;

  const loadList = useCallback(async (which = side) => {
    try {
      const list = await api.listConversations(which);
      setConversations(list);
      return list;
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load your messages.'); return []; }
  }, [side]);

  const openThread = useCallback(async (id: string) => {
    setOpenId(id); setDraftStart(null);
    try {
      const loaded = await api.getConversation(id);
      if (openRef.current !== id) return;
      setThread(loaded);
      setConversations((items) => items?.map((item) => item.id === id ? { ...item, unread: 0 } : item) ?? items);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not open this conversation.'); }
  }, []);

  useEffect(() => {
    // Partners land on their guests' messages, unless they came to message a listing themselves.
    api.unreadMessages().then((counts) => { setIsPartner(counts.isPartner); setUnread(counts); if (counts.isPartner && !start) setSide('partner'); }).catch(() => undefined);
  }, []);

  // Load the list; a start request opens that listing's thread if one exists, else a blank one to write in.
  useEffect(() => {
    setThread(null); setOpenId(null); setConversations(null);
    void loadList(side).then((list) => {
      if (side !== 'guest' || !draftStart) return;
      const existing = list.find((item) => item.listing.publicId === draftStart.listingId);
      if (existing) void openThread(existing.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

  // Realtime push; polling only when the socket is not connected (e.g. serverless hosting).
  useEffect(() => {
    const stop = onMessage(({ conversation, message }) => {
      if (conversation.side !== side) {
        setUnread((counts) => ({ ...counts, [conversation.side]: counts[conversation.side] + (message.mine ? 0 : 1) }));
        return;
      }
      setConversations((items) => [conversation, ...(items ?? []).filter((item) => item.id !== conversation.id)]);
      if (openRef.current === conversation.id) void openThread(conversation.id);
    });
    const timer = setInterval(() => {
      if (realtimeConnected()) return;
      void loadList(side);
      if (openRef.current) void openThread(openRef.current);
    }, POLL_MS);
    return () => { stop(); clearInterval(timer); };
  }, [side, loadList, openThread]);

  const send = async (body: string) => {
    const sent = draftStart ? await api.startConversation(draftStart.listingId, body) : await api.sendMessage(openId!, body);
    setConversations((items) => [sent.conversation, ...(items ?? []).filter((item) => item.id !== sent.conversation.id)]);
    if (draftStart) { setDraftStart(null); await openThread(sent.conversation.id); return sent.message; }
    setThread((current) => current && current.conversation.id === sent.conversation.id && !current.messages.some((item) => item.id === sent.message.id)
      ? { ...current, conversation: sent.conversation, messages: [...current.messages, sent.message] } : current);
    return sent.message;
  };

  const showingThread = Boolean(openId || draftStart);
  return <div className="mx-auto max-w-6xl space-y-4 pb-10">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Inbox</h1>
      {isPartner && <div role="tablist" aria-label="Whose messages" className="flex rounded-xl border border-slate-200 bg-white p-1">
        {([['partner', 'Guest messages'], ['guest', 'My trips']] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={side === id} onClick={() => { setSide(id); setDraftStart(null); }}
            className={`flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold ${side === id ? 'bg-[#006F3C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            {label}{unread[id] > 0 && side !== id && <span className="rounded-full bg-rose-600 px-1.5 text-xs text-white">{unread[id]}</span>}
          </button>
        ))}
      </div>}
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

    <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[320px_minmax(0,1fr)]">
      <aside aria-label="Conversations" className={`border-slate-200 md:border-r ${showingThread ? 'hidden md:block' : ''}`}>
        {conversations === null ? <div className="flex justify-center p-10"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading conversations" /></div>
          : conversations.length === 0 && !draftStart ? <div className="space-y-2 p-8 text-center text-sm text-slate-500"><MessageSquare className="mx-auto size-8 text-slate-300" aria-hidden="true" /><p>{side === 'partner' ? 'Questions from guests appear here.' : 'Message a host from a listing or a booking and the chat appears here.'}</p></div>
          : <ul>
            {draftStart && <li><button type="button" className="flex w-full items-center gap-3 border-b border-slate-100 bg-emerald-50 p-3 text-left"><Thumb src={draftStart.image} /><span className="min-w-0"><strong className="block truncate text-sm">{draftStart.title}</strong><span className="text-xs text-slate-500">New message</span></span></button></li>}
            {conversations.map((item) => <li key={item.id}>
              <button type="button" onClick={() => void openThread(item.id)} aria-current={openId === item.id ? 'true' : undefined}
                className={`flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${openId === item.id ? 'bg-emerald-50' : ''}`}>
                <Thumb src={item.listing.image} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2"><strong className="truncate text-sm text-slate-900">{side === 'partner' ? item.guestName ?? 'Guest' : item.partnerName ?? item.listing.title}</strong>{item.lastMessage && <span className="shrink-0 text-xs text-slate-500">{timeLabel(item.lastMessage.at)}</span>}</span>
                  <span className="block truncate text-xs text-slate-500">{item.listing.title}</span>
                  <span className="flex items-center justify-between gap-2"><span className={`truncate text-sm ${item.unread ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{item.lastMessage ? `${item.lastMessage.sender === side ? 'You: ' : ''}${item.lastMessage.body}` : ''}</span>{item.unread > 0 && <span className="shrink-0 rounded-full bg-[#006F3C] px-2 text-xs font-bold text-white">{item.unread}</span>}</span>
                </span>
              </button>
            </li>)}
          </ul>}
      </aside>

      <section aria-label="Conversation" className={`flex min-w-0 flex-col ${showingThread ? '' : 'hidden md:flex'}`}>
        {!showingThread ? <div className="m-auto p-10 text-center text-sm text-slate-500">Choose a conversation.</div>
          : <Thread key={openId ?? 'new'} side={side} thread={thread && thread.conversation.id === openId ? thread : null} draft={draftStart}
              onBack={() => { setOpenId(null); setDraftStart(null); }} onSend={send} />}
      </section>
    </div>
  </div>;
}

function Thumb({ src }: { src?: string }) {
  return src ? <img src={src} alt="" onError={handleImageError} className="size-12 shrink-0 rounded-lg object-cover" /> : <span className="size-12 shrink-0 rounded-lg bg-slate-100" />;
}

function Thread({ side, thread, draft, onBack, onSend }: {
  side: 'guest' | 'partner'; thread: ConversationThread | null; draft: InboxStart | null;
  onBack: () => void; onSend: (body: string) => Promise<ChatMessage>;
}) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hiddenNotice, setHiddenNotice] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [thread?.messages.length]);

  const title = draft?.title ?? thread?.conversation.listing.title ?? '';
  const other = side === 'partner' ? thread?.conversation.guestName ?? 'Guest' : thread?.conversation.partnerName ?? 'Host';
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true); setError('');
    try { const sent = await onSend(body); setBody(''); setHiddenNotice(sent.contactsHidden); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Message not sent. Please try again.'); }
    finally { setBusy(false); }
  };

  return <>
    <header className="flex items-center gap-3 border-b border-slate-200 p-3">
      <button type="button" onClick={onBack} aria-label="Back to conversations" className="flex size-10 items-center justify-center rounded-lg hover:bg-slate-50 md:hidden"><ArrowLeft className="size-5" /></button>
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-bold text-slate-950">{draft ? title : other}</h2>
        <p className="truncate text-xs text-slate-500">{draft ? 'Ask the host anything before or after you book' : title}</p>
      </div>
    </header>
    {thread && thread.bookings.length > 0 && <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-[#F5F7F4] px-4 py-2 text-xs text-slate-700">
      {thread.bookings.map((booking) => <span key={booking.reference} className="rounded-full bg-white px-2.5 py-1 font-semibold">{booking.reference} · {formatDateForDisplay(booking.checkIn)} · {booking.status}</span>)}
    </div>}
    <div className="h-[420px] flex-1 space-y-3 overflow-y-auto bg-[#F5F7F4]/60 p-4" aria-live="polite">
      {!thread && !draft && <div className="flex justify-center p-10"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading messages" /></div>}
      {draft && <p className="mx-auto max-w-sm rounded-xl bg-white p-4 text-center text-sm text-slate-600">Ask about rooms, meals, road access or pickup. The host usually answers here within a day.</p>}
      {thread?.messages.map((message) => <div key={message.id} className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${message.mine ? 'rounded-br-md bg-[#006F3C] text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
          <p className={`mt-1 text-[11px] ${message.mine ? 'text-emerald-100' : 'text-slate-500'}`}>{timeLabel(message.at)}{message.contactsHidden ? ' · contact details hidden' : ''}</p>
        </div>
      </div>)}
      <div ref={end} />
    </div>
    <form onSubmit={submit} className="space-y-2 border-t border-slate-200 p-3">
      {hiddenNotice && <p role="status" className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">We hid a phone number, email or link in your message. Please keep chats and payments on GBBookings so we can protect you.</p>}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1"><span className="sr-only">Message</span>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={2} maxLength={2000} placeholder="Write a message…"
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}
            className="block w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#006F3C]" /></label>
        <button disabled={busy || !body.trim()} aria-label="Send message" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#006F3C] text-white hover:bg-[#005c32] disabled:opacity-50">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</button>
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><ShieldCheck className="size-3.5" aria-hidden="true" />Phone numbers, emails and links are hidden to keep you safe.</p>
    </form>
  </>;
}
