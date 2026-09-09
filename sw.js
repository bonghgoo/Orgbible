// Org Bible 오프라인 웹앱 서비스워커
// 버전을 바꾸면(v1 -> v2 등) 예전 캐시가 자동으로 정리되고 최신 파일로 교체됩니다.
const CACHE_NAME = 'orgbible-static-v1';

// 설치 시 미리 저장해둘 "앱 껍데기" 파일들 (항상 필요한 것들만 — 66권 데이터는
// 여기 포함하지 않고, 실제로 그 책을 열어볼 때 자동으로 캐시됩니다)
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './strongs_hebrew.json',
  './strongs_greek.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch((e) => {
      console.warn('[SW] 일부 파일 캐시 실패 (인터넷 연결 확인 필요):', e);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// 캐시 우선(cache-first) + 실패 시 네트워크로 가져와서 캐시에 저장(다음부터는 오프라인에서도 사용 가능)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached); // 오프라인이고 캐시에도 없으면 실패(해당 페이지에서 안내 문구 표시됨)
    })
  );
});
