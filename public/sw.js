// Service Worker for Barbershop Manager PWA

const CACHE_NAME = "barbershop-pwa-cache-v3";
const STATIC_ASSETS = [
  "/manifest.json",
  "/Logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// 1. Install Event
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event (Essential for PWA Installability & Offline Cache)
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  // Never cache authenticated pages, RSC payloads, API calls, or server actions.
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/_next") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/employee") || event.request.headers.get("RSC")) {
    return;
  }

  const isStaticAsset = /\.(?:png|jpg|jpeg|svg|ico|webp|woff2?|css|js)$/.test(url.pathname);
  if (!isStaticAsset) {
    event.respondWith(fetch(event.request).catch(() => new Response("Offline", { status: 503 })));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      return cachedResponse || fetch(event.request).then(function (response) {
        if (response && response.status === 200 && response.type === "basic") {
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, response.clone()); });
        }
        return response;
      });
    })
  );
});

// 4. Push Notification Event
self.addEventListener("push", function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "Barbershop Manager";
    const options = {
      body: data.body || data.message || "Bạn có thông báo mới từ tiệm tóc",
      icon: "/Logo.png",
      badge: "/Logo.png",
      data: data.data || {},
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Error parsing push payload:", err);
  }
});

// 5. Notification Click Event
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/admin/revenue";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
