const CACHE_NAME = 'weather-app-v13';
const VERSION = '20261105-3';
const APP_SHELL = ['/', '/index.html', '/offline.html', '/manifest.webmanifest', '/favicon.ico', '/fonts/fa-solid-900.woff2', `/styles/icons.css?v=${VERSION}`, '/icons/icon.svg', '/icons/favicon-32.png', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png', '/icons/apple-touch-icon.png', ...['api', 'app', 'config', 'theme', 'ui', 'utils', 'storage', 'forecast', 'insights'].map(name => `/scripts/${name}.js?v=${VERSION}`), `/styles/styles.css?v=${VERSION}`];
const shellUrls = new Set(APP_SHELL.map(path => new URL(path, self.location.origin).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('weather-app-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname === '/healthz') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => response.ok ? response : caches.match('/index.html').then(cached => cached || response)).catch(async () => await caches.match('/index.html') || await caches.match('/offline.html')));
  } else if (shellUrls.has(url.href)) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});
