# OAuth 설정 가이드

Makeit은 GitHub과 Vercel OAuth를 통해 자동으로 토큰을 관리합니다. 사용자가 수동으로 토큰을 입력할 필요가 없습니다.

## 1. Supabase 설정 (필수)

### 1.1 tokens 테이블 생성

Supabase Dashboard > SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- supabase/migrations/001_create_tokens_table.sql 파일 내용 실행
```

### 1.2 GitHub OAuth Provider 설정

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. Authentication → Providers → GitHub
3. **Enable Sign in with GitHub** 활성화
4. **Additional Scopes** 필드에 `repo` 추가 (필수!)
   - 기본값: `read:user user:email`
   - 수정값: `read:user user:email repo`
5. GitHub OAuth App 정보 입력:
   - Client ID
   - Client Secret
   - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

> ⚠️ **중요**: `repo` scope가 없으면 GitHub 저장소 생성이 안 됩니다!

## 2. Vercel OAuth 설정 (선택)

### 2.1 Vercel OAuth App 생성

1. [Vercel Account Settings](https://vercel.com/account/tokens) → OAuth Apps
2. "Create OAuth App" 클릭
3. 정보 입력:
   - **Application Name**: `Makeit`
   - **Homepage URL**: `https://your-domain.com`
   - **Redirect URL**: `https://your-domain.com/api/auth/vercel/callback`
4. 생성 후 Client ID와 Client Secret 복사

### 2.2 환경변수 추가

`.env.local` 파일에 추가:

```env
VERCEL_CLIENT_ID=oac_xxxxxxxxx
VERCEL_CLIENT_SECRET=xxxxxxxxx
```

### 2.3 Vercel 배포 시 환경변수 설정

Vercel Dashboard → Project → Settings → Environment Variables에서 동일하게 추가

## 3. 사용자 흐름

### GitHub 연결
1. 사용자가 "GitHub으로 로그인" 클릭
2. GitHub OAuth 승인 (repo 권한 포함)
3. 로그인 완료 시 provider_token이 자동으로 DB에 저장됨

### Vercel 연결
1. 대시보드 사이드바에서 "Vercel 연결" 버튼 클릭
2. Vercel OAuth 승인
3. 토큰이 자동으로 DB에 저장됨

### 배포
1. GitHub + Vercel 모두 연결된 상태에서
2. 프로젝트 생성 후 "배포하기" 버튼 클릭
3. 자동으로 GitHub 리포 생성 → Vercel 배포

## 4. 보안

- 토큰은 Supabase `tokens` 테이블에 저장
- RLS(Row Level Security)로 사용자 본인의 토큰만 접근 가능
- 토큰은 서버 사이드에서만 사용됨 (클라이언트에 노출 안 됨)
- 사용자는 언제든 연결을 해제할 수 있음

## 5. 트러블슈팅

### "GitHub not connected" 에러
- 로그아웃 후 다시 로그인
- Supabase GitHub Provider에 `repo` scope가 있는지 확인

### "Vercel OAuth not configured" 에러
- 환경변수 `VERCEL_CLIENT_ID`와 `VERCEL_CLIENT_SECRET`가 설정되었는지 확인

### Vercel 배포 실패
- Vercel 계정에 GitHub Integration이 연결되어 있는지 확인
- 리포지토리에 Vercel 접근 권한이 있는지 확인
