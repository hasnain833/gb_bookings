import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../config/env.js';
import { sendTransactionalEmail } from '../modules/email/brevo.service.js';

const originalApiKey = env.BREVO_API_KEY;
const originalSenderEmail = env.BREVO_SENDER_EMAIL;

afterEach(() => {
  env.BREVO_API_KEY = originalApiKey;
  env.BREVO_SENDER_EMAIL = originalSenderEmail;
  vi.unstubAllGlobals();
});

describe('Brevo email adapter', () => {
  it('sends the documented transactional email request without exposing the API key in the body', async () => {
    env.BREVO_API_KEY = 'test-brevo-key';
    env.BREVO_SENDER_EMAIL = 'verified@example.com';
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ messageId: '<message@example.com>' }),
      { status: 201, headers: { 'content-type': 'application/json' } },
    ));
    vi.stubGlobal('fetch', fetchMock);

    const messageId = await sendTransactionalEmail({
      to: { email: 'user@example.com', name: 'Test User' },
      subject: 'Test email',
      htmlContent: '<p>Hello</p>',
      tag: 'test',
    });

    expect(messageId).toBe('<message@example.com>');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'api-key': 'test-brevo-key' }),
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({
      sender: { email: 'verified@example.com', name: 'GBBookings' },
      to: [{ email: 'user@example.com', name: 'Test User' }],
      tags: ['test'],
    });
    expect(JSON.stringify(body)).not.toContain('test-brevo-key');
  });
});
