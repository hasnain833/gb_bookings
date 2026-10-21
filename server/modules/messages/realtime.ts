import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { isAllowedOrigin } from '../../shared/origin.js';
import { sessionFromToken } from '../../middleware/authenticate.js';
import { ACCESS_COOKIE } from '../auth/auth.tokens.js';
import { reservationVendorIds } from '../bookings/booking.service.js';

/**
 * Socket.IO on the long-running server (server/start.ts). Each user joins `user:<id>`; partner staff also join
 * `vendor:<id>` for every business whose reservations they handle. On serverless hosts (Vercel) there is no
 * socket server: `io` stays null and the inbox falls back to polling the REST API.
 */
let io: Server | null = null;

const cookieValue = (header: string | undefined, name: string) =>
  header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);

export function attachRealtime(server: HttpServer) {
  io = new Server(server, {
    path: '/api/v1/realtime',
    serveClient: false,
    // Sockets authenticate with the session cookie, so refuse connections opened from other sites.
    allowRequest: (request, callback) => callback(null, !request.headers.origin || isAllowedOrigin(request.headers.origin, request.headers.host)),
  });
  io.use(async (socket, next) => {
    try {
      const session = await sessionFromToken(cookieValue(socket.handshake.headers.cookie, ACCESS_COOKIE));
      socket.data.userId = session.userId;
      next();
    } catch {
      next(new Error('AUTHENTICATION_REQUIRED'));
    }
  });
  io.on('connection', async (socket) => {
    const userId = String(socket.data.userId);
    await socket.join(`user:${userId}`);
    for (const vendorId of await reservationVendorIds(userId)) await socket.join(`vendor:${vendorId}`);
  });
}

export function emitToRooms(rooms: string[], event: string, payload: unknown) {
  io?.to(rooms).emit(event, payload);
}
