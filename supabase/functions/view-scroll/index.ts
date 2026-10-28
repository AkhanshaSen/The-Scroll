/// <reference path="../deno.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

Deno.serve(async (request) => {
  const corsHeaders = corsForRequest(request)

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405, corsHeaders)
  }

  const url = new URL(request.url)
  const token = url.searchParams.get('token')?.trim()

  if (!token || !UUID_RE.test(token)) {
    return json({ error: 'A valid view token is required.' }, 400, corsHeaders)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = resolveServiceKey()

    if (!supabaseUrl || !serviceKey) {
      return json({ error: 'Server configuration error.' }, 500, corsHeaders)
    }

    const admin = createClient(supabaseUrl, serviceKey)

    type SendViewRow = {
      id: string
      view_token: string
      to_email: string
      sender_email: string
      note: string
      status: string
      image_data: string
      scrolls: { title: string } | { title: string }[] | null
    }

    const { data, error } = await admin
      .from('sends')
      .select('id, view_token, to_email, sender_email, note, status, image_data, scrolls(title)')
      .eq('view_token', token)
      .maybeSingle()

    if (error) throw error
    if (!data) return json({ error: 'This scroll was not found.' }, 404, corsHeaders)

    const row = data as SendViewRow
    const related = Array.isArray(row.scrolls) ? row.scrolls[0] : row.scrolls
    const title = related?.title?.trim() || 'A scroll'

    console.log(`[view-scroll] viewed sendId=${row.id} status=${row.status}`)

    return json(
      {
        title,
        note: row.note ?? '',
        senderEmail: row.sender_email ?? '',
        imageBase64: row.image_data ?? '',
      },
      200,
      corsHeaders,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error(`[view-scroll] error: ${message}`)
    return json({ error: 'Something went wrong.' }, 500, corsHeaders)
  }
})

function resolveServiceKey(): string {
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (raw?.trim()) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const value = parsed.default
      if (typeof value === 'string' && value.trim()) return value.trim()
    } catch {
      /* fall through */
    }
  }
  return (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').trim()
}

function corsForRequest(request: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    Vary: 'Origin',
  }
}

function json(body: unknown, status = 200, corsHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
