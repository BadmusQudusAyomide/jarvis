// Dictionary/Definitions service using dictionaryapi.dev (no API key required)
// Provides concise, spoken-friendly definitions.

export type DefinitionEntry = {
  word: string
  partOfSpeech?: string
  definitions: string[]
  phonetic?: string
}

function extractDefinitionTarget(raw: string): string | null {
  if (!raw) return null
  const text = raw.trim().toLowerCase()
  const patterns: RegExp[] = [
    /^what\s+does\s+(.+?)\s+mean\??$/i,
    /^define\s+(.+?)\s*$/i,
    /^(?:the\s+)?definition\s+of\s+(.+?)\s*$/i,
    /^(?:the\s+)?meaning\s+of\s+(.+?)\s*$/i,
    /^meaning\s+of\s+(.+?)\s*$/i,
  ]
  for (const pat of patterns) {
    const m = raw.match(pat)
    if (m && m[1]) return m[1].trim().replace(/^["'`\(\[]+|["'`\)\]]+$/g, '')
  }
  // Short forms like: "recursion definition", "recursion meaning"
  const short = raw.match(/^([\p{L}-]+)\s+(?:definition|meaning)$/iu)
  if (short && short[1]) return short[1]
  // Single-word define command handled earlier, else try last token after 'define'
  return null
}

async function fetchDefinitions(word: string, lang = 'en'): Promise<DefinitionEntry[]> {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/${encodeURIComponent(lang)}/${encodeURIComponent(word)}`
  try {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json()
    const out: DefinitionEntry[] = []
    for (const entry of Array.isArray(data) ? data : []) {
      const word = String(entry?.word || '').trim()
      const phonetic = String(entry?.phonetic || '').trim() || undefined
      const meanings = Array.isArray(entry?.meanings) ? entry.meanings : []
      for (const m of meanings) {
        const pos = String(m?.partOfSpeech || '').trim() || undefined
        const defs = (Array.isArray(m?.definitions) ? m.definitions : [])
          .map((d: any) => String(d?.definition || '').trim())
          .filter(Boolean)
        if (defs.length) out.push({ word, partOfSpeech: pos, definitions: defs, phonetic })
      }
    }
    return out
  } catch {
    return []
  }
}

function clean(text: string): string {
  let s = (text || '').trim()
  s = s.replace(/\s+/g, ' ').trim()
  if (s.length > 180) s = s.slice(0, 177).trimEnd() + '…'
  return s
}

function formatConciseDefinition(entries: DefinitionEntry[], maxSenses = 2): string {
  if (!entries.length) return "I couldn't find a concise definition for that."
  const first = entries[0]
  const defs = first.definitions.slice(0, maxSenses).map(clean)
  const parts: string[] = []
  const head = first.word ? first.word.charAt(0).toUpperCase() + first.word.slice(1) : 'Word'
  const pos = first.partOfSpeech ? ` ${first.partOfSpeech}` : ''
  parts.push(`${head}:${pos ? pos : ''}`.trim())
  if (defs.length === 1) {
    parts.push(defs[0])
  } else {
    defs.forEach((d, i) => parts.push(`${i + 1}. ${d}`))
  }
  return parts.join('\n')
}

export async function getDefinitionResponse(raw: string): Promise<string> {
  const target = extractDefinitionTarget(raw)
  if (!target) return 'Tell me the word to define.'
  // Use only the first token phrase up to punctuation
  const word = target.replace(/[.?!\s]+$/u, '').trim()
  if (!word) return 'Tell me the word to define.'
  const entries = await fetchDefinitions(word)
  if (!entries.length) return `I couldn't find a definition for "${word}".`
  return formatConciseDefinition(entries)
}
