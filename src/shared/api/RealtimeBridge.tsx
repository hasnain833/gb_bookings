import { useEffect, useState } from 'react';
import { useRealtime } from 'inngest/react';
import { api } from './api';
import { deliverMessage, setRealtimeConnected, type MessageEvent } from './realtime';

function Connection({ channel, token }: { channel: string; token: { key: string; apiBaseUrl: string } }) {
  // historyLimit is small because each message is handled as it arrives and then dropped.
  const { messages, connectionStatus } = useRealtime({
    channel, topics: ['message'], historyLimit: 20,
    // A reconnect may outlive the first token (they are short-lived), so fetch a new one each time.
    token: () => api.realtimeToken().then((result) => result.token).catch(() => token),
  });
  useEffect(() => { setRealtimeConnected(connectionStatus === 'open'); return () => setRealtimeConnected(false); }, [connectionStatus]);
  useEffect(() => {
    const fresh = messages.delta ?? [];
    if (!fresh.length) return;
    for (const message of fresh) if (message.kind === 'data') deliverMessage(message.data as unknown as MessageEvent);
  }, [messages.delta]);
  return null;
}

/** Holds the signed-in user's realtime connection. Renders nothing; off when the server has no Inngest keys (503), so the inbox polls. */
export default function RealtimeBridge() {
  const [session, setSession] = useState<{ channel: string; token: { key: string; apiBaseUrl: string } } | null>(null);
  useEffect(() => {
    let active = true;
    api.realtimeToken().then((result) => { if (active) setSession(result); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  return session ? <Connection channel={session.channel} token={session.token} /> : null;
}
