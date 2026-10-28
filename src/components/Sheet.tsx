import { useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { fontOf, inkOf, type Scrap, type Scroll, type Stroke } from '../types.ts'

type SheetProps = {
  scroll: Scroll
  pen: boolean
  focusId: string | null
  onFocused: () => void
  onAddScrap: (x: number, y: number) => void
  onChangeScrap: (id: string, patch: Partial<Scrap>) => void
  onDeleteScrap: (id: string) => void
  onCommitStroke: (stroke: Stroke) => void
}

export function Sheet({
  scroll,
  pen,
  focusId,
  onFocused,
  onAddScrap,
  onChangeScrap,
  onDeleteScrap,
  onCommitStroke,
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const grainId = useId().replace(/:/g, '')
  const [selected, setSelected] = useState<string | null>(null)
  const [box, setBox] = useState({ w: 640, h: 760 })
  const [draft, setDraft] = useState<Stroke | null>(null)
  const draftRef = useRef<Stroke | null>(null)
  const font = fontOf(scroll.font)
  const ink = inkOf(scroll.ink)
  const quiet = scroll.scraps.every((scrap) => !scrap.text.trim()) && scroll.strokes.length === 0 && !draft

  const layoutKey = scroll.scraps.map((scrap) => `${scrap.text}|${scrap.x}|${scrap.y}|${scrap.width}|${scrap.size}`).join('~')

  useEffect(() => {
    if (pen) return
    const current = draftRef.current
    if (!current) return
    draftRef.current = null
    setDraft(null)
    if (worthKeeping(current)) onCommitStroke(current)
  }, [pen, onCommitStroke])

  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    let frame = 0
    const fit = () => {
      let bottom = 680
      for (const node of el.querySelectorAll<HTMLElement>('.scrap')) {
        bottom = Math.max(bottom, node.offsetTop + node.offsetHeight + 80)
      }
      const nextHeight = `${bottom}px`
      if (el.style.minHeight !== nextHeight) el.style.minHeight = nextHeight
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = { w: Math.max(el.clientWidth, 1), h: Math.max(el.clientHeight, 1) }
        setBox((current) => (current.w === next.w && current.h === next.h ? current : next))
      })
    }
    const watch = new ResizeObserver(fit)
    for (const node of el.querySelectorAll('.scrap-text')) watch.observe(node)
    fit()
    return () => {
      cancelAnimationFrame(frame)
      watch.disconnect()
    }
  }, [layoutKey, scroll.font])

  function pointFrom(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = sheetRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 }
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    }
  }

  function startStroke(event: ReactPointerEvent<SVGSVGElement>) {
    if (!pen) return
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Some pointer events cannot be captured. The stroke can still be drawn.
    }
    const stroke: Stroke = {
      id: crypto.randomUUID(),
      ink: scroll.ink,
      size: 2.3,
      points: [pointFrom(event)],
    }
    draftRef.current = stroke
    setDraft(stroke)
  }

  function moveStroke(event: ReactPointerEvent<SVGSVGElement>) {
    const current = draftRef.current
    if (!current) return
    const next = pointFrom(event)
    const last = current.points[current.points.length - 1]
    if (last && Math.hypot(next.x - last.x, next.y - last.y) < 0.35) return
    const stroke = { ...current, points: [...current.points, next] }
    draftRef.current = stroke
    setDraft(stroke)
  }

  function endStroke() {
    const current = draftRef.current
    draftRef.current = null
    setDraft(null)
    if (current && worthKeeping(current)) onCommitStroke(current)
  }

  function place(event: ReactPointerEvent<HTMLDivElement>) {
    if (pen || event.target !== event.currentTarget) return
    const rect = sheetRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setSelected(null)
    onAddScrap(x, y)
  }

  return (
    <div
      ref={sheetRef}
      className={`sheet texture-${scroll.texture} hand-${scroll.font} ${pen ? 'is-pen' : ''}`}
    >
      <div className="paper-hit" onPointerDown={place} />
      <svg className="grain" aria-hidden="true">
        <filter id={grainId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </svg>
      <div className="vignette" />
      {quiet && !pen && scroll.form !== 'blank' && (
        <p className="sheet-hint">
          Click the paper and write, or leave a few clumsy words in the tray.
        </p>
      )}
      {pen && <p className="pen-banner">Pen is down</p>}
      {scroll.scraps.map((scrap) => (
        <ScrapView
          key={scrap.role === 'generated' ? `${scrap.id}-${scroll.salt}` : scrap.id}
          scrap={scrap}
          color={ink.color}
          scale={font.scale}
          selected={selected === scrap.id}
          sheetRef={sheetRef}
          shouldFocus={focusId === scrap.id}
          onFocused={onFocused}
          onSelect={() => setSelected(scrap.id)}
          onText={(text) => onChangeScrap(scrap.id, { text })}
          onMove={(x, y) => onChangeScrap(scrap.id, { x, y })}
          onResize={(width) => onChangeScrap(scrap.id, { width })}
          onSize={(size) => onChangeScrap(scrap.id, { size })}
          onDelete={() => onDeleteScrap(scrap.id)}
        />
      ))}
      <svg
        className="ink-layer"
        viewBox={`0 0 ${box.w} ${box.h}`}
        onPointerDown={startStroke}
        onPointerMove={moveStroke}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
      >
        {scroll.strokes.map((stroke) => (
          <InkLine key={stroke.id} stroke={stroke} box={box} />
        ))}
        {draft && <InkLine stroke={draft} box={box} />}
      </svg>
    </div>
  )
}

function InkLine({ stroke, box }: { stroke: Stroke; box: { w: number; h: number } }) {
  const color = inkOf(stroke.ink).color
  const points = stroke.points
    .map((point) => `${(point.x / 100) * box.w},${(point.y / 100) * box.h}`)
    .join(' ')
  return (
    <polyline
      points={points}
      fill="none"
      stroke={color}
      strokeWidth={stroke.size}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

function ScrapView({
  scrap,
  color,
  scale,
  selected,
  sheetRef,
  shouldFocus,
  onFocused,
  onSelect,
  onText,
  onMove,
  onResize,
  onSize,
  onDelete,
}: {
  scrap: Scrap
  color: string
  scale: number
  selected: boolean
  sheetRef: RefObject<HTMLDivElement | null>
  shouldFocus: boolean
  onFocused: () => void
  onSelect: () => void
  onText: (text: string) => void
  onMove: (x: number, y: number) => void
  onResize: (width: number) => void
  onSize: (size: number) => void
  onDelete: () => void
}) {
  const textRef = useRef<HTMLDivElement>(null)
  const sticker = scrap.kind === 'sticker'

  useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return
    const shown = el.innerText.replace(/\n$/, '')
    if (shown === scrap.text) return
    el.innerText = scrap.text
  }, [scrap.text])

  useEffect(() => {
    if (!shouldFocus) return
    textRef.current?.focus()
    onFocused()
  }, [shouldFocus, onFocused])

  function readText() {
    return (textRef.current?.innerText ?? '').replace(/\n$/, '')
  }

  function drag(start: ReactPointerEvent, apply: (dx: number, dy: number) => void) {
    const sheet = sheetRef.current?.getBoundingClientRect()
    if (!sheet) return
    const originX = start.clientX
    const originY = start.clientY
    const move = (event: PointerEvent) => {
      apply(event.clientX - originX, event.clientY - originY)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const toolbarBelow = scrap.y < 8

  return (
    <div
      className={`scrap ${sticker ? 'is-sticker' : ''} ${scrap.role === 'generated' ? 'is-poem' : ''} ${scrap.role === 'blank' ? 'is-blank' : ''} ${selected ? 'is-selected' : ''} ${toolbarBelow ? 'toolbar-below' : ''}`}
      style={{
        left: `${scrap.x}%`,
        top: `${scrap.y}%`,
        width: `${scrap.width}%`,
        color,
        textAlign: scrap.align,
        fontSize: `${scrap.size * scale}px`,
      }}
      onPointerDown={onSelect}
    >
      <div className="scrap-tools">
        <button
          type="button"
          className="grip"
          aria-label="Move this writing"
          onMouseDown={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            event.stopPropagation()
            onSelect()
            const width = sheetRef.current?.getBoundingClientRect().width ?? 1
            const height = sheetRef.current?.getBoundingClientRect().height ?? 1
            const startX = scrap.x
            const startY = scrap.y
            drag(event, (dx, dy) => {
              onMove(
                clamp(startX + (dx / width) * 100, 0, 100 - scrap.width),
                clamp(startY + (dy / height) * 100, 0, 92),
              )
            })
          }}
        >
          move
        </button>
        <button type="button" aria-label="Smaller writing" onMouseDown={(event) => event.preventDefault()} onClick={() => onSize(clamp(scrap.size - (sticker ? 6 : 2), sticker ? 28 : 16, sticker ? 96 : 72))}>
          A−
        </button>
        <button type="button" aria-label="Larger writing" onMouseDown={(event) => event.preventDefault()} onClick={() => onSize(clamp(scrap.size + (sticker ? 6 : 2), sticker ? 28 : 16, sticker ? 96 : 72))}>
          A+
        </button>
        <button type="button" aria-label="Remove this writing" onMouseDown={(event) => event.preventDefault()} onClick={onDelete}>
          ×
        </button>
      </div>
      {sticker ? (
        <div className="sticker-mark" aria-hidden="true">{scrap.text}</div>
      ) : (
        <div
          ref={textRef}
          className="scrap-text"
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label="Writing"
          spellCheck={false}
          suppressContentEditableWarning
          data-placeholder={scrap.role === 'blank' ? 'write here' : 'write'}
          onFocus={onSelect}
          onInput={() => onText(readText())}
          onBlur={() => {
            const text = readText()
            if (scrap.role === 'blank' || text.trim()) onText(text)
            else onDelete()
          }}
        />
      )}
      {!sticker && <button
        type="button"
        className="resize"
        aria-label="Change the width"
        onMouseDown={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          event.stopPropagation()
          const width = sheetRef.current?.getBoundingClientRect().width ?? 1
          const start = scrap.width
          drag(event, (dx) => {
            onResize(clamp(start + (dx / width) * 100, 18, 100 - scrap.x))
          })
        }}
      />}
    </div>
  )
}

function worthKeeping(stroke: Stroke): boolean {
  const points = stroke.points
  if (points.length < 2) return false
  let length = 0
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!
    const point = points[index]!
    length += Math.hypot(point.x - previous.x, point.y - previous.y)
  }
  const diagonal = Math.hypot(100, 100)
  return length >= diagonal * 0.02 || points.length >= 8
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
