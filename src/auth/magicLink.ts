import { authRedirectUrl } from '../lib/authRedirect.ts'
import { supabase } from '../lib/supabase.ts'

export async function requestMagicLink(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase is not configured.' }
  const trimmed = email.trim()
  if (!trimmed) return { error: 'Enter your email.' }
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: { emailRedirectTo: authRedirectUrl() },
  })
  return { error: error?.message ?? null }
}
