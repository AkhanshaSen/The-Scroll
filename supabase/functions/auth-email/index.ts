/// <reference path="../deno.d.ts" />
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import {
  authEmailCopy,
  buildAuthEmailHtml,
  buildAuthEmailText,
} from '../_shared/brandedEmail.ts'

type EmailData = {
  token?: string
  token_hash?: string
  redirect_to?: string
  email_action_type?: string
  site_url?: string
  token_new?: string
  token_hash_new?: string
}

type HookUser = {
  email?: string
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
  const sendFrom = Deno.env.get('SEND_FROM') ?? 'Paper scroll studio <onboarding@resend.dev>'
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '')
  const hookSecretRaw = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? ''

  if (!resendKey || !supabaseUrl) {
    return json({ error: { message: 'Auth email is missing Resend or Supabase configuration.' } }, 500)
  }

  const payload = await request.text()
  let user: HookUser = {}
  let emailData: EmailData = {}

  try {
    if (hookSecretRaw) {
      const hookSecret = hookSecretRaw.replace('v1,whsec_', '')
      const headers = Object.fromEntries(request.headers)
      const verified = new Webhook(hookSecret).verify(payload, headers) as {
        user?: HookUser
        email_data?: EmailData
      }
      user = verified.user ?? {}
      emailData = verified.email_data ?? {}
    } else {
      const parsed = JSON.parse(payload) as { user?: HookUser; email_data?: EmailData }
      user = parsed.user ?? {}
      emailData = parsed.email_data ?? {}
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid webhook'
    console.error('[auth-email] verify failed', message)
    return json({ error: { http_code: 401, message: 'Invalid auth email webhook.' } }, 401)
  }

  const email = (user.email ?? '').trim()
  const action = (emailData.email_action_type ?? 'magiclink').trim() || 'magiclink'
  const tokenHash = (emailData.token_hash ?? '').trim()
  const redirectTo = (emailData.redirect_to ?? '').trim()

  if (!email || !tokenHash) {
    return json({ error: { message: 'Missing email or token.' } }, 400)
  }

  const confirmUrl =
    `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}` +
    `&type=${encodeURIComponent(action)}` +
    (redirectTo ? `&redirect_to=${encodeURIComponent(redirectTo)}` : '')

  const copy = authEmailCopy(action)
  const html = buildAuthEmailHtml({ action, confirmUrl, email })
  const text = buildAuthEmailText({ action, confirmUrl, email })

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: sendFrom,
      to: [email],
      subject: copy.subject,
      html,
      text,
    }),
  })

  if (!resendResponse.ok) {
    const body = (await resendResponse.text()).slice(0, 500)
    console.error('[auth-email] resend failed', resendResponse.status, body)
    return json(
      {
        error: {
          http_code: resendResponse.status,
          message: 'The sign-in letter could not be delivered.',
        },
      },
      500,
    )
  }

  console.log('[auth-email] sent', JSON.stringify({ email, action }))
  return json({}, 200)
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
