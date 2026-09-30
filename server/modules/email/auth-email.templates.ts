export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[character]!));
}

function actionEmail(title: string, name: string, message: string, actionLabel: string, actionUrl: string) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f4f7f5;font-family:Arial,sans-serif;color:#17211c">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px">
      <div style="background:#ffffff;border:1px solid #dce5df;padding:32px">
        <p style="margin:0 0 24px;color:#006f3c;font-size:20px;font-weight:700">GBBookings</p>
        <h1 style="margin:0 0 16px;font-size:24px">${escapeHtml(title)}</h1>
        <p style="line-height:1.6">Hello ${escapeHtml(name)},</p>
        <p style="line-height:1.6">${escapeHtml(message)}</p>
        <p style="margin:28px 0">
          <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#006f3c;color:#fff;text-decoration:none;padding:13px 20px;font-weight:700">${escapeHtml(actionLabel)}</a>
        </p>
        <p style="font-size:13px;color:#5e6d64;line-height:1.5">If you did not request this, you can safely ignore this email.</p>
      </div>
    </div>
  </body>
</html>`;
}

export function verificationEmail(name: string, url: string) {
  return actionEmail(
    'Verify your email address',
    name,
    'Confirm your email address to finish securing your GBBookings account. This link expires in one hour.',
    'Verify email',
    url,
  );
}

export function passwordResetEmail(name: string, url: string) {
  return actionEmail(
    'Reset your password',
    name,
    'Use this secure link to choose a new password. This link expires in 30 minutes and can only be used once.',
    'Reset password',
    url,
  );
}
