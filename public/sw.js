/* Simple service worker for Vite + React PWA */
const CACHE_NAME = 'jarvis-cache-v3';
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

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Network-first for navigations (HTML). Prevents stale app shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          // Optionally cache successful navigations
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        } catch (_) {
          // Fallback to cache, then offline shell
          const cached = await caches.match(request);
          return (
            cached ||
            (await caches.match('/index.html')) ||
            new Response('Offline', { status: 503, statusText: 'Offline' })
          );
        }
      })()
    );
    return;
  }

  // For other GET requests: cache-first for same-origin; network for cross-origin
  event.respondWith(
    (async () => {
      if (sameOrigin) {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const resp = await fetch(request);
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return resp;
        } catch (_) {
          // If offline and not cached, try app shell
          const fallback = await caches.match('/index.html');
          return fallback || new Response('Offline', { status: 503 });
        }
      } else {
        // Cross-origin: just go to network
        return fetch(request).catch(() => new Response('Offline', { status: 503 }));
      }
    })()
  );
});
