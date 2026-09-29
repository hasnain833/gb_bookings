import { AppError } from '../../shared/app-error.js';
import { sendTransactionalEmail } from '../email/brevo.service.js';

export type OtpChannel = 'email' | 'sms';

export interface OtpDelivery {
  destination: string;
  recipientName?: string;
  code: string;
  purpose: 'two_factor_login' | 'two_factor_setup' | 'email_verification' | 'phone_verification';
  expiresInMinutes: number;
}

export interface OtpProvider {
  readonly channel: OtpChannel;
  send(delivery: OtpDelivery): Promise<void>;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]!));
}

export class BrevoEmailOtpProvider implements OtpProvider {
  readonly channel = 'email' as const;

  async send(delivery: OtpDelivery) {
    const name = delivery.recipientName ? ` ${escapeHtml(delivery.recipientName)}` : '';
    await sendTransactionalEmail({
      to: { email: delivery.destination, name: delivery.recipientName },
      subject: 'Your GBBookings security code',
      tag: delivery.purpose,
      htmlContent: `<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;color:#17211c">
        <div style="max-width:560px;margin:0 auto;padding:32px 16px">
          <h1 style="font-size:22px">GBBookings security code</h1>
          <p>Hello${name},</p>
          <p>Use this one-time code to continue:</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#006f3c">${delivery.code}</p>
          <p>This code expires in ${delivery.expiresInMinutes} minutes. Never share it with anyone.</p>
        </div></body></html>`,
    });
  }
}

export class UnconfiguredSmsOtpProvider implements OtpProvider {
  readonly channel = 'sms' as const;

  async send() {
    throw new AppError(503, 'SMS_PROVIDER_NOT_CONFIGURED', 'SMS verification is not configured.');
  }
}

const providers: Record<OtpChannel, OtpProvider> = {
  email: new BrevoEmailOtpProvider(),
  sms: new UnconfiguredSmsOtpProvider(),
};

export function otpProvider(channel: OtpChannel) {
  return providers[channel];
}
