/** What GBBookings holds for a booking and what it owes the partner. Pure, so the sums can be checked without a database. */
type SettlementBooking = {
  status: string; paymentMethod: string; paymentStatus: string;
  pricing: { totalMinor: number; balanceDueMinor?: number; commissionMinor?: number };
  refunds?: Array<{ channel: string; amountMinor: number; status: string }>;
};

/** The money paid so far: a balance agreed on a later change is collected by the partner, not by GBBookings. */
export const heldMinor = (booking: Pick<SettlementBooking, 'pricing'>) => booking.pricing.totalMinor - (booking.pricing.balanceDueMinor ?? 0);

export const hasOpenRefund = (booking: Pick<SettlementBooking, 'refunds'>) => (booking.refunds ?? []).some((refund) => refund.status !== 'sent');

/** The stay happened, or money stayed with the partner after a no-show or cancellation. Waits while a refund is still open. */
export function settlementDue(booking: SettlementBooking) {
  if (hasOpenRefund(booking)) return false;
  return booking.status === 'completed' || (['no_show', 'cancelled'].includes(booking.status) && booking.paymentStatus === 'paid');
}

/**
 * Positive: GBBookings owes the partner (Pay now money, less refunds and commission).
 * Negative: the partner owes GBBookings commission on money they collected on arrival.
 */
export function settlement(booking: SettlementBooking) {
  const online = booking.paymentMethod === 'online' && booking.paymentStatus === 'paid';
  const collectedOnlineMinor = online ? heldMinor(booking) : 0;
  const refundedMinor = online ? (booking.refunds ?? []).reduce((total, refund) => total + refund.amountMinor, 0) : 0;
  const commissionMinor = booking.pricing.commissionMinor ?? 0;
  return { collectedOnlineMinor, refundedMinor, commissionMinor, netMinor: collectedOnlineMinor - refundedMinor - commissionMinor };
}
