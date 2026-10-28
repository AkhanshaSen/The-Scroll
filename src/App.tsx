import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Desk } from './components/Desk.tsx'
import type { ScrollPhase } from './components/Scroll.tsx'
import {
  captureSheetForSend,
  captureStage,
  downloadPdf,
  printSheet,
} from './exportSheet.ts'
import { supabase } from './lib/supabase.ts'
import {
  addScrap,
  addSticker,
  createScroll,
  displayTitle,
  duplicateScroll,
  normalizeLook,
  scatterLines,
  scrollHasContent,
  syncBlankScrapToWords,
  syncWordsToBlank,
  touchScroll,
  uid,
  visibleScrolls,
  withTexture,
  writeFromWords,
} from './model.ts'
import type { SendGateReady } from './components/SendGateDialog.tsx'
import {
  markWelcomeEmailDismissed,
  wasWelcomeEmailDismissed,
} from './components/WelcomeEmailDialog.tsx'
import {
  allowGuestSend,
  defaultSenderName,
  loadGuestDisplayName,
  saveGuestDisplayName,
} from './lib/guestSend.ts'
import type { MailRecipient } from './lib/recipients.ts'
import { sendScrollMail } from './sendMail.ts'
import { loadDesk, saveDesk } from './storage.ts'
import { deleteRemoteScroll, fetchScrollsForUser, mergeScrolls, upsertScroll } from './storage/remoteScrolls.ts'
import type { Scroll, Stroke, TextureId } from './types.ts'

function isSignedInUser(session: Session | null): boolean {
  return Boolean(session?.user && !session.user.is_anonymous)
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function App() {
  const [scrolls, setScrolls] = useState<Scroll[]>(() => loadDesk())
  const [openId, setOpenId] = useState<string | null>(null)
  const [phase, setPhase] = useState<ScrollPhase>('open')
  const [pen, setPen] = useState(false)
  const [busy, setBusy] = useState<'print' | 'pdf' | 'send' | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [guestDisplayName, setGuestDisplayName] = useState(() => loadGuestDisplayName())
  const [sendOpen, setSendOpen] = useState(false)
  const [sendGateOpen, setSendGateOpen] = useState(false)
  const [welcomeEmailOpen, setWelcomeEmailOpen] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [sendDone, setSendDone] = useState(false)
  const [sentSummary, setSentSummary] = useState<{ title: string; recipients: string[] } | null>(null)
  const [sendLogRefreshKey, setSendLogRefreshKey] = useState(0)
  const pendingRef = useRef<string | null>(null)
  const phaseRef = useRef<ScrollPhase>('open')
  const sendPayloadRef = useRef<{
    recipients: MailRecipient[]
    note: string
    imageBase64?: string
    senderDisplayName?: string
  } | null>(null)
  const senderDisplayNameRef = useRef(guestDisplayName)
  const syncTimer = useRef<number | null>(null)
  const clearFocus = useCallback(() => setFocusId(null), [])

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      const name = loadGuestDisplayName()
      setGuestDisplayName(name)
      senderDisplayNameRef.current = name
      setAuthReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (next?.user && !next.user.is_anonymous) {
        setWelcomeEmailOpen(false)
      }
      const name = loadGuestDisplayName()
      setGuestDisplayName(name)
      senderDisplayNameRef.current = name
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authReady || !supabase) return
    if (isSignedInUser(session)) {
      setWelcomeEmailOpen(false)
      return
    }
    if (wasWelcomeEmailDismissed()) return
    setWelcomeEmailOpen(true)
  }, [authReady, session])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    void (async () => {
      try {
        const remote = await fetchScrollsForUser()
        if (cancelled) return
        setScrolls((local) => {
          const merged = mergeScrolls(local, remote)
          if (!merged.length) return local
          return visibleScrolls(merged).length ? merged : [...merged, createScroll()]
        })
      } catch {
        // Keep local cache if remote is unreachable.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    if (!openId) return
    const open = scrolls.find((scroll) => scroll.id === openId)
    if (open?.isDeleted) {
      pendingRef.current = null
      phaseRef.current = 'open'
      setOpenId(null)
      setPhase('open')
      setPen(false)
    }
  }, [scrolls, openId])

  useEffect(() => {
    saveDesk(scrolls)
    if (!session || !supabase) return
    if (syncTimer.current) window.clearTimeout(syncTimer.current)
    syncTimer.current = window.setTimeout(() => {
      void Promise.all(scrolls.map((scroll) => upsertScroll(scroll).catch(() => undefined)))
    }, 800)
    return () => {
      if (syncTimer.current) window.clearTimeout(syncTimer.current)
    }
  }, [scrolls, session])

  const finishSend = useCallback(async () => {
    const open = scrolls.find((scroll) => scroll.id === openId)
    const payload = sendPayloadRef.current
    if (!open || !payload) {
      phaseRef.current = 'open'
      setPhase('open')
      setBusy(null)
      return
    }
    setBusy('send')
    const title = displayTitle(open)
    const emails = payload.recipients.map((item) => item.email)
    const senderDisplayName =
      payload.senderDisplayName?.trim() || senderDisplayNameRef.current || guestDisplayName
    try {
      await upsertScroll(open)
      const image = payload.imageBase64 ?? (await captureSheetForSend())
      const minSealMs = reducedMotion() ? 0 : 900
      const flyAwayMs = reducedMotion() ? 120 : 450
      await Promise.all([
        sendScrollMail({
          scrollId: open.id,
          recipients: payload.recipients,
          note: payload.note,
          imageBase64: image,
          title,
          senderDisplayName,
        }),
        new Promise<void>((resolve) => window.setTimeout(resolve, minSealMs)),
      ])
      setSendLogRefreshKey((key) => key + 1)
      setSendDone(true)
      window.setTimeout(() => {
        sendPayloadRef.current = null
        setSendDone(false)
        setBusy(null)
        pendingRef.current = null
        // Skip the slow roll-up — envelope already flew away
        phaseRef.current = 'open'
        setOpenId(null)
        setPhase('open')
        setSentSummary({ title, recipients: emails })
      }, flyAwayMs)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The letter could not be sent.'
      window.alert(message)
      sendPayloadRef.current = null
      setSendDone(false)
      setBusy(null)
      phaseRef.current = 'open'
      setPhase('open')
    }
  }, [openId, scrolls, session])

  const onPhaseEnd = useCallback(
    (ended: ScrollPhase) => {
      if (phaseRef.current !== ended) return
      if (ended === 'opening') {
        phaseRef.current = 'open'
        setPhase('open')
        return
      }
      if (ended === 'folding') {
        phaseRef.current = 'envelope'
        setPhase('envelope')
        // Network + seal started when folding began (confirmSend)
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
    },
    [],
  )

  function update(id: string, recipe: (scroll: Scroll) => Scroll) {
    setScrolls((current) =>
      current.map((scroll) => (scroll.id === id ? touchScroll(recipe(scroll)) : scroll)),
    )
  }

  function openRoll(id: string) {
    setPen(false)
    setSendDone(false)
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
    if (phaseRef.current === 'closing' || phaseRef.current === 'folding' || phaseRef.current === 'envelope') {
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
    if (!scroll || scroll.isDeleted) return
    const dirty = scroll.scraps.some((scrap) => scrap.text.trim()) || scroll.strokes.length > 0
    if (dirty && !window.confirm('Throw this roll away?')) return
    const remainingVisible = visibleScrolls(scrolls).filter((item) => item.id !== id)
    const fallback = remainingVisible.length === 0 ? createScroll() : null
    setScrolls((current) => {
      const next = current.map((item) =>
        item.id === id ? { ...item, isDeleted: true, updatedAt: Date.now() } : item,
      )
      return fallback ? [...next, fallback] : next
    })
    if (session) void deleteRemoteScroll(id).catch(() => undefined)
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
    if (!open || busy || phase === 'closing' || phase === 'folding' || phase === 'envelope') return
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

  async function ensureGuestSession(): Promise<boolean> {
    if (!supabase || !allowGuestSend()) return false
    const name = loadGuestDisplayName() || defaultSenderName()
    saveGuestDisplayName(name)
    setGuestDisplayName(name)
    senderDisplayNameRef.current = name
    const { error } = await supabase.auth.signInAnonymously()
    return !error
  }

  async function openSend() {
    if (!open || busy || !scrollHasContent(open)) return
    setPen(false)
    if (isSignedInUser(session)) {
      setSendOpen(true)
      return
    }
    if (allowGuestSend()) {
      if (session?.user.is_anonymous && (senderDisplayNameRef.current || guestDisplayName)) {
        setSendOpen(true)
        return
      }
      setBusy('send')
      const ok = session?.user.is_anonymous
        ? true
        : await ensureGuestSession()
      setBusy(null)
      if (ok) {
        setSendOpen(true)
        return
      }
    }
    setSendGateOpen(true)
  }

  function onSendGateReady(result: SendGateReady) {
    setSendGateOpen(false)
    if (result.mode === 'guest' && result.senderDisplayName) {
      saveGuestDisplayName(result.senderDisplayName)
      setGuestDisplayName(result.senderDisplayName)
      senderDisplayNameRef.current = result.senderDisplayName
    }
    setSendOpen(true)
  }

  function onChangeSenderName(name: string) {
    saveGuestDisplayName(name)
    setGuestDisplayName(name)
    senderDisplayNameRef.current = name
  }

  async function confirmSend(recipients: MailRecipient[], note: string, senderDisplayName: string) {
    if (!open || phase !== 'open' || busy || !scrollHasContent(open)) return
    const cleanName = senderDisplayName.trim()
    if (cleanName) {
      saveGuestDisplayName(cleanName)
      setGuestDisplayName(cleanName)
      senderDisplayNameRef.current = cleanName
    }
    setSendOpen(false)
    setPen(false)
    setBusy('send')
    setSendDone(false)
    try {
      const imageBase64 = await captureSheetForSend()
      sendPayloadRef.current = {
        recipients,
        note,
        imageBase64,
        senderDisplayName: cleanName || senderDisplayNameRef.current || guestDisplayName,
      }
      setBusy(null)
      if (reducedMotion()) {
        phaseRef.current = 'envelope'
        setPhase('envelope')
        void finishSend()
        return
      }
      // Fold + envelope + mail request overlap for a snappier send
      phaseRef.current = 'folding'
      setPhase('folding')
      void finishSend()
    } catch (error) {
      setBusy(null)
      sendPayloadRef.current = null
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'The paper could not be prepared. Try again with the roll open.'
      window.alert(message)
    }
  }

  const deskScrolls = visibleScrolls(scrolls)

  return (
    <Desk
      scrolls={deskScrolls}
      openId={openId}
      phase={phase}
      pen={pen}
      busy={busy}
      focusId={focusId}
      session={session}
      guestDisplayName={guestDisplayName}
      sendLogRefreshKey={sendLogRefreshKey}
      sendOpen={sendOpen}
      sendGateOpen={sendGateOpen}
      welcomeEmailOpen={welcomeEmailOpen}
      sendDone={sendDone}
      sentSummary={sentSummary}
      onDismissSentSummary={() => setSentSummary(null)}
      onDismissWelcomeEmail={() => {
        markWelcomeEmailDismissed()
        setWelcomeEmailOpen(false)
      }}
      onChangeSenderName={onChangeSenderName}
      onRequestSignInFromSheet={() => {
        setSendOpen(false)
        setSendGateOpen(true)
      }}
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
      onCloseScroll={() => requestClose(null)}
      onOpenSend={openSend}
      onCloseSend={() => setSendOpen(false)}
      onCloseSendGate={() => setSendGateOpen(false)}
      onSendGateReady={(result) => {
        markWelcomeEmailDismissed()
        setWelcomeEmailOpen(false)
        onSendGateReady(result)
      }}
      onConfirmSend={confirmSend}
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
        if (!open || phase === 'closing' || phase === 'folding' || phase === 'envelope') return
        update(open.id, (scroll) => addSticker(scroll, mark, uid()))
      }}
      onPrint={() => {
        void share('print')
      }}
      onPdf={() => {
        void share('pdf')
      }}
      onAddScrap={(x, y) => {
        if (!open || phase === 'closing' || phase === 'folding' || phase === 'envelope') return
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
        if (!open || phase === 'closing' || phase === 'folding' || phase === 'envelope') return
        update(open.id, (scroll) => ({ ...scroll, strokes: [...scroll.strokes, stroke] }))
      }}
    />
  )
}
