/** Shared parchment letter HTML for auth mail and sealed-scroll mail. */

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function wrapLetterHtml(opts: {
  preheader: string
  kicker: string
  headline: string
  fromLineHtml: string
  bodyHtml: string
  ctaLabel: string
  ctaUrl: string
  footerNote: string
}): string {
  const { preheader, kicker, headline, fromLineHtml, bodyHtml, ctaLabel, ctaUrl, footerNote } = opts
  const safeUrl = escapeHtml(ctaUrl)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(headline)}</title>
</head>
<body style="margin:0;padding:0;background:#1a0a04;font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#1a0a04;">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:540px;background:#fdf8ee;border-radius:14px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,0.45);">
          <tr>
            <td style="background:#6e2f2a;padding:12px 28px;text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(253,244,227,0.78);">${escapeHtml(kicker)}</p>
            </td>
          </tr>
          <tr>
            <td style="background:#582420;padding:28px 32px 24px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;background:radial-gradient(circle at 35% 30%,#c45a4a,#8c2f28 55%,#5a1814);border-radius:50%;box-shadow:0 4px 14px rgba(0,0,0,0.4);margin-bottom:14px;line-height:56px;font-size:24px;color:#fdf4e3;">✦</div>
              <h1 style="margin:0 0 10px;color:#fdf4e3;font-family:Georgia,serif;font-size:24px;font-weight:400;letter-spacing:0.03em;">${escapeHtml(headline)}</h1>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:rgba(253,244,227,0.88);">${fromLineHtml}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 20px;">
              ${bodyHtml}
              <table cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin:8px auto 28px;">
                <tr>
                  <td align="center" style="background:#6e2f2a;border-radius:999px;box-shadow:0 8px 20px rgba(80,24,16,0.35);">
                    <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:16px 40px;color:#fdf4e3;font-family:Arial,Helvetica,sans-serif;font-size:14px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;font-weight:700;">${escapeHtml(ctaLabel)}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#9a8070;text-align:center;">
                Or paste this link into your browser:<br />
                <a href="${safeUrl}" style="color:#6e2f2a;word-break:break-all;">${safeUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f0e6d0;padding:18px 28px;text-align:center;border-top:1px solid rgba(80,50,24,0.12);">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a6850;letter-spacing:0.05em;">Sent by <strong>Paper scroll studio</strong> · a writing app</p>
              <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.45;color:#b09078;">${escapeHtml(footerNote)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function buildScrollEmailHtml(opts: {
  title: string
  note: string
  fromLabel: string
  senderEmail: string
  viewUrl: string
  imageBase64: string
}): string {
  const { title, note, fromLabel, senderEmail, viewUrl, imageBase64 } = opts
  const fromLine = senderEmail
    ? `From: <strong style="color:#fdf4e3;">${escapeHtml(fromLabel)}</strong> · ${escapeHtml(senderEmail)}`
    : `From: <strong style="color:#fdf4e3;">${escapeHtml(fromLabel)}</strong>`
  const noteBlock = note
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
        <tr>
          <td style="border-left:3px solid #6e2f2a;padding:12px 16px;background:#f7efe3;">
            <p style="margin:0;font-size:16px;line-height:1.65;color:#4a3728;font-style:italic;">“${escapeHtml(note)}”</p>
          </td>
        </tr>
      </table>`
    : ''
  const preview =
    imageBase64.length > 0 && imageBase64.length < 400_000
      ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:16px 0 8px;">
          <tr>
            <td style="border-radius:8px;overflow:hidden;border:1px solid rgba(80,50,24,0.15);">
              <img alt="Preview of the sealed scroll" src="${imageBase64}" width="468" style="display:block;width:100%;max-width:468px;height:auto;" />
            </td>
          </tr>
        </table>
        <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9a8070;text-align:center;">A glimpse of the paper · open the letter for the full animation</p>`
      : ''

  const bodyHtml = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:500;color:#2c1a12;font-family:Georgia,serif;">${escapeHtml(title)}</h2>
    <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#6a4e38;">
      Someone used <strong>Paper scroll studio</strong> to fold a letter for you. This is not a login, a payment, or a password reset — it is a sealed writing.
    </p>
    ${noteBlock}
    ${preview}
  `

  return wrapLetterHtml({
    preheader: `${fromLabel} sent you a sealed scroll in Paper scroll studio.`,
    kicker: 'Paper scroll studio',
    headline: 'A sealed scroll for you',
    fromLineHtml: fromLine,
    bodyHtml,
    ctaLabel: 'Open your scroll',
    ctaUrl: viewUrl,
    footerNote: 'Transactional letter from a writing app. Reply goes to the sender when Reply-To is set. If you were not expecting a scroll, you can ignore this message.',
  })
}

export function buildScrollEmailText(opts: {
  title: string
  note: string
  fromLabel: string
  viewUrl: string
}): string {
  const { title, note, fromLabel, viewUrl } = opts
  const noteLine = note ? `\nTheir note:\n“${note}”\n` : ''
  return [
    'Paper scroll studio',
    '',
    `${fromLabel} sent you a sealed scroll.`,
    `Title: ${title}`,
    noteLine,
    'This is a letter from a writing app — not a login or a payment request.',
    'Open your sealed scroll:',
    viewUrl,
    '',
    '— Paper scroll studio',
  ]
    .filter((line) => line !== undefined)
    .join('\n')
}

export type AuthEmailAction =
  | 'magiclink'
  | 'signup'
  | 'invite'
  | 'recovery'
  | 'email_change'
  | 'email'
  | string

export function authEmailCopy(action: AuthEmailAction): {
  subject: string
  headline: string
  ctaLabel: string
  body: string
  footer: string
} {
  switch (action) {
    case 'recovery':
      return {
        subject: 'Reset your Paper scroll studio desk',
        headline: 'A letter to reopen your desk',
        ctaLabel: 'Reset and sign in',
        body: 'You asked to reset access to Paper scroll studio. Tap the wax seal below. We never ask for your password in email. If you did not request this, ignore the letter — your desk stays as it is.',
        footer: 'You requested this from Paper scroll studio. After you tap the link you stay signed in on that computer until you sign out.',
      }
    case 'email_change':
      return {
        subject: 'Confirm your new Paper scroll studio address',
        headline: 'Confirm this address',
        ctaLabel: 'Confirm email',
        body: 'You asked Paper scroll studio to use this address. Tap the wax seal to confirm. This is not a bank notice or a password reset from another company.',
        footer: 'You requested this change in Paper scroll studio.',
      }
    case 'invite':
      return {
        subject: 'You are invited to Paper scroll studio',
        headline: 'An invitation to the desk',
        ctaLabel: 'Accept invitation',
        body: 'Someone invited you to Paper scroll studio, a writing app for poems and letters. Tap the wax seal to take your seat at the desk.',
        footer: 'This invitation is only for you. If you were not expecting it, you can ignore this letter.',
      }
    case 'signup':
      return {
        subject: 'Open your Paper scroll studio desk',
        headline: 'Your desk is ready',
        ctaLabel: 'Open my desk',
        body: 'Welcome to Paper scroll studio — a writing app, not a bank, shop, or password manager. You asked to create a desk with this address. Tap the wax seal once. After that you stay signed in on this computer until you sign out.',
        footer: 'You requested this sign-in. We will not email you a password. If this was not you, ignore the letter.',
      }
    default:
      return {
        subject: 'Your sign-in letter from Paper scroll studio',
        headline: 'A sign-in letter for your desk',
        ctaLabel: 'Sign in to my desk',
        body: 'You asked to sign in to Paper scroll studio. Tap the wax seal below — it is a one-time link, not a password. This is a writing app. We will not ask you to confirm again on this computer until you sign out.',
        footer: 'You requested this from Paper scroll studio. If you did not, ignore the letter. After you tap it, you stay signed in on that device.',
      }
  }
}

export function buildAuthEmailHtml(opts: {
  action: AuthEmailAction
  confirmUrl: string
  email: string
}): string {
  const copy = authEmailCopy(opts.action)
  const bodyHtml = `
    <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#4a3728;">
      ${escapeHtml(copy.body)}
    </p>
    <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:#8a6850;">
      Sent to ${escapeHtml(opts.email)} · Paper scroll studio
    </p>
  `
  return wrapLetterHtml({
    preheader: `${copy.headline}. Tap the seal to continue — this is Paper scroll studio, a writing app.`,
    kicker: 'Paper scroll studio',
    headline: copy.headline,
    fromLineHtml: 'A letter from <strong style="color:#fdf4e3;">Paper scroll studio</strong>',
    bodyHtml,
    ctaLabel: copy.ctaLabel,
    ctaUrl: opts.confirmUrl,
    footerNote: copy.footer,
  })
}

export function buildAuthEmailText(opts: {
  action: AuthEmailAction
  confirmUrl: string
  email: string
}): string {
  const copy = authEmailCopy(opts.action)
  return [
    'Paper scroll studio',
    '',
    copy.headline,
    '',
    copy.body,
    '',
    copy.ctaLabel + ':',
    opts.confirmUrl,
    '',
    `Sent to ${opts.email}`,
    copy.footer,
  ].join('\n')
}
