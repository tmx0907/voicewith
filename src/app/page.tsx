'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/hooks/use-auth'

export default function Home() {
  const { user, profile, isLoading } = useAuthStore()
  const { logout } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-gray-400">로딩 중...</p>
      </main>
    )
  }

  const displayName = profile?.display_name || user?.user_metadata?.display_name || '사용자'

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-8 pt-safe-top">
      {/* 헤더 */}
      <header className="flex items-center justify-between py-4">
        <h1 className="text-xl font-bold text-primary-600">WithVoice</h1>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          로그아웃
        </button>
      </header>

      {/* 환영 메시지 */}
      <section className="mt-6 mb-8">
        <h2 className="text-2xl font-bold text-foreground">
          안녕하세요, {displayName}님
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          사랑하는 사람의 목소리와 함께 하루를 시작하세요
        </p>
      </section>

      {/* 바로가기 */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/persons"
          className="flex flex-col items-center gap-2 rounded-2xl bg-primary-50 p-5 transition-colors hover:bg-primary-100 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <span className="text-3xl">👥</span>
          <span className="text-sm font-medium text-foreground">인물 관리</span>
          <span className="text-xs text-gray-500">목소리 주인 등록</span>
        </Link>

        <Link
          href="/recording"
          className="flex flex-col items-center gap-2 rounded-2xl bg-primary-50 p-5 transition-colors hover:bg-primary-100 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <span className="text-3xl">🎙️</span>
          <span className="text-sm font-medium text-foreground">음성 녹음</span>
          <span className="text-xs text-gray-500">새 목소리 녹음</span>
        </Link>

        <Link
          href="/voices"
          className="flex flex-col items-center gap-2 rounded-2xl bg-primary-50 p-5 transition-colors hover:bg-primary-100 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <span className="text-3xl">🔊</span>
          <span className="text-sm font-medium text-foreground">음성 목록</span>
          <span className="text-xs text-gray-500">저장된 목소리</span>
        </Link>

        <Link
          href="/alarms"
          className="flex flex-col items-center gap-2 rounded-2xl bg-primary-50 p-5 transition-colors hover:bg-primary-100 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <span className="text-3xl">⏰</span>
          <span className="text-sm font-medium text-foreground">알람 설정</span>
          <span className="text-xs text-gray-500">목소리 알람</span>
        </Link>
      </section>
    </main>
  )
}
