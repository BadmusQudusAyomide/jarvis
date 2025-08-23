// Weather service: fetches real weather data for desktop and mobile
// Uses OpenWeatherMap (https://openweathermap.org/) free API
// Required env: VITE_WEATHER_API_KEY=<your_key>

export type WeatherQuery = {
  raw: string
}

const OWM_KEY = import.meta.env.VITE_WEATHER_API_KEY as string | undefined

const isMobile = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

// Locale + units helpers
const locale = (navigator.language || 'en-US').toString()
const lang = (locale.split('-')[0] || 'en')
const UNITS_ENV = (import.meta.env.VITE_WEATHER_UNITS as string | undefined)?.toLowerCase()
function detectUnits(): 'metric' | 'imperial' {
  // 1) Explicit override via env
  if (UNITS_ENV === 'metric' || UNITS_ENV === 'imperial') return UNITS_ENV
  // 2) Default preference: metric globally
  return /^en-US$/i.test(locale) ? 'imperial' : 'metric'
}

// Fetch with timeout for network resilience
async function fetchWithTimeout(input: RequestInfo, opts?: { timeout?: number }): Promise<Response> {
  const timeout = opts?.timeout ?? 7000
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), timeout)
  try {
    // @ts-ignore - RequestInit supports signal in browsers
    const res = await fetch(input as any, { signal: ctrl.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

async function geolocatePrecise(timeoutMs = 6000): Promise<GeolocationPosition | null> {
  if (!('geolocation' in navigator)) return null
  return new Promise((resolve) => {
    const onSuccess = (pos: GeolocationPosition) => resolve(pos)
    const onError = () => resolve(null)
    try {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: isMobile(),
        timeout: timeoutMs,
        maximumAge: 60_000,
      })
    } catch {
      resolve(null)
    }
  })
}

async function geoLookupCity(q: string): Promise<{ lat: number; lon: number; name: string; country?: string } | null> {
  if (!OWM_KEY) return null
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${OWM_KEY}&lang=${encodeURIComponent(lang)}`
  try {
    const res = await fetchWithTimeout(url, { timeout: 6000 })
    if (!res.ok) {
      return null
    }
    const arr = (await res.json()) as Array<any>
    if (!arr?.length) return null
    const it = arr[0]
    return { lat: it.lat, lon: it.lon, name: it.name, country: it.country }
  } catch {
    return null
  }
}

async function weatherByCoords(lat: number, lon: number, units: 'metric' | 'imperial' = 'metric') {
  if (!OWM_KEY) throw new Error('Missing VITE_WEATHER_API_KEY')
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${OWM_KEY}&lang=${encodeURIComponent(lang)}`
  const res = await fetchWithTimeout(url, { timeout: 7000 })
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`)
  return res.json()
}

function extractLocationFromText(raw: string): string | null {
  // Examples: "weather in São Paulo", "what's the temperature in New York?", "rain in London"
  const text = raw.trim().toLowerCase()
  const pat1 = /(?:weather|temperature|rain|sunny|cloudy|forecast)\s+(?:in|at|for)\s+([\p{L}\s,'-]+)[?.!]*$/u
  const pat2 = /(?:in|at|for)\s+([\p{L}\s,'-]+).*?(?:weather|temperature|forecast)/u
  const m1 = text.match(pat1)
  if (m1 && m1[1]) return m1[1].trim().replace(/[?.!,\s]+$/u, '')
  const m2 = text.match(pat2)
  if (m2 && m2[1]) return m2[1].trim().replace(/[?.!,\s]+$/u, '')
  return null
}

function describe(data: any, units: 'metric' | 'imperial', locationHint?: string) {
  const name = locationHint || data?.name || ''
  const safeRound = (v: any) => {
    const n = Number(v)
    return Number.isFinite(n) ? Math.round(n) : null
  }
  const temp = safeRound(data?.main?.temp)
  const feels = safeRound(data?.main?.feels_like)
  const cond = (data?.weather?.[0]?.description as string) || 'conditions unknown'
  const hum = typeof data?.main?.humidity === 'number' ? data.main.humidity : null
  const wind = safeRound(data?.wind?.speed)
  const unitTemp = units === 'metric' ? '°C' : '°F'
  const unitWind = units === 'metric' ? 'm/s' : 'mph'
  const where = name ? ` in ${name}` : ''
  return `Right now${where}: ${temp ?? '?'}${unitTemp}, feels like ${feels ?? '?'}${unitTemp}, ${cond}. Humidity ${hum ?? '?'}%, wind ${wind ?? '?'} ${unitWind}.`
}

export async function getWeatherResponse(raw: string): Promise<string> {
  if (!OWM_KEY) {
    return 'Weather is supported, but no API key is configured. Add VITE_WEATHER_API_KEY to your .env.local to enable real data.'
  }

  const units: 'metric' | 'imperial' = detectUnits()

  // 1) If a city is specified, prefer geocoding
  const city = extractLocationFromText(raw)
  if (city) {
    const g = await geoLookupCity(city)
    if (g) {
      try {
        const data = await weatherByCoords(g.lat, g.lon, units)
        return describe(data, units, `${g.name}${g.country ? ', ' + g.country : ''}`)
      } catch (e) {
        // fallthrough
      }
    }
  }

  // 2) Try precise device location (works well on phone)
  const pos = await geolocatePrecise(isMobile() ? 7000 : 4000)
  if (pos) {
    try {
      const { latitude, longitude } = pos.coords
      const data = await weatherByCoords(latitude, longitude, units)
      return describe(data, units)
    } catch (e) {
      // fallthrough
    }
  }

  // 3) Fallback: ask user to provide city
  return 'Tell me the city, e.g., "what\'s the weather in Lagos" so I can fetch precise data.'
}
