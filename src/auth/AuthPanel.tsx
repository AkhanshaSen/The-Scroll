import { useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authRedirectUrl } from '../lib/authRedirect.ts'
import { supabase, supabaseConfigured } from '../lib/supabase.ts'

type AuthPanelProps = {
  session: Session | null
}

export function AuthPanel({ session }: AuthPanelProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  if (!supabaseConfigured || !supabase) {
    return (
      <p className="auth-note" title="Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local">
        Local only
      </p>
    )
  }

  async function requestLink(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !email.trim()) return
    setBusy(true)
    setStatus('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: authRedirectUrl() },
    })
    setBusy(false)
    if (error) setStatus(error.message)
    else setStatus('Check your email for the sign-in link.')
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setOpen(false)
  }

  if (session) {
    return (
      <div className="auth-signed">
        <span className="auth-email" title={session.user.email ?? ''}>
          {session.user.email}
        </span>
        <button type="button" className="auth-button" onClick={() => void signOut()}>
          Sign out
        </button>
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
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              required
              autoComplete="email"
              placeholder="you@example.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Email me a link'}
          </button>
          {status && <p className="auth-status">{status}</p>}
        </form>
      )}
    </div>
  )
}
