import { authRedirectUrl } from '../lib/authRedirect.ts'
import { defaultRecipientEmail } from '../lib/guestSend.ts'
import { supabase } from '../lib/supabase.ts'
import { parseOtpCooldownSeconds } from './authEmailStatus.ts'

function friendlyAuthError(message: string): string {
  if (parseOtpCooldownSeconds(message) != null) {
    return message
  }
  const lower = message.toLowerCase()
  if (lower.includes('hook') && (lower.includes('500') || lower.includes('status code'))) {
    const testInbox = defaultRecipientEmail()
    return (
      `Sign-in email hook failed. If you re-enabled the Resend Send Email hook, check SEND_EMAIL_HOOK_SECRET ` +
      `and use your Resend account email (${testInbox}) while on onboarding@resend.dev — see docs/SUPABASE_SETUP.md. ` +
      `With the hook off, Supabase sends magic links itself (any email).`
    )
  }
  return message
}

export async function requestMagicLink(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase is not configured.' }
  const trimmed = email.trim()
  if (!trimmed) return { error: 'Enter your email.' }
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: { emailRedirectTo: authRedirectUrl() },
  })
  if (!error?.message) return { error: null }
  return { error: friendlyAuthError(error.message) }
}
