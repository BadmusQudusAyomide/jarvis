import { getSupabase } from '../lib/supabaseClient'

export const SUPABASE_ENABLED = !!getSupabase()

export type PersistedMessage = {
  id?: string
  user_id: string
  role: 'you' | 'jarvis'
  text: string
  created_at?: string
}

const DEFAULT_USER_ID = 'qudus' // replace with real auth later

export async function saveMessage(role: 'you' | 'jarvis', text: string, userId: string = DEFAULT_USER_ID) {
  const supabase = getSupabase()
  if (!supabase) return
  try {
    const { error } = await supabase.from('messages').insert({ user_id: userId, role, text })
    if (error) console.warn('Supabase saveMessage error', error)
  } catch (e) {
    console.warn('Supabase saveMessage exception', e)
  }
}

export async function loadRecentMessages(limit = 50, userId: string = DEFAULT_USER_ID) {
  const supabase = getSupabase()
  if (!supabase) return [] as PersistedMessage[]
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit)
    if (error) {
      console.warn('Supabase loadRecentMessages error', error)
      return []
    }
    return (data || []) as PersistedMessage[]
  } catch (e) {
    console.warn('Supabase loadRecentMessages exception', e)
    return []
  }
}
