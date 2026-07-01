/* Lumora service worker — app shell offline
   Estratégia:
   - navegação + same-origin: network-first (mantém o cache-bust ?v quando online),
     cai pro cache quando offline;
   - cross-origin (CDNs): stale-while-revalidate. */
const CACHE = 'lumora-v1';
const CORE = [
  './', './index.html',
  './css/style.css', './js/icons.js', './js/supabase.js', './js/app.js',
  './icon.svg', './manifest.webmanifest'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u)))));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === location.origin;

  // navegação → network-first, fallback index em offline (SPA-like)
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const net = await fetch(req);
        caches.open(CACHE).then(c => c.put(req, net.clone()));
        return net;
      } catch (_) {
        return (await caches.match(req, { ignoreSearch: true }))
            || (await caches.match('./index.html'))
            || Response.error();
      }
    })());
    return;
  }

  if (sameOrigin) {
    e.respondWith((async () => {
      try {
        const net = await fetch(req);
        caches.open(CACHE).then(c => c.put(req, net.clone()));
        return net;
      } catch (_) {
        return (await caches.match(req, { ignoreSearch: true })) || Response.error();
      }
    })());
    return;
  }

  // CDN → stale-while-revalidate
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const fetchP = fetch(req).then(net => {
      caches.open(CACHE).then(c => c.put(req, net.clone()));
      return net;
    }).catch(() => null);
    return cached || (await fetchP) || Response.error();
  })());
});
