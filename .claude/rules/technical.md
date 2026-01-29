# Technical Guidelines

## Architecture
- **Pattern**: Feature-based modular architecture (Next.js App Router)
- **State**: Zustand (클라이언트 상태), Supabase (서버 상태)
- **Audio**: Custom Hook 기반 오디오 서비스 레이어 (`useVoiceRecorder`, `useAudioPlayer`)
- **Data**: Supabase 직접 쿼리 (RLS 기반, Repository 패턴 불필요)
- **Rendering**: Server Component 기본, 필요 시 `'use client'`

## Code Style
- **TypeScript**: Strict mode, 명시적 타입 필수
- **Naming**:
  - Components: PascalCase (`VoiceRecorder`)
  - Files: kebab-case (`voice-recorder.tsx`)
  - Hooks: camelCase with `use` prefix (`useVoiceRecorder`)
  - Stores: camelCase with `use` prefix + `Store` suffix (`useAuthStore`)
  - Constants: UPPER_SNAKE_CASE (`VOICE_BUCKET`)
  - Types/Interfaces: PascalCase (`VoiceWithPerson`)
- **Formatting**: 2-space indent, single quotes, no semicolons (Prettier)
- **Linting**: ESLint with Next.js config

## Next.js Best Practices
```typescript
// ✅ Good: Server Component (기본)
// 이벤트 핸들러, useState, useEffect 없는 컴포넌트
export default function VoiceListPage() {
  return <VoiceList />
}

// ✅ Good: Client Component (필요 시만)
'use client'
export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  // ...
}

// ✅ Good: 리소스 정리
useEffect(() => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  return () => {
    stream.getTracks().forEach(track => track.stop())
  }
}, [])

// ✅ Good: 에러 처리
const { data, error } = await supabase
  .from('voices')
  .select('*, person:persons(*)')
if (error) {
  console.error('Voices fetch error:', error)
  return null
}

// ❌ Bad: Server Component에서 onClick
export default function Page() {
  return <button onClick={() => {}}>Click</button> // 빌드 에러
}

// ❌ Bad: 환경 변수 직접 사용
const url = 'https://xxx.supabase.co' // .env.local 사용

// ❌ Bad: 리소스 미정리
const audioUrl = URL.createObjectURL(blob) // revokeObjectURL 누락
```

## Audio Processing
- `MediaRecorder API`로 녹음 (브라우저 네이티브)
- `Web Audio API`로 실시간 레벨 분석 (시각화용)
- MIME 타입 우선순위: `audio/webm;codecs=opus` > `audio/webm` > `audio/mp4` > `audio/ogg`
- 녹음 전 권한 요청 (`getUserMedia`)
- 녹음 시간 제한: 5초(최소) ~ 60초(최대)
- 데이터 수집 간격: 100ms (`mediaRecorder.start(100)`)

```typescript
// 오디오 리소스 정리 체크리스트
// 1. MediaStream tracks 정지
stream.getTracks().forEach(track => track.stop())
// 2. AudioContext 닫기
audioContext.close()
// 3. AnimationFrame 취소
cancelAnimationFrame(animationFrameId)
// 4. Timer 정리
clearInterval(timerId)
// 5. Object URL 해제
URL.revokeObjectURL(audioUrl)
```

## Supabase Patterns
```typescript
// 브라우저 클라이언트 (싱글톤)
import { getSupabaseClient } from '@/lib/supabase'
const supabase = getSupabaseClient()

// 서버 클라이언트 (요청마다 새로 생성)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// 관계 데이터 조회
const { data } = await supabase
  .from('voices')
  .select('*, person:persons(*)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

// Storage 업로드
const filePath = `${userId}/${Date.now()}_${fileName}`
await supabase.storage.from('voices').upload(filePath, blob)
```

## Tailwind CSS Patterns
```typescript
// ✅ 모바일 퍼스트 반응형
className="p-4 md:p-6 lg:p-8"

// ✅ Primary (Indigo) 색상 계열
className="bg-indigo-500 hover:bg-indigo-600 text-white"

// ✅ 조건부 스타일
className={`px-4 py-2 rounded-xl ${
  isActive ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'
}`}

// ❌ 인라인 style 지양
style={{ backgroundColor: '#4f46e5' }}
```

## Performance
- Turbopack 개발 빌드 (`next dev --turbopack`)
- `React.memo()`는 오디오 시각화 등 고비용 컴포넌트에만
- 오디오 파일은 Service Worker 캐시 우선 전략
- 이미지/아이콘은 Next.js `Image` 컴포넌트 사용
- 정적 페이지는 빌드 시 사전 렌더링

## PWA Considerations
- Service Worker 캐시 버전 관리 (`CACHE_NAME`)
- 오프라인 시 오디오 재생 지원
- iOS Safari 제한사항:
  - Background audio 제한
  - Push API 미지원 (iOS 16.4+부터 지원)
  - Service Worker 제한적 지원
- `viewportFit: cover`로 노치/Safe Area 대응

## Testing
```bash
# TypeScript 타입 체크
npm run type-check

# ESLint
npm run lint

# 프로덕션 빌드 테스트
npm run build

# 개발 서버
npm run dev
```

## File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root Layout (메타데이터, PWA)
│   ├── page.tsx            # 홈 페이지
│   ├── offline/            # 오프라인 페이지
│   └── test/               # 테스트 페이지
├── components/             # UI 컴포넌트
│   ├── voice-recorder.tsx  # 녹음 컴포넌트
│   ├── pwa-banners.tsx     # PWA 배너
│   └── index.ts            # re-export
├── hooks/                  # Custom Hooks
│   ├── use-voice-recorder.ts # 녹음 Hook
│   ├── use-pwa.ts          # PWA Hook
│   └── index.ts            # re-export
├── lib/                    # 유틸리티
│   └── supabase/           # Supabase 클라이언트
│       ├── client.ts       # 브라우저 + Storage + Auth
│       ├── server.ts       # 서버 컴포넌트용
│       └── middleware.ts   # 세션 갱신
├── stores/                 # Zustand 스토어
│   └── auth-store.ts       # 인증 상태
├── types/                  # TypeScript 타입
│   └── supabase.ts         # DB 타입 + Helper 타입
└── middleware.ts            # Next.js 미들웨어
```

## Dependencies Management
```bash
# 의존성 확인
npm outdated

# 업데이트 (테스트 후 커밋)
npm update

# 타입 체크 후 커밋
npm run type-check && npm run build
```

## Git Workflow
- Branch naming: `feature/voice-recording`, `fix/offline-page`
- Commit messages: Conventional Commits
  - `feat: 음성 녹음 컴포넌트 추가`
  - `fix: 오프라인 페이지 빌드 에러 수정`
  - `docs: 프로젝트 문서 업데이트`
  - `refactor: Supabase 클라이언트 구조 개선`
  - `chore: 의존성 업데이트`
- PR: `npm run type-check` + `npm run build` 통과 필수
