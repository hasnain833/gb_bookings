import { cron, Inngest, realtime, staticSchema } from 'inngest';
import { env } from '../../config/env.js';

/**
 * Inngest calls /api/inngest on a schedule, so the jobs run on Vercel too, and carries realtime messages to browsers.
 * Without INNGEST_EVENT_KEY (or INNGEST_DEV locally) it is off: a timer runs the jobs on a long-running server (start.ts)
 * and the inbox polls.
 */
export const inngest = new Inngest({ id: 'gbbookings' });

export const inngestEnabled = () => Boolean(env.INNGEST_DEV || (env.INNGEST_EVENT_KEY && env.INNGEST_SIGNING_KEY));

/** One private channel per user. Only the server mints tokens for it, after sign-in (see message.routes). */
export const userChannel = realtime.channel({
  name: ({ userId }: { userId: string }) => `user:${userId}`,
  topics: { message: { schema: staticSchema<Record<string, unknown>>() } },
});

export async function inngestFunctions() {
  const { runDailyJobs, runFrequentJobs } = await import('./scheduled.js');
  return [
    inngest.createFunction({ id: 'frequent-jobs', triggers: [cron('*/5 * * * *')] }, async ({ step }) => step.run('run', runFrequentJobs)),
    inngest.createFunction({ id: 'daily-trip-emails', triggers: [cron('TZ=Asia/Karachi 0 10 * * *')] }, async ({ step }) => step.run('run', runDailyJobs)),
  ];
}
