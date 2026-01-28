// =====================================================
// WithVoice - Supabase Client Configuration
// =====================================================

import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// =====================================================
// Environment Variables
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// =====================================================
// Browser Client (클라이언트 컴포넌트용)
// =====================================================

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// 싱글톤 패턴 (클라이언트 사이드)
let browserClient: ReturnType<typeof createBrowserSupabaseClient> | null = null

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient should only be called on the client side')
  }

  if (!browserClient) {
    browserClient = createBrowserSupabaseClient()
  }

  return browserClient
}

// 기존 createClient 호환성 유지
export function createClient() {
  return createBrowserSupabaseClient()
}

// =====================================================
// Server Client (서버 컴포넌트/API 라우트용)
// =====================================================

export function createServerSupabaseClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// =====================================================
// Storage Helpers
// =====================================================

const VOICE_BUCKET = 'voices'
const AVATAR_BUCKET = 'avatars'

/** 음성 파일 업로드 */
export async function uploadVoiceFile(
  userId: string,
  file: Blob,
  fileName: string
): Promise<{ url: string; path: string } | null> {
  const supabase = getSupabaseClient()

  // 파일 경로: voices/{user_id}/{timestamp}_{filename}
  const timestamp = Date.now()
  const filePath = `${userId}/${timestamp}_${fileName}`

  const { data, error } = await supabase.storage
    .from(VOICE_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error('Voice upload error:', error)
    return null
  }

  // Public URL 생성
  const { data: urlData } = supabase.storage
    .from(VOICE_BUCKET)
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path,
  }
}

/** 음성 파일 삭제 */
export async function deleteVoiceFile(filePath: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { error } = await supabase.storage
    .from(VOICE_BUCKET)
    .remove([filePath])

  if (error) {
    console.error('Voice delete error:', error)
    return false
  }

  return true
}

/** 프로필 이미지 업로드 */
export async function uploadAvatarFile(
  userId: string,
  file: Blob,
  fileName: string
): Promise<string | null> {
  const supabase = getSupabaseClient()

  const filePath = `${userId}/${fileName}`

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true, // 덮어쓰기 허용
    })

  if (error) {
    console.error('Avatar upload error:', error)
    return null
  }

  const { data: urlData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

// =====================================================
// Auth Helpers
// =====================================================

/** 현재 사용자 가져오기 */
export async function getCurrentUser() {
  const supabase = getSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Get user error:', error)
    return null
  }

  return user
}

/** 로그아웃 */
export async function signOut() {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error)
    return false
  }

  return true
}
