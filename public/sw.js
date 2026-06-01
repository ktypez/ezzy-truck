// Ezzy Truck - Service Worker
const CACHE_NAME = "ezzy-truck-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
];

// Install: precache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for pages, cache-first for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and non-HTTP(S)
  if (request.method !== "GET" || !url.protocol.startsWith("http")) return;

  // API calls (Supabase, etc.) — network-only
  if (url.hostname !== self.location.hostname) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Vite static assets (/assets/) — cache-first
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Public icons, fonts, images — cache-first
  if (/\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Pages / navigation — network-first
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Everything else — network-first
  event.respondWith(networkFirst(request));
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
    return new Response("Offline", { status: 503 });
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
    return new Response("Offline", { status: 503 });
  }
}
