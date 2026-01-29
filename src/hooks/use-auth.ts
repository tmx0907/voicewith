'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'

interface AuthError {
  message: string
}

export function useAuth() {
  const router = useRouter()
  const { reset } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError({ message: signInError.message })
        return false
      }

      router.push('/')
      return true
    } catch {
      setError({ message: '로그인 중 오류가 발생했습니다' })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const signup = useCallback(async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      })

      if (signUpError) {
        setError({ message: signUpError.message })
        return false
      }

      return true
    } catch {
      setError({ message: '회원가입 중 오류가 발생했습니다' })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        setError({ message: signOutError.message })
        return false
      }

      reset()
      router.push('/login')
      return true
    } catch {
      setError({ message: '로그아웃 중 오류가 발생했습니다' })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [reset, router])

  return {
    login,
    signup,
    logout,
    isLoading,
    error,
    clearError: useCallback(() => setError(null), []),
  }
}
