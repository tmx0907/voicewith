-- =====================================================
-- WithVoice Database Schema
-- Supabase PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS 테이블 (Supabase Auth와 연동)
-- =====================================================
-- Supabase Auth가 자동으로 auth.users 테이블을 관리합니다.
-- 우리는 추가 사용자 정보를 위한 profiles 테이블을 만듭니다.

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'Asia/Seoul',
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 조회/수정 가능
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. PERSONS 테이블 (목소리 주인 관리)
-- =====================================================

CREATE TYPE relationship_type AS ENUM (
    'family',      -- 가족
    'partner',     -- 연인
    'friend',      -- 친구
    'mentor',      -- 멘토
    'other'        -- 기타
);

CREATE TABLE public.persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship relationship_type NOT NULL DEFAULT 'family',
    profile_image_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_persons_user_id ON public.persons(user_id);

-- RLS
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own persons"
    ON public.persons FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- 3. VOICES 테이블 (녹음된 음성 메시지)
-- =====================================================

CREATE TYPE voice_category AS ENUM (
    'motivation',   -- 동기부여
    'comfort',      -- 위로
    'goodnight',    -- 잘자요
    'wakeup',       -- 일어나
    'encouragement', -- 응원
    'other'         -- 기타
);

CREATE TABLE public.voices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,

    -- 음성 파일 정보
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,           -- Supabase Storage URL
    file_path TEXT NOT NULL,          -- Storage 내 경로
    duration_seconds INTEGER NOT NULL, -- 5-60초
    file_size_bytes INTEGER,
    mime_type TEXT DEFAULT 'audio/webm',

    -- 분류 및 메타데이터
    category voice_category NOT NULL DEFAULT 'other',
    transcript TEXT,                   -- 음성 텍스트 (선택)

    -- 상태
    is_favorite BOOLEAN DEFAULT false,
    play_count INTEGER DEFAULT 0,
    last_played_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 제약조건: 5-60초
    CONSTRAINT voice_duration_check CHECK (duration_seconds >= 5 AND duration_seconds <= 60)
);

-- 인덱스
CREATE INDEX idx_voices_user_id ON public.voices(user_id);
CREATE INDEX idx_voices_person_id ON public.voices(person_id);
CREATE INDEX idx_voices_category ON public.voices(category);
CREATE INDEX idx_voices_is_favorite ON public.voices(is_favorite) WHERE is_favorite = true;

-- RLS
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own voices"
    ON public.voices FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- 4. ALARMS 테이블 (알람 설정)
-- =====================================================

CREATE TABLE public.alarms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    voice_id UUID NOT NULL REFERENCES public.voices(id) ON DELETE CASCADE,

    -- 알람 시간 설정
    alarm_time TIME NOT NULL,          -- HH:MM:SS
    days_of_week INTEGER[] NOT NULL,   -- 0=일, 1=월, 2=화, ... 6=토

    -- 알람 정보
    label TEXT,                        -- 알람 이름 (예: "아침 기상")
    is_enabled BOOLEAN DEFAULT true,
    is_vibrate BOOLEAN DEFAULT true,
    snooze_minutes INTEGER DEFAULT 5,  -- 다시 알림 간격

    -- 알람 실행 기록
    last_triggered_at TIMESTAMPTZ,
    next_trigger_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_alarms_user_id ON public.alarms(user_id);
CREATE INDEX idx_alarms_voice_id ON public.alarms(voice_id);
CREATE INDEX idx_alarms_next_trigger ON public.alarms(next_trigger_at) WHERE is_enabled = true;

-- RLS
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alarms"
    ON public.alarms FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- 5. ALARM_LOGS 테이블 (알람 이력 - 행동 변화 추적용)
-- =====================================================

CREATE TYPE alarm_action AS ENUM (
    'triggered',    -- 알람 울림
    'dismissed',    -- 해제
    'snoozed',      -- 다시 알림
    'missed'        -- 놓침
);

CREATE TABLE public.alarm_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alarm_id UUID REFERENCES public.alarms(id) ON DELETE SET NULL,
    voice_id UUID REFERENCES public.voices(id) ON DELETE SET NULL,

    action alarm_action NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    response_seconds INTEGER,          -- 응답까지 걸린 시간

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_alarm_logs_user_id ON public.alarm_logs(user_id);
CREATE INDEX idx_alarm_logs_triggered_at ON public.alarm_logs(triggered_at);

-- RLS
ALTER TABLE public.alarm_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alarm logs"
    ON public.alarm_logs FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- 6. FCM_TOKENS 테이블 (푸시 알림용)
-- =====================================================

CREATE TABLE public.fcm_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_info JSONB,                 -- 기기 정보
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_token ON public.fcm_tokens(token);

-- RLS
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own FCM tokens"
    ON public.fcm_tokens FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_persons_updated_at
    BEFORE UPDATE ON public.persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voices_updated_at
    BEFORE UPDATE ON public.voices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alarms_updated_at
    BEFORE UPDATE ON public.alarms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 신규 사용자 프로필 자동 생성 함수
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Auth 사용자 생성 시 자동으로 프로필 생성
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 음성 재생 횟수 증가 함수
-- =====================================================

CREATE OR REPLACE FUNCTION public.increment_play_count(voice_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.voices
    SET
        play_count = play_count + 1,
        last_played_at = NOW()
    WHERE id = voice_uuid AND user_id = auth.uid();
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- =====================================================
-- STORAGE 버킷 설정 (Supabase Dashboard에서 실행)
-- =====================================================
--
-- 1. 'voices' 버킷 생성 (private)
-- 2. 'avatars' 버킷 생성 (public)
--
-- Storage Policy 예시:
-- INSERT: auth.uid() = (storage.foldername)[1]::uuid
-- SELECT: auth.uid() = (storage.foldername)[1]::uuid
-- DELETE: auth.uid() = (storage.foldername)[1]::uuid
