import { useEffect, useRef, useState } from 'react'
import type { Scrap, Scroll, Stroke } from '../types.ts'
import { Sheet } from './Sheet.tsx'
import { ScrollRoller, SilkRibbon } from './ScrollRoller.tsx'

export type ScrollPhase = 'opening' | 'open' | 'folding' | 'envelope' | 'closing'

type OpenProps = {
  scroll: Scroll
  phase: ScrollPhase
  pen: boolean
  focusId: string | null
  onPhaseEnd: (phase: ScrollPhase) => void
  onFocused: () => void
  onAddScrap: (x: number, y: number) => void
  onChangeScrap: (id: string, patch: Partial<Scrap>) => void
  onDeleteScrap: (id: string) => void
  onCommitStroke: (stroke: Stroke) => void
}

export function OpenScroll({ phase, onPhaseEnd, scroll, ...sheet }: OpenProps) {
  const clipRef = useRef<HTMLDivElement>(null)
  const [armed, setArmed] = useState(false)
  if (phase !== 'opening' && armed) setArmed(false)
  const spreadNow =
    phase === 'open' || (phase === 'opening' && armed) || phase === 'folding' || phase === 'envelope'
  const folding = phase === 'folding' || phase === 'envelope'
  const tight = !spreadNow
  const ribbonState: 'tied' | 'untied' =
    phase === 'closing' || folding || (phase === 'opening' && !armed) || tight ? 'tied' : 'untied'

  useEffect(() => {
    if (phase !== 'opening') return
    const frame = requestAnimationFrame(() => setArmed(true))
    return () => cancelAnimationFrame(frame)
  }, [phase, scroll.id])

  useEffect(() => {
    if (phase === 'open' || phase === 'envelope') return
    if (phase === 'folding') {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const wait = reduced ? 0 : 1600
      const timer = window.setTimeout(() => onPhaseEnd('folding'), wait)
      return () => window.clearTimeout(timer)
    }
    const el = clipRef.current
    if (!el) return
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      onPhaseEnd(phase)
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return
    }
    const onEnd = (event: TransitionEvent) => {
      if (event.target !== el || event.propertyName !== 'grid-template-rows') return
      finish()
    }
    el.addEventListener('transitionend', onEnd)
    const fallback = window.setTimeout(finish, 1600)
    return () => {
      settled = true
      el.removeEventListener('transitionend', onEnd)
      window.clearTimeout(fallback)
    }
  }, [phase, onPhaseEnd])

  const clipClass =
    spreadNow && !folding
      ? 'clip is-open'
      : phase === 'closing'
        ? 'clip is-closing'
        : folding
          ? 'clip is-open is-folding'
          : 'clip is-opening'

  return (
    <div
      className={`stage ${spreadNow ? 'is-spread' : 'is-tight'} ${folding ? 'is-folding' : ''} ${phase === 'envelope' ? 'is-enveloped' : ''} ${phase === 'closing' ? 'is-rolling-up' : ''} ${phase === 'opening' ? 'is-unrolling' : ''} tube-${scroll.texture}`}
    >
      <ScrollRoller position="top" />
      <div ref={clipRef} className={clipClass}>
        <div className="clip-inner">
          <div className="roll-curl roll-curl-top" aria-hidden="true" />
          <div className="sheet-wrap">
            <Sheet scroll={scroll} {...sheet} />
          </div>
          <div className="roll-curl roll-curl-bottom" aria-hidden="true" />
        </div>
      </div>
      <ScrollRoller position="bottom" />
      <SilkRibbon state={ribbonState === 'tied' ? 'tied' : 'untied'} />
    </div>
  )
}
