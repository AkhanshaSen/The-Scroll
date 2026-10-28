export const RECIPIENT_CATEGORIES = [
  { id: 'family', label: 'Family' },
  { id: 'friend', label: 'Friend' },
  { id: 'colleague', label: 'Colleague' },
  { id: 'acquaintance', label: 'Acquaintance' },
] as const

export type RecipientCategory = (typeof RECIPIENT_CATEGORIES)[number]['id']

export type MailRecipient = {
  email: string
  category: RecipientCategory
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_RECIPIENTS = 10

export function isValidEmail(value: string): boolean {
  const email = value.trim().toLowerCase()
  return EMAIL_RE.test(email) && email.length <= 320
}

export function normalizeCategory(value: string): RecipientCategory {
  return RECIPIENT_CATEGORIES.some((item) => item.id === value)
    ? (value as RecipientCategory)
    : 'friend'
}

export function sanitizeRecipients(raw: MailRecipient[]): MailRecipient[] {
  const seen = new Set<string>()
  const out: MailRecipient[] = []
  for (const item of raw) {
    const email = item.email.trim().toLowerCase()
    if (!isValidEmail(email) || seen.has(email)) continue
    seen.add(email)
    out.push({ email, category: normalizeCategory(item.category) })
    if (out.length >= MAX_RECIPIENTS) break
  }
  return out
}

export { MAX_RECIPIENTS }
