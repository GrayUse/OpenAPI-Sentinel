// Basic Service Worker to enable PWA installability
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Let the browser do its default thing for now
  e.respondWith(fetch(e.request).catch(() => new Response('Offline')));
});
