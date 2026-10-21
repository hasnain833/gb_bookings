import { io, type Socket } from 'socket.io-client';
import type { ChatMessage, Conversation } from './api';

export type MessageEvent = { conversation: Conversation; message: ChatMessage };

/**
 * One shared Socket.IO connection, opened on first use. The server pushes `message` events to the guest and to the
 * partner's team. Where the API runs serverless (no socket server) it never connects, and callers poll instead.
 */
let socket: Socket | null = null;

function connect() {
  socket ??= io({ path: '/api/v1/realtime', withCredentials: true, transports: ['websocket'], reconnectionDelayMax: 30_000 });
  return socket;
}

export function onMessage(handler: (event: MessageEvent) => void) {
  const live = connect();
  live.on('message', handler);
  return () => { live.off('message', handler); };
}

export const realtimeConnected = () => Boolean(socket?.connected);
