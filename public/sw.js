const CACHE_NAME = 'examhub-static-v2';
const RUNTIME_CACHE = 'examhub-runtime-v1';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
    '/',
    '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    // Clean up old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map(name => caches.delete(name))
            );
        }).then(() => clients.claim())
    );
});

const offlineHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline | ABCD Exam Hub</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #fafafa; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 1rem; }
        .card { background: #18181b; padding: 2.5rem; border-radius: 1.5rem; box-shadow: 0 25px 50px rgba(0,0,0,0.4); max-width: 400px; width: 100%; border: 1px solid #27272a; }
        .icon { width: 64px; height: 64px; background: #451a03; color: #f97316; border-radius: 1rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 2rem; }
        h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; }
        p { color: #a1a1aa; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.5rem; }
        button { background: #eab308; color: #09090b; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 700; font-size: 0.875rem; cursor: pointer; width: 100%; transition: opacity 0.15s; }
        button:hover { opacity: 0.85; }
        button:active { transform: scale(0.98); }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">⚡</div>
        <h1>You're Offline</h1>
        <p>Please check your internet connection and try again to access ABCD Exam Hub.</p>
        <button onclick="window.location.reload()">Try Again</button>
    </div>
</body>
</html>`;

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET and cross-origin requests
    if (request.method !== 'GET' || !url.origin.includes(self.location.origin.replace(/^https?:\/\//, ''))) {
        return;
    }

    // Static assets: Cache-first strategy
    if (
        request.destination === 'image' ||
        request.destination === 'font' ||
        request.destination === 'style' ||
        request.destination === 'script' ||
        url.pathname.startsWith('/_next/static/')
    ) {
        event.respondWith(
            caches.open(RUNTIME_CACHE).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    return fetch(request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // Navigation: Network-first with offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match('/').then(cached => {
                    return cached || new Response(offlineHtml, {
                        headers: { 'Content-Type': 'text/html; charset=utf-8' }
                    });
                });
            })
        );
        return;
    }

    // API routes: Network-only (never cache)
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Everything else: Network with runtime cache fallback
    event.respondWith(
        fetch(request).then((response) => {
            if (response.ok) {
                const clone = response.clone();
                caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
            }
            return response;
        }).catch(() => caches.match(request))
    );
});
