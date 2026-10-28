/** Client feature flag for guest send (magic-link still always available). */
export function allowGuestSend(): boolean {
  const raw = (import.meta.env.VITE_ALLOW_GUEST_SEND as string | undefined)?.trim().toLowerCase()
  return raw === 'true' || raw === '1' || raw === 'yes'
}

export const GUEST_DISPLAY_NAME_KEY = 'scroll_guest_display_name'

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
    return sanitizeDisplayName(sessionStorage.getItem(GUEST_DISPLAY_NAME_KEY) ?? '')
  } catch {
    return ''
  }
}

export function saveGuestDisplayName(name: string): void {
  const clean = sanitizeDisplayName(name)
  try {
    if (clean) sessionStorage.setItem(GUEST_DISPLAY_NAME_KEY, clean)
    else sessionStorage.removeItem(GUEST_DISPLAY_NAME_KEY)
  } catch {
    /* ignore */
  }
}

export function clearGuestDisplayName(): void {
  try {
    sessionStorage.removeItem(GUEST_DISPLAY_NAME_KEY)
  } catch {
    /* ignore */
  }
}
