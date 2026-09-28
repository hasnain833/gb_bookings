import { describe, expect, it } from 'vitest';
import { UnconfiguredSmsOtpProvider } from '../modules/otp/otp-provider.js';

describe('OTP provider interface', () => {
  it('fails explicitly when SMS has not been configured', async () => {
    const provider = new UnconfiguredSmsOtpProvider();
    await expect(provider.send()).rejects.toMatchObject({
      status: 503,
      code: 'SMS_PROVIDER_NOT_CONFIGURED',
    });
  });
});
