// =====================================================
// WithVoice - Supabase Database Types
// 이 파일은 수동으로 작성되었습니다.
// 실제 프로젝트에서는 `supabase gen types typescript` 명령어로 자동 생성 권장
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =====================================================
// Enum Types
// =====================================================

export type RelationshipType = 'family' | 'partner' | 'friend' | 'mentor' | 'other'

export type VoiceCategory = 'motivation' | 'comfort' | 'goodnight' | 'wakeup' | 'encouragement' | 'other'

export type AlarmAction = 'triggered' | 'dismissed' | 'snoozed' | 'missed'

// =====================================================
// Database Tables
// =====================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          timezone: string
          notification_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          notification_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          notification_enabled?: boolean
          updated_at?: string
        }
      }
      persons: {
        Row: {
          id: string
          user_id: string
          name: string
          relationship: RelationshipType
          profile_image_url: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          relationship?: RelationshipType
          profile_image_url?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          relationship?: RelationshipType
          profile_image_url?: string | null
          description?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      voices: {
        Row: {
          id: string
          user_id: string
          person_id: string
          title: string
          file_url: string
          file_path: string
          duration_seconds: number
          file_size_bytes: number | null
          mime_type: string
          category: VoiceCategory
          transcript: string | null
          is_favorite: boolean
          play_count: number
          last_played_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          person_id: string
          title: string
          file_url: string
          file_path: string
          duration_seconds: number
          file_size_bytes?: number | null
          mime_type?: string
          category?: VoiceCategory
          transcript?: string | null
          is_favorite?: boolean
          play_count?: number
          last_played_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          category?: VoiceCategory
          transcript?: string | null
          is_favorite?: boolean
          play_count?: number
          last_played_at?: string | null
          updated_at?: string
        }
      }
      alarms: {
        Row: {
          id: string
          user_id: string
          voice_id: string
          alarm_time: string
          days_of_week: number[]
          label: string | null
          is_enabled: boolean
          is_vibrate: boolean
          snooze_minutes: number
          last_triggered_at: string | null
          next_trigger_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          voice_id: string
          alarm_time: string
          days_of_week: number[]
          label?: string | null
          is_enabled?: boolean
          is_vibrate?: boolean
          snooze_minutes?: number
          last_triggered_at?: string | null
          next_trigger_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          voice_id?: string
          alarm_time?: string
          days_of_week?: number[]
          label?: string | null
          is_enabled?: boolean
          is_vibrate?: boolean
          snooze_minutes?: number
          last_triggered_at?: string | null
          next_trigger_at?: string | null
          updated_at?: string
        }
      }
      alarm_logs: {
        Row: {
          id: string
          user_id: string
          alarm_id: string | null
          voice_id: string | null
          action: AlarmAction
          triggered_at: string
          responded_at: string | null
          response_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          alarm_id?: string | null
          voice_id?: string | null
          action: AlarmAction
          triggered_at?: string
          responded_at?: string | null
          response_seconds?: number | null
          created_at?: string
        }
        Update: {
          action?: AlarmAction
          responded_at?: string | null
          response_seconds?: number | null
        }
      }
      fcm_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          device_info: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          device_info?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          token?: string
          device_info?: Json | null
          is_active?: boolean
          updated_at?: string
        }
      }
    }
    Functions: {
      increment_play_count: {
        Args: { voice_uuid: string }
        Returns: void
      }
    }
  }
}

// =====================================================
// Helper Types (프론트엔드에서 사용하기 편한 타입들)
// =====================================================

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Person = Database['public']['Tables']['persons']['Row']
export type PersonInsert = Database['public']['Tables']['persons']['Insert']
export type PersonUpdate = Database['public']['Tables']['persons']['Update']

export type Voice = Database['public']['Tables']['voices']['Row']
export type VoiceInsert = Database['public']['Tables']['voices']['Insert']
export type VoiceUpdate = Database['public']['Tables']['voices']['Update']

export type Alarm = Database['public']['Tables']['alarms']['Row']
export type AlarmInsert = Database['public']['Tables']['alarms']['Insert']
export type AlarmUpdate = Database['public']['Tables']['alarms']['Update']

export type AlarmLog = Database['public']['Tables']['alarm_logs']['Row']
export type AlarmLogInsert = Database['public']['Tables']['alarm_logs']['Insert']

export type FcmToken = Database['public']['Tables']['fcm_tokens']['Row']
export type FcmTokenInsert = Database['public']['Tables']['fcm_tokens']['Insert']

// =====================================================
// Extended Types (관계 포함)
// =====================================================

/** Voice with Person info */
export interface VoiceWithPerson extends Voice {
  person: Person
}

/** Alarm with Voice and Person info */
export interface AlarmWithVoice extends Alarm {
  voice: VoiceWithPerson
}

/** Person with voice count */
export interface PersonWithVoiceCount extends Person {
  voice_count: number
}

// =====================================================
// UI Helper Types
// =====================================================

/** 요일 표시용 */
export const DAYS_OF_WEEK = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
} as const

/** 관계 표시용 */
export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  family: '가족',
  partner: '연인',
  friend: '친구',
  mentor: '멘토',
  other: '기타',
}

/** 카테고리 표시용 */
export const CATEGORY_LABELS: Record<VoiceCategory, string> = {
  motivation: '동기부여',
  comfort: '위로',
  goodnight: '잘자요',
  wakeup: '일어나',
  encouragement: '응원',
  other: '기타',
}

/** 카테고리 이모지 */
export const CATEGORY_EMOJI: Record<VoiceCategory, string> = {
  motivation: '💪',
  comfort: '🤗',
  goodnight: '🌙',
  wakeup: '☀️',
  encouragement: '📣',
  other: '💬',
}
