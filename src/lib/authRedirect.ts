/** Magic-link return URL (works on localhost and GitHub Pages base path). */
export function authRedirectUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const origin = window.location.origin
  if (base === '/' || base === '') return origin
  const path = base.startsWith('/') ? base : `/${base}`
  return `${origin}${path}`.replace(/\/+$/, '') || origin
}
