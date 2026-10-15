import { useCallback, useEffect, useRef, useState } from 'react'
import { Desk } from './components/Desk.tsx'
import type { ScrollPhase } from './components/Scroll.tsx'
import { captureStage, downloadPdf, printSheet } from './exportSheet.ts'
import { addScrap, addSticker, createScroll, displayTitle, duplicateScroll, normalizeLook, scatterLines, syncBlankScrapToWords, syncWordsToBlank, uid, withTexture, writeFromWords } from './model.ts'
import { loadDesk, saveDesk } from './storage.ts'
import type { Scroll, Stroke, TextureId } from './types.ts'

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function App() {
  const [scrolls, setScrolls] = useState<Scroll[]>(() => loadDesk())
  const [openId, setOpenId] = useState<string | null>(null)
  const [phase, setPhase] = useState<ScrollPhase>('open')
  const [pen, setPen] = useState(false)
  const [busy, setBusy] = useState<'print' | 'pdf' | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const pendingRef = useRef<string | null>(null)
  const phaseRef = useRef<ScrollPhase>('open')
  const clearFocus = useCallback(() => setFocusId(null), [])

  const onPhaseEnd = useCallback((ended: ScrollPhase) => {
    if (phaseRef.current !== ended) return
    if (ended === 'opening') {
      phaseRef.current = 'open'
      setPhase('open')
      return
    }
    if (ended !== 'closing') return
    const next = pendingRef.current
    pendingRef.current = null
    if (next) {
      const following = reducedMotion() ? 'open' : 'opening'
      phaseRef.current = following
      setOpenId(next)
      setPhase(following)
    } else {
      phaseRef.current = 'open'
      setOpenId(null)
    }
  }, [])

  useEffect(() => {
    saveDesk(scrolls)
  }, [scrolls])

  function update(id: string, recipe: (scroll: Scroll) => Scroll) {
    setScrolls((current) => current.map((scroll) => (scroll.id === id ? recipe(scroll) : scroll)))
  }

  function openRoll(id: string) {
    setPen(false)
    const scroll = scrolls.find((item) => item.id === id)
    if (scroll?.form === 'blank' && !scroll.scraps.some((scrap) => scrap.role === 'blank')) {
      const blankId = uid()
      update(id, (current) =>
        current.form === 'blank' && !current.scraps.some((scrap) => scrap.role === 'blank')
          ? syncWordsToBlank(current, current.words, blankId)
          : current,
      )
      setFocusId(blankId)
    }
    setOpenId(id)
    const next = reducedMotion() ? 'open' : 'opening'
    phaseRef.current = next
    setPhase(next)
  }

  function requestClose(nextId: string | null) {
    setPen(false)
    if (!openId) {
      if (nextId) openRoll(nextId)
      return
    }
    if (phaseRef.current === 'closing') {
      if (nextId) pendingRef.current = nextId
      return
    }
    if (reducedMotion()) {
      phaseRef.current = 'open'
      if (nextId && nextId !== openId) openRoll(nextId)
      else setOpenId(null)
      return
    }
    pendingRef.current = nextId && nextId !== openId ? nextId : null
    phaseRef.current = 'closing'
    setPhase('closing')
  }

  function create() {
    const scroll = createScroll()
    setScrolls((current) => [...current, scroll])
    if (openId) requestClose(scroll.id)
    else openRoll(scroll.id)
  }

  function remove(id: string) {
    const scroll = scrolls.find((item) => item.id === id)
    if (!scroll) return
    const dirty = scroll.scraps.some((scrap) => scrap.text.trim()) || scroll.strokes.length > 0
    if (dirty && !window.confirm('Throw this roll away? It only exists on this computer.')) return
    const fallback = scrolls.length === 1 ? createScroll() : null
    setScrolls((current) => {
      const next = current.filter((item) => item.id !== id)
      if (next.length) return next
      return fallback ? [fallback] : [createScroll()]
    })
    if (openId === id) {
      pendingRef.current = null
      phaseRef.current = 'open'
      setOpenId(null)
      setPhase('open')
      setPen(false)
    }
  }

  function duplicate(id: string) {
    const scroll = scrolls.find((item) => item.id === id)
    if (!scroll) return
    const copy = duplicateScroll(scroll)
    setScrolls((current) => {
      const index = current.findIndex((item) => item.id === id)
      const next = [...current]
      next.splice(index + 1, 0, copy)
      return next
    })
    requestClose(copy.id)
  }

  const open = scrolls.find((scroll) => scroll.id === openId)

  async function share(mode: 'print' | 'pdf') {
    if (!open || busy || phase === 'closing') return
    setBusy(mode)
    try {
      const image = await captureStage()
      if (mode === 'pdf') await downloadPdf(image, displayTitle(open))
      else printSheet(image)
    } catch {
      window.alert('The paper could not be prepared. Try again with the roll open.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Desk
      scrolls={scrolls}
      openId={openId}
      phase={phase}
      pen={pen}
      busy={busy}
      focusId={focusId}
      onToggle={(id) => {
        if (openId === id) requestClose(null)
        else requestClose(id)
      }}
      onCreate={create}
      onPhaseEnd={onPhaseEnd}
      onFocused={clearFocus}
      onPatch={(patch) => {
        if (!open) return
        const creatingBlank = patch.form === 'blank' && !open.scraps.some((scrap) => scrap.role === 'blank')
        const blankId = creatingBlank ? uid() : null
        update(open.id, (scroll) => {
          const next = normalizeLook({ ...scroll, ...patch })
          if (next.form !== 'blank') return next
          if (patch.form !== 'blank' && typeof patch.words !== 'string') return next
          return syncWordsToBlank(next, next.words, blankId ?? undefined)
        })
        if (patch.form === 'blank') {
          const id = blankId ?? open.scraps.find((scrap) => scrap.role === 'blank')?.id
          if (id) setFocusId(id)
        }
      }}
      onTexture={(texture: TextureId) => {
        if (open) update(open.id, (scroll) => withTexture(scroll, texture))
      }}
      onWrite={() => {
        if (open) update(open.id, writeFromWords)
      }}
      onScatter={() => {
        if (open) update(open.id, scatterLines)
      }}
      onRollUp={() => requestClose(null)}
      onDuplicate={() => {
        if (open) duplicate(open.id)
      }}
      onDelete={() => {
        if (open) remove(open.id)
      }}
      onPen={() => setPen((value) => !value)}
      onUndo={() => {
        if (open) update(open.id, (scroll) => ({ ...scroll, strokes: scroll.strokes.slice(0, -1) }))
      }}
      onWipe={() => {
        if (open) update(open.id, (scroll) => ({ ...scroll, strokes: [] }))
      }}
      onSticker={(mark) => {
        if (!open || phase === 'closing') return
        update(open.id, (scroll) => addSticker(scroll, mark, uid()))
      }}
      onPrint={() => {
        void share('print')
      }}
      onPdf={() => {
        void share('pdf')
      }}
      onAddScrap={(x, y) => {
        if (!open || phase === 'closing') return
        const id = uid()
        setFocusId(id)
        update(open.id, (scroll) => addScrap(scroll, x, y, id))
      }}
      onChangeScrap={(id, patch) => {
        if (!open) return
        update(open.id, (scroll) => {
          const target = scroll.scraps.find((scrap) => scrap.id === id)
          if (target?.role === 'blank' && typeof patch.text === 'string') {
            return syncBlankScrapToWords(scroll, id, patch.text)
          }
          return {
            ...scroll,
            scraps: scroll.scraps.map((scrap) => (scrap.id === id ? { ...scrap, ...patch } : scrap)),
          }
        })
      }}
      onDeleteScrap={(id) => {
        if (!open) return
        update(open.id, (scroll) => {
          const target = scroll.scraps.find((scrap) => scrap.id === id)
          if (target?.role === 'blank') return syncBlankScrapToWords(scroll, id, '')
          return { ...scroll, scraps: scroll.scraps.filter((scrap) => scrap.id !== id) }
        })
      }}
      onCommitStroke={(stroke: Stroke) => {
        if (!open || phase === 'closing') return
        update(open.id, (scroll) => ({ ...scroll, strokes: [...scroll.strokes, stroke] }))
      }}
    />
  )
}
