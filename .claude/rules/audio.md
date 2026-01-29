# Audio Processing Guidelines

WithVoice는 **실제 사람의 목소리 녹음**만 사용합니다. AI TTS/STT는 사용하지 않습니다.

---

## Audio Recording

### MediaRecorder API
```typescript
import { useVoiceRecorder } from '@/hooks/use-voice-recorder'

// 기본 사용
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
  minDuration: 5,    // 최소 5초
  maxDuration: 60,   // 최대 60초
  onMaxDurationReached: () => {
    // 자동 녹음 중지 처리
  },
})
```

### MIME 타입 우선순위
브라우저 호환성 순서:
```typescript
const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',  // Chrome, Firefox, Edge
  'audio/webm',              // Chrome, Firefox
  'audio/mp4',               // Safari
  'audio/ogg;codecs=opus',   // Firefox
  'audio/ogg',               // Firefox
]
```

### 마이크 권한 요청
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,   // 에코 제거
    noiseSuppression: true,   // 노이즈 제거
    sampleRate: 44100,        // 샘플링 레이트
  }
})
```

### 녹음 제약조건
- **최소 녹음 시간**: 5초 (DB CHECK 제약조건)
- **최대 녹음 시간**: 60초 (DB CHECK 제약조건)
- **데이터 수집 간격**: 100ms (`mediaRecorder.start(100)`)
- **HTTPS 필수**: MediaRecorder API는 보안 컨텍스트에서만 동작

---

## Audio Playback

### useAudioPlayer Hook
```typescript
import { useAudioPlayer } from '@/hooks/use-voice-recorder'

const {
  isPlaying,
  currentTime,
  duration,
  play,
  pause,
  stop,
  seek,
} = useAudioPlayer(audioUrl)
```

### Supabase Storage에서 재생
```typescript
// Storage에서 음성 파일 URL 가져오기
const { data } = supabase.storage
  .from('voices')
  .getPublicUrl(filePath)

// 또는 임시 서명된 URL (private 버킷)
const { data } = await supabase.storage
  .from('voices')
  .createSignedUrl(filePath, 3600) // 1시간 유효
```

---

## Audio Level Visualization

### Web Audio API로 실시간 레벨 분석
```typescript
// AudioContext + AnalyserNode 사용
const audioContext = new AudioContext()
const analyser = audioContext.createAnalyser()
analyser.fftSize = 256

const source = audioContext.createMediaStreamSource(stream)
source.connect(analyser)

const dataArray = new Uint8Array(analyser.frequencyBinCount)

function updateLevel() {
  analyser.getByteFrequencyData(dataArray)
  const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
  const level = Math.min(100, Math.round((average / 255) * 100 * 1.5))
  // level: 0~100
  requestAnimationFrame(updateLevel)
}
```

---

## Resource Cleanup Checklist

녹음/재생 후 반드시 정리할 리소스:

```typescript
// 1. MediaStream tracks 정지
stream.getTracks().forEach(track => track.stop())

// 2. AudioContext 닫기
if (audioContext.state !== 'closed') {
  audioContext.close()
}

// 3. AnimationFrame 취소
cancelAnimationFrame(animationFrameId)

// 4. Timer 정리
clearInterval(timerId)

// 5. Object URL 해제
URL.revokeObjectURL(audioUrl)

// 6. MediaRecorder 참조 해제
mediaRecorder = null
```

> **주의**: 리소스 미정리 시 메모리 누수, 마이크 점유, 배터리 소모 발생

---

## File Upload

### Supabase Storage 업로드
```typescript
import { uploadVoiceFile } from '@/lib/supabase'

// 파일 경로: voices/{user_id}/{timestamp}_{filename}
const result = await uploadVoiceFile(userId, audioBlob, 'recording.webm')
// result: { url: string, path: string } | null
```

### 파일 크기 예상
| 녹음 시간 | webm/opus 예상 크기 |
|-----------|---------------------|
| 5초 | ~40KB |
| 30초 | ~240KB |
| 60초 | ~480KB |

---

## Error Handling

```typescript
// 마이크 권한 에러
if (error instanceof DOMException) {
  switch (error.name) {
    case 'NotAllowedError':
      // 사용자가 권한 거부
      // → 브라우저 설정에서 마이크 권한 허용 안내
      break
    case 'NotFoundError':
      // 마이크 없음
      // → 마이크 연결 확인 안내
      break
    case 'NotReadableError':
      // 마이크가 다른 앱에 의해 사용 중
      // → 다른 앱 종료 안내
      break
  }
}
```

---

## Browser Compatibility

| 기능 | Chrome | Safari | Firefox | Edge |
|------|--------|--------|---------|------|
| MediaRecorder | ✅ | ✅ (14.5+) | ✅ | ✅ |
| webm/opus | ✅ | ❌ | ✅ | ✅ |
| mp4 | ❌ | ✅ | ❌ | ❌ |
| Web Audio API | ✅ | ✅ | ✅ | ✅ |
| getUserMedia | ✅ | ✅ | ✅ | ✅ |

> Safari는 `audio/mp4`만 지원하므로 MIME 타입 자동 감지 로직 필수

---

## Offline Audio Playback

Service Worker에서 오디오 파일 캐시 우선 전략:
```javascript
// sw.js - 오디오 파일은 캐시 우선
if (request.url.includes('/storage/') && request.url.includes('audio')) {
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
}
```

---

## Audio Quality Guidelines

| 항목 | 값 |
|------|------|
| **Sample Rate** | 44,100 Hz |
| **Bit Rate** | ~128kbps (opus 코덱) |
| **Format** | WebM (Chrome/Firefox), MP4 (Safari) |
| **Channels** | Mono (음성에 충분) |
| **Max Length** | 60초 (메모리 관리) |
| **Echo Cancel** | 활성화 |
| **Noise Suppress** | 활성화 |

---

## Testing

### 녹음 기능 테스트
- 테스트 페이지: `/test/recording`
- Mock Person으로 전체 녹음 플로우 테스트
- 콘솔에서 Blob 크기/타입 확인 가능
- 저장된 녹음은 브라우저 메모리에만 유지 (새로고침 시 삭제)

### 수동 테스트 체크리스트
- [ ] 마이크 권한 요청 동작
- [ ] 권한 거부 시 에러 메시지
- [ ] 5초 미만 녹음 시 경고
- [ ] 60초 도달 시 자동 중지
- [ ] 일시정지/재개 동작
- [ ] 녹음 후 미리듣기 재생
- [ ] 카테고리 선택 및 제목 입력
- [ ] Safari에서 MIME 타입 호환성
- [ ] 오프라인 상태에서 캐시된 오디오 재생
