import { useEffect, useMemo, useRef, useState } from 'react'
import { displayTitle } from '../model.ts'
import { FORMS, type Scroll } from '../types.ts'

type LibraryProps = {
  open: boolean
  scrolls: Scroll[]
  openId: string | null
  onOpen: (id: string) => void
  onClose: () => void
  onCreate: () => void
}

export function Library({ open, scrolls, openId, onOpen, onClose, onCreate }: LibraryProps) {
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const needle = query.trim().toLowerCase()
  const rows = useMemo(() => {
    const ordered = [...scrolls].sort((left, right) => right.created - left.created)
    if (!needle) return ordered
    return ordered.filter((scroll) => {
      const haystack = [
        displayTitle(scroll),
        scroll.words,
        ...scroll.scraps.filter((scrap) => scrap.kind !== 'sticker').map((scrap) => scrap.text),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [scrolls, needle])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <button type="button" className="library-backdrop" aria-label="Close library" onClick={onClose} />
      <aside className="library" role="dialog" aria-modal="true" aria-labelledby="library-title">
        <label className="library-search">
          <span id="library-title">Library</span>
          <input
            ref={searchRef}
            value={query}
            placeholder="Search titles and words"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button type="button" className="library-new" onClick={onCreate}>
          + New scroll
        </button>
        <ul>
          {rows.map((scroll) => {
            const form = FORMS.find((item) => item.id === scroll.form)
            return (
              <li key={scroll.id}>
                <button
                  type="button"
                  className={scroll.id === openId ? 'library-row is-active' : 'library-row'}
                  aria-pressed={scroll.id === openId}
                  onClick={() => onOpen(scroll.id)}
                >
                  <span className={`swatch texture-${scroll.texture}`} aria-hidden="true" />
                  <span className="library-copy">
                    <strong>{displayTitle(scroll)}</strong>
                    <small>
                      {when(scroll.created)}
                      {form ? ` · ${form.label}` : ''}
                    </small>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        {rows.length === 0 && <p className="library-empty">Nothing matches that search.</p>}
      </aside>
    </>
  )
}

function when(created: number): string {
  const delta = Date.now() - created
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (delta < minute) return 'Just now'
  if (delta < hour) return `${Math.floor(delta / minute)}m ago`
  if (delta < day) return `${Math.floor(delta / hour)}h ago`
  if (delta < 7 * day) return `${Math.floor(delta / day)}d ago`
  return new Date(created).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
