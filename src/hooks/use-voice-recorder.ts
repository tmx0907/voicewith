// =====================================================
// WithVoice - Voice Recording Hook
// Web Audio API + MediaRecorder API
// =====================================================

import { useState, useRef, useCallback, useEffect } from 'react'

// =====================================================
// Types
// =====================================================

export interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number          // 현재 녹음 시간 (초)
  audioBlob: Blob | null
  audioUrl: string | null
  error: string | null
}

export interface UseVoiceRecorderOptions {
  minDuration?: number      // 최소 녹음 시간 (기본: 5초)
  maxDuration?: number      // 최대 녹음 시간 (기본: 60초)
  onMaxDurationReached?: () => void
}

export interface UseVoiceRecorderReturn extends RecordingState {
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  resetRecording: () => void
  isSupported: boolean
  audioLevel: number        // 0-100 오디오 레벨 (시각화용)
}

// =====================================================
// Constants
// =====================================================

const DEFAULT_MIN_DURATION = 5    // 5초
const DEFAULT_MAX_DURATION = 60   // 60초

// 지원되는 MIME 타입 (우선순위 순)
const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
]

// =====================================================
// Helper Functions
// =====================================================

/** 브라우저가 지원하는 MIME 타입 찾기 */
function getSupportedMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null

  for (const mimeType of SUPPORTED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType
    }
  }
  return null
}

/** MediaRecorder 지원 여부 확인 */
function isRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    getSupportedMimeType() !== null
  )
}

// =====================================================
// Main Hook
// =====================================================

export function useVoiceRecorder(
  options: UseVoiceRecorderOptions = {}
): UseVoiceRecorderReturn {
  const {
    minDuration = DEFAULT_MIN_DURATION,
    maxDuration = DEFAULT_MAX_DURATION,
    onMaxDurationReached,
  } = options

  // State
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
  })
  const [audioLevel, setAudioLevel] = useState(0)
  const [isSupported] = useState(isRecordingSupported)

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedDurationRef = useRef<number>(0)

  // Audio Analysis (시각화용)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // =====================================================
  // Cleanup
  // =====================================================

  const cleanup = useCallback(() => {
    // 타이머 정리
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // 애니메이션 프레임 정리
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // 미디어 스트림 정리
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // 오디오 컨텍스트 정리
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // MediaRecorder 정리
    mediaRecorderRef.current = null
    analyserRef.current = null
    audioChunksRef.current = []
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // =====================================================
  // Audio Level Analysis (시각화용)
  // =====================================================

  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()

      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      analyserRef.current.fftSize = 256
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateLevel = () => {
        if (!analyserRef.current) return

        analyserRef.current.getByteFrequencyData(dataArray)

        // 평균 볼륨 계산 (0-100)
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength
        const normalizedLevel = Math.min(100, Math.round((average / 255) * 100 * 1.5))

        setAudioLevel(normalizedLevel)
        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }

      updateLevel()
    } catch (error) {
      console.warn('Audio analysis not available:', error)
    }
  }, [])

  // =====================================================
  // Recording Controls
  // =====================================================

  /** 녹음 시작 */
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setState(prev => ({ ...prev, error: '이 브라우저에서는 녹음이 지원되지 않습니다.' }))
      return
    }

    try {
      // 마이크 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      })
      streamRef.current = stream

      // 오디오 분석 시작 (시각화용)
      startAudioAnalysis(stream)

      // MediaRecorder 설정
      const mimeType = getSupportedMimeType()!
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // 데이터 수집
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // 녹음 완료 처리
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const audioUrl = URL.createObjectURL(audioBlob)

        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob,
          audioUrl,
        }))

        cleanup()
      }

      // 녹음 시작
      mediaRecorder.start(100) // 100ms 간격으로 데이터 수집
      startTimeRef.current = Date.now()
      pausedDurationRef.current = 0

      // 타이머 시작
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000)

        setState(prev => ({ ...prev, duration: elapsed }))

        // 최대 시간 도달
        if (elapsed >= maxDuration) {
          stopRecording()
          onMaxDurationReached?.()
        }
      }, 100)

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null,
        error: null,
      })

    } catch (error) {
      console.error('Recording error:', error)

      let errorMessage = '녹음을 시작할 수 없습니다.'
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = '마이크 접근 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = '마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.'
        }
      }

      setState(prev => ({ ...prev, error: errorMessage }))
      cleanup()
    }
  }, [isSupported, maxDuration, onMaxDurationReached, startAudioAnalysis, cleanup])

  /** 녹음 중지 */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      // 최소 시간 체크
      if (state.duration < minDuration) {
        setState(prev => ({
          ...prev,
          error: `최소 ${minDuration}초 이상 녹음해주세요.`,
        }))
        return
      }

      mediaRecorderRef.current.stop()
    }
  }, [state.isRecording, state.duration, minDuration])

  /** 녹음 일시정지 */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause()

      // 타이머 일시정지
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setState(prev => ({ ...prev, isPaused: true }))
    }
  }, [state.isRecording, state.isPaused])

  /** 녹음 재개 */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume()

      // 타이머 재시작
      const pauseTime = Date.now()
      timerRef.current = setInterval(() => {
        pausedDurationRef.current += Date.now() - pauseTime
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000)

        setState(prev => ({ ...prev, duration: elapsed }))

        if (elapsed >= maxDuration) {
          stopRecording()
          onMaxDurationReached?.()
        }
      }, 100)

      setState(prev => ({ ...prev, isPaused: false }))
    }
  }, [state.isRecording, state.isPaused, maxDuration, stopRecording, onMaxDurationReached])

  /** 녹음 초기화 */
  const resetRecording = useCallback(() => {
    // 이전 URL 해제
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl)
    }

    cleanup()

    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
    })
    setAudioLevel(0)
  }, [state.audioUrl, cleanup])

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    isSupported,
    audioLevel,
  }
}

// =====================================================
// Audio Player Hook (녹음된 오디오 재생용)
// =====================================================

export interface UseAudioPlayerReturn {
  isPlaying: boolean
  currentTime: number
  duration: number
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
}

export function useAudioPlayer(audioUrl: string | null): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!audioUrl) {
      audioRef.current = null
      return
    }

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.onloadedmetadata = () => {
      setDuration(audio.duration)
    }

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime)
    }

    audio.onended = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [audioUrl])

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  return {
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    stop,
    seek,
  }
}
