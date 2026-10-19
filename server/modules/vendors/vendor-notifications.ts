import { env } from '../../config/env.js';
import { escapeHtml } from '../email/auth-email.templates.js';
import { isEmailConfigured, sendTransactionalEmail } from '../email/resend.service.js';

export type VendorDecision =
  | 'vendor.approved' | 'vendor.rejected' | 'vendor.suspended'
  | 'vendor.changes_approved' | 'vendor.changes_rejected'
  | 'listing.published' | 'listing.rejected' | 'listing.taken_down'
  | 'listing.revision_approved' | 'listing.revision_rejected'
  | 'team.added';

const copy: Record<VendorDecision, { subject: string; message: string }> = {
  'vendor.approved': { subject: 'Your business is approved', message: 'Your business has been approved. You can now add your property from the partner dashboard.' },
  'vendor.rejected': { subject: 'Your business application was not approved', message: 'Your business application was not approved. Update your details and submit it again.' },
  'vendor.suspended': { subject: 'Your business has been suspended', message: 'Your business has been suspended and your partner access is paused. Contact GBBookings support for details.' },
  'vendor.changes_approved': { subject: 'Business details updated', message: 'Your requested changes to your business details have been approved and are now live.' },
  'vendor.changes_rejected': { subject: 'Business change request declined', message: 'Your requested changes to your business details were not approved. Your current details stay as they are.' },
  'listing.published': { subject: 'Your property is live', message: 'Your property has been approved and is now visible to guests.' },
  'listing.rejected': { subject: 'Your property was not approved', message: 'Your property was not approved. Make the changes below and submit it again.' },
  'listing.revision_approved': { subject: 'Your property changes are live', message: 'Your edits have been approved and guests now see the updated details.' },
  'listing.revision_rejected': { subject: 'Your property changes were not approved', message: 'Your edits were not approved. Your property stays live with its current details. Make the changes below and save again.' },
  'team.added': { subject: 'You have been added to a partner team', message: 'You now have access to this partner business on GBBookings. If you are new to GBBookings, first choose your password using the separate password email we sent, then sign in and open the partner dashboard.' },
  'listing.taken_down': { subject: 'Your property has been taken down', message: 'Your property has been removed from the site and is no longer bookable. Make the changes below and submit it again.' },
};

function decisionEmail(title: string, name: string, message: string, subject: string | undefined, reason: string | undefined, url: string) {
  const rows = [...(subject ? [['Property', subject]] : []), ...(reason ? [['Reason', reason]] : [])];
  const table = rows.map(([label, value]) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#5e6d64">${escapeHtml(label)}</td><td style="padding:6px 0;font-weight:700">${escapeHtml(value)}</td></tr>`).join('');
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f4f7f5;font-family:Arial,sans-serif;color:#17211c">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px">
      <div style="background:#ffffff;border:1px solid #dce5df;padding:32px">
        <p style="margin:0 0 24px;color:#006f3c;font-size:20px;font-weight:700">GBBookings</p>
        <h1 style="margin:0 0 16px;font-size:24px">${escapeHtml(title)}</h1>
        <p style="line-height:1.6">Hello ${escapeHtml(name)},</p>
        <p style="line-height:1.6">${escapeHtml(message)}</p>
        ${table ? `<table style="border-collapse:collapse;margin-top:16px">${table}</table>` : ''}
        <p style="margin:28px 0 0">
          <a href="${escapeHtml(url)}" style="display:inline-block;background:#006f3c;color:#fff;text-decoration:none;padding:13px 20px;font-weight:700">Open partner dashboard</a>
        </p>
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Emails the vendor about an admin decision. Never throws: a failed email must not undo the decision.
 * ponytail: sent inline with the request, same as booking emails; move to the queue when BullMQ lands (Phase 7).
 */
export async function notifyVendorDecision(vendor: { name: string; email: string }, decision: VendorDecision, details: { hotel?: string; reason?: string } = {}) {
  if (!isEmailConfigured()) return;
  const { subject, message } = copy[decision];
  const url = `${env.APP_URL ?? 'http://localhost:3000'}/vendor-dashboard`;
  try {
    await sendTransactionalEmail({
      to: { email: vendor.email, name: vendor.name },
      subject: details.hotel ? `${subject} · ${details.hotel}` : subject,
      htmlContent: decisionEmail(subject, vendor.name, message, details.hotel, details.reason || undefined, url),
      tag: decision.replace('.', '-'),
    });
  } catch (error) {
    console.error(`Vendor ${decision} email to ${vendor.email} failed:`, error);
  }
}
