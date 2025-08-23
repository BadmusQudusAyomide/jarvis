// Currency Conversion service using exchangerate.host (no API key required)
// Parses queries like: "Convert 100 dollars to naira" or "How much is 50 USD in NGN"

const NAME_TO_CODE: Record<string, string> = {
  dollar: 'USD', dollars: 'USD', usd: 'USD', 'us dollar': 'USD', 'american dollar': 'USD',
  naira: 'NGN', ngn: 'NGN',
  euro: 'EUR', euros: 'EUR', eur: 'EUR',
  pound: 'GBP', pounds: 'GBP', sterling: 'GBP', gbp: 'GBP', 'pound sterling': 'GBP',
  yen: 'JPY', jpy: 'JPY',
  rupee: 'INR', rupees: 'INR', inr: 'INR',
  cedi: 'GHS', cedis: 'GHS', ghs: 'GHS',
  rand: 'ZAR', zar: 'ZAR',
  yuan: 'CNY', cny: 'CNY', renminbi: 'CNY', rmb: 'CNY',
  cad: 'CAD', 'canadian dollar': 'CAD',
  aud: 'AUD', 'australian dollar': 'AUD',
  chf: 'CHF', franc: 'CHF', francs: 'CHF',
  kes: 'KES', 'kenyan shilling': 'KES',
  ugx: 'UGX', 'ugandan shilling': 'UGX',
  ghana: 'GHS', nigeria: 'NGN', america: 'USD', usa: 'USD', uk: 'GBP'
}

const SYMBOL_TO_CODE: Record<string, string> = {
  '$': 'USD', '₦': 'NGN', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR', '₵': 'GHS', 'R': 'ZAR', '元': 'CNY', 'C$': 'CAD', 'A$': 'AUD'
}

function normalizeCurrency(token: string): string | null {
  if (!token) return null
  const t = token.trim().toLowerCase()
  // If looks like a 3-letter code
  if (/^[a-z]{3}$/i.test(t)) return t.toUpperCase()
  if (NAME_TO_CODE[t]) return NAME_TO_CODE[t]
  // Try stripping plural 's'
  if (t.endsWith('s') && NAME_TO_CODE[t.slice(0, -1)]) return NAME_TO_CODE[t.slice(0, -1)]
  // Symbol mapping (single or two-char)
  if (SYMBOL_TO_CODE[token as keyof typeof SYMBOL_TO_CODE]) return SYMBOL_TO_CODE[token as keyof typeof SYMBOL_TO_CODE]
  return null
}

function parseAmount(raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/[,\s]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export type ParsedConversion = { amount: number, from: string, to: string }

export function extractConversion(raw: string): ParsedConversion | null {
  const text = (raw || '').trim()
  // Patterns covering common phrasings
  const pats: RegExp[] = [
    /^(?:convert|exchange)\s+([\d.,]+)\s*([\p{L}$€£¥₦₹₵]+)\s+(?:to|in)\s+([\p{L}$€£¥₦₹₵]+)\s*$/iu,
    /^how\s+much\s+is\s+([\d.,]+)\s*([\p{L}$€£¥₦₹₵]+)\s+(?:to|in)\s+([\p{L}$€£¥₦₹₵]+)\s*\??$/iu,
    /^([\d.,]+)\s*([\p{L}$€£¥₦₹₵]+)\s+(?:to|in)\s+([\p{L}$€£¥₦₹₵]+)\s*$/iu,
  ]
  for (const pat of pats) {
    const m = text.match(pat)
    if (m) {
      const amount = parseAmount(m[1])
      const from = normalizeCurrency(m[2])
      const to = normalizeCurrency(m[3])
      if (amount != null && from && to) return { amount, from, to }
    }
  }
  return null
}

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit & { timeout?: number } = {}) {
  const { timeout = 7000, ...rest } = init
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  return fetch(input, { ...rest, signal: controller.signal }).finally(() => clearTimeout(id))
}

async function fetchConversion(amount: number, from: string, to: string): Promise<number | null> {
  // Provider 1: exchangerate.host convert
  try {
    const url = `https://api.exchangerate.host/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`
    const res = await fetchWithTimeout(url, { timeout: 7000 })
    if (res.ok) {
      const data = await res.json()
      const v = Number(data?.result)
      if (Number.isFinite(v)) return v
    }
  } catch {}

  // Provider 2: open.er-api.com latest base FROM, compute amount * rate[to]
  try {
    const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`
    const res = await fetchWithTimeout(url, { timeout: 7000 })
    if (res.ok) {
      const data = await res.json()
      const rate = Number(data?.rates?.[to])
      if (Number.isFinite(rate)) return amount * rate
    }
  } catch {}

  // Provider 3: jsdelivr currency-api (daily JSON). Needs lowercase codes.
  try {
    const a = from.toLowerCase(), b = to.toLowerCase()
    const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${a}/${b}.json`
    const res = await fetchWithTimeout(url, { timeout: 7000 })
    if (res.ok) {
      const data = await res.json()
      const rate = Number(data?.[b])
      if (Number.isFinite(rate)) return amount * rate
    }
  } catch {}

  return null
}

function formatNumber(n: number, currency?: string): string {
  try {
    return new Intl.NumberFormat(undefined, currency ? { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 2 } : { maximumFractionDigits: 2 }).format(n)
  } catch {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }
}

export async function getCurrencyConversionResponse(raw: string): Promise<string | null> {
  const parsed = extractConversion(raw)
  if (!parsed) return null
  const { amount, from, to } = parsed
  const result = await fetchConversion(amount, from, to)
  if (result == null) {
    // Try cache fallback
    const cached = loadCachedRate(from, to)
    if (cached) {
      const computed = amount * cached.rate
      const left = `${formatNumber(amount, from)} (${from})`
      const right = `${formatNumber(computed, to)} (${to})`
      const when = new Date(cached.ts)
      const timeStr = when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      return `${left} ≈ ${right}. Using a recent rate from ${timeStr}.`
    }
    return `I couldn't fetch live rates right now. Please try again.`
  }
  // Keep it concise; show codes with formatted numbers
  const left = `${formatNumber(amount, from)} (${from})`
  const right = `${formatNumber(result, to)} (${to})`
  // Save to cache for resilience
  saveCachedRate(from, to, result / amount)
  return `${left} ≈ ${right}.`
}

// --- Simple local cache for rates ---
type CachedRate = { rate: number, ts: number }

function cacheKey(from: string, to: string) { return `cc_rate_${from}_${to}` }

function saveCachedRate(from: string, to: string, rate: number) {
  if (!Number.isFinite(rate)) return
  try {
    const rec: CachedRate = { rate, ts: Date.now() }
    localStorage.setItem(cacheKey(from, to), JSON.stringify(rec))
  } catch {}
}

function loadCachedRate(from: string, to: string, maxAgeMs = 24 * 60 * 60 * 1000): CachedRate | null {
  try {
    const raw = localStorage.getItem(cacheKey(from, to))
    if (!raw) return null
    const rec = JSON.parse(raw) as CachedRate
    if (!rec || !Number.isFinite(rec.rate) || !Number.isFinite(rec.ts)) return null
    if (Date.now() - rec.ts > maxAgeMs) return null
    return rec
  } catch {
    return null
  }
}
