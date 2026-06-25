const CACHE_NAME = "weather-app-v4";
const APP_SHELL = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/scripts/api.js?v=20260625-2",
  "/scripts/app.js?v=20260625-2",
  "/scripts/config.js?v=20260625-2",
  "/scripts/theme.js?v=20260625-2",
  "/scripts/ui.js?v=20260625-2",
  "/scripts/utils.js?v=20260625-2",
  "/styles/styles.css?v=20260625-2",
  "/styles/styles_v1.css?v=20260625-2",
  "/styles/styles_v2.css?v=20260625-2",
  "/styles/styles_v3.css?v=20260625-2",
  "/styles/styles_v4.css?v=20260625-2",
  "/images/appScreenshot.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (event.request.method !== "GET" || requestUrl.pathname.startsWith("/api/")) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok && requestUrl.origin === self.location.origin) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }

        return networkResponse;
      });
    })
  );
});
