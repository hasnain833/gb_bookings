import type { ChatMessage, Conversation } from './api';

export type MessageEvent = { conversation: Conversation; message: ChatMessage };

/**
 * Pushed messages. RealtimeBridge holds the one Inngest connection and hands each message here. When it is not
 * connected (Inngest not configured, or a network problem) callers poll instead.
 */
const handlers = new Set<(event: MessageEvent) => void>();
let connected = false;

export function onMessage(handler: (event: MessageEvent) => void) {
  handlers.add(handler);
  return () => { handlers.delete(handler); };
}

export const realtimeConnected = () => connected;
export const setRealtimeConnected = (value: boolean) => { connected = value; };
export const deliverMessage = (event: MessageEvent) => { for (const handler of handlers) handler(event); };
