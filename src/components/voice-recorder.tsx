'use client'

// =====================================================
// WithVoice - Voice Recorder Component
// 녹음 UI 컴포넌트
// =====================================================

import { useState } from 'react'
import { useVoiceRecorder, useAudioPlayer } from '@/hooks/use-voice-recorder'
import type { VoiceCategory, Person } from '@/types/supabase'
import { CATEGORY_LABELS, CATEGORY_EMOJI } from '@/types/supabase'

// =====================================================
// Types
// =====================================================

interface VoiceRecorderProps {
  person: Person
  onSave: (data: {
    audioBlob: Blob
    title: string
    category: VoiceCategory
    duration: number
  }) => Promise<void>
  onCancel: () => void
}

// =====================================================
// Helper Components
// =====================================================

/** 오디오 레벨 시각화 바 */
function AudioLevelBars({ level, isRecording }: { level: number; isRecording: boolean }) {
  const bars = 5
  const activeBarCount = Math.ceil((level / 100) * bars)

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const isActive = isRecording && i < activeBarCount
        const height = isActive ? 20 + Math.random() * 40 : 8

        return (
          <div
            key={i}
            className={`w-2 rounded-full transition-all duration-75 ${
              isActive ? 'bg-red-500' : 'bg-gray-300'
            }`}
            style={{ height: `${height}px` }}
          />
        )
      })}
    </div>
  )
}

/** 녹음 시간 표시 */
function RecordingTimer({ duration, maxDuration }: { duration: number; maxDuration: number }) {
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  const progress = (duration / maxDuration) * 100

  return (
    <div className="text-center">
      <div className="text-4xl font-mono font-bold text-gray-800">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div className="mt-2 text-sm text-gray-500">
        최대 {maxDuration}초
      </div>
      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-red-500 h-1.5 rounded-full transition-all duration-100"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  )
}

/** 카테고리 선택 버튼 */
function CategorySelector({
  selected,
  onChange,
}: {
  selected: VoiceCategory
  onChange: (category: VoiceCategory) => void
}) {
  const categories: VoiceCategory[] = ['motivation', 'comfort', 'goodnight', 'wakeup', 'encouragement', 'other']

  return (
    <div className="grid grid-cols-3 gap-2">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          className={`p-3 rounded-xl text-sm transition-all ${
            selected === category
              ? 'bg-indigo-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="text-lg">{CATEGORY_EMOJI[category]}</span>
          <div className="mt-1">{CATEGORY_LABELS[category]}</div>
        </button>
      ))}
    </div>
  )
}

/** 오디오 플레이어 미니 */
function AudioPreview({ audioUrl }: { audioUrl: string }) {
  const { isPlaying, currentTime, duration, play, pause, stop } = useAudioPlayer(audioUrl)

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="bg-gray-100 rounded-2xl p-4">
      <div className="flex items-center gap-4">
        <button
          onClick={isPlaying ? pause : play}
          className="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <div className="bg-gray-300 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-100"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <button
          onClick={stop}
          className="w-10 h-10 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// =====================================================
// Main Component
// =====================================================

export function VoiceRecorder({ person, onSave, onCancel }: VoiceRecorderProps) {
  const [step, setStep] = useState<'record' | 'review'>('record')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<VoiceCategory>('motivation')
  const [isSaving, setIsSaving] = useState(false)

  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error,
    audioLevel,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useVoiceRecorder({
    minDuration: 5,
    maxDuration: 60,
    onMaxDurationReached: () => {
      // 최대 시간 도달 시 자동으로 리뷰 단계로
      setStep('review')
    },
  })

  // 지원하지 않는 브라우저
  if (!isSupported) {
    return (
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">😢</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          녹음을 지원하지 않는 브라우저입니다
        </h2>
        <p className="text-gray-600 mb-4">
          Chrome, Safari, Firefox 등 최신 브라우저를 사용해주세요.
        </p>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 rounded-full hover:bg-gray-300"
        >
          돌아가기
        </button>
      </div>
    )
  }

  // 녹음 완료 후 저장
  const handleSave = async () => {
    if (!audioBlob || !title.trim()) return

    setIsSaving(true)
    try {
      await onSave({
        audioBlob,
        title: title.trim(),
        category,
        duration,
      })
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // 녹음 중지 후 리뷰 단계로
  const handleStopAndReview = () => {
    stopRecording()
    if (duration >= 5) {
      setStep('review')
    }
  }

  // 다시 녹음
  const handleReRecord = () => {
    resetRecording()
    setStep('record')
    setTitle('')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">
          {person.name}님의 목소리 녹음
        </h1>
        <div className="w-6" /> {/* Spacer */}
      </header>

      {/* Content */}
      <div className="flex-1 p-6">
        {step === 'record' ? (
          // ===== 녹음 단계 =====
          <div className="flex flex-col items-center justify-center h-full gap-8">
            {/* 안내 텍스트 */}
            <div className="text-center">
              <p className="text-gray-600">
                {isRecording
                  ? '녹음 중입니다. 마음을 담아 말해주세요.'
                  : '버튼을 누르고 녹음을 시작하세요'}
              </p>
            </div>

            {/* 오디오 레벨 시각화 */}
            <AudioLevelBars level={audioLevel} isRecording={isRecording && !isPaused} />

            {/* 타이머 */}
            <RecordingTimer duration={duration} maxDuration={60} />

            {/* 에러 메시지 */}
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 px-4 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* 녹음 버튼들 */}
            <div className="flex items-center gap-6">
              {!isRecording ? (
                // 녹음 시작 버튼
                <button
                  onClick={startRecording}
                  className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
                >
                  <div className="w-8 h-8 bg-white rounded-full" />
                </button>
              ) : (
                <>
                  {/* 일시정지/재개 버튼 */}
                  <button
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                  >
                    {isPaused ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    )}
                  </button>

                  {/* 녹음 중지 버튼 */}
                  <button
                    onClick={handleStopAndReview}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      duration >= 5
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={duration < 5}
                  >
                    <div className="w-8 h-8 bg-white rounded-sm" />
                  </button>
                </>
              )}
            </div>

            <p className="text-sm text-gray-400">
              최소 5초 이상 녹음해주세요
            </p>
          </div>
        ) : (
          // ===== 리뷰 & 저장 단계 =====
          <div className="space-y-6">
            {/* 오디오 미리듣기 */}
            {audioUrl && <AudioPreview audioUrl={audioUrl} />}

            {/* 제목 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 아침 기상 메시지"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                maxLength={50}
              />
            </div>

            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <CategorySelector selected={category} onChange={setCategory} />
            </div>

            {/* 버튼들 */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleReRecord}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                다시 녹음
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || isSaving}
                className={`flex-1 py-3 px-4 rounded-xl text-white transition-colors ${
                  title.trim() && !isSaving
                    ? 'bg-indigo-500 hover:bg-indigo-600'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isSaving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VoiceRecorder
