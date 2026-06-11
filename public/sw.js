/*
 * Jazon service worker — deliberately conservative.
 *
 * Strategy: network-first for everything, falling back to cache only when
 * offline. Never serves a cached response while the network works, so a
 * deploy can never strand users on a stale bundle (this app has been bitten
 * by stale bundles before). Exists primarily to satisfy PWA installability.
 */
const CACHE = "jazon-v1";
const OFFLINE_FALLBACK_PAGES = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(OFFLINE_FALLBACK_PAGES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only handle same-origin GETs; API calls and cross-origin pass through.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ??
            (request.mode === "navigate"
              ? caches.match("/index.html")
              : Response.error())
        )
      )
  );
});
