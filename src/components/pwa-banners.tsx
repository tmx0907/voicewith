'use client'

// =====================================================
// WithVoice - PWA Banner Components
// =====================================================

import { usePWA } from '@/hooks/use-pwa'

// =====================================================
// Install Prompt Component
// =====================================================

export function PWAInstallPrompt() {
  const { isInstallable, installPrompt } = usePWA()

  if (!isInstallable) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between z-50">
      <div>
        <p className="font-semibold">앱으로 설치하기</p>
        <p className="text-sm text-indigo-200">홈 화면에 추가하여 더 빠르게 접근하세요</p>
      </div>
      <button
        onClick={installPrompt}
        className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
      >
        설치
      </button>
    </div>
  )
}

// =====================================================
// Offline Banner Component
// =====================================================

export function OfflineBanner() {
  const { isOnline } = usePWA()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 text-center py-2 text-sm font-medium z-50">
      오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.
    </div>
  )
}

// =====================================================
// Update Banner Component
// =====================================================

export function UpdateBanner() {
  const { isUpdateAvailable, updateApp } = usePWA()

  if (!isUpdateAvailable) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-green-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between z-50">
      <div>
        <p className="font-semibold">새 버전이 있습니다</p>
        <p className="text-sm text-green-200">업데이트하여 최신 기능을 사용하세요</p>
      </div>
      <button
        onClick={updateApp}
        className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors"
      >
        업데이트
      </button>
    </div>
  )
}
