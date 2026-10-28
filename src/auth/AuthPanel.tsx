import { useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useOtpCooldownStatus } from './authEmailStatus.ts'
import { requestMagicLink } from './magicLink.ts'
import { clearGuestDisplayName } from '../lib/guestSend.ts'
import { supabase, supabaseConfigured } from '../lib/supabase.ts'

type AuthPanelProps = {
  session: Session | null
  guestDisplayName?: string
}

export function AuthPanel({ session, guestDisplayName = '' }: AuthPanelProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const { displayStatus, coolingDown } = useOtpCooldownStatus(status)

  if (!supabaseConfigured || !supabase) {
    return (
      <p className="auth-note" title="Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local">
        Local only
      </p>
    )
  }

  async function requestLink(event: FormEvent) {
    event.preventDefault()
    if (!email.trim() || coolingDown) return
    setBusy(true)
    setStatus('')
    const { error } = await requestMagicLink(email)
    setBusy(false)
    if (error) setStatus(error)
    else
      setStatus(
        'Look for a letter from Paper scroll studio. After you tap the seal, you stay signed in on this computer until you sign out.',
      )
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    clearGuestDisplayName()
    setOpen(false)
  }

  if (session) {
    const isGuest = Boolean(session.user.is_anonymous)
    const label = isGuest
      ? guestDisplayName
        ? `Guest: ${guestDisplayName}`
        : 'Guest'
      : (session.user.email ?? 'Signed in')
    return (
      <div className="auth-signed">
        <span
          className="auth-email"
          title={
            isGuest
              ? 'Guest session — stays on this computer until you sign out'
              : (session.user.email ?? 'Signed in on this computer')
          }
        >
          {label}
        </span>
        {isGuest && (
          <button type="button" className="auth-button" onClick={() => setOpen((value) => !value)}>
            Sign in to save
          </button>
        )}
        <button type="button" className="auth-button" onClick={() => void signOut()}>
          Sign out
        </button>
        {isGuest && open && (
          <form className="auth-form" onSubmit={(event) => void requestLink(event)}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                required
                autoComplete="email"
                placeholder="you@example.com"
                disabled={busy || coolingDown}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button type="submit" disabled={busy || coolingDown || !email.trim()}>
              {busy ? 'Sending…' : coolingDown ? displayStatus : 'Email me a link'}
            </button>
            {displayStatus && <p className="auth-status">{displayStatus}</p>}
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="auth-panel">
      <button type="button" className="auth-button" onClick={() => setOpen((value) => !value)}>
        Sign in
      </button>
      {open && (
        <form className="auth-form" onSubmit={(event) => void requestLink(event)}>
          <p className="auth-help">
            We’ll send a one-time letter from Paper scroll studio. After you tap it, you stay signed in
            here until you sign out.
          </p>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              required
              autoComplete="email"
              placeholder="you@example.com"
              disabled={busy || coolingDown}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button type="submit" disabled={busy || coolingDown || !email.trim()}>
            {busy ? 'Sending…' : coolingDown ? displayStatus : 'Email me a link'}
          </button>
          {displayStatus && <p className="auth-status">{displayStatus}</p>}
        </form>
      )}
    </div>
  )
}
