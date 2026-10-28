import { useState, type FormEvent } from 'react'
import { requestMagicLink } from '../auth/magicLink.ts'
import {
  allowGuestSend,
  isValidDisplayName,
  sanitizeDisplayName,
  saveGuestDisplayName,
} from '../lib/guestSend.ts'
import { supabase } from '../lib/supabase.ts'

export type SendGateReady = {
  mode: 'signed_in' | 'guest'
  senderDisplayName?: string
}

type SendGateDialogProps = {
  open: boolean
  onClose: () => void
  onReady: (result: SendGateReady) => void
}

type Step = 'choose' | 'sign_in' | 'guest_name'

export function SendGateDialog({ open, onClose, onReady }: SendGateDialogProps) {
  const guestAllowed = allowGuestSend()
  const [step, setStep] = useState<Step>('choose')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  if (!open) return null

  function resetAndClose() {
    setStep('choose')
    setEmail('')
    setDisplayName('')
    setStatus('')
    setBusy(false)
    onClose()
  }

  async function submitMagicLink(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setStatus('')
    const { error } = await requestMagicLink(email)
    setBusy(false)
    if (error) {
      setStatus(error)
      return
    }
    setStatus('Check your email for a sign-in link. After you open it, come back and tap Send by mail again.')
  }

  async function submitGuest(event: FormEvent) {
    event.preventDefault()
    if (busy || !supabase) return
    const name = sanitizeDisplayName(displayName)
    if (!isValidDisplayName(name)) {
      setStatus('Enter a name between 2 and 40 characters (no links).')
      return
    }
    setBusy(true)
    setStatus('')
    const { error } = await supabase.auth.signInAnonymously()
    setBusy(false)
    if (error) {
      setStatus(error.message || 'Could not start a guest session. Try signing in with email.')
      return
    }
    saveGuestDisplayName(name)
    onReady({ mode: 'guest', senderDisplayName: name })
    setStep('choose')
    setEmail('')
    setDisplayName('')
    setStatus('')
  }

  return (
    <div className="send-backdrop" role="presentation" onClick={resetAndClose}>
      <div
        className="send-sheet send-sheet-wide send-gate"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-gate-title"
        onClick={(event) => event.stopPropagation()}
      >
        {step === 'choose' && (
          <>
            <h2 id="send-gate-title">Before you send</h2>
            <p className="whisper">
              Sign in with an email link to save scrolls to your account, or continue as a guest with a
              display name for the letter.
            </p>
            <div className="send-gate-actions">
              <button type="button" className="write" onClick={() => setStep('sign_in')}>
                Sign in with email link
              </button>
              {guestAllowed && (
                <button type="button" className="send-gate-secondary" onClick={() => setStep('guest_name')}>
                  Continue as guest
                </button>
              )}
              <button type="button" onClick={resetAndClose}>
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'sign_in' && (
          <form onSubmit={(event) => void submitMagicLink(event)}>
            <h2 id="send-gate-title">Sign in with email</h2>
            <p className="whisper">We’ll email you a one-time link. No password.</p>
            <label className="field">
              <span>Your email</span>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                disabled={busy}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <div className="row-actions">
              <button type="button" disabled={busy} onClick={() => { setStep('choose'); setStatus('') }}>
                Back
              </button>
              <button type="submit" className="write" disabled={busy || !email.trim()}>
                {busy ? 'Sending…' : 'Email me a link'}
              </button>
            </div>
            {status && <p className="auth-status send-gate-status">{status}</p>}
          </form>
        )}

        {step === 'guest_name' && (
          <form onSubmit={(event) => void submitGuest(event)}>
            <h2 id="send-gate-title">Send as guest</h2>
            <p className="whisper">
              Recipients will see this name on the letter. You won’t get replies unless you sign in with
              email later.
            </p>
            <label className="field">
              <span>Your name (shown on the email)</span>
              <input
                type="text"
                required
                autoComplete="name"
                maxLength={40}
                placeholder="e.g. Akhansha"
                value={displayName}
                disabled={busy}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
            <div className="row-actions">
              <button type="button" disabled={busy} onClick={() => { setStep('choose'); setStatus('') }}>
                Back
              </button>
              <button
                type="submit"
                className="write"
                disabled={busy || !isValidDisplayName(displayName)}
              >
                {busy ? 'Starting…' : 'Continue to recipients'}
              </button>
            </div>
            {status && <p className="auth-status send-gate-status">{status}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
