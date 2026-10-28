import { useState, type FormEvent } from 'react'
import { useOtpCooldownStatus } from '../auth/authEmailStatus.ts'
import { requestMagicLink } from '../auth/magicLink.ts'
import { supabaseConfigured } from '../lib/supabase.ts'

export const WELCOME_EMAIL_DISMISS_KEY = 'scroll_welcome_email_dismissed'

export function wasWelcomeEmailDismissed(): boolean {
  try {
    return localStorage.getItem(WELCOME_EMAIL_DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function markWelcomeEmailDismissed(): void {
  try {
    localStorage.setItem(WELCOME_EMAIL_DISMISS_KEY, '1')
  } catch {
    /* ignore */
  }
}

type WelcomeEmailDialogProps = {
  open: boolean
  onDismiss: () => void
}

export function WelcomeEmailDialog({ open, onDismiss }: WelcomeEmailDialogProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const { displayStatus, coolingDown } = useOtpCooldownStatus(status)

  if (!open || !supabaseConfigured) return null

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || coolingDown || !email.trim()) return
    setBusy(true)
    setStatus('')
    const { error } = await requestMagicLink(email)
    setBusy(false)
    if (error) {
      setStatus(error)
      return
    }
    markWelcomeEmailDismissed()
    setStatus(
      'Look for a letter from Paper scroll studio. After you tap the seal, you stay signed in here — then you can send a scroll to someone you love.',
    )
  }

  function writeFirst() {
    markWelcomeEmailDismissed()
    onDismiss()
  }

  const linkSent = status.startsWith('Look for a letter')

  return (
    <div className="send-backdrop" role="presentation">
      <div
        className="send-sheet send-sheet-wide send-gate welcome-email"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-email-title"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={(event) => void submit(event)}>
          <h2 id="welcome-email-title">Your email, so you can send</h2>
          <p className="whisper">
            Sign in with a one-time letter — no password. After that you can save scrolls on this
            computer and fold one into an envelope for someone you love. You can also write first and
            sign in when you tap Send by mail.
          </p>
          <label className="field">
            <span>Your email</span>
            <input
              type="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              disabled={busy || coolingDown}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <div className="send-gate-actions">
            {!linkSent && (
              <button
                type="submit"
                className="write"
                disabled={busy || coolingDown || !email.trim()}
              >
                {busy ? 'Sending…' : coolingDown ? displayStatus : 'Email me a link'}
              </button>
            )}
            <button type="button" className="send-gate-secondary" disabled={busy} onClick={writeFirst}>
              {linkSent ? 'Continue writing' : 'Write first — I’ll sign in when I send'}
            </button>
          </div>
          {displayStatus && !coolingDown && (
            <p className="auth-status send-gate-status">{displayStatus}</p>
          )}
          {coolingDown && <p className="auth-status send-gate-status">{displayStatus}</p>}
        </form>
      </div>
    </div>
  )
}
