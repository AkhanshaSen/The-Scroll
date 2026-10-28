import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthPanel } from '../auth/AuthPanel.tsx'
import type { MailRecipient } from '../lib/recipients.ts'
import { displayTitle, scrollHasContent } from '../model.ts'
import type { Scrap, Scroll, Stroke, TextureId } from '../types.ts'
import { EnvelopeScene } from './EnvelopeScene.tsx'
import { Library } from './Library.tsx'
import { OpenScroll, type ScrollPhase } from './Scroll.tsx'
import { RolledScrollSvg } from './ScrollRoller.tsx'
import { SendGateDialog, type SendGateReady } from './SendGateDialog.tsx'
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
  guestDisplayName: string
  sendLogRefreshKey: number
  sendOpen: boolean
  sendGateOpen: boolean
  sendDone: boolean
  sentSummary: { title: string; recipients: string[] } | null
  onDismissSentSummary: () => void
  onChangeSenderName: (name: string) => void
  onRequestSignInFromSheet: () => void
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
  onCloseSendGate: () => void
  onSendGateReady: (result: SendGateReady) => void
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
  guestDisplayName,
  sendLogRefreshKey,
  sendOpen,
  sendGateOpen,
  sendDone,
  sentSummary,
  onDismissSentSummary,
  onChangeSenderName,
  onRequestSignInFromSheet,
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
  onCloseSendGate,
  onSendGateReady,
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
        <AuthPanel session={session} guestDisplayName={guestDisplayName} />
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
                active={phase === 'folding' || phase === 'envelope'}
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
          <>
            <DeskRollShelf
              scrolls={scrolls}
              openId={openId}
              onOpen={onToggle}
            />
            <TrayPlaceholder onNewRoll={onCreate} onOpenLibrary={() => setLibraryOpen(true)} />
          </>
        )}
      </main>

      <SendGateDialog
        open={sendGateOpen}
        onClose={onCloseSendGate}
        onReady={onSendGateReady}
      />

      <SendSheet
        key={sendOpen ? 'send-open' : 'send-closed'}
        open={sendOpen}
        busy={busy === 'send'}
        hasContent={open ? scrollHasContent(open) : false}
        senderDisplayName={guestDisplayName}
        isGuest={Boolean(session?.user.is_anonymous)}
        onClose={onCloseSend}
        onSend={onConfirmSend}
        onChangeSenderName={onChangeSenderName}
        onRequestSignIn={onRequestSignInFromSheet}
      />

      {sentSummary && (
        <div className="send-backdrop" role="presentation" onClick={onDismissSentSummary}>
          <div
            className="congrats-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="congrats-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="congrats-seal" aria-hidden="true">✦</div>
            <h2 id="congrats-title">Scroll sealed &amp; sent!</h2>
            <p className="congrats-body">
              Congratulations — <em>{sentSummary.title}</em> is on its way to{' '}
              <strong>{sentSummary.recipients.join(', ')}</strong>.
            </p>
            <button type="button" className="write" onClick={onDismissSentSummary}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DeskRollShelf({
  scrolls,
  openId,
  onOpen,
}: {
  scrolls: Scroll[]
  openId: string | null
  onOpen: (id: string) => void
}) {
  const rolls = [...scrolls].sort((left, right) => right.updatedAt - left.updatedAt).slice(0, 6)
  return (
    <section className="desk-rolls" aria-label="Rolled scrolls on the desk">
      <p className="desk-rolls-heading">On the desk</p>
      {rolls.length === 0 ? (
        <p className="desk-rolls-empty">No scrolls yet — start a new roll.</p>
      ) : (
        <div className="desk-rolls-row">
          {rolls.map((scroll) => (
            <button
              key={scroll.id}
              type="button"
              className={`desk-roll ${scroll.id === openId ? 'is-active' : ''}`}
              aria-label={`Unroll ${displayTitle(scroll)}`}
              onClick={() => onOpen(scroll.id)}
            >
              <RolledScrollSvg texture={scroll.texture} title={displayTitle(scroll)} tied />
            </button>
          ))}
        </div>
      )}
    </section>
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
      <p className="whisper">Start a new scroll, or pick one from the library. Tap a rolled scroll on the desk to unroll it.</p>
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
