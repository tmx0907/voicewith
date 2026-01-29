# Setup & Installation

## Prerequisites

### Required Software
- **Node.js**: v18.x 이상
- **npm**: v9.x 이상
- **Git**: 버전 관리

### Development Tools
- **브라우저**: Chrome (권장), Safari, Firefox
- **VSCode**: 권장 에디터
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript

### Accounts
- **GitHub**: 소스 코드 관리
- **Vercel**: 프론트엔드 배포 (GitHub 연동)
- **Supabase**: 백엔드 (Auth, DB, Storage)
- **Firebase**: 푸시 알림 (FCM)

---

## Initial Setup

### 1. Clone Repository
```bash
git clone https://github.com/tmx0907/voicewith.git
cd voicewith
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
```bash
# .env.local.example을 참고하여 .env.local 생성
cp .env.local.example .env.local
```

`.env.local` 파일 편집:
```env
# Supabase (필수)
# https://supabase.com/dashboard/project/_/settings/api 에서 확인
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Firebase FCM (선택 - 푸시 알림용)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

### 4. Run Development Server
```bash
npm run dev
# → http://localhost:3000
```

---

## Supabase Setup

### 1. 프로젝트 생성
- https://supabase.com/dashboard 에서 새 프로젝트 생성
- Region: Northeast Asia (ap-northeast-1) 권장

### 2. 데이터베이스 스키마 적용
Supabase Dashboard > SQL Editor에서 `database/schema.sql` 내용 실행:

```bash
# 또는 Supabase CLI 사용
supabase db push
```

### 3. Storage 버킷 생성
Supabase Dashboard > Storage:

1. **voices** 버킷 생성
   - Public: OFF (Private)
   - File size limit: 10MB
   - Allowed MIME types: `audio/*`

2. **avatars** 버킷 생성
   - Public: ON
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

### 4. Storage Policy 설정
각 버킷에 RLS Policy 추가:
```sql
-- voices 버킷 (INSERT, SELECT, DELETE)
auth.uid()::text = (storage.foldername(name))[1]

-- avatars 버킷 (INSERT, SELECT, DELETE)
auth.uid()::text = (storage.foldername(name))[1]
```

### 5. Auth 설정
Supabase Dashboard > Authentication > Settings:
- Site URL: `http://localhost:3000` (개발) / `https://withvoice.app` (배포)
- Redirect URLs: 필요 시 추가

---

## Firebase Setup (선택 - 푸시 알림)

### 1. 프로젝트 생성
- https://console.firebase.google.com
- 새 프로젝트 생성

### 2. 웹 앱 추가
- Project Settings > General > Web App 추가
- Firebase config 값 복사

### 3. Cloud Messaging 설정
- Project Settings > Cloud Messaging
- VAPID 키 생성 (Web Push certificates)
- `.env.local`에 VAPID 키 추가

---

## Vercel Setup

### 1. GitHub 연동
- https://vercel.com 에서 GitHub 저장소 연결
- Framework: Next.js (자동 감지)

### 2. 환경 변수 설정
Vercel Dashboard > Settings > Environment Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://실제프로젝트.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=실제-anon-key
NEXT_PUBLIC_FIREBASE_VAPID_KEY=실제-vapid-key
```

### 3. 배포 확인
`main` 브랜치에 push 시 자동 배포

---

## Verification

### 설치 확인
```bash
node --version     # v18+ 확인
npm --version      # v9+ 확인
git --version      # 설치 확인
```

### 프로젝트 확인
```bash
npm run type-check  # TypeScript 타입 체크
npm run lint        # ESLint
npm run build       # 프로덕션 빌드
npm run dev         # 개발 서버
```

### 기능 테스트
1. http://localhost:3000 접속
2. http://localhost:3000/test/recording 에서 녹음 테스트
3. 브라우저 DevTools > Application > Service Worker 확인
4. 브라우저 DevTools > Application > Manifest 확인

---

## Common Issues

### 미들웨어 에러: "Supabase URL and Key required"
```
원인: .env.local 파일이 없거나 환경 변수가 설정되지 않음
해결: .env.local 파일 생성 (플레이스홀더 값이라도 설정)
```

### 빌드 에러: "Event handlers cannot be passed to Client Component props"
```
원인: Server Component에서 onClick 등 이벤트 핸들러 사용
해결: 해당 컴포넌트 파일 상단에 'use client' 추가
```

### 녹음 안됨: "NotAllowedError"
```
원인: 마이크 권한 거부 또는 HTTP 환경
해결:
- 브라우저 설정에서 마이크 권한 허용
- HTTPS 또는 localhost에서만 동작 (MediaRecorder 요구사항)
```

### Safari에서 녹음 안됨
```
원인: Safari는 audio/webm 미지원
해결: MIME 타입 자동 감지 로직이 audio/mp4로 폴백 (이미 구현됨)
```

### `next dev` 경고: "middleware is deprecated"
```
원인: Next.js 16에서 middleware → proxy 컨벤션 변경
상태: 추후 마이그레이션 예정, 현재 동작에 영향 없음
```

---

## Useful Commands

```bash
# 개발
npm run dev              # 개발 서버 (Turbopack)
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버
npm run type-check       # TypeScript 체크
npm run lint             # ESLint

# Git
git status               # 변경 사항 확인
git push origin main     # 배포 (Vercel 자동)

# Supabase (CLI 설치 시)
supabase start           # 로컬 Supabase 실행
supabase db push         # 스키마 마이그레이션
supabase gen types typescript --local > src/types/supabase.ts  # 타입 재생성
```

---

## Project Structure After Setup

```
withvoice/
├── .claude/rules/           # Claude Code 규칙
├── .env.local               # 환경 변수 (git 미포함)
├── .env.local.example       # 환경 변수 템플릿
├── database/
│   └── schema.sql           # DB 스키마
├── public/
│   ├── manifest.json        # PWA 설정
│   ├── sw.js                # Service Worker
│   └── icons/               # 앱 아이콘 (추가 필요)
├── src/
│   ├── app/                 # 페이지
│   ├── components/          # 컴포넌트
│   ├── hooks/               # Custom Hooks
│   ├── lib/supabase/        # Supabase 클라이언트
│   ├── stores/              # Zustand 스토어
│   └── types/               # TypeScript 타입
├── package.json
└── tsconfig.json
```

---

## Next Steps

1. Supabase 프로젝트 생성 및 스키마 적용
2. `.env.local`에 실제 Supabase 키 설정
3. http://localhost:3000/test/recording 에서 녹음 테스트
4. 인증 페이지 구현 시작
