import type { Session } from '@supabase/supabase-js'
import { displayTitle } from '../model.ts'
import { FONTS, FORMS, INKS, STICKERS, TEXTURES, fontOf, type Scroll, type TextureId } from '../types.ts'
import { SendLog } from './SendLog.tsx'

type TrayProps = {
  scroll: Scroll
  pen: boolean
  busy: 'print' | 'pdf' | 'send' | null
  session: Session | null
  sendLogRefreshKey: number
  onPatch: (patch: Partial<Scroll>) => void
  onTexture: (texture: TextureId) => void
  onWrite: () => void
  onScatter: () => void
  onCloseScroll: () => void
  onSendMail: () => void
  onDuplicate: () => void
  onDelete: () => void
  onPen: () => void
  onUndo: () => void
  onWipe: () => void
  onSticker: (mark: string) => void
  onPrint: () => void
  onPdf: () => void
}

export function Tray({
  scroll,
  pen,
  busy,
  session,
  sendLogRefreshKey,
  onPatch,
  onTexture,
  onWrite,
  onScatter,
  onCloseScroll,
  onSendMail,
  onDuplicate,
  onDelete,
  onPen,
  onUndo,
  onWipe,
  onSticker,
  onPrint,
  onPdf,
}: TrayProps) {
  const form = FORMS.find((item) => item.id === scroll.form) ?? FORMS[0]
  const hand = fontOf(scroll.font)
  const hasPoem = scroll.scraps.some((scrap) => scrap.role === 'generated')
  const canScatter = scroll.scraps.some(
    (scrap) => scrap.role === 'generated' && scrap.text.split('\n').filter((line) => line.trim()).length > 1,
  )
  const titleValue = scroll.titleCustom
    ? scroll.title
    : displayTitle(scroll) === 'Untitled'
      ? ''
      : displayTitle(scroll)

  return (
    <aside className="tray">
      <section>
        <h2>Write</h2>
      <label className="field">
        <span>Title</span>
        <input
          value={titleValue}
          placeholder="Untitled"
          autoComplete="off"
          onChange={(event) => onPatch({ title: event.target.value, titleCustom: true })}
        />
      </label>

      <label className="field">
        <span>Words</span>
        <textarea
          className="words"
          style={{ fontFamily: hand.family }}
          value={scroll.words}
          placeholder={scroll.form === 'blank' ? 'Write anything here — it shows on the paper' : 'rain, lonely, the kitchen window'}
          spellCheck={false}
          rows={3}
          onChange={(event) => onPatch({ words: event.target.value })}
        />
      </label>
      <p className="whisper">Clumsy is welcome. Empty is fine too — the evening will start.</p>

      <div className="field">
        <span>Form</span>
        <div className="chips">
          {FORMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="chip"
              aria-pressed={scroll.form === item.id}
              onClick={() => onPatch({ form: item.id })}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="whisper">{form.hint}</p>
      </div>

      {scroll.form === 'blank' ? (
        <p className="blank-note">Words appear on the paper as you type. Click the paper to add another note.</p>
      ) : (
        <button type="button" className="write" onClick={onWrite}>
          {hasPoem ? 'Write another' : 'Write this'}
        </button>
      )}

      <div className="row-actions">
        {canScatter && (
          <button type="button" onClick={onScatter}>
            Scatter lines
          </button>
        )}
        <button type="button" className="write" onClick={onSendMail}>
          Send by mail
        </button>
        <button type="button" onClick={onCloseScroll}>
          Close scroll
        </button>
      </div>
      </section>

      <section>
        <h2>Look</h2>
      <div className="field">
        <span>Hand</span>
        <div className="hands">
          {FONTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="hand"
              aria-pressed={scroll.font === item.id}
              style={{ fontFamily: item.family }}
              onClick={() => onPatch({ font: item.id })}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>Paper</span>
        <div className="swatches">
          {TEXTURES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`swatch texture-${item.id}`}
              aria-pressed={scroll.texture === item.id}
              aria-label={item.label}
              title={item.label}
              onClick={() => onTexture(item.id)}
            />
          ))}
        </div>
      </div>

      <div className="field">
        <span>Ink</span>
        <div className="inks">
          {INKS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="ink-dot"
              style={{ background: item.color }}
              aria-pressed={scroll.ink === item.id}
              aria-label={item.label}
              title={item.label}
              onClick={() => onPatch({ ink: item.id })}
            />
          ))}
        </div>
      </div>
      </section>

      <section>
        <h2>Marks</h2>
      <div className="row-actions">
        <button type="button" className={pen ? 'is-on' : ''} aria-pressed={pen} onClick={onPen}>
          {pen ? 'Pen is down' : 'Pen'}
        </button>
        {scroll.strokes.length > 0 && (
          <>
            <button type="button" onClick={onUndo}>
              Undo pen
            </button>
            <button type="button" onClick={onWipe}>
              Wipe the pen
            </button>
          </>
        )}
      </div>
      <div className="stickers" aria-label="Marks">
        {STICKERS.map((mark) => (
          <button key={mark} type="button" className="sticker" onClick={() => onSticker(mark)}>
            {mark}
          </button>
        ))}
      </div>
      </section>

      <section>
        <h2>Share</h2>
      <div className="row-actions">
        <button type="button" disabled={busy !== null} onClick={onPrint}>
          {busy === 'print' ? 'Preparing…' : 'Print'}
        </button>
        <button type="button" disabled={busy !== null} onClick={onPdf}>
          {busy === 'pdf' ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>
      <div className="row-actions quiet">
        <button type="button" onClick={onDuplicate}>
          Another copy
        </button>
        <button type="button" className="danger" onClick={onDelete}>
          Throw away
        </button>
      </div>
      </section>

      {session && <SendLog refreshKey={sendLogRefreshKey} />}
    </aside>
  )
}
