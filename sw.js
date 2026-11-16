const CACHE_NAME = 'mazo-destino-14';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('mazo-destino-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const updateable = e.request.mode === 'navigate' ||
      e.request.destination === 'script' ||
      e.request.destination === 'style';

    if (updateable) {
      try {
        const response = await fetch(e.request, { cache: 'reload' });
        if (response.ok) await cache.put(e.request, response.clone());
        return response;
      } catch (error) {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        throw error;
      }
    }

    const response = await caches.match(e.request);
    return response || fetch(e.request);
  })());
});