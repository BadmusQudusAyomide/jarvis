/* Simple service worker for Vite + React PWA */
const CACHE_NAME = 'jarvis-cache-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/vite.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : undefined)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle GET
  if (request.method !== 'GET') return;

  // Only handle http(s) requests; ignore extensions like chrome-extension://
  try {
    const url = new URL(request.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  } catch (_) {
    return;
  }

  // Only cache same-origin requests
  const sameOrigin = new URL(request.url).origin === self.location.origin;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Only cache successful same-origin responses
          if (sameOrigin && response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});
