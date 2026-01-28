// =====================================================
// WithVoice Service Worker
// PWA 오프라인 지원 + 푸시 알림
// =====================================================

const CACHE_NAME = 'withvoice-v1'
const OFFLINE_URL = '/offline'

// 캐시할 정적 파일들
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// =====================================================
// Install Event - 정적 파일 캐싱
// =====================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )

  // 대기 중인 서비스 워커 즉시 활성화
  self.skipWaiting()
})

// =====================================================
// Activate Event - 이전 캐시 정리
// =====================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )

  // 모든 클라이언트 즉시 제어
  self.clients.claim()
})

// =====================================================
// Fetch Event - 네트워크 우선, 캐시 폴백
// =====================================================

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API 요청은 항상 네트워크로
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      })
    )
    return
  }

  // 오디오 파일은 캐시 우선 (오프라인 재생용)
  if (request.url.includes('/storage/') && request.url.includes('audio')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached

        return fetch(request).then((response) => {
          // 성공한 응답만 캐시
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // 그 외 요청: 네트워크 우선, 실패 시 캐시
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 성공한 GET 요청 캐시
        if (request.method === 'GET' && response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
        }
        return response
      })
      .catch(() => {
        // 오프라인: 캐시에서 가져오기
        return caches.match(request).then((cached) => {
          if (cached) return cached

          // HTML 요청이면 오프라인 페이지
          if (request.headers.get('Accept')?.includes('text/html')) {
            return caches.match(OFFLINE_URL)
          }

          return new Response('Offline', { status: 503 })
        })
      })
  )
})

// =====================================================
// Push Event - 푸시 알림 수신
// =====================================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)

  let data = {
    title: 'WithVoice',
    body: '새로운 알림이 있습니다',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'withvoice-notification',
    data: {},
  }

  // 푸시 데이터 파싱
  if (event.data) {
    try {
      const payload = event.data.json()
      data = { ...data, ...payload }
    } catch (e) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: true, // 사용자가 닫을 때까지 유지
    actions: [
      { action: 'open', title: '열기' },
      { action: 'dismiss', title: '닫기' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// =====================================================
// Notification Click Event - 알림 클릭 처리
// =====================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event)

  event.notification.close()

  // dismiss 액션이면 그냥 닫기
  if (event.action === 'dismiss') {
    return
  }

  // 앱 열기 또는 포커스
  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen)
            return client.focus()
          }
        }
        // 없으면 새 창 열기
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})

// =====================================================
// Background Sync - 오프라인 작업 동기화 (선택)
// =====================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === 'sync-alarm-logs') {
    event.waitUntil(syncAlarmLogs())
  }
})

async function syncAlarmLogs() {
  // IndexedDB에서 보류 중인 로그 가져와서 서버에 전송
  // 구현 예정
  console.log('[SW] Syncing alarm logs...')
}

// =====================================================
// Periodic Background Sync - 주기적 동기화 (선택)
// =====================================================

self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag)

  if (event.tag === 'check-alarms') {
    event.waitUntil(checkUpcomingAlarms())
  }
})

async function checkUpcomingAlarms() {
  // 다가오는 알람 체크
  console.log('[SW] Checking upcoming alarms...')
}

console.log('[SW] Service worker loaded')
