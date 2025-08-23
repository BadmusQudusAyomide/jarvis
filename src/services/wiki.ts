// Wikipedia lookup service: searches and returns concise summaries
// Uses MediaWiki APIs with CORS enabled endpoints

export async function getWikiSummary(rawQuery: string): Promise<string> {
  const query = normalizeQuery(rawQuery)
  if (!query) return 'Please tell me what to look up on Wikipedia, e.g., "Wikipedia Lagos".'

  // 1) Find best matching title via opensearch
  const title = await searchBestTitle(query)
  if (!title) return `I couldn't find anything relevant for "${query}" on Wikipedia.`

  // 2) Fetch summary via REST API (handles redirects)
  const summary = await fetchSummary(title)
  if (!summary) return `I found "${title}", but couldn't retrieve a summary.`

  const { extract, content_urls } = summary
  const url = content_urls?.desktop?.page || content_urls?.mobile?.page
  const snippet = extract?.trim()
  if (!snippet) return `I found "${title}", but the page has no summary.`

  if (url) {
    // Keep the link separate so TTS can be configured to skip URLs
    return `${title}: ${snippet}\n\nCheck it out at the link below:\nLink: ${url}`
  }
  return `${title}: ${snippet}`
}

function normalizeQuery(q: string): string {
  const s = q.trim()
  // Strip wake words like "wikipedia", "who is", "what is", "tell me about"
  const cleaned = s.replace(/^(wikipedia\s+|who\s+(is|was)\s+|what\s+is\s+|tell\s+me\s+about\s+)/i, '').trim()
  return cleaned || s
}

async function searchBestTitle(query: string): Promise<string | null> {
  // Using opensearch for simplicity and good relevance
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json&origin=*`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as [string, string[], string[], string[]]
    const titles = data?.[1]
    const title = titles?.[0]
    return title || null
  } catch {
    return null
  }
}

async function fetchSummary(title: string): Promise<any | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
