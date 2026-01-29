'use client'

import { useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import type { Profile } from '@/types/supabase'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading, setInitialized } = useAuthStore()

  useEffect(() => {
    const supabase = getSupabaseClient()

    // 초기 사용자 확인
    const initAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single<Profile>()

          setProfile(profile)
        }
      } catch {
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    initAuth()

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null
        setUser(user)

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single<Profile>()

          setProfile(profile)
        } else {
          setProfile(null)
        }

        setLoading(false)

        if (event === 'SIGNED_OUT') {
          setProfile(null)
        }
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setLoading, setInitialized])

  return <>{children}</>
}
