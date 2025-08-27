import { getSupabase } from '../lib/supabaseClient'

export async function getQueryEmbedding(text: string): Promise<number[] | null> {
  const url = import.meta.env.VITE_SUPABASE_EMBED_QUERY_URL as string | undefined
  if (!url || !text?.trim()) return null
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) {
      console.warn('embed-query error', await res.text())
      return null
    }
    const json = await res.json()
    const vec = json?.embedding as number[] | undefined
    if (!Array.isArray(vec) || !vec.length) return null
    return vec
  } catch (e) {
    console.warn('embed-query exception', e)
    return null
  }
}

export type RecallMatch = { text: string; similarity: number }

export async function semanticRecall(query: string, k = 5): Promise<RecallMatch[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  const vec = await getQueryEmbedding(query)
  if (!vec) return []
  // Send as text '[v1,v2,...]' so SQL can cast to vector(768)
  const qStr = `[${vec.map(v => Number.isFinite(v) ? v : 0).join(',')}]`
  const { data, error } = await (supabase as any).rpc('match_embeddings', {
    u: 'qudus',
    q: qStr,
    k,
  })
  if (error) {
    console.warn('semanticRecall rpc error', error)
    return []
  }
  return (data || []) as RecallMatch[]
}

export async function buildSemanticContext(query: string, k = 3, minSim = 0.7): Promise<string | ''> {
  try {
    const matches = await semanticRecall(query, k + 3) // fetch a few extra for filtering
    if (!matches.length) return ''

    const qLower = query.trim().toLowerCase()
    const seen = new Set<string>()
    const trivial = new Set(['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'])

    const cleaned = matches
      .filter(m => typeof m?.similarity === 'number' && m.similarity >= minSim)
      .map(m => ({ ...m, t: (m.text || '').trim() }))
      .filter(m => m.t.length >= 5) // drop very short
      .filter(m => !trivial.has(m.t.toLowerCase())) // drop greetings
      .filter(m => !m.t.toLowerCase().startsWith('relevant memory:')) // avoid recursion
      .filter(m => m.t.toLowerCase() !== qLower) // exclude exact query echo
      .filter(m => {
        const key = m.t.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, k)

    if (!cleaned.length) return ''
    const bullets = cleaned.map(m => `- You said: "${m.t}"`).join('\n')
    return `Relevant memory:\n${bullets}`
  } catch {
    return ''
  }
}
