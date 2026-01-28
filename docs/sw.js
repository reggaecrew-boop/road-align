// docs/sw.js
const CACHE_NAME = "road-align-pwa-v1";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
      await self.clients.claim();
    })()
  );
});

// ネット優先→ダメならキャッシュ（HTMLはオフラインでも開けるように）
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 同一オリジンだけ扱う
  if (url.origin !== self.location.origin) return;

  // ナビゲーション(ページ遷移)は index.html を返してPWAを保つ
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put("./", fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match("./");
          return cached || caches.match("./index.html");
        }
      })()
    );
    return;
  }

  // それ以外はネット→キャッシュ
  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return caches.match(req);
      }
    })()
  );
});

