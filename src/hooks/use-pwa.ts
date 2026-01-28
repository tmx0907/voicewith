// =====================================================
// WithVoice - PWA Hooks
// Service Worker 등록 + 푸시 알림 설정
// =====================================================

import { useEffect, useState, useCallback } from 'react'

// =====================================================
// Types
// =====================================================

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePWAReturn {
  isInstalled: boolean           // PWA로 설치되었는지
  isInstallable: boolean         // 설치 가능한지
  isOnline: boolean              // 온라인 상태
  isUpdateAvailable: boolean     // 업데이트 가능
  installPrompt: () => Promise<void>  // 설치 프롬프트
  updateApp: () => void          // 앱 업데이트
}

interface UsePushNotificationReturn {
  isSupported: boolean           // 푸시 지원 여부
  permission: NotificationPermission | 'default'
  subscription: PushSubscription | null
  requestPermission: () => Promise<boolean>
  subscribe: () => Promise<PushSubscription | null>
  unsubscribe: () => Promise<boolean>
}

// =====================================================
// PWA Hook
// =====================================================

export function usePWA(): UsePWAReturn {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 이미 설치되었는지 확인
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true

      setIsInstalled(isStandalone)
    }
    checkInstalled()

    // 온라인/오프라인 상태 감지
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 설치 프롬프트 이벤트 캡처
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // 앱 설치 완료 이벤트
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled', handleAppInstalled)

    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered')
          setRegistration(reg)

          // 업데이트 감지
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true)
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error)
        })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // 설치 프롬프트 실행
  const installPrompt = useCallback(async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstallable(false)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  // 앱 업데이트
  const updateApp = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }, [registration])

  return {
    isInstalled,
    isInstallable,
    isOnline,
    isUpdateAvailable,
    installPrompt,
    updateApp,
  }
}

// =====================================================
// Push Notification Hook
// =====================================================

// VAPID 공개키 (Firebase 또는 자체 서버에서 생성)
// 실제 프로젝트에서는 환경변수로 관리
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export function usePushNotification(): UsePushNotificationReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 지원 여부 확인
    const supported =
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window

    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)

      // 기존 구독 확인
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscription(sub)
        })
      })
    }
  }, [])

  // 알림 권한 요청
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch (error) {
      console.error('[Push] Permission request failed:', error)
      return false
    }
  }, [isSupported])

  // 푸시 구독
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return null
    }

    try {
      const reg = await navigator.serviceWorker.ready

      // VAPID 키를 Uint8Array로 변환
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      setSubscription(sub)
      console.log('[Push] Subscribed:', sub.endpoint)

      // 서버에 구독 정보 전송 (API 호출 필요)
      await sendSubscriptionToServer(sub)

      return sub
    } catch (error) {
      console.error('[Push] Subscription failed:', error)
      return null
    }
  }, [isSupported, permission, requestPermission])

  // 푸시 구독 해제
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false

    try {
      await subscription.unsubscribe()
      setSubscription(null)

      // 서버에서 구독 정보 삭제 (API 호출 필요)
      await removeSubscriptionFromServer(subscription)

      return true
    } catch (error) {
      console.error('[Push] Unsubscribe failed:', error)
      return false
    }
  }, [subscription])

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  }
}

// =====================================================
// Helper Functions
// =====================================================

/** VAPID 키를 Uint8Array로 변환 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray as Uint8Array<ArrayBuffer>
}

/** 서버에 구독 정보 전송 */
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  // TODO: API 엔드포인트 호출
  // await fetch('/api/push/subscribe', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(subscription.toJSON()),
  // })
  console.log('[Push] TODO: Send subscription to server', subscription.endpoint)
}

/** 서버에서 구독 정보 삭제 */
async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  // TODO: API 엔드포인트 호출
  // await fetch('/api/push/unsubscribe', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ endpoint: subscription.endpoint }),
  // })
  console.log('[Push] TODO: Remove subscription from server', subscription.endpoint)
}
