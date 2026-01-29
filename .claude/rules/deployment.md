# Deployment & Release

WithVoice는 **Vercel**에 프론트엔드를, **Supabase Cloud**에 백엔드를 배포합니다.

---

## 배포 구성

| 서비스 | 플랫폼 | URL |
|--------|--------|-----|
| Frontend | Vercel | withvoice.app (예정) |
| Database | Supabase | *.supabase.co |
| Storage | Supabase Storage | *.supabase.co/storage |
| Push | Firebase Cloud Messaging | FCM |

---

## Vercel 배포

### 자동 배포
GitHub `main` 브랜치에 push 시 Vercel이 자동으로 빌드/배포합니다.

```bash
# 빌드 명령어 (Vercel이 자동 실행)
npm run build

# 빌드 출력
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ○ /offline
# └ ○ /test/recording
```

### Vercel 환경 변수 설정
Vercel Dashboard > Settings > Environment Variables:

```env
# Production + Preview + Development
NEXT_PUBLIC_SUPABASE_URL=https://실제프로젝트.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=실제-anon-key
NEXT_PUBLIC_FIREBASE_VAPID_KEY=실제-vapid-key
```

### Preview 배포
Pull Request 생성 시 자동으로 Preview URL이 생성됩니다.
- `https://withvoice-<hash>-<team>.vercel.app`

---

## 로컬 빌드 및 테스트

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 타입 체크 (빌드 전 확인)
npm run type-check

# Lint
npm run lint
```

### 빌드 전 체크리스트
- [ ] `npm run type-check` 통과
- [ ] `npm run build` 성공
- [ ] Server Component에서 `onClick` 등 이벤트 핸들러 없음
- [ ] `'use client'` 지시문 필요한 곳에 추가됨
- [ ] 환경 변수 플레이스홀더 처리 (미들웨어 등)

---

## CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder-key
```

---

## Supabase 배포

### 스키마 마이그레이션
```bash
# Supabase CLI로 마이그레이션 실행
supabase db push

# 또는 Dashboard SQL Editor에서 직접 실행
# database/schema.sql 내용 붙여넣기
```

### Storage 버킷 설정 (Dashboard)
1. `voices` 버킷 생성 (Private)
2. `avatars` 버킷 생성 (Public)
3. 각 버킷에 Storage Policy 적용

### RLS 정책 확인
Supabase Dashboard > Authentication > Policies 에서 각 테이블 정책 확인

---

## PWA 배포 주의사항

### Service Worker 업데이트
```javascript
// public/sw.js - 버전 변경 시 캐시 이름 업데이트
const CACHE_NAME = 'withvoice-v1' // → 'withvoice-v2'
```

### manifest.json
```json
{
  "name": "WithVoice",
  "short_name": "WithVoice",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#4f46e5"
}
```

### PWA 설치 요구사항
- HTTPS 필수 (Vercel 자동 적용)
- `manifest.json` 연결
- Service Worker 등록
- 192x192, 512x512 아이콘 필수

---

## Version Management

### Semantic Versioning
```
MAJOR.MINOR.PATCH
0.1.0 → 초기 개발
0.2.0 → 인증 기능 추가
0.3.0 → 인물 관리 추가
1.0.0 → MVP 출시
1.1.0 → 새 기능 추가
1.1.1 → 버그 수정
```

### 버전 업데이트
```bash
# package.json의 version 필드 수정
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.0 → 0.2.0
npm version major  # 0.1.0 → 1.0.0
```

---

## 도메인 설정

### Vercel Custom Domain
1. Vercel Dashboard > Domains
2. `withvoice.app` 추가
3. DNS 레코드 설정:
   - `A` → `76.76.21.21`
   - `CNAME www` → `cname.vercel-dns.com`

### metadataBase 설정
```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://withvoice.app'),
  // ...
}
```

---

## 모니터링

### Vercel Analytics
- Vercel Dashboard > Analytics 탭
- Core Web Vitals 자동 수집
- 실시간 트래픽 모니터링

### 에러 모니터링 (추후)
```bash
# Sentry 설치 (선택)
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 빌드 로그
- Vercel Dashboard > Deployments에서 빌드 로그 확인
- 빌드 실패 시 에러 메시지 확인

---

## 롤백

### Vercel 롤백
```bash
# 이전 배포로 즉시 롤백
# Vercel Dashboard > Deployments > 이전 배포 선택 > "Promote to Production"
```

### 또는 Git 롤백
```bash
git revert HEAD
git push origin main
# Vercel이 자동으로 재배포
```

---

## Release Checklist

### Pre-Release
- [ ] `npm run type-check` 통과
- [ ] `npm run build` 성공
- [ ] 주요 기능 수동 테스트 완료
- [ ] 음성 녹음/재생 테스트 (Chrome, Safari)
- [ ] PWA 설치 테스트
- [ ] 오프라인 동작 테스트
- [ ] 환경 변수 설정 확인 (Vercel)

### Post-Release
- [ ] 배포 URL 접속 확인
- [ ] Vercel 빌드 로그 확인
- [ ] PWA manifest/Service Worker 동작 확인
- [ ] 에러 모니터링 확인

---

## Quick Commands

```bash
# 개발
npm run dev

# 빌드 테스트
npm run build && npm run start

# 배포 (main에 push)
git push origin main

# 긴급 수정
git add . && git commit -m "fix: 긴급 수정" && git push origin main

# 롤백
git revert HEAD && git push origin main
```
