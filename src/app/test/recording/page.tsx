'use client'

import { useState } from 'react'
import { VoiceRecorder } from '@/components/voice-recorder'
import type { Person, VoiceCategory } from '@/types/supabase'

// 테스트용 Mock Person
const mockPerson: Person = {
  id: 'mock-person-1',
  user_id: 'mock-user-1',
  name: '엄마',
  relationship: 'family',
  profile_image_url: null,
  description: '테스트용 인물',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

interface SavedRecording {
  title: string
  category: VoiceCategory
  duration: number
  audioUrl: string
  savedAt: string
}

export default function RecordingTestPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [savedRecordings, setSavedRecordings] = useState<SavedRecording[]>([])

  const handleSave = async (data: {
    audioBlob: Blob
    title: string
    category: VoiceCategory
    duration: number
  }) => {
    // 실제로는 Supabase Storage에 업로드하지만, 테스트에서는 로컬 URL 생성
    const audioUrl = URL.createObjectURL(data.audioBlob)

    const newRecording: SavedRecording = {
      title: data.title,
      category: data.category,
      duration: data.duration,
      audioUrl,
      savedAt: new Date().toISOString(),
    }

    setSavedRecordings((prev) => [newRecording, ...prev])
    setIsRecording(false)

    console.log('저장된 녹음:', {
      title: data.title,
      category: data.category,
      duration: data.duration,
      blobSize: data.audioBlob.size,
      blobType: data.audioBlob.type,
    })
  }

  const handleCancel = () => {
    setIsRecording(false)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  if (isRecording) {
    return (
      <VoiceRecorder
        person={mockPerson}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">음성 녹음 테스트</h1>
        <p className="text-gray-600 mt-1">
          VoiceRecorder 컴포넌트 테스트 페이지
        </p>
      </div>

      {/* 녹음 시작 버튼 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
            👩
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-800">{mockPerson.name}</h2>
            <p className="text-sm text-gray-500">테스트용 인물</p>
          </div>
          <button
            onClick={() => setIsRecording(true)}
            className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            녹음하기
          </button>
        </div>
      </div>

      {/* 저장된 녹음 목록 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">
          저장된 녹음 ({savedRecordings.length})
        </h2>

        {savedRecordings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <p>아직 녹음이 없습니다</p>
            <p className="text-sm mt-1">위 버튼을 눌러 녹음을 시작하세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedRecordings.map((recording, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
              >
                <button
                  onClick={() => {
                    const audio = new Audio(recording.audioUrl)
                    audio.play()
                  }}
                  className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors"
                >
                  <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 truncate">
                    {recording.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {recording.category} · {formatDuration(recording.duration)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    URL.revokeObjectURL(recording.audioUrl)
                    setSavedRecordings((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 개발자 정보 */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-xl text-sm text-yellow-800">
        <p className="font-medium">개발자 참고사항:</p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-yellow-700">
          <li>녹음된 파일은 브라우저 메모리에만 저장됩니다 (새로고침 시 삭제)</li>
          <li>실제 앱에서는 Supabase Storage에 업로드됩니다</li>
          <li>콘솔에서 저장된 녹음 정보를 확인할 수 있습니다</li>
          <li>최소 5초, 최대 60초 녹음 가능</li>
        </ul>
      </div>

      {/* 홈으로 돌아가기 */}
      <div className="mt-6 text-center">
        <a
          href="/"
          className="text-indigo-500 hover:text-indigo-600 text-sm"
        >
          ← 홈으로 돌아가기
        </a>
      </div>
    </div>
  )
}
