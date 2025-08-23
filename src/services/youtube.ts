// YouTube search service

export function buildYouTubeSearchUrl(query: string): string {
  const q = (query || '').trim()
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
  return url
}
