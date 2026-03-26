const CACHE_NAME = 'examhub-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through network-first strategy, required to pass PWA criteria
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline text here');
    })
  );
});
