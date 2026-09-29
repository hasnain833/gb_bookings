import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailInput {
  to: EmailRecipient;
  subject: string;
  htmlContent: string;
  tag: string;
}

export function isEmailConfigured() {
  return Boolean(env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL);
}

export async function sendTransactionalEmail(input: SendEmailInput) {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    throw new ServiceUnavailableError('Transactional email is not configured.');
  }

  let response: Response;
  try {
    response = await fetch(BREVO_SEND_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: {
        accept: 'application/json',
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
        to: [input.to],
        subject: input.subject,
        htmlContent: input.htmlContent,
        tags: [input.tag],
        headers: { 'Idempotency-Key': randomUUID() },
      }),
    });
  } catch {
    throw new ServiceUnavailableError('Transactional email provider could not be reached.');
  }

  if (!response.ok) {
    throw new AppError(502, 'EMAIL_DELIVERY_FAILED', 'Transactional email could not be sent.');
  }

  const result = await response.json() as { messageId?: string };
  if (!result.messageId) {
    throw new AppError(502, 'EMAIL_DELIVERY_FAILED', 'Transactional email provider returned an invalid response.');
  }
  return result.messageId;
}
