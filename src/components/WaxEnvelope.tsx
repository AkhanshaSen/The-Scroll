export type WaxEnvelopeMode = 'sealing' | 'sent' | 'sealed' | 'opening'

type WaxEnvelopeProps = {
  mode: WaxEnvelopeMode
  title: string
  subtitle?: string
  onOpen?: () => void
  className?: string
}

function WaxSealSvg() {
  return (
    <svg className="wax-seal-svg" viewBox="0 0 80 80" aria-hidden="true">
      <defs>
        <radialGradient id="wax-fill" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#c45a4a" />
          <stop offset="55%" stopColor="#8c2f28" />
          <stop offset="100%" stopColor="#5a1814" />
        </radialGradient>
        <radialGradient id="wax-shine" cx="32%" cy="28%" r="45%">
          <stop offset="0%" stopColor="rgba(255,220,180,0.55)" />
          <stop offset="100%" stopColor="rgba(255,220,180,0)" />
        </radialGradient>
      </defs>
      <path
        fill="url(#wax-fill)"
        d="M40 4c4.2 0 6.6 2.8 9.2 3.4 2.8.7 5.8-.6 8.2 1.2 2.4 1.8 2.6 5 4.4 7.2 1.7 2.1 4.8 2.9 5.6 5.6.9 2.9-.9 5.6-.4 8.5.5 2.9 3.1 4.9 3.1 7.9s-2.6 5-3.1 7.9c-.5 2.9 1.3 5.6.4 8.5-.8 2.7-3.9 3.5-5.6 5.6-1.8 2.2-2 5.4-4.4 7.2-2.4 1.8-5.4.5-8.2 1.2-2.6.6-5 3.4-9.2 3.4s-6.6-2.8-9.2-3.4c-2.8-.7-5.8.6-8.2-1.2-2.4-1.8-2.6-5-4.4-7.2-1.7-2.1-4.8-2.9-5.6-5.6-.9-2.9.9-5.6.4-8.5C8.1 45 5.5 43 5.5 40s2.6-5 3.1-7.9c.5-2.9-1.3-5.6-.4-8.5.8-2.7 3.9-3.5 5.6-5.6 1.8-2.2 2-5.4 4.4-7.2 2.4-1.8 5.4-.5 8.2-1.2C33.4 6.8 35.8 4 40 4z"
      />
      <circle cx="40" cy="40" r="22" fill="none" stroke="rgba(253,220,180,0.35)" strokeWidth="2.2" />
      <circle cx="40" cy="40" r="16" fill="none" stroke="rgba(253,220,180,0.22)" strokeWidth="1.4" />
      <path
        fill="rgba(253,244,227,0.92)"
        d="M40 26l2.4 7.4H50l-6 4.4 2.3 7.2L40 40.8l-6.3 4.2 2.3-7.2-6-4.4h7.6z"
      />
      <ellipse cx="30" cy="28" rx="10" ry="7" fill="url(#wax-shine)" />
    </svg>
  )
}

function EnvelopePocketSvg() {
  return (
    <svg className="wax-env-pocket-svg" viewBox="0 0 320 210" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="env-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0dfc0" />
          <stop offset="45%" stopColor="#e2c89a" />
          <stop offset="100%" stopColor="#d0b07e" />
        </linearGradient>
        <linearGradient id="env-left" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ead4ac" />
          <stop offset="100%" stopColor="#c9a878" />
        </linearGradient>
        <linearGradient id="env-right" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ead4ac" />
          <stop offset="100%" stopColor="#c9a878" />
        </linearGradient>
        <linearGradient id="env-bottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e6cfa0" />
          <stop offset="100%" stopColor="#c4a070" />
        </linearGradient>
        <filter id="env-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#3a2010" floodOpacity="0.22" />
        </filter>
      </defs>
      {/* Body fill */}
      <rect x="0" y="0" width="320" height="210" rx="8" fill="url(#env-paper)" />
      {/* Left flap */}
      <path d="M0 0 L160 108 L0 210 Z" fill="url(#env-left)" filter="url(#env-soft)" />
      {/* Right flap */}
      <path d="M320 0 L160 108 L320 210 Z" fill="url(#env-right)" filter="url(#env-soft)" />
      {/* Bottom flap */}
      <path d="M0 210 L160 108 L320 210 Z" fill="url(#env-bottom)" filter="url(#env-soft)" />
      {/* Crease lines */}
      <path d="M0 0 L160 108 L320 0" fill="none" stroke="rgba(90,55,25,0.22)" strokeWidth="1.2" />
      <path d="M0 210 L160 108 L320 210" fill="none" stroke="rgba(90,55,25,0.18)" strokeWidth="1.2" />
      <rect
        x="1"
        y="1"
        width="318"
        height="208"
        rx="7"
        fill="none"
        stroke="rgba(90,55,25,0.2)"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function EnvelopeFlapFrontSvg() {
  return (
    <svg className="wax-env-flap-svg" viewBox="0 0 320 118" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="flap-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6ead0" />
          <stop offset="55%" stopColor="#e4c898" />
          <stop offset="100%" stopColor="#d4b280" />
        </linearGradient>
      </defs>
      <path d="M0 0 L320 0 L160 118 Z" fill="url(#flap-front)" />
      <path d="M0 0 L160 118 L320 0" fill="none" stroke="rgba(90,55,25,0.22)" strokeWidth="1.2" />
    </svg>
  )
}

function EnvelopeFlapBackSvg() {
  return (
    <svg className="wax-env-flap-svg" viewBox="0 0 320 118" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="flap-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a3c24" />
          <stop offset="100%" stopColor="#3a2414" />
        </linearGradient>
      </defs>
      <path d="M0 0 L320 0 L160 118 Z" fill="url(#flap-back)" />
    </svg>
  )
}

export function WaxEnvelope({ mode, title, subtitle, onOpen, className = '' }: WaxEnvelopeProps) {
  const interactive = mode === 'sealed' && typeof onOpen === 'function'
  const body = (
    <div className="wax-envelope-stage">
      <div className="wax-envelope-body">
        <div className="wax-env-liner" aria-hidden="true" />

        <div className="wax-env-letter-slot">
          <div className="wax-env-letter">
            <div className="wax-env-letter-inner">
              <p className="wax-env-letter-title">{title || 'A scroll'}</p>
              {subtitle ? <p className="wax-env-letter-sub">{subtitle}</p> : null}
            </div>
          </div>
        </div>

        <div className="wax-env-pocket" aria-hidden="true">
          <EnvelopePocketSvg />
        </div>

        <div className="wax-env-flap" aria-hidden="true">
          <div className="wax-env-flap-face wax-env-flap-front">
            <EnvelopeFlapFrontSvg />
          </div>
          <div className="wax-env-flap-face wax-env-flap-back">
            <EnvelopeFlapBackSvg />
          </div>
        </div>

        <div className="wax-env-seal" aria-hidden="true">
          <WaxSealSvg />
        </div>
      </div>
    </div>
  )

  if (interactive) {
    return (
      <button
        type="button"
        className={`wax-envelope wax-envelope-${mode} ${className}`.trim()}
        aria-label="Open sealed scroll"
        onClick={onOpen}
      >
        {body}
      </button>
    )
  }

  return (
    <div className={`wax-envelope wax-envelope-${mode} ${className}`.trim()}>
      {body}
    </div>
  )
}
