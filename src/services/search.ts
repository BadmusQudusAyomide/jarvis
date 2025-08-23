// Google Search service
// Option A: open a Google search page
// Option B: fetch top results using Google Custom Search API if configured

const CSE_ID = import.meta.env.VITE_GOOGLE_CSE_ID as string | undefined
const CSE_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined

export function canFetchGoogleResults(): boolean {
  return Boolean(CSE_ID && CSE_KEY)
}

export function buildGoogleUrl(query: string): string {
  const q = query.trim()
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`
}

export type GoogleResult = { title: string; snippet: string; link: string }

export async function fetchGoogleTopResults(query: string, limit = 3): Promise<GoogleResult[]> {
  if (!canFetchGoogleResults()) return []
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(CSE_KEY!)}&cx=${encodeURIComponent(CSE_ID!)}&q=${encodeURIComponent(query)}&num=${limit}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    const items = Array.isArray(data?.items) ? data.items : []
    return items.slice(0, limit).map((it: any) => ({
      title: String(it.title || it.htmlTitle || 'Untitled'),
      snippet: String(it.snippet || it.htmlSnippet || ''),
      link: String(it.link || it.formattedUrl || '')
    }))
  } catch {
    return []
  }
}

// Create concise key points from result snippets/titles
function extractKeyPoints(results: GoogleResult[], maxPoints = 3): string[] {
  const points: string[] = []
  const seen = new Set<string>()

  const clean = (text: string): string => {
    let s = text.trim()
    // Remove site suffixes like " | CNN" or " - The Verge"
    s = s.replace(/\s*[|\-]\s*[^|\-]{2,40}$/g, '')
    // Drop common date prefixes like "Dec 5, 2024 —" or "Mar 20, 2025 -"
    s = s.replace(/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s*\d{4}\s*[—\-–]\s*/i, '')
    // Collapse whitespace and trailing punctuation
    s = s.replace(/\s+/g, ' ').replace(/[\s·•\-–—]+$/g, '').trim()
    return s
  }

  const toSentence = (r: GoogleResult): string | null => {
    const firstFromSnippet = clean((r.snippet || '').split(/(?<=[.!?])\s+/)[0] || '')
    const titleClean = clean(r.title || '')

    // If snippet starts with a date or is too short/boilerplate, fallback to title
    const looksLikeDate = /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test((r.snippet || '').trim())
    let s = firstFromSnippet && !looksLikeDate && firstFromSnippet.length > 25 ? firstFromSnippet : titleClean

    // If still too short or looks like a list headline, keep as-is but ensure it's concise
    if (!s) return null
    if (s.length > 160) s = s.slice(0, 157).trimEnd() + '…'
    return s
  }

  for (const r of results) {
    const sentence = toSentence(r)
    if (!sentence) continue
    const key = sentence.toLowerCase()
    // Skip near-empty or numeric/date-heavy lines
    const digitRatio = (sentence.replace(/\D/g, '').length) / Math.max(1, sentence.length)
    if (digitRatio > 0.4) continue
    if (!seen.has(key)) {
      seen.add(key)
      points.push(`- ${sentence}`)
    }
    if (points.length >= maxPoints) break
  }
  return points
}

export function formatGoogleResults(query: string, results: GoogleResult[]): string {
  if (!results.length) {
    return `I couldn't fetch Google results right now. I can open the search in your browser instead.`
  }
  const points = extractKeyPoints(results, 5)
  const lines: string[] = []
  // Spoken summary + key points
  lines.push(`I found some interesting insights about ${query}. Here are the key points:`)
  lines.push('')
  if (points.length) {
    lines.push(...points)
  } else {
    lines.push('🔹 Top sources found. I can open them for you or give more details.')
  }
  lines.push('')
  lines.push('Would you like me to elaborate on any of these, or open the full articles?')
  // Non-spoken section with source links
  lines.push('[no-speak]')
  lines.push('Sources:')
  results.slice(0, 5).forEach((r, idx) => {
    lines.push(`${idx + 1}. ${r.title}`)
    if (r.link) lines.push(`   Link: ${r.link}`)
  })
  return lines.join('\n')
}

export function formatBestGoogleInsight(_query: string, results: GoogleResult[]): string {
  if (!results.length) {
    return `I couldn't fetch Google results right now. I can open the search in your browser instead.`
  }
  const clean = (text: string): string => {
    let s = text.trim()
    s = s.replace(/\s*[|\-]\s*[^|\-]{2,40}$/g, '')
    s = s.replace(/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s*\d{4}\s*[—\-–]\s*/i, '')
    s = s.replace(/\s+/g, ' ').replace(/[\s·•\-–—]+$/g, '').trim()
    return s
  }
  const toSentence = (r: GoogleResult): string | null => {
    const snipFirst = clean((r.snippet || '').split(/(?<=[.!?])\s+/)[0] || '')
    const titleClean = clean(r.title || '')
    const looksLikeDate = /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test((r.snippet || '').trim())
    let s = snipFirst && !looksLikeDate && snipFirst.length > 25 ? snipFirst : titleClean
    if (!s) return null
    if (s.length > 180) s = s.slice(0, 177).trimEnd() + '…'
    return s
  }
  // Pick the first result that yields a good sentence
  let chosen = ''
  for (const r of results) {
    const s = toSentence(r)
    if (s) { chosen = s; break }
  }
  if (!chosen) chosen = clean(results[0].title || results[0].snippet || 'Top result')

  const first = results[0]
  const lines: string[] = []
  // Speak only the single best point
  lines.push(chosen)
  // Source link (not spoken)
  lines.push('[no-speak]')
  lines.push('Source:')
  lines.push(`- ${first.title}`)
  if (first.link) lines.push(`  Link: ${first.link}`)
  return lines.join('\n')
}
