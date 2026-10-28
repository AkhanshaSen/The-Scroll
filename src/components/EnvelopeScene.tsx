import { WaxEnvelope } from './WaxEnvelope.tsx'

type EnvelopeSceneProps = {
  active: boolean
  sent: boolean
  title: string
}

export function EnvelopeScene({ active, sent, title }: EnvelopeSceneProps) {
  if (!active) return null

  return (
    <div className={`envelope-scene ${sent ? 'is-sent' : ''}`} aria-live="polite">
      <WaxEnvelope mode={sent ? 'sent' : 'sealing'} title={title || 'A scroll'} />
      <p className="envelope-caption">{sent ? 'On its way' : 'Into the envelope…'}</p>
    </div>
  )
}
