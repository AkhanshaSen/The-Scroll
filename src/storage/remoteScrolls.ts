import { isUuid } from '../lib/ids.ts'
import { displayTitle } from '../model.ts'
import { supabase } from '../lib/supabase.ts'
import { sanitizeScroll } from '../storage.ts'
import type { Scroll } from '../types.ts'

type ScrollRow = {
  id: string
  payload: unknown
  title: string
  form: string
  updated_at: string
  created_at: string
}

export async function fetchScrollsForUser(): Promise<Scroll[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('scrolls')
    .select('id, payload, title, form, updated_at, created_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data as ScrollRow[] | null ?? [])
    .map((row) => {
      const scroll = sanitizeScroll(row.payload)
      if (!scroll) return null
      return {
        ...scroll,
        id: row.id,
        updatedAt: Date.parse(row.updated_at) || scroll.updatedAt,
        created: Date.parse(row.created_at) || scroll.created,
      }
    })
    .filter((scroll): scroll is Scroll => scroll !== null)
}

export async function upsertScroll(scroll: Scroll): Promise<void> {
  if (!supabase) return
  if (!isUuid(scroll.id)) return
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) return
  const { error } = await supabase.from('scrolls').upsert(
    {
      id: scroll.id,
      user_id: userId,
      payload: scroll,
      title: displayTitle(scroll),
      form: scroll.form,
      updated_at: new Date(scroll.updatedAt).toISOString(),
      created_at: new Date(scroll.created).toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) throw error
}

export async function deleteRemoteScroll(id: string): Promise<void> {
  if (!supabase) return
  if (!isUuid(id)) return
  const { error } = await supabase.from('scrolls').delete().eq('id', id)
  if (error) throw error
}

export function mergeScrolls(local: Scroll[], remote: Scroll[]): Scroll[] {
  const byId = new Map<string, Scroll>()
  for (const scroll of local) byId.set(scroll.id, scroll)
  for (const scroll of remote) {
    const existing = byId.get(scroll.id)
    if (!existing || scroll.updatedAt >= existing.updatedAt) byId.set(scroll.id, scroll)
  }
  return [...byId.values()].sort((left, right) => right.updatedAt - left.updatedAt)
}

export type SendLogEntry = {
  id: string
  toEmail: string
  senderEmail: string
  category: string
  note: string
  status: 'queued' | 'sent' | 'failed'
  createdAt: number
  scrollTitle: string
}

type SendRow = {
  id: string
  to_email: string
  sender_email: string | null
  category: string | null
  note: string
  status: string
  created_at: string
  scrolls: { title: string } | { title: string }[] | null
}

export async function fetchSendLog(): Promise<SendLogEntry[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('sends')
    .select('id, to_email, sender_email, category, note, status, created_at, scrolls(title)')
    .order('created_at', { ascending: false })
    .limit(40)
  if (error) throw error
  return (data as SendRow[] | null ?? []).map((row) => {
    const related = Array.isArray(row.scrolls) ? row.scrolls[0] : row.scrolls
    const status =
      row.status === 'sent' || row.status === 'failed' || row.status === 'queued'
        ? row.status
        : 'queued'
    return {
      id: row.id,
      toEmail: row.to_email,
      senderEmail: row.sender_email?.trim() || '',
      category: row.category?.trim() || 'friend',
      note: row.note ?? '',
      status,
      createdAt: Date.parse(row.created_at) || 0,
      scrollTitle: related?.title?.trim() || 'Untitled scroll',
    }
  })
}
