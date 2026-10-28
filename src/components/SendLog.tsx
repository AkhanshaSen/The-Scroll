import { useEffect, useState } from 'react'
import { RECIPIENT_CATEGORIES } from '../lib/recipients.ts'
import { fetchSendLog, type SendLogEntry } from '../storage/remoteScrolls.ts'

type SendLogProps = {
  /** Bump after a successful send so the list refreshes. */
  refreshKey?: number
}

export function SendLog({ refreshKey = 0 }: SendLogProps) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<SendLogEntry[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!open && refreshKey === 0 && tick === 0) return
    let cancelled = false
    void (async () => {
      try {
        const rows = await fetchSendLog()
        if (cancelled) return
        setEntries(rows)
        setError('')
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Could not load send history.'
        setError(message)
      } finally {
        if (!cancelled) setBusy(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, refreshKey, tick])

  return (
    <section className="send-log">
      <button
        type="button"
        className="send-log-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Hide send log' : 'Send log'}
      </button>
      {open && (
        <div className="send-log-body">
          {entries === null && !error && <p className="whisper">Loading…</p>}
          {error && <p className="send-log-error">{error}</p>}
          {entries && entries.length === 0 && !error && (
            <p className="whisper">No letters sent yet.</p>
          )}
          {entries && entries.length > 0 && (
            <ul className="send-log-list">
              {entries.map((entry) => (
                <li key={entry.id} className={`send-log-row status-${entry.status}`}>
                  <div className="send-log-main">
                    <strong className="send-log-title">{entry.scrollTitle}</strong>
                    <span className={`send-log-badge status-${entry.status}`}>{entry.status}</span>
                  </div>
                  <p className="send-log-meta">
                    to <span className="send-log-email">{entry.toEmail}</span>
                    <span className="send-log-category">{categoryLabel(entry.category)}</span>
                  </p>
                  {entry.senderEmail ? (
                    <p className="send-log-meta">
                      sent by <span className="send-log-email">{entry.senderEmail}</span>
                    </p>
                  ) : null}
                  <p className="send-log-time">{formatWhen(entry.createdAt)}</p>
                  {entry.note ? <p className="send-log-note">{entry.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
          {entries !== null && (
            <button
              type="button"
              className="send-log-refresh"
              disabled={busy}
              onClick={() => {
                setBusy(true)
                setTick((value) => value + 1)
              }}
            >
              {busy ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function categoryLabel(id: string): string {
  return RECIPIENT_CATEGORIES.find((item) => item.id === id)?.label ?? id
}

function formatWhen(ms: number): string {
  if (!ms) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(ms))
  } catch {
    return new Date(ms).toLocaleString()
  }
}
