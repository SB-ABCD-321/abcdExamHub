const CACHE_NAME = 'examhub-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

const offlineHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline | abcdExamHub</title>
    <style>
        body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; }
        .container { background: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.05); max-width: 400px; width: 90%; }
        .icon { width: 64px; height: 64px; background: #fee2e2; color: #ef4444; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 32px; font-weight: bold; }
        h1 { margin: 0 0 8px; font-size: 24px; font-weight: 800; }
        p { margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.5; }
        button { background: #4f46e5; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; width: 100%; transition: opacity 0.2s; }
        button:hover { opacity: 0.9; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">!</div>
        <h1>Connection Lost</h1>
        <p>You appear to be offline. Please check your internet connection and try again to access the platform.</p>
        <button onclick="window.location.reload()">Try Again</button>
    </div>
</body>
</html>
`;

self.addEventListener('fetch', (event) => {
  // Simple pass-through network-first strategy, required to pass PWA criteria
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(offlineHtml, {
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
  }
});
