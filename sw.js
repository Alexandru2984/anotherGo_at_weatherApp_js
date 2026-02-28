// sw.js — Service Worker pentru aplicația Vremea
// Strategie: Cache-first pentru resurse statice, Network-first pentru apeluri API.

const CACHE_NAME = 'vremea-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/styles.css',
  '/styles/styles_v1.css',
  '/styles/styles_v2.css',
  '/styles/styles_v3.css',
  '/styles/styles_v4.css',
  '/styles/styles_shared.css',
  '/scripts/app.js',
  '/scripts/ui.js',
  '/scripts/api.js',
  '/scripts/utils.js',
  '/scripts/config.js',
  '/manifest.json',
];

// ── Instalare: pre-cache resurse statice ────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activare: șterge cache-urile vechi ──────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Interceptare fetch ───────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Apeluri API (OpenWeatherMap, ipapi) → Network-first, fallback cache
  if (
    url.hostname.includes('openweathermap.org') ||
    url.hostname.includes('ipapi.co')
  ) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Iconițele meteo (cdn OpenWeatherMap) → Cache-first
  if (url.hostname === 'openweathermap.org' && url.pathname.includes('/img/wn/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Resurse statice locale → Cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Font Awesome, Google Fonts → Cache-first
  if (
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — resursa nu este disponibilă.', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
