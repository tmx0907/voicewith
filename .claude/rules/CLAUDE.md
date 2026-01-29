# WithVoice - Claude Code Rules

This folder contains rules and guidelines for the WithVoice project. Claude Code reads these files to understand the project context and coding standards.

## Quick Overview

WithVoice는 사랑하는 사람의 **실제 목소리**로 습관 형성을 돕는 모바일 웹앱(PWA)입니다. AI 합성이 아닌 실제 녹음을 통해 진정성 있는 감정을 전달합니다.

- **타겟**: 자기계발하는 20-30대, 장거리 커플, 가족과 떨어져 사는 사람
- **핵심 가치**: AI 합성 ❌ → 실제 녹음 ✅

---

## Tech Stack

| 영역 | 기술 |
|------|------|
| **Framework** | Next.js 16+ (App Router, Turbopack) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS (모바일 퍼스트) |
| **State** | Zustand |
| **Backend** | Supabase (Auth, PostgreSQL, Storage, RLS) |
| **Push** | Firebase Cloud Messaging |
| **Audio** | Web Audio API, MediaRecorder API |
| **Deploy** | Vercel (Frontend), Supabase Cloud (Backend) |
| **PWA** | Service Worker, Web Push API |

---

## Project Structure

```
withvoice/
├── .claude/rules/          # Claude Code 규칙
├── src/
│   ├── app/                # Next.js App Router 페이지
│   ├── components/         # React 컴포넌트
│   ├── hooks/              # Custom Hooks
│   ├── lib/                # 유틸리티 (Supabase 클라이언트 등)
│   ├── types/              # TypeScript 타입 정의
│   └── stores/             # Zustand 스토어
├── public/
│   ├── manifest.json       # PWA 설정
│   ├── sw.js               # Service Worker
│   └── icons/              # 앱 아이콘
├── database/
│   └── schema.sql          # Supabase DB 스키마
└── .env.local              # 환경 변수 (git 미포함)
```

---

## Coding Standards

### 일반 규칙
- TypeScript strict mode 필수
- 한국어 주석 사용
- 파일명: kebab-case (예: `voice-recorder.tsx`)
- 컴포넌트명: PascalCase (예: `VoiceRecorder`)
- Hook명: camelCase, `use` prefix (예: `useVoiceRecorder`)

### 컴포넌트
- `'use client'`는 필요한 경우에만 선언
- Props 타입은 `interface`로 정의
- 복잡한 로직은 Custom Hook으로 분리
- re-export는 각 폴더의 `index.ts`를 통해

### 스타일
- Tailwind CSS 사용 (인라인 `style` 지양)
- 모바일 퍼스트 반응형 디자인
- Primary 색상: Indigo 계열
- Neutral 색상: Gray 계열

### 데이터
- Supabase RLS 정책 활용 (클라이언트에서 직접 쿼리)
- 에러 처리 필수
- 로딩 상태 표시
- 타입은 `@/types/supabase`에서 import

### Import 경로
- `@/` alias 사용 (절대 경로)
- 예: `@/components/voice-recorder`, `@/hooks/use-pwa`

---

## Core Features (MVP)

1. **인증**: 회원가입/로그인 (Supabase Auth)
2. **인물 관리**: 목소리 주인 등록 (가족/연인/친구/멘토)
3. **음성 녹음**: 5-60초 녹음 및 저장 (MediaRecorder API)
4. **음성 재생**: 카테고리별 관리, 즐겨찾기
5. **알람 설정**: 시간/요일별 알람
6. **푸시 알림**: FCM 기반 백그라운드 알림
7. **PWA**: 오프라인 지원, 홈 화면 설치

---

## Database

6개 테이블로 구성:
- `profiles` - 사용자 프로필 (Auth 연동)
- `persons` - 목소리 주인 (관계 유형 포함)
- `voices` - 녹음된 음성 (5-60초, 카테고리별)
- `alarms` - 알람 설정 (시간/요일)
- `alarm_logs` - 알람 이력 (행동 추적)
- `fcm_tokens` - 푸시 알림 토큰

Storage 버킷:
- `voices` (private) - 음성 파일
- `avatars` (public) - 프로필 이미지

상세 스키마: `database/schema.sql` 참조

---

## Key Modules

### Hooks
| Hook | 용도 |
|------|------|
| `useVoiceRecorder` | 음성 녹음 (시작/중지/일시정지) |
| `useAudioPlayer` | 오디오 재생 |
| `usePWA` | PWA 설치/업데이트/온라인 상태 |
| `usePushNotification` | 푸시 알림 권한/구독 |

### Stores (Zustand)
| Store | 용도 |
|------|------|
| `useAuthStore` | 인증 상태 (user, profile, loading) |

### Components
| Component | 용도 |
|------|------|
| `VoiceRecorder` | 녹음 UI (시각화, 카테고리 선택) |
| `PWAInstallPrompt` | 앱 설치 유도 배너 |
| `OfflineBanner` | 오프라인 상태 알림 |
| `UpdateBanner` | 앱 업데이트 알림 |

---

## Commands

```bash
npm run dev          # 개발 서버 (Turbopack)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # ESLint
npm run type-check   # TypeScript 타입 체크
```

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL        # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase Anon Key
NEXT_PUBLIC_FIREBASE_VAPID_KEY  # FCM VAPID 공개키
```

---

## Best Practices

### 코드 품질
- 변경 전 반드시 `npm run type-check` 통과 확인
- 새 컴포넌트는 `'use client'` 필요 여부 확인
- Server Component에서 이벤트 핸들러 사용 금지

### 오디오
- 녹음 시간 제한: 5-60초
- MIME 타입 호환성 확인 (webm/opus 우선)
- 리소스 정리 (MediaStream, AudioContext) 필수
- Object URL 사용 후 `revokeObjectURL` 호출

### 보안
- `.env.local` 절대 커밋하지 않기
- Supabase RLS 정책 활용
- Storage 파일 경로에 `user_id` 포함
- 클라이언트에서 `service_role` 키 사용 금지

### PWA
- Service Worker 업데이트 시 캐시 버전 변경
- 오프라인 동작 테스트 필수
- iOS Safari PWA 제한사항 고려

---

## Git Convention

```
feat: 새 기능 추가
fix: 버그 수정
refactor: 코드 리팩토링
style: 스타일 변경
docs: 문서 수정
chore: 설정/빌드 변경
```

---

*"그 목소리는 영원히 남습니다"*
