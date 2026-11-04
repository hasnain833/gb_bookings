import { getClientSubscriptionToken } from 'inngest/react';
import { VendorMemberModel } from '../../models/vendor-member.model.js';
import { AppError } from '../../shared/app-error.js';
import { inngest, inngestEnabled, userChannel } from '../jobs/inngest.js';
import { MEMBER_ACCESS } from '../vendors/member-access.js';

/** Works on serverless hosts: Inngest holds the browser connections, the API only publishes. Without keys the inbox polls. */
const PUBLISH_WAIT_MS = 1500;

export async function publishToUser(userId: string, payload: Record<string, unknown>) {
  if (!inngestEnabled()) return;
  // Awaited because a serverless function freezes after the response, but capped so a slow push never delays sending.
  // A failed push must not fail the message: the inbox also polls.
  const published = inngest.realtime.publish(userChannel({ userId }).message, payload).catch((error: Error) => console.warn(`Realtime push failed: ${error.message}`));
  await Promise.race([published, new Promise((resolve) => setTimeout(resolve, PUBLISH_WAIT_MS))]);
}

export async function publishToVendorTeam(vendorId: unknown, payload: Record<string, unknown>) {
  const members = await VendorMemberModel.find({ vendorId, status: 'active', deletedAt: null, role: { $in: MEMBER_ACCESS.reservations } }).select('userId').lean() as any[];
  await Promise.all(members.map((member) => publishToUser(String(member.userId), payload)));
}

/** The signed-in user's own channel, nobody else's: the id comes from the session, never from the request. */
export async function realtimeToken(userId: string) {
  if (!inngestEnabled()) throw new AppError(503, 'REALTIME_OFF', 'Realtime is not configured.');
  try {
    try {
    return { channel: `user:${userId}`, token: await getClientSubscriptionToken(inngest, { channel: userChannel({ userId }), topics: ['message'] }) };
  } catch (error) {
    // Locally this means the Inngest dev server is not running (npm run dev:inngest).
    console.warn(`Realtime is off, the inbox will poll instead: ${(error as Error).message}`);
    throw new AppError(503, 'REALTIME_OFF', 'Realtime is not reachable.');
  }
  } catch (error) {
    // Locally this means the Inngest dev server is not running (npm run dev:inngest).
    console.warn(`Realtime is off, the inbox will poll instead: ${(error as Error).message}`);
    throw new AppError(503, 'REALTIME_OFF', 'Realtime is not reachable.');
  }
}
