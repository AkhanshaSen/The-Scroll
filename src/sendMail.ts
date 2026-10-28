import type { MailRecipient } from './lib/recipients.ts'
import { sanitizeRecipients } from './lib/recipients.ts'
import { supabase } from './lib/supabase.ts'

export async function sendScrollMail(input: {
  scrollId: string
  recipients: MailRecipient[]
  note: string
  imageBase64: string
  title: string
  senderDisplayName?: string
}): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured. Add keys to .env.local.')
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) throw new Error('Sign in or continue as guest before sending a scroll.')

  const recipients = sanitizeRecipients(input.recipients)
  if (recipients.length === 0) throw new Error('Add at least one valid email address.')

  const { data, error } = await supabase.functions.invoke('send-scroll', {
    body: {
      scrollId: input.scrollId,
      recipients,
      note: input.note,
      imageBase64: input.imageBase64,
      title: input.title,
      senderDisplayName: input.senderDisplayName?.trim() || undefined,
    },
  })

  if (error) {
    const fromBody = await extractInvokeError(error, data)
    throw new Error(fromBody || error.message || 'The letter could not be sent.')
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error))
  }
}

/** Prefer the Edge Function JSON `error` field over the generic “non-2xx” message. */
async function extractInvokeError(error: unknown, data: unknown): Promise<string | null> {
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return String(data.error)
  }

  const maybeResponse = error && typeof error === 'object' && 'context' in error
    ? (error as { context?: Response }).context
    : undefined

  if (maybeResponse && typeof maybeResponse.json === 'function') {
    try {
      const cloned = maybeResponse.clone?.() ?? maybeResponse
      const body = (await cloned.json()) as { error?: string }
      if (body?.error) return String(body.error)
    } catch {
      /* ignore parse errors */
    }
  }

  return null
}
