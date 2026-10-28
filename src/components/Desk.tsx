import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthPanel } from '../auth/AuthPanel.tsx'
import type { MailRecipient } from '../lib/recipients.ts'
import type { Scrap, Scroll, Stroke, TextureId } from '../types.ts'
import { EnvelopeScene } from './EnvelopeScene.tsx'
import { Library } from './Library.tsx'
import { OpenScroll, type ScrollPhase } from './Scroll.tsx'
import { SendSheet } from './SendSheet.tsx'
import { Tray } from './Tray.tsx'

type DeskProps = {
  scrolls: Scroll[]
  openId: string | null
  phase: ScrollPhase
  pen: boolean
  busy: 'print' | 'pdf' | 'send' | null
  focusId: string | null
  session: Session | null
  sendLogRefreshKey: number
  sendOpen: boolean
  sendDone: boolean
  onToggle: (id: string) => void
  onCreate: () => void
  onPhaseEnd: (phase: ScrollPhase) => void
  onFocused: () => void
  onPatch: (patch: Partial<Scroll>) => void
  onTexture: (texture: TextureId) => void
  onWrite: () => void
  onScatter: () => void
  onCloseScroll: () => void
  onOpenSend: () => void
  onCloseSend: () => void
  onConfirmSend: (recipients: MailRecipient[], note: string) => void | Promise<void>
  onDuplicate: () => void
  onDelete: () => void
  onPen: () => void
  onUndo: () => void
  onWipe: () => void
  onSticker: (mark: string) => void
  onPrint: () => void
  onPdf: () => void
  onAddScrap: (x: number, y: number) => void
  onChangeScrap: (id: string, patch: Partial<Scrap>) => void
  onDeleteScrap: (id: string) => void
  onCommitStroke: (stroke: Stroke) => void
}

export function Desk({
  scrolls,
  openId,
  phase,
  pen,
  busy,
  focusId,
  session,
  sendLogRefreshKey,
  sendOpen,
  sendDone,
  onToggle,
  onCreate,
  onPhaseEnd,
  onFocused,
  onPatch,
  onTexture,
  onWrite,
  onScatter,
  onCloseScroll,
  onOpenSend,
  onCloseSend,
  onConfirmSend,
  onDuplicate,
  onDelete,
  onPen,
  onUndo,
  onWipe,
  onSticker,
  onPrint,
  onPdf,
  onAddScrap,
  onChangeScrap,
  onDeleteScrap,
  onCommitStroke,
}: DeskProps) {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const open = scrolls.find((scroll) => scroll.id === openId) ?? null
  const sending = phase === 'folding' || phase === 'envelope'

  return (
    <div className={`desk ${sending ? 'is-sending' : ''}`}>
      <header className="topbar">
        <button
          type="button"
          className="menu-button"
          aria-label="Open library"
          aria-expanded={libraryOpen}
          onClick={() => setLibraryOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="brand">
          Paper scroll studio
          <small>Stays on this computer</small>
          <small className="credit">Developer Akhansha Sen</small>
        </div>
        <AuthPanel session={session} />
        <button type="button" className="new-roll" onClick={onCreate}>
          + New scroll
        </button>
      </header>

      <Library
        open={libraryOpen}
        scrolls={scrolls}
        openId={openId}
        onOpen={(id) => {
          onToggle(id)
          setLibraryOpen(false)
        }}
        onClose={() => setLibraryOpen(false)}
        onCreate={() => {
          onCreate()
          setLibraryOpen(false)
        }}
      />

      <main className="workspace">
        {open ? (
          <>
            <div className="stage-area">
              <OpenScroll
                key={open.id}
                scroll={open}
                phase={phase}
                pen={pen && phase !== 'closing' && !sending}
                focusId={focusId}
                onPhaseEnd={onPhaseEnd}
                onFocused={onFocused}
                onAddScrap={onAddScrap}
                onChangeScrap={onChangeScrap}
                onDeleteScrap={onDeleteScrap}
                onCommitStroke={onCommitStroke}
              />
              <EnvelopeScene
                active={phase === 'envelope'}
                sent={sendDone}
                title={open.title || open.words.slice(0, 42) || 'A scroll'}
              />
            </div>
            {!sending && (
              <Tray
                scroll={open}
                pen={pen}
                busy={busy === 'send' ? null : busy}
                session={session}
                sendLogRefreshKey={sendLogRefreshKey}
                onPatch={onPatch}
                onTexture={onTexture}
                onWrite={onWrite}
                onScatter={onScatter}
                onCloseScroll={onCloseScroll}
                onSendMail={onOpenSend}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onPen={onPen}
                onUndo={onUndo}
                onWipe={onWipe}
                onSticker={onSticker}
                onPrint={onPrint}
                onPdf={onPdf}
              />
            )}
          </>
        ) : (
          <TrayPlaceholder onNewRoll={onCreate} onOpenLibrary={() => setLibraryOpen(true)} />
        )}
      </main>

      <SendSheet
        key={sendOpen ? 'send-open' : 'send-closed'}
        open={sendOpen}
        busy={busy === 'send'}
        onClose={onCloseSend}
        onSend={onConfirmSend}
      />
    </div>
  )
}

function TrayPlaceholder({
  onNewRoll,
  onOpenLibrary,
}: {
  onNewRoll: () => void
  onOpenLibrary: () => void
}) {
  return (
    <aside className="tray tray-placeholder">
      <h2>Write</h2>
      <p className="whisper">Start a new scroll, or pick one from the library.</p>
      <div className="placeholder-actions">
        <button type="button" className="write" onClick={onNewRoll}>
          + New scroll
        </button>
        <button type="button" className="placeholder-secondary" onClick={onOpenLibrary}>
          Open library
        </button>
      </div>
    </aside>
  )
}
