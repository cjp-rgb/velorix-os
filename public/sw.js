const CACHE_NAME = 'velorix-v1'
const STATIC_ASSETS = ['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('fetch', (event) => {
  if (STATIC_ASSETS.includes(new URL(event.request.url).pathname)) {
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    )
  }
})
