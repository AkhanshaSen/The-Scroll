import { useState, type FormEvent } from 'react'
import {
  defaultRecipientEmail,
  isValidDisplayName,
  sanitizeDisplayName,
} from '../lib/guestSend.ts'
import {
  isValidEmail,
  MAX_RECIPIENTS,
  RECIPIENT_CATEGORIES,
  type MailRecipient,
  type RecipientCategory,
} from '../lib/recipients.ts'

type Row = {
  id: string
  email: string
  category: RecipientCategory
}

type SendSheetProps = {
  open: boolean
  busy: boolean
  hasContent: boolean
  senderDisplayName: string
  isGuest: boolean
  onClose: () => void
  onSend: (recipients: MailRecipient[], note: string) => void
  onChangeSenderName?: (name: string) => void
  onRequestSignIn?: () => void
}

function newRow(email = ''): Row {
  return {
    id: crypto.randomUUID(),
    email,
    category: 'friend',
  }
}

export function SendSheet({
  open,
  busy,
  hasContent,
  senderDisplayName,
  isGuest,
  onClose,
  onSend,
  onChangeSenderName,
  onRequestSignIn,
}: SendSheetProps) {
  const [rows, setRows] = useState<Row[]>(() => [newRow(defaultRecipientEmail())])
  const [note, setNote] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(senderDisplayName)

  if (!open) return null

  const validRecipients = rows
    .map((row) => ({ email: row.email.trim(), category: row.category }))
    .filter((row) => isValidEmail(row.email))

  function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || !hasContent || validRecipients.length === 0) return
    onSend(validRecipients, note.trim())
  }

  function updateRow(id: string, patch: Partial<Pick<Row, 'email' | 'category'>>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function removeRow(id: string) {
    setRows((current) => (current.length <= 1 ? current : current.filter((row) => row.id !== id)))
  }

  function saveName() {
    const clean = sanitizeDisplayName(nameDraft)
    if (!isValidDisplayName(clean) || !onChangeSenderName) return
    onChangeSenderName(clean)
    setEditingName(false)
  }

  return (
    <div className="send-backdrop" role="presentation" onClick={onClose}>
      <form
        className="send-sheet send-sheet-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <h2 id="send-title">Send by mail</h2>
        <p className="whisper">
          Add one or more addresses. The paper folds into an envelope, then goes to each person.
        </p>
        <p className="send-test-hint">
          While testing with Resend’s free sender, deliver to{' '}
          <strong>{defaultRecipientEmail()}</strong> (pre-filled below).
        </p>

        {isGuest && (
          <div className="send-as-row">
            {editingName ? (
              <>
                <label className="field send-as-edit">
                  <span>Sending as</span>
                  <input
                    type="text"
                    maxLength={40}
                    value={nameDraft}
                    disabled={busy}
                    onChange={(event) => setNameDraft(event.target.value)}
                  />
                </label>
                <button type="button" className="send-as-link" disabled={busy} onClick={saveName}>
                  Save
                </button>
              </>
            ) : (
              <>
                <p className="send-as-label">
                  Sending as <strong>{senderDisplayName || 'Guest'}</strong>
                </p>
                {onChangeSenderName && (
                  <button
                    type="button"
                    className="send-as-link"
                    disabled={busy}
                    onClick={() => {
                      setNameDraft(senderDisplayName)
                      setEditingName(true)
                    }}
                  >
                    Change name
                  </button>
                )}
                {onRequestSignIn && (
                  <button type="button" className="send-as-link" disabled={busy} onClick={onRequestSignIn}>
                    Sign in
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <div className="recipient-list" aria-label="Recipients">
          {rows.map((row) => (
            <div key={row.id} className="recipient-row">
              <label className="field recipient-email">
                <span className="sr-only">Email</span>
                <input
                  type="email"
                  required={rows.length === 1}
                  autoComplete="email"
                  placeholder="friend@example.com"
                  value={row.email}
                  disabled={busy}
                  onChange={(event) => updateRow(row.id, { email: event.target.value })}
                />
              </label>
              <label className="field recipient-category">
                <span className="sr-only">Category</span>
                <select
                  value={row.category}
                  disabled={busy}
                  onChange={(event) =>
                    updateRow(row.id, { category: event.target.value as RecipientCategory })
                  }
                >
                  {RECIPIENT_CATEGORIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="recipient-remove"
                aria-label="Remove recipient"
                disabled={busy || rows.length <= 1}
                onClick={() => removeRow(row.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {rows.length < MAX_RECIPIENTS && (
          <button
            type="button"
            className="add-recipient"
            disabled={busy}
            onClick={() => setRows((current) => [...current, newRow()])}
          >
            + Add more
          </button>
        )}

        <label className="field">
          <span>Short note</span>
          <textarea
            className="words"
            rows={3}
            placeholder="A line for the letter, if you like"
            value={note}
            disabled={busy}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <div className="row-actions">
          <button type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="write"
            disabled={busy || !hasContent || validRecipients.length === 0}
            title={hasContent ? undefined : 'Write something on the paper first.'}
          >
            {busy ? 'Sending…' : 'Fold and send'}
          </button>
        </div>
      </form>
    </div>
  )
}
