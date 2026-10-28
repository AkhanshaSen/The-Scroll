import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
/** Supabase Connect (Vite) uses publishable key; older docs use anon JWT — same role. */
const publishable = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
const anonLegacy = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const apiKey = publishable?.trim() || anonLegacy?.trim()

export const supabaseConfigured = Boolean(url && apiKey)

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, apiKey!, {
      auth: {
          persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
