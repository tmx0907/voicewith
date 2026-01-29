'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

export default function SignupPage() {
  const { signup, isLoading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await signup(email, password, displayName)
    if (success) {
      setIsEmailSent(true)
    }
  }

  if (isEmailSent) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-4xl">📧</div>
        <h2 className="text-lg font-semibold text-foreground">
          이메일을 확인해주세요
        </h2>
        <p className="text-sm text-gray-500">
          <span className="font-medium text-foreground">{email}</span>
          로 인증 링크를 보냈습니다.
          <br />
          메일함을 확인해주세요.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          로그인 페이지로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
          이름
        </label>
        <input
          id="displayName"
          type="text"
          required
          autoComplete="name"
          value={displayName}
          onChange={(e) => { clearError(); setDisplayName(e.target.value) }}
          placeholder="이름을 입력하세요"
          className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          이메일
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => { clearError(); setEmail(e.target.value) }}
          placeholder="example@email.com"
          className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(e) => { clearError(); setPassword(e.target.value) }}
          placeholder="6자 이상 입력하세요"
          className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error.message}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {isLoading ? '가입 중...' : '회원가입'}
      </button>

      <p className="text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
          로그인
        </Link>
      </p>
    </form>
  )
}
