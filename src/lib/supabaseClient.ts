import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Reads Vite env vars. If not present, we return null and the app runs without persistence.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let supabase: SupabaseClient | null = null

if (url && anonKey) {
  supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      // Provide a no-op storage to avoid IndexedDB/ServiceWorker issues in private mode
      storage: {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      } as any,
    },
    // Realtime config remains default; we are not subscribing anywhere yet
  })
}

export function getSupabase() {
  return supabase
}
