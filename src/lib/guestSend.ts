import { isValidEmail } from './recipients.ts'

/** Client feature flag for guest send (magic-link still always available). */
export function allowGuestSend(): boolean {
  const raw = (import.meta.env.VITE_ALLOW_GUEST_SEND as string | undefined)?.trim().toLowerCase()
  return raw === 'true' || raw === '1' || raw === 'yes'
}

export const GUEST_DISPLAY_NAME_KEY = 'scroll_guest_display_name'

const FALLBACK_RECIPIENT = 'kittucurious16047@gmail.com'
const FALLBACK_SENDER = 'kittucurious16047'

export function defaultRecipientEmail(): string {
  const fromEnv = (import.meta.env.VITE_DEFAULT_RECIPIENT_EMAIL as string | undefined)?.trim() ?? ''
  if (fromEnv && isValidEmail(fromEnv)) return fromEnv.toLowerCase()
  return FALLBACK_RECIPIENT
}

export function defaultSenderName(): string {
  const fromEnv = (import.meta.env.VITE_DEFAULT_SENDER_NAME as string | undefined)?.trim() ?? ''
  const cleaned = sanitizeDisplayName(fromEnv)
  if (isValidDisplayName(cleaned)) return cleaned
  return FALLBACK_SENDER
}

export function sanitizeDisplayName(raw: string): string {
  return raw
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[<>&"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
}

export function isValidDisplayName(value: string): boolean {
  const name = sanitizeDisplayName(value)
  return name.length >= 2 && name.length <= 40
}

export function loadGuestDisplayName(): string {
  try {
    const stored = sanitizeDisplayName(localStorage.getItem(GUEST_DISPLAY_NAME_KEY) ?? '')
    if (isValidDisplayName(stored)) return stored
  } catch {
    /* ignore */
  }
  return defaultSenderName()
}

export function saveGuestDisplayName(name: string): void {
  const clean = sanitizeDisplayName(name)
  try {
    if (clean) localStorage.setItem(GUEST_DISPLAY_NAME_KEY, clean)
    else localStorage.removeItem(GUEST_DISPLAY_NAME_KEY)
  } catch {
    /* ignore */
  }
}

export function clearGuestDisplayName(): void {
  try {
    localStorage.removeItem(GUEST_DISPLAY_NAME_KEY)
  } catch {
    /* ignore */
  }
}
