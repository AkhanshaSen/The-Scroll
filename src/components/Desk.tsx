import { useState } from 'react'
import type { Scrap, Scroll, Stroke, TextureId } from '../types.ts'
import { Library } from './Library.tsx'
import { OpenScroll, type ScrollPhase } from './Scroll.tsx'
import { Tray } from './Tray.tsx'

type DeskProps = {
  scrolls: Scroll[]
  openId: string | null
  phase: ScrollPhase
  pen: boolean
  busy: 'print' | 'pdf' | null
  focusId: string | null
  onToggle: (id: string) => void
  onCreate: () => void
  onPhaseEnd: (phase: ScrollPhase) => void
  onFocused: () => void
  onPatch: (patch: Partial<Scroll>) => void
  onTexture: (texture: TextureId) => void
  onWrite: () => void
  onScatter: () => void
  onRollUp: () => void
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
  onToggle,
  onCreate,
  onPhaseEnd,
  onFocused,
  onPatch,
  onTexture,
  onWrite,
  onScatter,
  onRollUp,
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

  return (
    <div className="desk">
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
        <button type="button" className="new-roll" onClick={onCreate}>
          New roll
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
      />

      <main className="workspace">
        {open ? (
          <>
            <OpenScroll
              key={open.id}
              scroll={open}
              phase={phase}
              pen={pen && phase !== 'closing'}
              focusId={focusId}
              onPhaseEnd={onPhaseEnd}
              onFocused={onFocused}
              onAddScrap={onAddScrap}
              onChangeScrap={onChangeScrap}
              onDeleteScrap={onDeleteScrap}
              onCommitStroke={onCommitStroke}
            />
            <Tray
              scroll={open}
              pen={pen}
              busy={busy}
              onPatch={onPatch}
              onTexture={onTexture}
              onWrite={onWrite}
              onScatter={onScatter}
              onRollUp={onRollUp}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onPen={onPen}
              onUndo={onUndo}
              onWipe={onWipe}
              onSticker={onSticker}
              onPrint={onPrint}
              onPdf={onPdf}
            />
          </>
        ) : (
          <>
            <p className="invite">
              Open a roll from the library. The paper can hold a sonnet, a note, or anything you write yourself.
            </p>
            <TrayPlaceholder onOpenLibrary={() => setLibraryOpen(true)} />
          </>
        )}
      </main>
    </div>
  )
}

function TrayPlaceholder({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  return (
    <aside className="tray tray-placeholder">
      <h2>Write</h2>
      <p className="whisper">The paper is waiting. Open a roll from the library, or start a new one.</p>
      <button type="button" className="write" onClick={onOpenLibrary}>
        Open library
      </button>
    </aside>
  )
}
