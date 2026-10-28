/// <reference path="../deno.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NOTE_LEN = 2000
const MAX_TITLE_LEN = 500
const MAX_DISPLAY_NAME_LEN = 40
const MAX_RECIPIENTS = 10
/** ~2.5 MB base64 string cap for inline email image */
const MAX_IMAGE_BASE64_LEN = 2_500_000
const CATEGORIES = new Set(['family', 'friend', 'colleague', 'acquaintance'])

type RecipientIn = { email?: string; category?: string }

type Body = {
  scrollId?: string
  /** @deprecated single-recipient; prefer recipients[] */
  toEmail?: string
  recipients?: RecipientIn[]
  note?: string
  imageBase64?: string
  title?: string
  senderDisplayName?: string
}

type Recipient = { email: string; category: string }

Deno.serve(async (request) => {
  const corsHeaders = corsForRequest(request)

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405, corsHeaders)
  }

  if (!originAllowed(request)) {
    return json({ error: 'Forbidden origin.' }, 403, corsHeaders)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const publishableKey = resolvePublishableKey(request)
    const serviceKey = resolveServiceKey()
    const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
    const sendFrom = Deno.env.get('SEND_FROM') ?? ''
    const viewBaseUrl = (Deno.env.get('VIEW_BASE_URL') ?? 'https://akhanshasen.github.io/The-Scroll').replace(
      /\/$/,
      '',
    )

    if (!supabaseUrl || !publishableKey || !serviceKey) {
      return json({ error: 'Server is missing Supabase configuration.' }, 500, corsHeaders)
    }
    if (!resendKey || !sendFrom) {
      return json(
        { error: 'Server is missing Resend configuration (RESEND_API_KEY, SEND_FROM).' },
        500,
        corsHeaders,
      )
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Sign in to send a scroll.' }, 401, corsHeaders)
    }

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'Sign in to send a scroll.' }, 401, corsHeaders)

    const isAnonymous = Boolean(
      (user as { is_anonymous?: boolean }).is_anonymous ||
        user.app_metadata?.provider === 'anonymous',
    )
    if (isAnonymous && !guestSendAllowed()) {
      return json(
        { error: 'Guest send is turned off. Sign in with email to send a scroll.' },
        403,
        corsHeaders,
      )
    }

    let body: Body
    try {
      body = (await request.json()) as Body
    } catch {
      return json({ error: 'Invalid request body.' }, 400, corsHeaders)
    }

    const scrollId = body.scrollId?.trim()
    const note = (body.note ?? '').trim().slice(0, MAX_NOTE_LEN)
    const imageBase64 = body.imageBase64 ?? ''
    const title =
      (body.title ?? 'A paper scroll').trim().slice(0, MAX_TITLE_LEN) || 'A paper scroll'
    const senderEmail = isAnonymous ? '' : (user.email ?? '').trim().toLowerCase()
    const senderDisplayName = sanitizeDisplayName(body.senderDisplayName ?? '')
    const recipients = parseRecipients(body)

    if (isAnonymous && !senderDisplayName) {
      return json({ error: 'Enter a sender name to send as a guest.' }, 400, corsHeaders)
    }

    if (!scrollId || !UUID_RE.test(scrollId)) {
      return json({ error: 'A valid scroll is required.' }, 400, corsHeaders)
    }
    if (recipients.length === 0) {
      return json({ error: 'At least one valid email address is required.' }, 400, corsHeaders)
    }
    if (!imageBase64.startsWith('data:image/') || imageBase64.length > MAX_IMAGE_BASE64_LEN) {
      return json({ error: 'The paper image could not be prepared.' }, 400, corsHeaders)
    }

    const fromLabel = senderDisplayName || senderEmail || 'Someone'

    log('SEND_ATTEMPT', {
      userId: user.id,
      userEmail: senderEmail || null,
      senderDisplayName: senderDisplayName || null,
      guest: isAnonymous,
      scrollId,
      recipientCount: recipients.length,
      title,
    })

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: scroll, error: scrollError } = await admin
      .from('scrolls')
      .select('id')
      .eq('id', scrollId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (scrollError) throw scrollError
    if (!scroll) {
      log('SEND_ERROR', { reason: 'scroll_not_found', scrollId, userId: user.id })
      return json({ error: 'That scroll was not found for your account.' }, 404, corsHeaders)
    }

    const sendIds: string[] = []
    const failures: string[] = []
    let lastResendHint = ''

    for (const recipient of recipients) {
      const { data: sendRow, error: insertError } = await admin
        .from('sends')
        .insert({
          user_id: user.id,
          scroll_id: scrollId,
          to_email: recipient.email,
          note,
          status: 'queued',
          category: recipient.category,
          sender_email: senderEmail,
          sender_display_name: senderDisplayName,
          image_data: imageBase64,
        })
        .select('id, view_token')
        .single()
      if (insertError) throw insertError

      const viewUrl = `${viewBaseUrl}/?view=${sendRow.view_token}`

      log('SEND_QUEUED', {
        sendId: sendRow.id,
        viewToken: sendRow.view_token,
        scrollId,
        toEmail: recipient.email,
        category: recipient.category,
        title,
        fromLabel,
        viewUrl,
      })

      const emailHtml = buildEmailHtml({
        title,
        note,
        fromLabel,
        senderEmail,
        viewUrl,
        imageBase64,
      })
      const emailText = buildEmailText({ title, note, fromLabel, viewUrl })
      const subjectTitle = title.length > 60 ? `${title.slice(0, 57)}…` : title
      const subject = `Paper scroll studio — ${fromLabel} sent you “${subjectTitle}”`

      const resendPayload: Record<string, unknown> = {
        from: sendFrom,
        to: [recipient.email],
        subject,
        html: emailHtml,
        text: emailText,
      }
      if (senderEmail && EMAIL_RE.test(senderEmail)) {
        resendPayload.reply_to = [senderEmail]
      }

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendPayload),
      })

      if (!resendResponse.ok) {
        const resendBody = (await resendResponse.text()).slice(0, 500)
        lastResendHint = summarizeResendFailure(resendResponse.status, resendBody)
        await admin
          .from('sends')
          .update({ status: 'failed' })
          .eq('id', sendRow.id)
          .eq('user_id', user.id)
        log('SEND_FAILED', {
          sendId: sendRow.id,
          scrollId,
          toEmail: recipient.email,
          title,
          status: resendResponse.status,
          resendBody,
          hint: lastResendHint,
        })
        failures.push(recipient.email)
        continue
      }

      await admin
        .from('sends')
        .update({ status: 'sent' })
        .eq('id', sendRow.id)
        .eq('user_id', user.id)
      log('SEND_SUCCESS', {
        sendId: sendRow.id,
        scrollId,
        toEmail: recipient.email,
        category: recipient.category,
        title,
      })
      sendIds.push(sendRow.id)
    }

    if (sendIds.length === 0) {
      return json(
        {
          error:
            lastResendHint ||
            'The letter could not be delivered to any address. With Resend’s test sender, send only to your Resend account email, or verify a domain.',
        },
        502,
        corsHeaders,
      )
    }
    if (failures.length > 0) {
      return json(
        {
          ok: true,
          sendIds,
          partial: true,
          failedEmails: failures,
          error: `Sent to some addresses; failed: ${failures.join(', ')}. ${lastResendHint}`.trim(),
        },
        200,
        corsHeaders,
      )
    }
    return json({ ok: true, sendIds }, 200, corsHeaders)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    log('SEND_ERROR', { reason: message })
    const hint =
      /view_token|image_data|column/i.test(message)
        ? 'Database may be missing migration 004_view_tokens.sql (view_token / image_data columns).'
        : 'Something went wrong while sending.'
    return json({ error: hint, detail: message.slice(0, 200) }, 500, corsHeaders)
  }
})

/** New API keys JSON dict → legacy string → request apikey header. */
function resolvePublishableKey(request: Request): string {
  const fromJson = readNamedKey(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS'))
  const legacy = (Deno.env.get('SUPABASE_ANON_KEY') ?? '').trim()
  const fromHeader = (request.headers.get('apikey') ?? '').trim()
  return fromJson || legacy || fromHeader
}

function resolveServiceKey(): string {
  const fromJson = readNamedKey(Deno.env.get('SUPABASE_SECRET_KEYS'))
  const legacy = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').trim()
  return fromJson || legacy
}

function readNamedKey(raw: string | undefined, name = 'default'): string {
  if (!raw?.trim()) return ''
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const value = parsed[name]
    return typeof value === 'string' ? value.trim() : ''
  } catch {
    return ''
  }
}

function summarizeResendFailure(status: number, body: string): string {
  const lower = body.toLowerCase()
  if (status === 403 || lower.includes('only send testing') || lower.includes('verify a domain')) {
    return 'Resend rejected delivery: with onboarding@resend.dev you can only send to your Resend signup email until you verify a domain.'
  }
  if (status === 422 || lower.includes('invalid') || lower.includes('from')) {
    return 'Resend rejected the email (check SEND_FROM and recipient address).'
  }
  return `Resend rejected delivery (HTTP ${status}). Check Edge Function logs and Resend → Logs.`
}

function guestSendAllowed(): boolean {
  const raw = (Deno.env.get('ALLOW_GUEST_SEND') ?? 'true').trim().toLowerCase()
  return raw !== 'false' && raw !== '0' && raw !== 'no'
}

function sanitizeDisplayName(raw: string): string {
  return raw
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[<>&"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_DISPLAY_NAME_LEN)
}

function buildEmailText(opts: {
  title: string
  note: string
  fromLabel: string
  viewUrl: string
}) {
  const { title, note, fromLabel, viewUrl } = opts
  const fromLine = `From: ${fromLabel}`
  const noteLine = note ? `\nTheir note:\n"${note}"\n` : ''
  return [
    'Paper scroll studio',
    '',
    fromLine,
    '',
    `Title: ${title}`,
    noteLine,
    'Open your sealed scroll:',
    viewUrl,
    '',
    '— Sent via Paper scroll studio',
  ]
    .filter((line) => line !== undefined)
    .join('\n')
}

function buildEmailHtml(opts: {
  title: string
  note: string
  fromLabel: string
  senderEmail: string
  viewUrl: string
  imageBase64: string
}) {
  const { title, note, fromLabel, senderEmail, viewUrl, imageBase64 } = opts
  const fromLine = `From: <strong style="color:#fdf4e3;">${escapeHtml(fromLabel)}</strong>`
  const noteBlock = note
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
        <tr>
          <td style="border-left:3px solid #6e2f2a;padding:12px 16px;background:#f7efe3;">
            <p style="margin:0;font-size:16px;line-height:1.65;color:#4a3728;font-style:italic;">"${escapeHtml(note)}"</p>
          </td>
        </tr>
      </table>`
    : ''
  // Prefer CTA over huge inline images (Gmail often clips / blocks oversized base64).
  const preview =
    imageBase64.length > 0 && imageBase64.length < 400_000
      ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 8px;">
          <tr>
            <td style="border-radius:8px;overflow:hidden;border:1px solid rgba(80,50,24,0.15);">
              <img alt="Preview of your scroll" src="${imageBase64}" width="468" style="display:block;width:100%;max-width:468px;height:auto;" />
            </td>
          </tr>
        </table>
        <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:12px;color:#9a8070;text-align:center;">Preview · open the link above for the full animation</p>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>A scroll arrived for you</title>
</head>
<body style="margin:0;padding:0;background:#1a0a04;font-family:Georgia,'Times New Roman',serif;">
  <!-- Preheader (inbox preview) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Tap to open your sealed scroll from Paper scroll studio · ${escapeHtml(fromLabel)}${senderEmail ? ` (${escapeHtml(senderEmail)})` : ''}
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#1a0a04;">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table width="100%" style="max-width:540px;background:#fdf8ee;border-radius:14px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,0.45);" cellpadding="0" cellspacing="0" role="presentation">

          <!-- Brand bar -->
          <tr>
            <td style="background:#6e2f2a;padding:12px 28px;text-align:center;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(253,244,227,0.7);">Paper scroll studio</p>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background:#582420;padding:28px 32px 24px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;background:#a84040;border-radius:50%;box-shadow:0 4px 14px rgba(0,0,0,0.4);margin-bottom:14px;line-height:56px;font-size:24px;color:#fdf4e3;">✦</div>
              <h1 style="margin:0 0 10px;color:#fdf4e3;font-family:Georgia,serif;font-size:24px;font-weight:400;letter-spacing:0.03em;">A sealed scroll for you</h1>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:rgba(253,244,227,0.85);">${fromLine}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 20px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:500;color:#2c1a12;font-family:Georgia,serif;">${escapeHtml(title)}</h2>
              <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:14px;line-height:1.55;color:#6a4e38;">
                This note is waiting inside an envelope. Open it to watch the scroll unfold.
              </p>
              ${noteBlock}

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 28px;" align="center">
                <tr>
                  <td align="center" style="background:#6e2f2a;border-radius:999px;box-shadow:0 8px 20px rgba(80,24,16,0.35);">
                    <a href="${viewUrl}" target="_blank" style="display:inline-block;padding:16px 40px;color:#fdf4e3;font-family:Arial,sans-serif;font-size:14px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;font-weight:700;">Open your scroll →</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#9a8070;text-align:center;">
                Or paste this link into your browser:<br />
                <a href="${viewUrl}" style="color:#6e2f2a;word-break:break-all;">${escapeHtml(viewUrl)}</a>
              </p>

              ${preview}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0e6d0;padding:18px 28px;text-align:center;border-top:1px solid rgba(80,50,24,0.12);">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#8a6850;letter-spacing:0.05em;">Sent via <strong>Paper scroll studio</strong></p>
              <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#b09078;">Transactional message · reply goes to the sender when Reply-To is set</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function parseRecipients(body: Body): Recipient[] {
  const raw: RecipientIn[] = Array.isArray(body.recipients)
    ? body.recipients
    : body.toEmail
      ? [{ email: body.toEmail, category: 'friend' }]
      : []

  const seen = new Set<string>()
  const out: Recipient[] = []
  for (const item of raw) {
    const email = (item.email ?? '').trim().toLowerCase()
    if (!EMAIL_RE.test(email) || email.length > 320 || seen.has(email)) continue
    seen.add(email)
    const category =
      item.category && CATEGORIES.has(item.category) ? item.category : 'friend'
    out.push({ email, category })
    if (out.length >= MAX_RECIPIENTS) break
  }
  return out
}

function log(tag: string, data: Record<string, unknown>) {
  console.log(`[send-scroll] ${tag}`, JSON.stringify(data))
}

function corsForRequest(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin')
  const allowed = allowedOrigins()
  let allowOrigin = ''
  if (origin) {
    if (allowed.has(origin)) allowOrigin = origin
  } else {
    allowOrigin = '*'
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function originAllowed(request: Request): boolean {
  const origin = request.headers.get('Origin')
  if (!origin) return true
  return allowedOrigins().has(origin)
}

function allowedOrigins(): Set<string> {
  const raw = Deno.env.get('ALLOWED_ORIGINS') ?? ''
  const defaults = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://akhanshasen.github.io',
  ]
  const fromEnv = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  return new Set(fromEnv.length ? fromEnv : defaults)
}

function json(body: unknown, status = 200, corsHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
