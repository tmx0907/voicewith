# WithVoice - Project Overview

사랑하는 사람의 실제 목소리로 습관 형성을 돕는 모바일 웹앱 (PWA)

---

## Target Market

- **Primary**: 자기계발하는 20-30대 한국인
- **Secondary**: 장거리 커플, 가족과 떨어져 사는 사람
- **Core Value**: AI 합성 ❌ → 실제 녹음 ✅ (진정성 있는 감정 전달)

---

## Tech Stack

| 영역 | 기술 | 용도 |
|------|------|------|
| **Framework** | Next.js 16+ (App Router) | SSR/SSG, 라우팅 |
| **Language** | TypeScript (strict) | 타입 안전성 |
| **Styling** | Tailwind CSS | 모바일 퍼스트 UI |
| **State** | Zustand | 클라이언트 상태 관리 |
| **Auth** | Supabase Auth | 이메일/소셜 로그인 |
| **Database** | Supabase (PostgreSQL) | 데이터 저장, RLS |
| **Storage** | Supabase Storage | 음성 파일, 프로필 이미지 |
| **Audio Recording** | MediaRecorder API | 음성 녹음 (5-60초) |
| **Audio Playback** | Web Audio API | 음성 재생, 레벨 분석 |
| **Push** | Firebase Cloud Messaging | 백그라운드 푸시 알림 |
| **PWA** | Service Worker, Web Push | 오프라인 지원, 홈 화면 설치 |
| **Deploy** | Vercel | 프론트엔드 배포 |
| **Analytics** | (추후 추가) | 사용자 행동 분석 |

---

## Core Features (MVP)

### 1. 인증
- 이메일 회원가입/로그인 (Supabase Auth)
- 소셜 로그인 (Google, Kakao - 추후)
- 프로필 관리 (이름, 아바타, 타임존)

### 2. 인물 관리 (Persons)
- 목소리 주인 등록 (이름, 관계, 설명)
- 관계 유형: 가족 / 연인 / 친구 / 멘토 / 기타
- 프로필 이미지 업로드

### 3. 음성 녹음
- 5초~60초 녹음
- 실시간 오디오 레벨 시각화
- 일시정지/재개 지원
- 녹음 후 미리듣기
- MIME 타입: audio/webm (opus 코덱 우선)

### 4. 음성 관리
- 카테고리별 분류 (동기부여/위로/잘자요/일어나/응원/기타)
- 즐겨찾기
- 재생 횟수 추적
- 음성 텍스트 기록 (선택)

### 5. 알람
- 시간/요일별 알람 설정
- 특정 음성 연결
- 스누즈 기능
- 알람 이력 추적 (행동 변화 분석용)

### 6. 푸시 알림
- FCM 기반 백그라운드 알림
- VAPID 키 기반 Web Push
- 디바이스별 토큰 관리

### 7. PWA
- 홈 화면 설치
- 오프라인 음성 재생 (캐싱)
- 백그라운드 동기화
- iOS Safari 대응

---

## Database Schema

6개 테이블 (`database/schema.sql` 참조):

```
profiles     ← auth.users (1:1)
persons      ← profiles (1:N)
voices       ← persons (1:N)
alarms       ← voices (1:1)
alarm_logs   ← alarms (1:N)
fcm_tokens   ← profiles (1:N)
```

Storage 버킷:
- `voices` (private) - 음성 파일: `{user_id}/{timestamp}_{filename}`
- `avatars` (public) - 프로필 이미지: `{user_id}/{filename}`

---

## Development Principles

### 디자인
- **모바일 퍼스트** - 375px 기준 설계
- **PWA 최적화** - 네이티브 앱 경험
- **다크모드 대응** - CSS 미디어 쿼리
- **노치/Safe Area 대응** - `viewportFit: cover`

### 오디오
- 실제 녹음만 사용 (AI 합성 없음)
- 브라우저 호환성 고려 (Chrome, Safari, Firefox)
- 오프라인 재생을 위한 캐싱
- 리소스 정리 (MediaStream, AudioContext, Object URL)

### 보안
- Supabase RLS로 사용자별 데이터 격리
- Storage 경로에 user_id 포함
- 환경 변수로 키 관리 (커밋 금지)
- HTTPS 필수 (MediaRecorder 요구사항)

### 성능
- Turbopack 개발 빌드
- 정적 페이지 사전 렌더링
- 오디오 파일 지연 로딩
- Service Worker 캐싱 전략 (네트워크 우선, 오디오 캐시 우선)

---

## Roadmap

### Phase 1 - MVP (현재)
- [x] 프로젝트 설정 (Next.js, Tailwind, Supabase)
- [x] DB 스키마 및 타입 정의
- [x] 음성 녹음 훅 및 컴포넌트
- [x] PWA 설정 (SW, manifest, 오프라인)
- [ ] 인증 페이지 (로그인/회원가입)
- [ ] 인물 관리 CRUD
- [ ] 음성 목록/재생 페이지
- [ ] 알람 설정 UI

### Phase 2 - 핵심 기능 완성
- [ ] FCM 푸시 알림 연동
- [ ] 알람 트리거 로직
- [ ] 음성 카테고리/즐겨찾기 관리
- [ ] 프로필 설정 페이지

### Phase 3 - 고도화
- [ ] 소셜 로그인 (Google, Kakao)
- [ ] 사용 통계 대시보드
- [ ] 음성 공유 기능
- [ ] 다국어 지원

---

## Version Info

- **Current**: 0.1.0 (개발 중)
- **Next.js**: 16.1.6
- **Node**: 18+
- **Deploy**: Vercel
- **Repository**: github.com/tmx0907/voicewith
