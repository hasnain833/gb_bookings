import { env } from '../../config/env.js';
import { AppError } from '../../shared/app-error.js';

/**
 * Safepay Express Checkout: the guest pays on Safepay's hosted page, so card and wallet details never reach us.
 * We never trust the browser or the webhook body about the outcome: `trackerPaid` asks Safepay directly.
 * Endpoints follow Safepay's docs and their @sfpy/node-core SDK (v0.3.5), called with fetch instead of the SDK.
 */
const API_HOST = { sandbox: 'https://sandbox.api.getsafepay.com', production: 'https://api.getsafepay.com' };
const CHECKOUT_PAGE = { sandbox: 'https://sandbox.api.getsafepay.com/embedded/', production: 'https://getsafepay.com/embedded/' };
/** A Safepay checkout token lasts an hour, so an unpaid "Pay now" booking holds its rooms that long. */
export const ONLINE_HOLD_MINUTES = 60;

export const onlinePaymentsEnabled = () => Boolean(env.SAFEPAY_API_KEY && env.SAFEPAY_SECRET_KEY);

async function call(path: string, body?: unknown) {
  const response = await fetch(`${API_HOST[env.SAFEPAY_ENV]}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'x-sfpy-merchant-secret': env.SAFEPAY_SECRET_KEY ?? '' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const result = await response.json().catch(() => ({})) as any;
  if (!response.ok) {
    console.error(`Safepay ${path} failed (${response.status}):`, JSON.stringify(result).slice(0, 500));
    throw new AppError(502, 'PAYMENT_PROVIDER_ERROR', 'The payment service is not responding. Please try again in a moment.');
  }
  return result;
}

/** Opens a payment for `amountMinor` (paisa) and returns the tracker and the hosted page to send the guest to. */
export async function startSafepayCheckout(input: { amountMinor: number; reference: string; redirectUrl: string; cancelUrl: string }) {
  if (!onlinePaymentsEnabled()) throw new AppError(503, 'ONLINE_PAYMENT_UNAVAILABLE', 'Online payment is not available right now. Choose Pay on arrival.');
  const session = await call('/order/payments/v3/', {
    merchant_api_key: env.SAFEPAY_API_KEY, intent: 'CYBERSOURCE', mode: 'payment', currency: 'PKR',
    amount: input.amountMinor, metadata: { order_id: input.reference },
  });
  const tracker: string | undefined = session?.data?.tracker?.token;
  const tbt: string | undefined = (await call('/client/passport/v1/token', {}))?.data;
  if (!tracker || !tbt) throw new AppError(502, 'PAYMENT_PROVIDER_ERROR', 'The payment service did not start the payment. Please try again.');
  const query = new URLSearchParams({
    environment: env.SAFEPAY_ENV, tbt, tracker, source: 'hosted', order_id: input.reference,
    redirect_url: input.redirectUrl, cancel_url: input.cancelUrl,
  });
  return { tracker, url: `${CHECKOUT_PAGE[env.SAFEPAY_ENV]}?${query}` };
}

/** True once Safepay reports the payment on this tracker as complete (state TRACKER_ENDED). */
export async function trackerPaid(tracker: string) {
  const result = await call(`/reporter/api/v1/payments/${encodeURIComponent(tracker)}`);
  return (result?.data?.tracker?.state ?? result?.data?.state) === 'TRACKER_ENDED';
}

/** Tracker tokens mentioned anywhere in a webhook body; each is re-checked with Safepay before use. */
export const trackersIn = (body: unknown) => [...new Set(JSON.stringify(body ?? {}).match(/track_[0-9a-zA-Z-]+/g) ?? [])].slice(0, 5);
