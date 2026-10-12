import { env } from '../../config/env.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';

interface SendEmailInput {
  to: { email: string; name?: string };
  subject: string;
  htmlContent: string;
  tag: string;
}

export function isEmailConfigured() {
  return Boolean(env.RESEND_API_KEY && env.RESEND_SENDER_EMAIL);
}

export async function sendTransactionalEmail(input: SendEmailInput): Promise<string> {
  if (!isEmailConfigured()) {
    throw new AppError(503, 'EMAIL_PROVIDER_NOT_CONFIGURED', 'Resend is not configured. Set RESEND_API_KEY and RESEND_SENDER_EMAIL.');
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', redirect: 'error',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        from: `${JSON.stringify(env.RESEND_SENDER_NAME)} <${env.RESEND_SENDER_EMAIL}>`,
        to: [input.to.email], subject: input.subject, html: input.htmlContent,
        tags: [{ name: 'event', value: input.tag.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 256) }],
      }),
    });
    if (response.status === 401) throw new AppError(503, 'EMAIL_AUTH_FAILED', 'Resend authentication failed. Check RESEND_API_KEY.');
    if (response.status === 403) throw new AppError(503, 'EMAIL_SENDER_NOT_AUTHORIZED', 'Resend denied email sending. Check the API key permissions and sender domain verification.');
    if (response.status === 429 || response.status >= 500) throw new ServiceUnavailableError('Resend is temporarily unavailable. Please try again later.');
    if (!response.ok) throw new AppError(502, 'EMAIL_DELIVERY_FAILED', 'Resend could not accept this email.');
    const result: unknown = await response.json();
    if (!result || typeof result !== 'object' || !('id' in result) || typeof result.id !== 'string' || !result.id) {
      throw new AppError(502, 'EMAIL_DELIVERY_FAILED', 'Resend returned an invalid email confirmation.');
    }
    return result.id;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new ServiceUnavailableError('Resend could not be reached or returned an invalid response.');
  }
}
