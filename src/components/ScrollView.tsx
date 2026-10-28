import { useEffect, useState, type FormEvent } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase.ts'

type ViewState =
  | { stage: 'loading' }
  | { stage: 'error'; message: string }
  | { stage: 'envelope'; title: string; note: string; senderEmail: string; imageBase64: string }
  | { stage: 'opening'; title: string; note: string; senderEmail: string; imageBase64: string }
  | { stage: 'reading'; title: string; note: string; senderEmail: string; imageBase64: string }
  | { stage: 'signup'; title: string }

export function ScrollView({ token }: { token: string }) {
  const [state, setState] = useState<ViewState>({ stage: 'loading' })
  const [signupEmail, setSignupEmail] = useState('')
  const [signupStatus, setSignupStatus] = useState('')
  const [signupBusy, setSignupBusy] = useState(false)

  useEffect(() => {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '')
    const apiKey =
      (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
      (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
      ''

    if (!token) return
    if (!supabaseUrl) return

    let cancelled = false

    const doFetch = async () => {
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/view-scroll?token=${encodeURIComponent(token)}`,
          { headers: { apikey: apiKey } },
        )
        const data = (await res.json()) as {
          title?: string
          note?: string
          senderEmail?: string
          imageBase64?: string
          error?: string
        }
        if (cancelled) return
        if (!res.ok || data.error) {
          setState({ stage: 'error', message: data.error ?? 'Scroll not found.' })
          return
        }
        setState({
          stage: 'envelope',
          title: data.title ?? 'A scroll',
          note: data.note ?? '',
          senderEmail: data.senderEmail ?? '',
          imageBase64: data.imageBase64 ?? '',
        })
      } catch {
        if (!cancelled) setState({ stage: 'error', message: 'Could not load this scroll. Try again.' })
      }
    }

    void doFetch()
    return () => {
      cancelled = true
    }
  }, [token])

  // Auto-open envelope after 1.4 s
  useEffect(() => {
    if (state.stage !== 'envelope') return
    const { title, note, senderEmail, imageBase64 } = state
    const timer = window.setTimeout(
      () => setState({ stage: 'opening', title, note, senderEmail, imageBase64 }),
      1400,
    )
    return () => window.clearTimeout(timer)
  }, [state])

  // Transition opening → reading after animation
  useEffect(() => {
    if (state.stage !== 'opening') return
    const { title, note, senderEmail, imageBase64 } = state
    const timer = window.setTimeout(
      () => setState({ stage: 'reading', title, note, senderEmail, imageBase64 }),
      1800,
    )
    return () => window.clearTimeout(timer)
  }, [state])

  async function requestSignupLink(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !signupEmail.trim()) return
    setSignupBusy(true)
    setSignupStatus('')
    const { error } = await supabase.auth.signInWithOtp({
      email: signupEmail.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setSignupBusy(false)
    if (error) setSignupStatus(error.message)
    else setSignupStatus('Check your email for a sign-in link. Start folding scrolls!')
  }

  if (state.stage === 'loading') {
    return (
      <div className="sv-root">
        <div className="sv-center">
          <p className="sv-hint">Unfolding your scroll…</p>
        </div>
      </div>
    )
  }

  if (state.stage === 'error') {
    return (
      <div className="sv-root">
        <div className="sv-center">
          <p className="sv-error">{state.message}</p>
          <a href="/" className="sv-home-link">Go to Paper scroll studio</a>
        </div>
      </div>
    )
  }

  if (state.stage === 'envelope' || state.stage === 'opening') {
    const { title, senderEmail } = state
    const isOpening = state.stage === 'opening'
    return (
      <div className="sv-root">
        <div className="sv-center">
          <p className="sv-from">
            {senderEmail ? `${senderEmail.split('@')[0]} sent you a scroll` : 'A scroll arrived for you'}
          </p>
          <div className={`sv-envelope ${isOpening ? 'sv-envelope-open' : ''}`} aria-label="Opening envelope">
            <div className="sv-env-flap" />
            <div className="sv-env-pocket">
              <div className="sv-env-letter">
                <span>{title}</span>
              </div>
            </div>
            <div className="sv-env-seal" aria-hidden="true">✦</div>
          </div>
          <p className="sv-hint">{isOpening ? 'Opening…' : 'Tap to open'}</p>
          {!isOpening && state.stage === 'envelope' && (
            <button
              type="button"
              className="sv-open-btn"
              onClick={() => {
                const { title, note, senderEmail, imageBase64 } = state
                setState({ stage: 'opening', title, note, senderEmail, imageBase64 })
              }}
            >
              Open scroll
            </button>
          )}
        </div>
      </div>
    )
  }

  if (state.stage === 'reading') {
    const { title, note, senderEmail, imageBase64 } = state
    return (
      <div className="sv-root sv-root-reading">
        <div className="sv-reading-area">
          <header className="sv-header">
            <p className="sv-from-reading">
              {senderEmail ? `${senderEmail.split('@')[0]} sent this to you` : 'A scroll for you'}
            </p>
            <h1 className="sv-scroll-title">{title}</h1>
            {note ? <p className="sv-note">"{note}"</p> : null}
          </header>
          <div className="sv-paper-wrap sv-unroll">
            <img className="sv-paper-img" src={imageBase64} alt={title} />
          </div>
          <div className="sv-cta-area">
            <button
              type="button"
              className="sv-cta-btn"
              onClick={() => setState({ stage: 'signup', title })}
            >
              Send your own scroll
            </button>
          </div>
        </div>
      </div>
    )
  }

  // signup
  const { title } = state
  return (
    <div className="sv-root">
      <div className="sv-center">
        <div className="sv-signup-card">
          <div className="sv-signup-seal" aria-hidden="true">✦</div>
          <h2 className="sv-signup-title">Fold your own scroll</h2>
          <p className="sv-signup-sub">
            Paper scroll studio lets you write poems and notes on textured paper, then fold them into an
            envelope and send them to anyone.
          </p>
          {supabaseConfigured ? (
            <form onSubmit={(event) => void requestSignupLink(event)} className="sv-signup-form">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="your@email.com"
                value={signupEmail}
                disabled={signupBusy}
                onChange={(event) => setSignupEmail(event.target.value)}
              />
              <button type="submit" className="sv-cta-btn" disabled={signupBusy || !signupEmail.trim()}>
                {signupBusy ? 'Sending…' : 'Get started — it\'s free'}
              </button>
              {signupStatus && <p className="sv-signup-status">{signupStatus}</p>}
            </form>
          ) : (
            <a href="/" className="sv-cta-btn">Open Paper scroll studio</a>
          )}
          <p className="sv-signup-note">
            Replying to "{title}" you just read.
          </p>
        </div>
      </div>
    </div>
  )
}
