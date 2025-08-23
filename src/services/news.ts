// News service using NewsAPI.org Top Headlines
// Env: VITE_NEWS_API_KEY

export type NewsArticle = {
  title: string
  description?: string
  url?: string
  source?: string
}

// Country detection and grouped formatting
const COUNTRY_MAP: Record<string, string> = {
  'nigeria': 'ng', 'naija': 'ng',
  'united states': 'us', 'usa': 'us', 'america': 'us',
  'united kingdom': 'gb', 'uk': 'gb', 'england': 'gb',
  'canada': 'ca',
  'india': 'in',
  'germany': 'de',
  'france': 'fr',
  'china': 'cn',
  'japan': 'jp',
  'south africa': 'za', 'sa': 'za'
}

function countryNameFromCode(code: string): string {
  const entry = Object.entries(COUNTRY_MAP).find(([, c]) => c === code)
  if (!entry) return code.toUpperCase()
  const name = entry[0]
  return name.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

export function detectCountryCodes(text: string): string[] {
  const t = (text || '').toLowerCase()
  const found: string[] = []
  for (const [name, code] of Object.entries(COUNTRY_MAP)) {
    const pat = new RegExp(`(^|\\b|\\s)${name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(\\b|\\s|$)`, 'i')
    if (pat.test(t) && !found.includes(code)) found.push(code)
    if (found.length >= 5) break
  }
  return found
}

export async function fetchHeadlinesByCountries(countryCodes: string[], perCountryLimit = 3) {
  const groups: Array<{ country: string, articles: NewsArticle[] }> = []
  for (const code of countryCodes) {
    const arts = await fetchTopHeadlines(perCountryLimit, code)
    groups.push({ country: code, articles: arts })
  }
  return groups
}

export function formatHeadlinesByCountry(groups: Array<{ country: string, articles: NewsArticle[] }>, perCountryLimit = 3): string {
  const available = groups.filter(g => (g.articles || []).length)
  if (!available.length) return "I couldn't fetch headlines right now."
  const names = available.map(g => countryNameFromCode(g.country))
  const lines: string[] = []
  // Short spoken intro
  lines.push(`Top headlines for ${names.join(', ')}.`)
  available.forEach(g => {
    const name = countryNameFromCode(g.country)
    lines.push(`${name}:`)
    g.articles.slice(0, perCountryLimit).forEach((a, idx) => {
      const t = clean(a.title || a.description || 'Headline')
      lines.push(`${idx + 1}. ${t}`)
    })
    lines.push('')
  })
  return lines.join('\n')
}

const NEWS_KEY = import.meta.env.VITE_NEWS_API_KEY as string | undefined

export function canFetchNews(): boolean {
  return !!NEWS_KEY
}

function getLocaleCountryFallback(): string {
  try {
    const lang = (navigator.language || 'en-US')
    const parts = lang.split('-')
    const cc = (parts[1] || '').toLowerCase()
    // NewsAPI supports specific countries; use 'ng' for Nigeria if present, else fallback to 'us'
    if (cc) return cc
  } catch {}
  return 'us'
}

async function fetchWithTimeout(url: string, opts: RequestInit & { timeout?: number } = {}) {
  const { timeout = 7000, ...rest } = opts
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(url, { ...rest, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

export async function fetchTopHeadlines(limit = 3, country?: string): Promise<NewsArticle[]> {
  if (!NEWS_KEY) return []
  const cc = (country || getLocaleCountryFallback())
  const url = `https://newsapi.org/v2/top-headlines?country=${encodeURIComponent(cc)}&pageSize=${limit}&apiKey=${encodeURIComponent(NEWS_KEY)}`
  try {
    const res = await fetchWithTimeout(url, { timeout: 7000 })
    if (!res.ok) throw new Error(`News request failed (${res.status})`)
    const data = await res.json()
    const items = Array.isArray(data?.articles) ? data.articles : []
    return items.slice(0, limit).map((it: any) => ({
      title: String(it?.title || '').trim(),
      description: String(it?.description || '').trim() || undefined,
      url: String(it?.url || '').trim() || undefined,
      source: String(it?.source?.name || '').trim() || undefined,
    }))
  } catch {
    return []
  }
}

function clean(text: string): string {
  let s = (text || '').trim()
  // Remove site/source separators if present in title
  s = s.replace(/\s*[|\-]\s*[^|\-]{2,40}$/g, '')
  s = s.replace(/\s+/g, ' ').trim()
  if (s.length > 180) s = s.slice(0, 177).trimEnd() + '…'
  return s
}

export function formatBestHeadline(articles: NewsArticle[]): string {
  if (!articles.length) return `I couldn't fetch the top headline right now.`
  const first = articles[0]
  const headline = clean(first.title || first.description || 'Top headline')
  return headline
}

export function formatHeadlineList(articles: NewsArticle[], limit = 5): string {
  const list = articles.slice(0, limit)
  if (!list.length) return `I couldn't fetch headlines right now.`
  const first = list[0]
  const firstLine = clean(first.title || first.description || 'Top headline')
  const lines: string[] = []
  // Speak intro + first headline only
  lines.push('Top headlines today:')
  lines.push(firstLine)
  lines.push('More headlines:')
  list.forEach((a, idx) => {
    const t = clean(a.title || a.description || `Headline ${idx + 1}`)
    lines.push(`${idx + 1}. ${t}`)
  })
  return lines.join('\n')
}
