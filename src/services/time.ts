// Time & Date service
// Provides concise, locale-aware time/date strings and intent detection

function locale(): string {
  try {
    return navigator.language || 'en-US'
  } catch {
    return 'en-US'
  }
}

function formatTime(d = new Date()): string {
  return new Intl.DateTimeFormat(locale(), {
    hour: 'numeric', minute: '2-digit', hour12: undefined,
  }).format(d)
}

function formatDate(d = new Date()): string {
  return new Intl.DateTimeFormat(locale(), {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(d)
}

export function detectTimeDateIntent(raw: string): 'time' | 'date' | 'datetime' | null {
  const text = (raw || '').trim().toLowerCase()
  const askTime = /(what(?:'s| is)\s+)?(the\s+)?time(\s+now)?\??|current\s+time|tell\s+time/.test(text)
  const askDate = /(what(?:'s| is)\s+)?(the\s+)?date(\s+today)?\??|today'?s\s+date|current\s+date|what\s+day\s+is\s+it/.test(text)
  if (askTime && askDate) return 'datetime'
  if (askTime) return 'time'
  if (askDate) return 'date'
  return null
}

export function getTimeDateResponse(intent: 'time' | 'date' | 'datetime'): string {
  const now = new Date()
  if (intent === 'time') return `It's ${formatTime(now)}.`
  if (intent === 'date') return `Today is ${formatDate(now)}.`
  return `It's ${formatTime(now)} on ${formatDate(now)}.`
}
