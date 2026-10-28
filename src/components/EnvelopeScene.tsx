type EnvelopeSceneProps = {
  active: boolean
  sent: boolean
  title: string
}

export function EnvelopeScene({ active, sent, title }: EnvelopeSceneProps) {
  if (!active) return null

  return (
    <div className={`envelope-scene ${sent ? 'is-sent' : ''}`} aria-live="polite">
      <div className="envelope">
        <div className="envelope-flap" />
        <div className="envelope-pocket">
          <div className="envelope-letter">
            <span>{title || 'A scroll'}</span>
          </div>
        </div>
        <div className="envelope-seal" aria-hidden="true" />
      </div>
      <p className="envelope-caption">{sent ? 'On its way' : 'Into the envelope…'}</p>
    </div>
  )
}
