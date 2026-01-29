# Security & Privacy Guidelines

WithVoice는 사용자의 **실제 목소리**를 다루므로 개인정보 보호가 핵심입니다.

---

## 핵심 원칙

1. **최소 권한**: 필요한 데이터만 수집, 필요한 권한만 요청
2. **사용자 격리**: RLS로 사용자 간 데이터 완전 분리
3. **전송 암호화**: HTTPS 필수 (MediaRecorder API 요구사항)
4. **키 보호**: 환경 변수 관리, 클라이언트에 비밀키 노출 금지

---

## Supabase RLS (Row Level Security)

모든 테이블에 RLS 적용 — 사용자는 자신의 데이터만 접근 가능:

```sql
-- 기본 패턴: auth.uid() = user_id
CREATE POLICY "Users can manage own data"
  ON public.voices FOR ALL
  USING (auth.uid() = user_id);

-- profiles는 id가 곧 user_id
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
```

### RLS 체크리스트
- [ ] 새 테이블 생성 시 반드시 `ENABLE ROW LEVEL SECURITY`
- [ ] SELECT / INSERT / UPDATE / DELETE 각각 정책 확인
- [ ] `auth.uid()` 기반 필터링 확인
- [ ] Supabase Dashboard에서 정책 테스트

> **주의**: RLS 없이 테이블을 만들면 모든 사용자가 모든 데이터에 접근 가능

---

## Storage 보안

### 파일 경로에 user_id 포함
```typescript
// ✅ Good: user_id가 경로에 포함
const filePath = `${userId}/${timestamp}_${fileName}`

// ❌ Bad: user_id 없이 저장
const filePath = `${timestamp}_${fileName}`
```

### Storage Policy
```sql
-- 자신의 폴더만 업로드/조회/삭제 가능
-- foldername[1]이 user_id와 일치해야 함
INSERT: auth.uid()::text = (storage.foldername(name))[1]
SELECT: auth.uid()::text = (storage.foldername(name))[1]
DELETE: auth.uid()::text = (storage.foldername(name))[1]
```

### 버킷 설정
| 버킷 | 접근 | 용도 |
|------|------|------|
| `voices` | **private** | 음성 파일 (서명된 URL로 접근) |
| `avatars` | **public** | 프로필 이미지 |

---

## 인증 보안

### Supabase Auth
```typescript
// ✅ getUser()로 서버사이드 인증 확인 (JWT 검증)
const { data: { user } } = await supabase.auth.getUser()

// ❌ getSession()만으로 인증 확인하지 않기 (JWT 미검증)
const { data: { session } } = await supabase.auth.getSession()
```

### 미들웨어에서 세션 갱신
```typescript
// src/lib/supabase/middleware.ts
// 매 요청마다 토큰 갱신 처리
await supabase.auth.getUser()
```

### 보호된 라우트
```typescript
// 인증 필요한 페이지에서
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  redirect('/login')
}
```

---

## 환경 변수 관리

### 공개 가능 (NEXT_PUBLIC_)
```env
NEXT_PUBLIC_SUPABASE_URL=        # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase Anon Key (RLS로 보호)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=  # FCM VAPID 공개키
```

### 절대 노출 금지
```env
SUPABASE_SERVICE_ROLE_KEY=       # 서버에서만 사용
FIREBASE_ADMIN_SDK_KEY=          # 서버에서만 사용
```

### 규칙
- `.env.local`은 `.gitignore`에 포함 (커밋 금지)
- `.env.local.example`에 키 이름만 기록
- Vercel 환경 변수로 프로덕션 키 관리
- `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트에 노출

---

## 클라이언트 보안

### XSS 방지
```typescript
// ✅ React가 자동으로 이스케이프 처리
<p>{userInput}</p>

// ❌ dangerouslySetInnerHTML 사용 금지
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 입력 검증
```typescript
// 제목 길이 제한 (DB 제약조건과 일치)
<input maxLength={50} />

// 녹음 시간 제한 (5-60초)
CONSTRAINT voice_duration_check CHECK (duration_seconds >= 5 AND duration_seconds <= 60)
```

### HTTPS 필수
- MediaRecorder API는 Secure Context(HTTPS)에서만 동작
- Vercel 배포 시 자동 HTTPS 적용
- 개발 환경: `localhost`는 Secure Context로 취급

---

## 푸시 알림 보안

### FCM 토큰 관리
```typescript
// 토큰은 사용자별로 관리
// 디바이스 변경 시 이전 토큰 비활성화
await supabase
  .from('fcm_tokens')
  .update({ is_active: false })
  .eq('user_id', userId)
  .neq('token', newToken)
```

### VAPID 키
- 공개키: 클라이언트에서 사용 (환경 변수)
- 비밀키: 서버에서만 사용 (절대 노출 금지)

---

## 개인정보 보호

### 수집하는 데이터
| 데이터 | 용도 | 보관 |
|--------|------|------|
| 이메일 | 인증 | 계정 삭제 시 삭제 |
| 표시 이름 | UI 표시 | 계정 삭제 시 삭제 |
| 음성 파일 | 핵심 기능 | 사용자 삭제 시 삭제 |
| FCM 토큰 | 푸시 알림 | 비활성화/삭제 가능 |
| 알람 로그 | 행동 추적 | 계정 삭제 시 삭제 |

### 데이터 삭제
```sql
-- CASCADE 설정으로 계정 삭제 시 모든 관련 데이터 자동 삭제
-- profiles → persons → voices → alarms → alarm_logs
-- profiles → fcm_tokens
REFERENCES auth.users(id) ON DELETE CASCADE
```

### 음성 데이터 특별 관리
- 음성은 개인의 생체 정보에 준하는 민감 데이터
- Private 버킷에 저장 (공개 URL 없음)
- 서명된 URL로만 접근 (유효기간 설정)
- 사용자 요청 시 즉시 삭제 가능

---

## 보안 체크리스트

### 개발 시
- [ ] 새 테이블에 RLS 정책 적용
- [ ] Storage 파일 경로에 user_id 포함
- [ ] `service_role` 키를 클라이언트에서 사용하지 않음
- [ ] 환경 변수가 `.env.local`에만 있음
- [ ] `dangerouslySetInnerHTML` 사용하지 않음
- [ ] 사용자 입력에 길이 제한 적용

### 배포 시
- [ ] Vercel 환경 변수에 프로덕션 키 설정
- [ ] HTTPS 적용 확인
- [ ] Supabase Dashboard에서 RLS 정책 확인
- [ ] Storage 버킷 접근 권한 확인

### 정기 점검
- [ ] Supabase Auth 설정 (비밀번호 정책 등)
- [ ] 만료된 FCM 토큰 정리
- [ ] 사용되지 않는 음성 파일 정리
- [ ] 의존성 보안 업데이트 (`npm audit`)
